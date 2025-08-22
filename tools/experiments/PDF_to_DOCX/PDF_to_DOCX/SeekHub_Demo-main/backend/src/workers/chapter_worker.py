"""
Chapter Worker - Handles individual chapter translation tasks with streaming support
"""
import asyncio
import logging
import signal
import sys
from typing import Optional, Dict, Any
import os

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from src.core.config import config
from src.core.pubsub_queue import queue_manager, StreamingWorker
from src.core.translation_orchestrator import orchestrator
from src.core.firestore_helper import db_helper

# Import appropriate translator based on API key availability
if config.get_gemini_api_keys():
    from src.core.gemini_client import translator
else:
    # Use mock translator for testing without API keys
    import asyncio
    import time
    from typing import Optional, AsyncIterator
    
    class MockGeminiTranslator:
        def __init__(self):
            self.logger = logging.getLogger(__name__)
        
        async def translate_text_stream(self, text: str, source_lang: str = "English", 
                                      target_lang: str = "Chinese") -> AsyncIterator[str]:
            """Mock streaming translation"""
            translated = f"[模拟翻译] {text}"
            # Simulate streaming by yielding in chunks
            chunk_size = 50
            for i in range(0, len(translated), chunk_size):
                await asyncio.sleep(0.1)  # Simulate processing time
                yield translated[i:i+chunk_size]
        
        async def translate_chapter_stream(self, chapter_text: str, chapter_index: int,
                                         callback=None) -> dict:
            self.logger.info(f"Mock streaming translation for chapter {chapter_index}")
            
            chunks = []
            async for chunk in self.translate_text_stream(chapter_text):
                chunks.append(chunk)
                if callback:
                    progress = len("".join(chunks)) / len(f"[模拟翻译] {chapter_text}") * 100
                    await callback(chunk, progress)
            
            return {
                'chapter_index': chapter_index,
                'original_text': chapter_text,
                'translated_text': "".join(chunks),
                'success': True,
                'timestamp': time.time(),
                'streaming': True
            }
    
    translator = MockGeminiTranslator()

class ChapterWorker:
    """Worker that processes chapter translation tasks with streaming support"""
    
    def __init__(self, worker_id: str):
        self.worker_id = worker_id
        self.logger = logging.getLogger(f"{__name__}.{worker_id}")
        self.running = False
        self.setup_signal_handlers()
    
    def setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        self.logger.info(f"Worker {self.worker_id} received shutdown signal")
        self.running = False
    
    async def process_chapter_task(self, task_data: Dict[str, Any]) -> bool:
        """
        Process a single chapter translation task with streaming
        
        Args:
            task_data (dict): Task data containing book_id, chapter_index, chapter_text
            
        Returns:
            bool: True if processed successfully
        """
        book_id = task_data['book_id']
        chapter_index = task_data['chapter_index']
        chapter_text = task_data['chapter_text']
        ack_id = task_data.get('ack_id')
        
        self.logger.info(f"Processing chapter {chapter_index} of book {book_id}")
        
        try:
            # Initialize services if needed
            if not db_helper._initialized:
                await db_helper.connect()
            
            # Update chapter status to processing
            chapters = await db_helper.find_documents(
                f"books/{book_id}/chapters",
                query={"chapter_index": chapter_index},
                limit=1
            )
            
            if chapters:
                chapter_doc_id = chapters[0]['id']
                await db_helper.update_document(
                    f"books/{book_id}/chapters",
                    chapter_doc_id,
                    {"status": "processing"}
                )
            
            # Initialize orchestrator if needed and get GCS bucket
            if not hasattr(orchestrator, 'bucket') or orchestrator.bucket is None:
                await orchestrator.initialize()
            bucket = orchestrator.bucket
            blob = bucket.blob(f"books/{book_id}/chapters/chapter_{chapter_index}_zh.txt")
            
            # Create streaming callback to write to GCS progressively
            stream_buffer = []
            
            def streaming_callback(chunk: str, progress: float):
                """Callback to handle streaming chunks"""
                stream_buffer.append(chunk)
                
                # Write to GCS every 10% progress or at completion
                if progress >= 100 or (len(stream_buffer) > 5 and progress % 10 < 1):
                    partial_content = "".join(stream_buffer)
                    blob.upload_from_string(
                        partial_content,
                        content_type="text/plain; charset=utf-8"
                    )
                    self.logger.debug(f"Chapter {chapter_index}: {progress:.1f}% complete")
            
            # Translate the chapter with streaming
            translation_result = await translator.translate_chapter_stream(
                chapter_text,
                chapter_index,
                callback=streaming_callback
            )
            
            if translation_result['success']:
                # Final write to ensure all content is saved
                final_text = translation_result['translated_text']
                blob.upload_from_string(
                    final_text,
                    content_type="text/plain; charset=utf-8"
                )
                
                # Store the result metadata
                success = await orchestrator.store_chapter_translation(
                    book_id, chapter_index, translation_result
                )
                
                if success:
                    self.logger.info(f"Successfully processed chapter {chapter_index} of book {book_id}")
                    
                    # Acknowledge the message
                    if ack_id and hasattr(queue_manager, 'chapter_subscription_path') and queue_manager.chapter_subscription_path:
                        await queue_manager.ack_message(
                            queue_manager.chapter_subscription_path,
                            ack_id
                        )
                    return True
                else:
                    self.logger.error(f"Failed to store translation result for chapter {chapter_index}")
                    return False
            else:
                self.logger.error(f"Translation failed for chapter {chapter_index} of book {book_id}")
                
                # Update chapter status to failed
                if chapters:
                    await db_helper.update_document(
                        f"books/{book_id}/chapters",
                        chapter_doc_id,
                        {
                            "status": "failed",
                            "error": translation_result.get('error', 'Unknown error')
                        }
                    )
                
                # NACK the message for retry
                if ack_id and hasattr(queue_manager, 'chapter_subscription_path') and queue_manager.chapter_subscription_path:
                    await queue_manager.nack_message(
                        queue_manager.chapter_subscription_path,
                        ack_id
                    )
                return False
                
        except Exception as e:
            self.logger.error(f"Error processing chapter {chapter_index} of book {book_id}: {e}")
            
            # NACK the message for retry
            if ack_id and hasattr(queue_manager, 'chapter_subscription_path') and queue_manager.chapter_subscription_path:
                await queue_manager.nack_message(
                    queue_manager.chapter_subscription_path,
                    ack_id
                )
            return False
    
    async def run_pull_mode(self):
        """Main worker loop using pull mode"""
        self.running = True
        self.logger.info(f"Chapter worker {self.worker_id} started (pull mode)")
        
        # Initialize services
        await queue_manager.initialize()
        
        while self.running:
            try:
                # Pull tasks from the queue
                tasks = await queue_manager.pull_chapter_task(
                    max_messages=1,
                    timeout=30.0
                )
                
                if tasks:
                    for task_data in tasks:
                        await self.process_chapter_task(task_data)
                else:
                    # No task available, continue polling
                    self.logger.debug(f"Worker {self.worker_id} - no tasks available")
                    
            except Exception as e:
                self.logger.error(f"Worker {self.worker_id} error: {e}")
                await asyncio.sleep(5)  # Brief pause before retrying
        
        self.logger.info(f"Chapter worker {self.worker_id} stopped")
    
    async def run_streaming_mode(self):
        """Run worker in streaming mode (push subscription)"""
        self.running = True
        self.logger.info(f"Chapter worker {self.worker_id} started (streaming mode)")
        
        # Create streaming worker
        streaming_worker = StreamingWorker(
            subscription_name='chapter-translation-sub',
            process_callback=self.process_chapter_task
        )
        
        await streaming_worker.start()
        
        # Keep running until shutdown signal
        while self.running:
            await asyncio.sleep(1)
        
        streaming_worker.stop()
        self.logger.info(f"Chapter worker {self.worker_id} stopped")

async def run_chapter_worker(worker_id: str, mode: str = "pull"):
    """Run a chapter worker"""
    worker = ChapterWorker(worker_id)
    
    if mode == "streaming":
        await worker.run_streaming_mode()
    else:
        await worker.run_pull_mode()

if __name__ == "__main__":
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Get worker ID and mode from command line
    worker_id = sys.argv[1] if len(sys.argv) > 1 else "worker_1"
    mode = sys.argv[2] if len(sys.argv) > 2 else "pull"
    
    # Run the worker
    asyncio.run(run_chapter_worker(worker_id, mode))
