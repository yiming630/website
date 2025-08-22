"""
Translation Orchestrator - Manages the translation workflow using Google Cloud services
"""
import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import re

# Import cloud services
from .firestore_helper import db_helper, FirestoreContext, update_book_status
from .pubsub_queue import queue_manager
from .gemini_client import translator
from .config import config
from .local_storage import LocalFileStorage

class CloudTranslationOrchestrator:
    """Orchestrates book translation workflow using Firestore and Pub/Sub"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        # Replace GCS with local storage
        self.storage_client = LocalFileStorage()
        self.bucket_name = 'seekhub-translations'  # Kept for compatibility
        
    async def initialize(self):
        """Initialize cloud services"""
        await db_helper.connect()
        await queue_manager.initialize()
        
        # Local storage is initialized automatically
        self.logger.info(f"Using local storage at: {self.storage_client.storage_root}")
    
    def split_into_chapters(self, content: str) -> List[str]:
        """
        Split book content into chapters
        
        Args:
            content (str): Full book content
            
        Returns:
            list: List of chapter texts
        """
        # Try to split by common chapter markers
        chapter_patterns = [
            r'Chapter\s+\d+',
            r'CHAPTER\s+\d+',
            r'第\s*[一二三四五六七八九十百千万0-9]+\s*章',
            r'\n\s*\d+\.\s+',
            r'\n\s*[IVX]+\.\s*'
        ]
        
        for pattern in chapter_patterns:
            chapters = re.split(pattern, content)
            if len(chapters) > 1:
                # Remove empty chapters and clean up
                chapters = [ch.strip() for ch in chapters if ch.strip()]
                self.logger.info(f"Split book into {len(chapters)} chapters using pattern: {pattern}")
                return chapters
        
        # If no chapter markers found, split by paragraphs or size
        paragraphs = content.split('\n\n')
        if len(paragraphs) > 20:
            # Group paragraphs into chapters
            chapter_size = max(1, len(paragraphs) // 20)
            chapters = []
            for i in range(0, len(paragraphs), chapter_size):
                chapter = '\n\n'.join(paragraphs[i:i+chapter_size])
                if chapter.strip():
                    chapters.append(chapter)
            self.logger.info(f"Split book into {len(chapters)} chapters by paragraph grouping")
            return chapters
        
        # Last resort: treat entire content as one chapter
        self.logger.warning("Could not find chapter markers, treating as single chapter")
        return [content]
    
    async def translate_book(self, book_id: str, title: str, author: str, 
                           content: str, language: str = "en") -> Dict[str, Any]:
        """
        Orchestrate the translation of a book
        
        Args:
            book_id (str): Book identifier
            title (str): Book title
            author (str): Book author
            content (str): Book content
            language (str): Source language
            
        Returns:
            dict: Translation job information
        """
        try:
            # Initialize services
            await self.initialize()
            
            # Save book metadata to Firestore
            book_doc = {
                "title": title,
                "author": author,
                "source_language": language,
                "target_language": "zh",
                "status": "processing",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            if not book_id:
                book_id = await db_helper.insert_document("books", book_doc)
            else:
                book_doc["id"] = book_id
                await db_helper.insert_document("books", book_doc, book_id)
            
            # Upload original content to local storage
            original_path = self.storage_client.upload_string(
                content, 
                f"books/{book_id}/original.txt"
            )
            self.logger.info(f"Uploaded original content to: {original_path}")
            
            # Split into chapters
            chapters = self.split_into_chapters(content)
            total_chapters = len(chapters)
            
            # Update book with chapter count
            await update_book_status(book_id, "processing", 
                                   total_chapters=total_chapters,
                                   chapters_completed=0)
            
            # Create chapter documents in Firestore
            chapter_docs = []
            for i, chapter_text in enumerate(chapters):
                chapter_doc = {
                    "book_id": book_id,
                    "chapter_index": i,
                    "status": "pending",
                    "original_length": len(chapter_text),
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                doc_id = await db_helper.insert_document(f"books/{book_id}/chapters", chapter_doc)
                chapter_docs.append(doc_id)
            
            # Publish chapter translation tasks to Pub/Sub
            message_ids = await queue_manager.add_chapter_tasks_batch([
                {
                    'book_id': book_id,
                    'chapter_index': i,
                    'chapter_text': chapter_text,
                    'priority': 1
                }
                for i, chapter_text in enumerate(chapters)
            ])
            
            self.logger.info(f"Published {len(message_ids)} chapter translation tasks for book {book_id}")
            
            # Start monitoring for completion
            asyncio.create_task(self._monitor_translation_progress(book_id, total_chapters))
            
            return {
                'book_id': book_id,
                'status': 'processing',
                'total_chapters': total_chapters,
                'message': f'Translation started for {total_chapters} chapters'
            }
            
        except Exception as e:
            self.logger.error(f"Error in translate_book: {e}")
            if book_id:
                await update_book_status(book_id, "failed", error=str(e))
            raise
    
    async def _monitor_translation_progress(self, book_id: str, total_chapters: int):
        """
        Monitor translation progress and trigger combination when complete
        
        Args:
            book_id (str): Book ID
            total_chapters (int): Total number of chapters
        """
        try:
            while True:
                # Check chapter completion status
                completed_chapters = 0
                chapters = await db_helper.find_documents(
                    f"books/{book_id}/chapters",
                    query={"status": "completed"}
                )
                completed_chapters = len(chapters)
                
                # Update book progress
                await update_book_status(book_id, "processing", 
                                       chapters_completed=completed_chapters)
                
                if completed_chapters >= total_chapters:
                    self.logger.info(f"All chapters completed for book {book_id}")
                    # Publish combination task
                    await queue_manager.add_combination_task(book_id, total_chapters)
                    break
                
                # Wait before checking again
                await asyncio.sleep(10)
                
        except Exception as e:
            self.logger.error(f"Error monitoring progress for book {book_id}: {e}")
            await update_book_status(book_id, "failed", error=str(e))
    
    async def store_chapter_translation(self, book_id: str, chapter_index: int, 
                                      translation_result: Dict[str, Any]) -> bool:
        """
        Store chapter translation result in GCS and update Firestore
        
        Args:
            book_id (str): Book ID
            chapter_index (int): Chapter index
            translation_result (dict): Translation result
            
        Returns:
            bool: Success status
        """
        try:
            # Upload translated text to local storage
            translated_text = translation_result.get('translated_text', '')
            if translated_text:
                chapter_path = self.storage_client.upload_string(
                    translated_text,
                    f"books/{book_id}/chapters/chapter_{chapter_index}_zh.txt"
                )
                self.logger.info(f"Uploaded chapter translation to: {chapter_path}")
            
            # Update chapter document in Firestore
            chapters = await db_helper.find_documents(
                f"books/{book_id}/chapters",
                query={"chapter_index": chapter_index},
                limit=1
            )
            
            if chapters:
                chapter_id = chapters[0]['id']
                await db_helper.update_document(
                    f"books/{book_id}/chapters",
                    chapter_id,
                    {
                        "status": "completed" if translation_result.get('success') else "failed",
                        "translated_length": len(translated_text),
                        "translation_time": translation_result.get('translation_time', 0),
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                        "gcs_path": f"books/{book_id}/chapters/chapter_{chapter_index}_zh.txt"
                    }
                )
            return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Error storing chapter translation: {e}")
            return False
    
    async def combine_translated_book(self, book_id: str) -> Optional[str]:
        """
        Combine all translated chapters into final book
        
        Args:
            book_id (str): Book ID
            
        Returns:
            str: GCS path of combined book or None
        """
        try:
            # Get all chapters in order
            chapters = await db_helper.find_documents(
                f"books/{book_id}/chapters",
                order_by="chapter_index"
            )
            
            # Download and combine translations
            combined_text = []
            for chapter in chapters:
                if chapter.get('status') == 'completed' and chapter.get('gcs_path'):
                    # Extract relative path from the stored path
                    relative_path = chapter['gcs_path']
                    if relative_path.startswith(self.storage_client.public_url_base):
                        relative_path = relative_path.replace(self.storage_client.public_url_base + '/', '')
                    chapter_text = self.storage_client.download_string(relative_path)
                    combined_text.append(f"\n\n第 {chapter['chapter_index'] + 1} 章\n\n{chapter_text}")
            
            if combined_text:
                # Upload combined translation
                final_text = "".join(combined_text)
                final_path = self.storage_client.upload_string(
                    final_text,
                    f"books/{book_id}/translated_zh.txt"
                )
                self.logger.info(f"Uploaded final translation to: {final_path}")
                
                # Update book status
                await update_book_status(
                    book_id, 
                    "completed",
                    gcs_path=f"books/{book_id}/translated_zh.txt",
                    completed_at=datetime.now(timezone.utc).isoformat()
                )
                
                return f"books/{book_id}/translated_zh.txt"
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error combining book {book_id}: {e}")
            await update_book_status(book_id, "failed", error=str(e))
            return None
    
    async def get_translation_status(self, book_id: str) -> Dict[str, Any]:
        """
        Get current translation status
        
        Args:
            book_id (str): Book ID
        
        Returns:
            dict: Status information
        """
        try:
            # Get book document
            book = await db_helper.get_document_by_id("books", book_id)
            if not book:
                return {"error": "Book not found"}
            
            # Get chapter statuses
            chapters = await db_helper.find_documents(f"books/{book_id}/chapters")
            
            status_counts = {
                "pending": 0,
                "processing": 0,
                "completed": 0,
                "failed": 0
            }
            
            for chapter in chapters:
                status = chapter.get('status', 'pending')
                if status in status_counts:
                    status_counts[status] += 1
            
            return {
                "book_id": book_id,
                "title": book.get('title'),
                "status": book.get('status'),
                "total_chapters": book.get('total_chapters', 0),
                "chapters_completed": status_counts['completed'],
                "chapters_failed": status_counts['failed'],
                "chapters_pending": status_counts['pending'],
                "chapters_processing": status_counts['processing'],
                "created_at": book.get('created_at'),
                "completed_at": book.get('completed_at'),
                "gcs_path": book.get('gcs_path')
            }
            
        except Exception as e:
            self.logger.error(f"Error getting translation status: {e}")
            return {"error": str(e)}

# Create global orchestrator instance
orchestrator = CloudTranslationOrchestrator()

if __name__ == "__main__":
    # Test the orchestrator
    async def test_orchestrator():
        await orchestrator.initialize()
        
        # Test with sample content
        test_content = """
        Chapter 1: Introduction
        
        This is the first chapter of our test book.
        
        Chapter 2: Development
        
        This is the second chapter with more content.
        
        Chapter 3: Conclusion
        
        This is the final chapter.
        """
        
        result = await orchestrator.translate_book(
            book_id= "",
            title="Test Book",
            author="Test Author",
            content=test_content,
            language="en"
        )
        
        print(f"Translation started: {result}")
    
    asyncio.run(test_orchestrator())
