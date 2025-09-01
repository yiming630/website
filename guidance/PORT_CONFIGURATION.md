# Port Configuration Management

## Overview
This project uses a centralized port configuration system to manage all service ports in one place.

## Configuration Files

### `.portenv`
- **Primary port configuration file**
- Contains all port definitions for the entire platform
- Must be loaded BEFORE `.env`
- Version controlled and shared across the team

### `.env`
- Contains all other environment variables
- Port values are defaults that should match `.portenv`
- Services automatically load `.portenv` first, then `.env`

## Port Assignments

| Service | Port | Variable Name |
|---------|------|--------------|
| **Frontend** | 3000 | `FRONTEND_PORT` |
| **API Gateway** | 4002 | `API_GATEWAY_PORT` |
| **User Service** | 4003 | `USER_SERVICE_PORT` |
| **Document Service** | 8001 | `DOCUMENT_SERVICE_PORT` |
| **PostgreSQL** | 5432 | `POSTGRES_PORT` |
| **Redis** | 6379 | `REDIS_PORT` |
| **PgAdmin** | 5050 | `PGADMIN_PORT` |
| **MailHog SMTP** | 1025 | `MAILHOG_SMTP_PORT` |
| **MailHog Web** | 8025 | `MAILHOG_WEB_PORT` |
| **Health Check** | 8080 | `HEALTH_CHECK_PORT` |

## Port Ranges

- **3000-3999**: Frontend applications
- **4000-4999**: Backend API services
- **5000-5999**: Database services
- **6000-6999**: Cache services
- **7000-7999**: Message queue services
- **8000-8999**: Processing services
- **9000-9999**: Monitoring services

## Usage

### For Node.js Services
Services automatically load ports in this order:
1. Load `.portenv` (port configurations)
2. Load `.env` (other configurations)

```javascript
// Automatic loading in server.js
require('dotenv').config({ path: '../../../.portenv' });
require('dotenv').config({ path: '../../../.env' });

// Access port
const PORT = process.env.API_GATEWAY_PORT || 4002;
```

### For Docker Services
Docker Compose files should reference the environment variables:
```yaml
services:
  api-gateway:
    ports:
      - "${API_GATEWAY_PORT}:${API_GATEWAY_PORT}"
```

### Testing Port Configuration
Run the loader script to verify port configuration:
```bash
node load-env.js
```

## Changing Ports

1. **Update `.portenv`** with the new port value
2. **Do NOT** manually change port values in `.env`
3. Restart all affected services
4. Update any hardcoded references in frontend config files

## Troubleshooting

### Port Already in Use
1. Check what's using the port:
   ```bash
   # Windows
   netstat -ano | findstr :PORT_NUMBER
   
   # Linux/Mac
   lsof -i :PORT_NUMBER
   ```

2. Update the port in `.portenv`
3. Restart services

### Services Not Using Correct Port
1. Ensure service loads `.portenv` before `.env`
2. Check that the service uses the correct environment variable
3. Verify no hardcoded port values override the configuration

## Best Practices

1. **Always use environment variables** for ports, never hardcode
2. **Update `.portenv` only** when changing ports
3. **Document any new ports** in this file
4. **Follow port range conventions** for new services
5. **Test port changes** with `load-env.js` before deploying