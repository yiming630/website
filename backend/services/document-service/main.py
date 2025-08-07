"""
FastAPI Document Processing Service
Integrates with existing PDF processing system
"""
import os
import sys
import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

# Add the existing PDF processing modules to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "Test" / "PDF_to_DOCX"))

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, ValidationError
from typing import Optional, List, Dict, Any
import uvicorn

# Import existing processing modules
from src.converter import PDFConverter
from src.splitter import DocumentSplitter
from src.pdf_splitter import PDFSplitter
from src.gemini_client import GeminiClient
from src.cloud_storage import CloudStorageManager

# Import database connection
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "databases"))
from connection import query, transaction

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global instances
pdf_converter = None
document_splitter = None
pdf_splitter = None
gemini_client = None
cloud_storage = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global pdf_converter, document_splitter, pdf_splitter, gemini_client, cloud_storage
    
    # Startup
    logger.info("🚀 Starting Document Processing Service...")
    
    try:
        # Initialize processing components
        pdf_converter = PDFConverter()
        document_splitter = DocumentSplitter()
        pdf_splitter = PDFSplitter()
        gemini_client = GeminiClient()
        cloud_storage = CloudStorageManager()
        
        logger.info("✅ Document processing components initialized")
        
        # Test database connection
        await query("SELECT 1")
        logger.info("✅ Database connection established")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize service: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Document Processing Service...")

# Create FastAPI app
app = FastAPI(
    title="Translation Platform - Document Service",
    description="Document processing and conversion service",
    version="1.0.0",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Pydantic models
class DocumentProcessRequest(BaseModel):
    document_id: str
    source_language: str
    target_language: str
    translation_style: str
    specialization: str
    auto_start: bool = True

class ProcessingStatus(BaseModel):
    document_id: str
    status: str
    progress: int
    current_step: str
    estimated_time_remaining: Optional[int] = None
    error: Optional[str] = None

class TranslationRequest(BaseModel):
    content: str
    source_language: str
    target_language: str
    style: str = "general"

class TranslationResponse(BaseModel):
    translated_content: str
    confidence: float
    processing_time: float

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "document-service",
        "timestamp": asyncio.get_event_loop().time()
    }

# Document processing endpoints
@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Upload and process a document"""
    try:
        # Validate file type
        if not file.filename.lower().endswith(('.pdf', '.docx', '.txt')):
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file type. Only PDF, DOCX, and TXT files are allowed."
            )
        
        # Save uploaded file temporarily
        upload_dir = Path("temp_uploads")
        upload_dir.mkdir(exist_ok=True)
        
        file_path = upload_dir / file.filename
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Create document record (simplified - normally would come from GraphQL)
        document_id = str(uuid.uuid4())
        
        # Start background processing
        background_tasks.add_task(
            process_document_background,
            document_id,
            str(file_path),
            file.filename
        )
        
        return {
            "document_id": document_id,
            "filename": file.filename,
            "size": len(content),
            "status": "processing"
        }
        
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/process")
async def process_document(
    request: DocumentProcessRequest,
    background_tasks: BackgroundTasks
):
    """Start document processing"""
    try:
        # Get document info from database
        result = await query(
            "SELECT * FROM documents WHERE id = $1",
            [request.document_id]
        )
        
        if not result.rows:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document = result.rows[0]
        
        # Start background processing
        background_tasks.add_task(
            process_document_background,
            request.document_id,
            document.bos_object_key or document.file_url,
            document.title
        )
        
        return {
            "document_id": request.document_id,
            "status": "processing_started"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents/{document_id}/status")
async def get_processing_status(document_id: str):
    """Get document processing status"""
    try:
        result = await query(
            "SELECT status, progress, title FROM documents WHERE id = $1",
            [document_id]
        )
        
        if not result.rows:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document = result.rows[0]
        
        return ProcessingStatus(
            document_id=document_id,
            status=document.status,
            progress=document.progress or 0,
            current_step=get_current_step(document.status),
            estimated_time_remaining=estimate_time_remaining(document.progress or 0)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/translate/text")
async def translate_text(request: TranslationRequest):
    """Translate text directly using AI"""
    try:
        # Use existing Gemini client for translation
        # This is a placeholder - actual implementation would use Gemini API
        translated_content = f"[Translated from {request.source_language} to {request.target_language}]: {request.content}"
        
        return TranslationResponse(
            translated_content=translated_content,
            confidence=0.95,
            processing_time=1.2
        )
        
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Background processing functions
async def process_document_background(document_id: str, file_path: str, filename: str):
    """Background task for document processing"""
    try:
        await update_document_status(document_id, "PROCESSING", 10)
        
        # Determine file type and process accordingly
        file_extension = Path(filename).suffix.lower()
        
        if file_extension == '.pdf':
            await process_pdf_document(document_id, file_path)
        elif file_extension == '.docx':
            await process_docx_document(document_id, file_path)
        elif file_extension == '.txt':
            await process_text_document(document_id, file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")
        
        await update_document_status(document_id, "COMPLETED", 100)
        logger.info(f"✅ Document {document_id} processed successfully")
        
    except Exception as e:
        logger.error(f"❌ Document processing failed for {document_id}: {e}")
        await update_document_status(document_id, "FAILED", 0, str(e))

async def process_pdf_document(document_id: str, file_path: str):
    """Process PDF document using existing PDF processing system"""
    await update_document_status(document_id, "PROCESSING", 30)
    
    # Use existing PDF splitter for processing
    result = pdf_splitter.split_and_convert_pdf(file_path)
    
    if result.get('success'):
        await update_document_status(document_id, "TRANSLATING", 60)
        
        # Extract content for translation
        # This would integrate with the existing processing pipeline
        content = "Extracted PDF content"  # Placeholder
        
        # Store extracted content
        await query(
            "UPDATE documents SET original_content = $1 WHERE id = $2",
            [content, document_id]
        )
        
        await update_document_status(document_id, "TRANSLATING", 80)
        
        # Translate content (placeholder)
        translated_content = f"Translated: {content}"
        
        await query(
            "UPDATE documents SET translated_content = $1 WHERE id = $2",
            [translated_content, document_id]
        )
        
    else:
        raise Exception(f"PDF processing failed: {result.get('error')}")

async def process_docx_document(document_id: str, file_path: str):
    """Process DOCX document"""
    await update_document_status(document_id, "PROCESSING", 50)
    
    # Extract content from DOCX
    # Implementation would use existing DOCX processing
    content = "Extracted DOCX content"  # Placeholder
    
    await query(
        "UPDATE documents SET original_content = $1 WHERE id = $2",
        [content, document_id]
    )
    
    await update_document_status(document_id, "TRANSLATING", 80)
    
    # Translate content (placeholder)
    translated_content = f"Translated: {content}"
    
    await query(
        "UPDATE documents SET translated_content = $1 WHERE id = $2",
        [translated_content, document_id]
    )

async def process_text_document(document_id: str, file_path: str):
    """Process text document"""
    await update_document_status(document_id, "PROCESSING", 40)
    
    # Read text file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    await query(
        "UPDATE documents SET original_content = $1 WHERE id = $2",
        [content, document_id]
    )
    
    await update_document_status(document_id, "TRANSLATING", 80)
    
    # Translate content (placeholder)
    translated_content = f"Translated: {content}"
    
    await query(
        "UPDATE documents SET translated_content = $1 WHERE id = $2",
        [translated_content, document_id]
    )

async def update_document_status(document_id: str, status: str, progress: int, error: str = None):
    """Update document processing status"""
    try:
        if error:
            await query(
                "UPDATE documents SET status = $1, progress = $2, updated_at = NOW() WHERE id = $3",
                [status, progress, document_id]
            )
            # Log error separately or store in error table
            logger.error(f"Document {document_id} error: {error}")
        else:
            await query(
                "UPDATE documents SET status = $1, progress = $2, updated_at = NOW() WHERE id = $3",
                [status, progress, document_id]
            )
            
        logger.info(f"Document {document_id} status updated: {status} ({progress}%)")
        
    except Exception as e:
        logger.error(f"Failed to update document status: {e}")

def get_current_step(status: str) -> str:
    """Get human-readable current step"""
    steps = {
        "PROCESSING": "Processing document...",
        "TRANSLATING": "Translating content...",
        "REVIEWING": "Review in progress...",
        "COMPLETED": "Translation completed",
        "FAILED": "Processing failed"
    }
    return steps.get(status, "Unknown status")

def estimate_time_remaining(progress: int) -> Optional[int]:
    """Estimate time remaining based on progress"""
    if progress >= 100:
        return 0
    elif progress >= 80:
        return 30  # 30 seconds
    elif progress >= 50:
        return 120  # 2 minutes
    elif progress >= 20:
        return 300  # 5 minutes
    else:
        return 600  # 10 minutes

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )