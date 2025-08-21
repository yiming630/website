#!/usr/bin/env python3
"""
Complete SeekHub Translation Pipeline
Starts workers and runs the full translation process
"""

import os
import sys
import asyncio
import argparse
import logging
import signal
import time
from pathlib import Path
from typing import List, Dict, Any
import subprocess
import threading

# Add paths for imports
sys.path.append(str(Path(__file__).parent / 'PDF_to_DOCX' / 'src'))
sys.path.append(str(Path(__file__).parent / 'backend' / 'src'))

# Import components
from PDF_to_DOCX.src.converter import PDFConverter
from PDF_to_DOCX.src.splitter import DocumentSplitter
from PDF_to_DOCX.src.pdf_splitter import PDFSplitter
from backend.src.core.translation_orchestrator import CloudTranslationOrchestrator
from backend.src.core.firestore_helper import db_helper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_env_vars():
    """Check that all required environment variables are set and valid."""
    missing = []
    errors = []
    # Required variables
    required_vars = [
        'GOOGLE_APPLICATION_CREDENTIALS',
        'FIRESTORE_PROJECT_ID',
        'PUBSUB_PROJECT_ID',
        'GCS_BUCKET_NAME',
        'GEMINI_API_KEYS',
    ]
    for var in required_vars:
        value = os.environ.get(var)
        if not value or (var == 'GEMINI_API_KEYS' and not any(k.strip() for k in value.split(','))):
            missing.append(var)
    # Check credentials file exists
    cred_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    if cred_path and not Path(cred_path).expanduser().exists():
        errors.append(f"GOOGLE_APPLICATION_CREDENTIALS file not found: {cred_path}")
    # Warn if GEMINI_MODEL is missing
    if not os.environ.get('GEMINI_MODEL'):
        print("[WARN] GEMINI_MODEL is not set. Using default model if available.")
    if missing or errors:
        print("\n[ERROR] The following environment variables are missing or invalid:")
        for var in missing:
            print(f"  - {var}")
        for err in errors:
            print(f"  - {err}")
        print("\nPlease set these variables in your environment or .env file before running the pipeline.")
        sys.exit(1)

# Run env check before anything else
check_env_vars()

class FullTranslationPipeline:
    """Complete translation pipeline with worker management"""
    
    def __init__(self):
        self.pdf_converter = PDFConverter()
        self.document_splitter = DocumentSplitter()
        self.pdf_splitter = PDFSplitter()
        self.translation_orchestrator = CloudTranslationOrchestrator()
        self.worker_process = None
        self.running = False
        
    async def start_workers(self, chapter_workers: int = 4, combination_workers: int = 2):
        """Start the worker processes"""
        logger.info("🚀 Starting translation workers...")
        
        # Start workers in a separate process
        worker_script = Path(__file__).parent / 'backend' / 'start_workers.py'
        
        cmd = [
            sys.executable,
            str(worker_script),
            '--chapter-workers', str(chapter_workers),
            '--combination-workers', str(combination_workers)
        ]
        
        self.worker_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        logger.info(f"✅ Workers started with PID: {self.worker_process.pid}")
        
        # Wait a bit for workers to initialize
        await asyncio.sleep(5)
        
        return True
    
    def stop_workers(self):
        """Stop the worker processes"""
        if self.worker_process:
            logger.info("🛑 Stopping workers...")
            self.worker_process.terminate()
            
            try:
                self.worker_process.wait(timeout=10)
                logger.info("✅ Workers stopped gracefully")
            except subprocess.TimeoutExpired:
                logger.warning("⚠️  Workers didn't stop gracefully, forcing...")
                self.worker_process.kill()
                self.worker_process.wait()
                logger.info("✅ Workers force stopped")
    
    async def convert_pdf_to_chapters(self, pdf_path: str, book_title: str) -> List[Dict[str, Any]]:
        """Convert PDF to chapters"""
        logger.info(f"📖 Converting PDF: {pdf_path}")
        
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        # Convert PDF to DOCX
        docx_path = pdf_path.with_suffix('.docx')
        logger.info(f"🔄 Converting PDF to DOCX: {docx_path}")
        
        # Create output directory
        output_dir = docx_path.parent
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Use the correct method (synchronous)
        success, result_path, error_msg = self.pdf_converter.convert_single_pdf(pdf_path, output_dir)
        if not success:
            raise Exception(f"Failed to convert PDF to DOCX: {error_msg}")
        
        # Update docx_path to the actual result path
        docx_path = result_path
        
        # Extract text from DOCX
        logger.info("📑 Extracting text from DOCX...")
        text = self.document_splitter.extract_text_from_docx(docx_path)
        
        # Split text into chapters (simple paragraph-based splitting)
        logger.info("📑 Splitting text into chapters...")
        paragraphs = text.split('\n\n')
        
        # Group paragraphs into chapters (simple approach)
        chapter_size = max(1, len(paragraphs) // 5)  # Split into ~5 chapters
        chapters = []
        for i in range(0, len(paragraphs), chapter_size):
            chapter_text = '\n\n'.join(paragraphs[i:i+chapter_size])
            if chapter_text.strip():
                chapters.append({
                    'content': chapter_text.strip(),
                    'index': len(chapters)
                })
        
        logger.info(f"✅ Document split into {len(chapters)} chapters")
        return chapters
    
    async def translate_book(self, chapters: List[Dict[str, Any]], book_title: str) -> str:
        """Translate the book using the orchestrator"""
        logger.info(f"🌐 Starting translation for book: {book_title}")
        
        # Combine all chapters into a single content string
        full_content = ""
        for i, chapter in enumerate(chapters):
            chapter_text = chapter.get('content', '')
            if chapter_text.strip():
                full_content += f"\n\nChapter {i+1}\n\n{chapter_text}"
        
        # Use the translate_book method which handles everything internally
        result = await self.translation_orchestrator.translate_book(
            book_id="",  # Auto-generate book ID
            title=book_title,
            author="Unknown",  # We don't have author info
            content=full_content,
            language="en"
        )
        
        book_id = result['book_id']
        logger.info(f"📚 Created book with ID: {book_id}")
        logger.info(f"📝 Submitted {result['total_chapters']} chapters for translation")
        
        # Monitor translation progress
        logger.info("⏳ Monitoring translation progress...")
        completed_chapters = 0
        total_chapters = len(chapters)
        
        while completed_chapters < total_chapters:
            # Get book status
            book_data = await db_helper.get_document_by_id("books", book_id)
            if book_data:
                status = book_data.get('status', 'unknown')
                logger.info(f"📊 Book status: {status}")
                
                if status == 'completed':
                    logger.info("✅ Translation completed!")
                    return book_id
                elif status == 'failed':
                    error = book_data.get('error', 'Unknown error')
                    raise Exception(f"Translation failed: {error}")
            
            # Check completed chapters
            chapters_data = await db_helper.find_documents(
                f"books/{book_id}/chapters",
                query={"status": "completed"}
            )
            
            new_completed = len(chapters_data)
            if new_completed > completed_chapters:
                completed_chapters = new_completed
                progress = (completed_chapters / total_chapters) * 100
                logger.info(f"📈 Progress: {completed_chapters}/{total_chapters} chapters ({progress:.1f}%)")
            
            # Wait before checking again
            await asyncio.sleep(10)
        
        return book_id
    
    async def download_translated_book(self, book_id: str, output_path: str) -> str:
        """Download the translated book"""
        logger.info(f"📥 Downloading translated book: {book_id}")
        
        # Get book data
        book_data = await db_helper.get_document_by_id("books", book_id)
        if not book_data:
            raise Exception(f"Book {book_id} not found")
        
        gcs_path = book_data.get('gcs_path')
        if not gcs_path:
            raise Exception("No GCS path found for translated book")
        
        # Download from GCS
        bucket = self.translation_orchestrator.bucket
        blob = bucket.blob(gcs_path)
        
        if not blob.exists():
            raise Exception(f"Translated book not found in GCS: {gcs_path}")
        
        # Download content
        content = blob.download_as_text()
        
        # Save to file
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        logger.info(f"✅ Translated book saved to: {output_path}")
        return str(output_path)
    
    async def run_full_pipeline(self, pdf_path: str, book_title: str, output_dir: str = "result"):
        """Run the complete translation pipeline"""
        logger.info("🎯 Starting complete translation pipeline")
        
        try:
            # Start workers
            await self.start_workers()
            
            # Convert PDF to chapters
            chapters = await self.convert_pdf_to_chapters(pdf_path, book_title)
            
            # Translate book
            book_id = await self.translate_book(chapters, book_title)
            
            # Download result
            output_path = Path(output_dir) / f"{book_title}_translated.txt"
            final_path = await self.download_translated_book(book_id, str(output_path))
            
            logger.info("🎉 Translation pipeline completed successfully!")
            logger.info(f"📄 Final result: {final_path}")
            
            return final_path
            
        except Exception as e:
            logger.error(f"💥 Pipeline failed: {e}")
            raise
        finally:
            # Stop workers
            self.stop_workers()

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info(f"Received signal {signum}, shutting down...")
    sys.exit(0)

async def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Complete SeekHub Translation Pipeline")
    parser.add_argument('pdf_path', help='Path to the PDF file to translate')
    parser.add_argument('--title', '-t', required=True, help='Book title')
    parser.add_argument('--output-dir', '-o', default='result', help='Output directory')
    parser.add_argument('--chapter-workers', '-c', type=int, default=4, help='Number of chapter workers')
    parser.add_argument('--combination-workers', '-b', type=int, default=2, help='Number of combination workers')
    
    args = parser.parse_args()
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create pipeline
    pipeline = FullTranslationPipeline()
    
    try:
        # Run the complete pipeline
        result_path = await pipeline.run_full_pipeline(
            pdf_path=args.pdf_path,
            book_title=args.title,
            output_dir=args.output_dir
        )
        
        print(f"\n🎉 Translation completed successfully!")
        print(f"📄 Result saved to: {result_path}")
        
    except KeyboardInterrupt:
        logger.info("👋 Pipeline interrupted by user")
    except Exception as e:
        logger.error(f"💥 Pipeline failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 