# Translation Platform Test Suite

## Overview
Comprehensive testing suite for the Translation Platform including frontend, backend, and integration tests.

## Test Structure
```
tests/
├── frontend/          # Frontend component and page tests
├── backend/           # Backend API and service tests
├── integration/       # End-to-end integration tests
├── results/          # Test execution results and reports
└── README.md         # This file
```

## Quick Start

### Run All Tests
```bash
# From project root
npm run test:all

# Individual test suites
npm run test:frontend
npm run test:backend
npm run test:integration
```

### Prerequisites
- Node.js 18+
- PostgreSQL database running
- Redis server (optional)
- All dependencies installed

## Test Coverage

### Frontend Tests
- Component rendering tests
- Page navigation tests
- Form validation tests
- API integration tests

### Backend Tests
- GraphQL resolver tests
- Authentication middleware tests
- Database connection tests
- Service integration tests

### Integration Tests
- Full user workflow tests
- Document upload and translation flow
- Project management flow
- Real-time collaboration tests

## Test Results
See individual test result files in the `results/` directory for detailed test execution reports.

## Known Issues
Check `TEST_ISSUES.md` for current known issues and their status.