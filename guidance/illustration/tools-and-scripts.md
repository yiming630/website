# Tools and Scripts Documentation

## Development Tools Overview

**Purpose**: Utilities, experiments, and automation scripts for development and maintenance

**Why these exist separately**: 
- Experimental features not ready for production
- Development utilities not needed in production
- Automation scripts for repetitive tasks
- Testing and prototyping new features

---

## `/tools` - Development Tools

### `/tools/experiments/PDF_to_DOCX`
**Purpose**: Experimental PDF to DOCX conversion feature

**Structure**:
```
PDF_to_DOCX/
├── src/
│   ├── converter.py         # Core conversion logic
│   ├── pdf_splitter.py      # PDF splitting utilities
│   ├── splitter.py          # Document splitting logic
│   ├── gemini_client.py     # AI integration for conversion
│   ├── wps_client.py        # WPS Office integration
│   └── cloud_storage.py     # Cloud storage integration
├── data/
│   ├── pdf/                 # Input PDF files
│   ├── docx_raw/           # Raw conversion output
│   └── docx_split/         # Split document output
└── main.py                  # Entry point
```

**Technology Stack**:
- Python-based implementation
- AI-powered conversion (Gemini API)
- Cloud storage support
- WPS Office integration

**Cross-References**:
- May integrate with **→ `/services/api-gateway`** when production-ready
- Uses AI similar to **→ `/frontend/web-app/hooks/useAIChat.ts`**

### `/tools/dev-tools` (Planned)
**Purpose**: Development productivity tools

**Expected Contents**:
- Code generators
- Database seeders
- Performance profilers
- Debug utilities

### `/tools/scripts/legacy`
**Purpose**: Archived scripts from earlier development

**Contents**:
- **setup.sh**: Original Unix/Linux setup script
- **test-auth.js**: Authentication testing script

---

## `/scripts` - Automation Scripts

### Root Level Scripts

#### `setup.sh`
**Purpose**: Project setup automation

**Functions**:
- Install dependencies
- Configure environment
- Initialize database
- Start development servers

#### `test-auth.js`
**Purpose**: Authentication system testing

**Functions**:
- Test login endpoints
- Verify JWT tokens
- Check authorization
- Validate refresh tokens

**Cross-References**:
- Tests **→ `/services/user-service/routes/auth.js`**
- Uses configuration from **→ environment variables**

---

## `/Test` - Testing Experiments

### `/Test/PDF_to_DOCX`
**Purpose**: Testing environment for PDF conversion feature

**Why separate from `/tools`**:
- Isolated testing environment
- Sample test data
- Performance benchmarking
- Feature validation

**Test Data**:
- Abel.pdf/docx: Test document pairs
- SwiftNotesForProfessionals: Large document testing

---

## Script Categories and Usage

### 1. **Setup Scripts**:
```bash
# Unix/Linux/Mac
./scripts/setup.sh

# Windows
tools/scripts/test-setup.bat
```

### 2. **Testing Scripts**:
```javascript
// Test authentication
node scripts/test-auth.js
```

### 3. **Development Tools**:
```python
# PDF conversion experiment
cd tools/experiments/PDF_to_DOCX
python main.py
```

---

## Cross-References:

### Services Integration:
- **→ `/services`**: Scripts may interact with services
- **→ `/database`**: Database initialization scripts
- **→ `/infrastructure`**: Deployment scripts

### Configuration:
- **← Environment variables**: Script configuration
- **← `/configs`**: Tool configurations

### Documentation:
- **→ `/docs/user-guides`**: Setup guide references
- **→ `/Documentations`**: Development plans

---

## Development Workflow Integration:

### 1. **Initial Setup**:
```
Clone Repo → Run Setup Script → Configure Environment → Start Development
```

### 2. **Feature Development**:
```
Experiment in /tools → Test in /Test → Integrate to Services
```

### 3. **Testing**:
```
Unit Tests → Integration Tests → Test Scripts → Manual Testing
```

---

## Best Practices:

### Script Development:
1. **Idempotent**: Scripts can run multiple times safely
2. **Error Handling**: Graceful failure with clear messages
3. **Documentation**: Clear usage instructions
4. **Cross-Platform**: Support multiple operating systems
5. **Version Control**: Track script changes

### Tool Organization:
1. **Experimental**: Keep experiments separate
2. **Production Ready**: Move to services when stable
3. **Deprecation**: Archive old scripts in legacy
4. **Dependencies**: Document required tools
5. **Configuration**: Use environment variables

### Testing Strategy:
1. **Isolated Testing**: Separate test environment
2. **Test Data**: Maintain consistent test datasets
3. **Automation**: Automate repetitive tests
4. **Performance**: Benchmark critical operations
5. **Validation**: Verify expected outcomes