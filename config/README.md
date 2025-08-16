# Configuration Directory Structure

## Overview
This directory contains all configuration files for the Translation Platform, organized by purpose and service.

## Directory Structure

```
config/
├── app/                    # Application-level configurations
│   ├── features.json      # Feature flags and settings
│   └── api-endpoints.json # API endpoint definitions
├── environments/          # Environment-specific configurations
│   ├── development.env    # Development environment variables
│   ├── production.env.example # Production template (copy and customize)
│   └── staging.env        # Staging environment (create as needed)
└── services/              # Service-specific configurations
    └── redis/             # Redis configuration
        └── redis.conf     # Redis server configuration
```

## Usage

### Environment Variables

1. **Development**: 
   - Use `development.env` as the default configuration
   - Copy to `.env` in the root directory for local development

2. **Production**:
   - Copy `production.env.example` to `production.env`
   - Update all placeholder values with secure credentials
   - Never commit `production.env` to version control

3. **Loading Order**:
   ```
   1. System environment variables (highest priority)
   2. .env file in root directory
   3. Environment-specific file (development.env, production.env)
   4. Default values in docker-compose.yml
   ```

### Feature Flags

The `app/features.json` file controls feature availability:
- Enable/disable features without code changes
- Configure feature-specific settings
- Manage experimental features

### API Endpoints

The `app/api-endpoints.json` file defines:
- All available API endpoints
- Rate limiting configurations
- API versioning information

### Service Configurations

Service-specific configurations are stored in `services/`:
- Each service has its own subdirectory
- Configuration files are mounted as volumes in Docker

## Best Practices

1. **Security**:
   - Never commit sensitive data (passwords, API keys)
   - Use strong, unique passwords in production
   - Rotate credentials regularly

2. **Environment Separation**:
   - Keep development and production configs separate
   - Use environment-specific feature flags
   - Test configuration changes in staging first

3. **Version Control**:
   - Commit example/template files only
   - Use `.gitignore` for actual environment files
   - Document all configuration options

4. **Updates**:
   - Update documentation when adding new configs
   - Maintain backwards compatibility
   - Notify team of breaking changes

## Configuration Sources

Configurations can come from multiple sources:

1. **Static Files**: JSON/YAML configurations
2. **Environment Variables**: Runtime overrides
3. **Command Line**: Docker/service arguments
4. **Config Service**: Dynamic updates (future)

## Related Documentation

- Docker setup: `/DOCKER_EXPLANATION.md`
- Environment setup: `/docs/user-guides/PROJECT_SETUP_GUIDE.md`
- Service documentation: `/guidance/illustration/services.md`