# Document Translation Pipeline - Core Engine Technical Specification

## Executive Summary

Build a modular document translation engine in Python that processes documents through a pipeline: **Parse → Segment → Translate → Reassemble**. The engine will integrate with the existing Node.js/GraphQL backend infrastructure through a REST API wrapper, connecting to the PostgreSQL database and Redis queue system.

## Core Architecture

### Directory Structure
```
backend/services/document-processing-engine/
├── core/
│   ├── processors/           # Document format handlers
│   │   ├── base_processor.py
│   │   ├── pdf_processor.py
│   │   ├── docx_processor.py
│   │   └── txt_processor.py
│   ├── segmentation/         # Text segmentation strategies
│   │   ├── base_segmenter.py
│   │   └── smart_segmenter.py
│   ├── translation/          # Translation engine
│   │   ├── openrouter_client.py
│   │   └── translation_manager.py
│   └── assembly/             # Document reconstruction
│       └── format_reconstructor.py
├── pipelines/
│   └── simple_pipeline.py   # Main pipeline orchestrator
├── models/
│   └── data_models.py       # Data structures
├── api/
│   └── fastapi_server.py    # REST API for Node.js integration
├── integrations/
│   ├── postgres_client.py   # Database connection
│   └── redis_client.py       # Queue integration
├── requirements.txt
└── setup.py
```

## Integration Architecture

### System Context
The Python translation engine integrates with the existing SeekHub infrastructure:

```
Frontend (Next.js) → GraphQL API (Node.js) → Redis Queue → Python Translation Engine
                                            ↓                        ↓
                                     PostgreSQL DB            OpenRouter API
```

### Integration Points

#### 1. API Gateway Integration
- **Protocol**: REST API via FastAPI
- **Port**: 8001 (Python service)
- **Endpoint**: `/api/translate/process`
- **Communication**: The Node.js API Gateway (port 4000) will call the Python service
- **Data Format**: JSON with base64 encoded document

#### 2. Queue System Integration
- **Technology**: Redis (existing infrastructure)
- **Queue Names**: `translation-simple`, `translation-complex`
- **Worker Pattern**: Python workers pull jobs from Redis queue
- **Job Format**: JSON containing job_id, document_path, config

#### 3. Database Integration
- **Database**: PostgreSQL (existing)
- **Tables to interact with**:
  - `translation_jobs`: Track job status and progress
  - `translation_segments`: Store segment-level translations (for complex pipeline)
  - `documents`: Reference original documents
- **Connection**: Use `psycopg2` to connect to existing PostgreSQL instance

#### 4. File Storage Integration
- **Current System**: LocalFileStorage (Node.js)
- **Python Access**: Direct file system access to `./uploads` directory
- **File Naming**: `{job_id}_{timestamp}_{filename}`

## Code Style Guidelines

### Python Standards
- **Python Version**: 3.9+ required
- **Style Guide**: PEP 8 compliance mandatory
- **Type Hints**: Required for all function signatures
- **Docstrings**: Google style docstrings for all classes and methods
- **Import Order**: Standard library → Third-party → Local imports
- **Line Length**: Maximum 100 characters
- **Class Names**: PascalCase
- **Function/Variable Names**: snake_case
- **Constants**: UPPER_SNAKE_CASE

### Project Conventions
- All processors must inherit from `BaseProcessor`
- All segmenters must inherit from `BaseSegmenter`
- Use dependency injection for external services
- Implement factory pattern for processor selection
- Use async/await for I/O operations
- Return typed dataclasses, not dictionaries

## Data Flow Architecture

### Processing Pipeline

1. **Job Receipt** (from Redis Queue)
   - Pull job from queue
   - Update job status in PostgreSQL
   - Retrieve document from file storage

2. **Document Processing**
   - Detect format
   - Initialize processor
   - Extract text and structure
   - Segment for translation

3. **Translation**
   - Batch segments
   - Call OpenRouter API
   - Store translations in database
   - Update progress

4. **Reconstruction**
   - Reassemble document
   - Save to file storage
   - Update job completion
   - Notify via Redis pub/sub

## Component Specifications

### 1. Data Models
Define structured data models using Python dataclasses:
- `DocumentMetadata`: Format, languages, statistics
- `TextSegment`: Content, position, formatting
- `DocumentStructure`: Complete document representation
- `TranslationJob`: Job tracking information
- `TranslationConfig`: Processing parameters

### 2. Document Processors

#### Base Processor
Abstract base class defining the interface:
- `parse()`: Extract text and structure
- `reconstruct()`: Rebuild with translations
- `get_format()`: Return supported format

#### PDF Processor
- Libraries: PyPDF2, pdfplumber, reportlab
- Preserve: Page layout, fonts, images, coordinates
- Handle: Text extraction, OCR fallback, reconstruction

#### DOCX Processor
- Library: python-docx
- Preserve: Styles, tables, lists, inline formatting
- Handle: Paragraphs, runs, sections, headers/footers

#### TXT Processor
- Simple text processing
- Preserve: Line breaks, encoding
- Handle: Various encodings (UTF-8, ASCII, etc.)

### 3. Segmentation Strategy

Smart segmentation algorithm:
- Respect sentence boundaries
- Group related content
- Target segment size: 800 characters
- Maintain context overlap
- Preserve special markers (bullets, numbers)

### 4. Translation Management

#### OpenRouter Integration
- Base URL: `https://openrouter.ai/api/v1`
- Model: `google/gemini-pro-1.5`
- Batch size: 5-10 segments
- Rate limiting: 5 concurrent requests
- Retry strategy: Exponential backoff

#### Translation Flow
- Queue segments for processing
- Batch API calls
- Validate responses
- Handle failures gracefully
- Cache successful translations

### 5. Format Reconstruction

Reconstruction requirements per format:
- **PDF**: Maintain layout, adjust text sizing, preserve graphics
- **DOCX**: Clone structure, apply styles, maintain metadata
- **TXT**: Simple text replacement

## API Specifications

### REST API Endpoints

#### Process Document
- **Endpoint**: `POST /api/translate/process`
- **Input**: Job ID, document path, configuration
- **Output**: Status acknowledgment
- **Processing**: Asynchronous via queue

#### Get Status
- **Endpoint**: `GET /api/translate/status/{job_id}`
- **Output**: Progress percentage, current stage

#### Health Check
- **Endpoint**: `GET /health`
- **Output**: Service status, version, dependencies

### GraphQL Integration (via Node.js)
The Node.js API Gateway exposes GraphQL mutations:
- `startSimpleTranslation`: Initiates translation job
- `cancelTranslation`: Cancels running job
- `translationProgress`: Subscribe to progress updates

## Database Schema Extensions

Required tables for translation pipeline:
- `translation_jobs`: Main job tracking
- `translation_segments`: Segment-level data
- `translation_cache`: Cached translations
- `processing_metrics`: Performance tracking

## Performance Requirements

### Processing Targets
- Document size: Up to 100MB
- Processing time: <2 minutes for 10 pages
- Concurrent jobs: 10 simultaneous
- Memory usage: <500MB per job
- API response time: <100ms

### Optimization Strategies
- Connection pooling for database
- Redis connection reuse
- Segment-level caching
- Async I/O operations
- Memory streaming for large files

## Error Handling

### Error Categories
1. **Input Errors**: Invalid format, corrupted files
2. **Processing Errors**: Parsing failures, memory issues
3. **API Errors**: Rate limits, network failures
4. **System Errors**: Database connection, file I/O

### Recovery Strategies
- Automatic retry for transient failures
- Partial processing for recoverable errors
- Graceful degradation for non-critical failures
- Complete rollback for critical errors

## Testing Requirements

### Unit Testing
- Each processor implementation
- Segmentation algorithms
- Translation manager logic
- Format reconstruction

### Integration Testing
- Full pipeline execution
- Database interactions
- Queue processing
- API endpoints

### Performance Testing
- Load testing with concurrent jobs
- Memory usage profiling
- Large document handling
- API throughput testing

## Deployment Configuration

### Environment Variables
```
OPENROUTER_API_KEY=<key>
DATABASE_URL=postgresql://user:pass@localhost/seekhub
REDIS_URL=redis://localhost:6379
FILE_STORAGE_PATH=./uploads
SERVICE_PORT=8001
MAX_WORKERS=4
```

### Docker Configuration
- Base image: `python:3.9-slim`
- Install system dependencies for PDF processing
- Mount volumes for file storage
- Network mode: bridge with backend services

## Future Expansion Points

### Complex Pipeline Support
- Interactive translation with AI chat
- Human review interface
- Translation memory integration
- Quality scoring system
- Collaborative editing

### Additional Format Support
- PowerPoint (PPTX)
- Excel (XLSX)
- HTML/Markdown
- EPUB
- RTF

### Advanced Features
- Glossary management
- Style guide enforcement
- Batch document processing
- Translation versioning
- A/B testing framework

## Development Phases

### Phase 1: Core Implementation
- Set up project structure
- Implement base classes
- Create TXT processor
- Basic segmentation
- OpenRouter client

### Phase 2: Format Support
- PDF processor implementation
- DOCX processor implementation
- Format detection
- Reconstruction logic

### Phase 3: Integration
- FastAPI server
- Redis queue worker
- PostgreSQL connection
- GraphQL resolver support

### Phase 4: Production Ready
- Error handling
- Performance optimization
- Monitoring integration
- Documentation
- Deployment scripts

## Success Metrics

1. **Accuracy**: >95% format preservation
2. **Performance**: <2 min/10 pages
3. **Reliability**: >99% job completion
4. **Scalability**: 100+ concurrent jobs
5. **Quality**: Coherent translations

## Critical Implementation Notes

1. The engine must be stateless for horizontal scaling
2. PostgreSQL is the single source of truth for all metadata
3. MongoDB GridFS is used only for binary storage of large files (>1MB)
4. Database connections must use connection pooling for both PostgreSQL and MongoDB
5. Always check PostgreSQL for file references before accessing MongoDB
6. Memory usage must be bounded regardless of document size
7. API keys must never be logged or exposed
8. All errors must be caught and logged appropriately
9. Progress updates must be real-time via Redis pub/sub
10. MongoDB GridFS chunks should be streamed, not loaded entirely into memory
11. Implement retry logic for MongoDB connection failures
12. Clean up orphaned GridFS files if translation fails
13. Glossary terms from PostgreSQL should be applied before translation
14. All audit trails and history must be recorded in PostgreSQL

## Coordination with Existing System

The Python engine coordinates with:
- **Frontend**: Receives jobs via GraphQL/REST chain
- **API Gateway**: Processes requests from Node.js
- **Queue System**: Pulls jobs from Redis
- **Database**: Updates job status in PostgreSQL
- **File Storage**: Accesses documents via shared filesystem
- **Workers**: Runs alongside existing Node.js workers