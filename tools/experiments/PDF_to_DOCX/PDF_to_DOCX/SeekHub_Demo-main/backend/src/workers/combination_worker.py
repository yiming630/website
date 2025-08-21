"""
Combination Worker - Combines translated chapters into final book with early processing
"""
import asyncio
import logging
import sys
import os
from typing import Dict, Any, List
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from src.core.config import config
from src.core.pubsub_queue import queue_manager
from src.core.translation_orchestrator import orchestrator
from src.core.firestore_helper import db_helper

class CombinationWorker:
    """Worker that combines translated chapters with early processing support"""
    
    def __init__(self, worker_id: str):
        self.worker_id = worker_id
        self.logger = logging.getLogger(f"{__name__}.{worker_id}")
        self.running = False
    
    async def process_combination_task(self, task_data: Dict[str, Any]) -> bool:
        """
        Process a book combination task with early processing
        
        Args:
            task_data (dict): Task data containing book_id and total_chapters
            
        Returns:
            bool: True if processed successfully
        """
        book_id = task_data['book_id']
        total_chapters = task_data['total_chapters']
        ack_id = task_data.get('ack_id')
        
        self.logger.info(f"Starting combination for book {book_id} with {total_chapters} chapters")
        
        try:
            # Initialize services if needed
            if not db_helper._initialized:
                await db_helper.connect()
            
            # Update book status
            await db_helper.update_document("books", book_id, {"status": "combining"})
            
            # Start monitoring and combining as chapters complete
            combined_chapters = []
            chapters_processed = 0
            last_check_count = 0
            
            while chapters_processed < total_chapters:
                # Get completed chapters
                chapters = await db_helper.find_documents(
                    f"books/{book_id}/chapters",
                    query={"status": "completed"},
                    order_by="chapter_index"
                )
                
                # Process newly completed chapters
                new_chapters = chapters[last_check_count:]
                if new_chapters:
                    self.logger.info(f"Processing {len(new_chapters)} new chapters for book {book_id}")
                    
                    for chapter in new_chapters:
                        # Get translated text from GCS
                        if chapter.get('gcs_path'):
                            # Initialize orchestrator if needed
                            if not hasattr(orchestrator, 'bucket') or orchestrator.bucket is None:
                                await orchestrator.initialize()
                            blob = orchestrator.bucket.blob(chapter['gcs_path'])
                            if blob.exists():
                                chapter_text = blob.download_as_text()
                                combined_chapters.append({
                                    'index': chapter['chapter_index'],
                                    'text': chapter_text
                                })
                    
                    last_check_count = len(chapters)
                    chapters_processed = len(combined_chapters)
                    
                    # Calculate progress
                    progress = (chapters_processed / total_chapters) * 100
                    self.logger.info(f"Book {book_id}: {progress:.1f}% chapters ready for combination")
                    
                    # Start early processing when we have 30% of chapters
                    if progress >= 30 and len(combined_chapters) >= 3:
                        await self._perform_early_processing(book_id, combined_chapters)
                
                # Check if all chapters are done
                if chapters_processed >= total_chapters:
                    break
                
                # Wait a bit before checking again
                await asyncio.sleep(5)
            
            # Final combination
            self.logger.info(f"All chapters ready, performing final combination for book {book_id}")
            
            # Sort chapters by index
            combined_chapters.sort(key=lambda x: x['index'])
            
            # Create final document
            final_text = ""
            for chapter in combined_chapters:
                final_text += f"\n\n第 {chapter['index'] + 1} 章\n\n{chapter['text']}"
            
            # Upload final combined book
            # Initialize orchestrator if needed
            if not hasattr(orchestrator, 'bucket') or orchestrator.bucket is None:
                await orchestrator.initialize()
            final_blob = orchestrator.bucket.blob(f"books/{book_id}/translated_zh.txt")
            final_blob.upload_from_string(
                final_text,
                content_type="text/plain; charset=utf-8"
            )
            
            # Update book status to completed
            await db_helper.update_document(
                "books",
                book_id,
                {
                    "status": "completed",
                    "gcs_path": f"books/{book_id}/translated_zh.txt",
                    "completed_at": datetime.utcnow().isoformat()
                }
            )
            
            self.logger.info(f"Successfully combined book {book_id}")
            
            # Acknowledge the message
            if ack_id and hasattr(queue_manager, 'combination_subscription_path') and queue_manager.combination_subscription_path:
                await queue_manager.ack_message(
                    queue_manager.combination_subscription_path,
                    ack_id
                )
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error combining book {book_id}: {e}")
            
            # Update book status to failed
            await db_helper.update_document(
                "books",
                book_id,
                {
                    "status": "failed",
                    "error": str(e)
                }
            )
            
            # NACK the message for retry
            if ack_id and hasattr(queue_manager, 'combination_subscription_path') and queue_manager.combination_subscription_path:
                await queue_manager.nack_message(
                    queue_manager.combination_subscription_path,
                    ack_id
                )
            
            return False
    
    async def _perform_early_processing(self, book_id: str, chapters: List[Dict[str, Any]]):
        """
        Perform early processing tasks like formatting, indexing, etc.
        
        Args:
            book_id (str): Book ID
            chapters (list): List of available chapters
        """
        try:
            self.logger.info(f"Performing early processing for book {book_id} with {len(chapters)} chapters")
            
            # Example early processing tasks:
            # 1. Generate table of contents
            toc = "目录\n\n"
            for chapter in chapters:
                toc += f"第 {chapter['index'] + 1} 章\n"
            
            # Upload partial TOC
            # Initialize orchestrator if needed
            if not hasattr(orchestrator, 'bucket') or orchestrator.bucket is None:
                await orchestrator.initialize()
            toc_blob = orchestrator.bucket.blob(f"books/{book_id}/toc_partial.txt")
            toc_blob.upload_from_string(toc, content_type="text/plain; charset=utf-8")
            
            # 2. Start generating preview (first few chapters)
            if len(chapters) >= 3:
                preview_text = ""
                for chapter in chapters[:3]:
                    preview_text += f"\n\n第 {chapter['index'] + 1} 章\n\n{chapter['text']}"
                
                # Initialize orchestrator if needed (already done above)
                preview_blob = orchestrator.bucket.blob(f"books/{book_id}/preview_zh.txt")
                preview_blob.upload_from_string(
                    preview_text,
                    content_type="text/plain; charset=utf-8"
                )
                
                # Update book with preview availability
                await db_helper.update_document(
                    "books",
                    book_id,
                    {
                        "preview_available": True,
                        "preview_path": f"books/{book_id}/preview_zh.txt"
                    }
                )
            
            self.logger.info(f"Early processing completed for book {book_id}")
            
        except Exception as e:
            self.logger.error(f"Error in early processing for book {book_id}: {e}")
    
    async def run(self):
        """Main worker loop"""
        self.running = True
        self.logger.info(f"Combination worker {self.worker_id} started")
        
        # Initialize services
        await queue_manager.initialize()
        
        while self.running:
            try:
                # Pull combination tasks
                if hasattr(queue_manager, 'combination_subscription_path') and queue_manager.combination_subscription_path:
                    tasks = await queue_manager.pull_messages(
                        queue_manager.combination_subscription_path,
                        max_messages=1,
                        timeout=30.0
                    )
                    
                    if tasks:
                        for task_data in tasks:
                            await self.process_combination_task(task_data)
                    else:
                        self.logger.debug(f"Worker {self.worker_id} - no combination tasks available")
                else:
                    self.logger.warning(f"Worker {self.worker_id} - combination subscription path not configured")
                    
            except Exception as e:
                self.logger.error(f"Worker {self.worker_id} error: {e}")
                await asyncio.sleep(5)
        
        self.logger.info(f"Combination worker {self.worker_id} stopped")

async def run_combination_worker(worker_id: str):
    """Run a combination worker"""
    worker = CombinationWorker(worker_id)
    await worker.run()

if __name__ == "__main__":
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Get worker ID from command line
    worker_id = sys.argv[1] if len(sys.argv) > 1 else "combination_worker_1"
    
    # Import datetime for timestamp
    from datetime import datetime
    
    # Run the worker
    asyncio.run(run_combination_worker(worker_id))
