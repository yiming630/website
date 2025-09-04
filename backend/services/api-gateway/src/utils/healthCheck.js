const db = require('./database');
const mongoFileService = require('./mongoFileService');

class HealthChecker {
  constructor() {
    this.services = {
      postgresql: { status: 'unknown', details: null, lastCheck: null },
      mongodb: { status: 'unknown', details: null, lastCheck: null },
      graphql: { status: 'unknown', details: null, lastCheck: null },
      fileStorage: { status: 'unknown', details: null, lastCheck: null }
    };
  }

  // Check all services and return comprehensive status
  async checkAllServices() {
    console.log('🔍 Starting comprehensive health check...');
    console.log('='.repeat(50));

    const results = {
      overall: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.API_GATEWAY_PORT || 4000,
        host: process.env.HOST || '0.0.0.0'
      }
    };

    // Check PostgreSQL
    try {
      console.log('🐘 Checking PostgreSQL...');
      const pgHealth = await this.checkPostgreSQL();
      results.services.postgresql = pgHealth;
      if (pgHealth.status !== 'healthy') results.overall = 'degraded';
    } catch (error) {
      console.error('❌ PostgreSQL check failed:', error.message);
      results.services.postgresql = { status: 'unhealthy', error: error.message };
      results.overall = 'unhealthy';
    }

    // Check MongoDB
    try {
      console.log('🍃 Checking MongoDB...');
      const mongoHealth = await this.checkMongoDB();
      results.services.mongodb = mongoHealth;
      if (mongoHealth.status !== 'healthy') results.overall = 'degraded';
    } catch (error) {
      console.error('❌ MongoDB check failed:', error.message);
      results.services.mongodb = { status: 'unhealthy', error: error.message };
      results.overall = 'unhealthy';
    }

    // Check File Storage
    try {
      console.log('📁 Checking File Storage...');
      const fileHealth = await this.checkFileStorage();
      results.services.fileStorage = fileHealth;
      if (fileHealth.status !== 'healthy') results.overall = 'degraded';
    } catch (error) {
      console.error('❌ File Storage check failed:', error.message);
      results.services.fileStorage = { status: 'unhealthy', error: error.message };
      results.overall = 'unhealthy';
    }

    // Check GraphQL
    try {
      console.log('🔗 Checking GraphQL...');
      const gqlHealth = await this.checkGraphQL();
      results.services.graphql = gqlHealth;
      if (gqlHealth.status !== 'healthy') results.overall = 'degraded';
    } catch (error) {
      console.error('❌ GraphQL check failed:', error.message);
      results.services.graphql = { status: 'unhealthy', error: error.message };
      results.overall = 'unhealthy';
    }

    // Environment variables check
    results.environment.configStatus = this.checkEnvironmentVariables();

    console.log('='.repeat(50));
    console.log(`🏥 Overall Health: ${results.overall.toUpperCase()}`);
    this.printHealthSummary(results);

    return results;
  }

  async checkPostgreSQL() {
    const startTime = Date.now();
    try {
      const isHealthy = await db.checkHealth();
      const responseTime = Date.now() - startTime;
      
      if (isHealthy) {
        // Get additional stats
        const statsQuery = `
          SELECT 
            current_database() as database_name,
            current_user as current_user,
            version() as version,
            pg_database_size(current_database()) as database_size
        `;
        const stats = await db.query(statsQuery);
        const row = stats.rows[0];
        
        return {
          status: 'healthy',
          responseTime: `${responseTime}ms`,
          details: {
            database: row.database_name,
            user: row.current_user,
            version: row.version.split(',')[0],
            size: `${Math.round(row.database_size / 1024 / 1024)} MB`
          }
        };
      } else {
        return { status: 'unhealthy', responseTime: `${responseTime}ms` };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: `${Date.now() - startTime}ms`
      };
    }
  }

  async checkMongoDB() {
    const startTime = Date.now();
    try {
      const isHealthy = await mongoFileService.checkHealth();
      const responseTime = Date.now() - startTime;
      
      if (isHealthy) {
        await mongoFileService.initialize();
        const client = mongoFileService.client;
        const db = mongoFileService.database;
        
        // Get MongoDB stats
        const stats = await db.admin().serverStatus();
        const dbStats = await db.stats();
        
        return {
          status: 'healthy',
          responseTime: `${responseTime}ms`,
          details: {
            version: stats.version,
            uptime: `${Math.round(stats.uptime / 3600)}h`,
            connections: stats.connections.current,
            database: mongoFileService.dbName,
            collections: dbStats.collections,
            dataSize: `${Math.round(dbStats.dataSize / 1024 / 1024)} MB`
          }
        };
      } else {
        return { status: 'unhealthy', responseTime: `${responseTime}ms` };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: `${Date.now() - startTime}ms`
      };
    }
  }

  async checkFileStorage() {
    const startTime = Date.now();
    try {
      await mongoFileService.initialize();
      const bucket = mongoFileService.gridFSBucket;
      
      // Check if we can list files (basic GridFS operation)
      const cursor = bucket.find({}).limit(1);
      const files = await cursor.toArray();
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        details: {
          gridFSBucket: mongoFileService.bucketName,
          chunkSize: '255KB',
          hasFiles: files.length > 0
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: `${Date.now() - startTime}ms`
      };
    }
  }

  async checkGraphQL() {
    const startTime = Date.now();
    try {
      // Basic GraphQL schema validation
      const resolvers = require('../resolvers');
      const typeDefs = require('../schema/typeDefs');
      
      const responseTime = Date.now() - startTime;
      
      // Count available resolvers
      const queryResolvers = Object.keys(resolvers.Query || {}).length;
      const mutationResolvers = Object.keys(resolvers.Mutation || {}).length;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        details: {
          queries: queryResolvers,
          mutations: mutationResolvers,
          typeDefs: typeDefs ? 'loaded' : 'missing'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: `${Date.now() - startTime}ms`
      };
    }
  }

  checkEnvironmentVariables() {
    const required = {
      'DB_HOST': process.env.DB_HOST,
      'DB_NAME': process.env.DB_NAME,
      'DB_USER': process.env.DB_USER,
      'DB_PASSWORD': process.env.DB_PASSWORD,
      'JWT_SECRET': process.env.JWT_SECRET,
      'MONGODB_CONNECTION_STRING': process.env.MONGODB_CONNECTION_STRING,
    };

    const optional = {
      'OPENROUTER_API_KEY': process.env.OPENROUTER_API_KEY,
      'CORS_ORIGIN': process.env.CORS_ORIGIN,
      'REDIS_URL': process.env.REDIS_URL,
    };

    const missing = Object.keys(required).filter(key => !required[key]);
    const optionalMissing = Object.keys(optional).filter(key => !optional[key]);

    return {
      required: {
        total: Object.keys(required).length,
        missing: missing.length,
        missingVars: missing
      },
      optional: {
        total: Object.keys(optional).length,
        missing: optionalMissing.length,
        missingVars: optionalMissing
      }
    };
  }

  printHealthSummary(results) {
    console.log('📊 Service Status Summary:');
    Object.entries(results.services).forEach(([service, status]) => {
      const emoji = status.status === 'healthy' ? '✅' : status.status === 'degraded' ? '⚠️' : '❌';
      const responseTime = status.responseTime ? ` (${status.responseTime})` : '';
      console.log(`   ${emoji} ${service.toUpperCase()}${responseTime}`);
      
      if (status.details) {
        Object.entries(status.details).forEach(([key, value]) => {
          console.log(`      ${key}: ${value}`);
        });
      }
      
      if (status.error) {
        console.log(`      Error: ${status.error}`);
      }
    });

    // Environment variables summary
    const envStatus = results.environment.configStatus;
    console.log('🔧 Environment Configuration:');
    console.log(`   Required: ${envStatus.required.total - envStatus.required.missing}/${envStatus.required.total} set`);
    console.log(`   Optional: ${envStatus.optional.total - envStatus.optional.missing}/${envStatus.optional.total} set`);
    
    if (envStatus.required.missing.length > 0) {
      console.log(`   ❌ Missing required: ${envStatus.required.missingVars.join(', ')}`);
    }
    
    if (envStatus.optional.missing.length > 0) {
      console.log(`   ⚠️ Missing optional: ${envStatus.optional.missingVars.join(', ')}`);
    }
  }

  // Quick health check for API endpoint
  async quickCheck() {
    try {
      const [pgHealth, mongoHealth] = await Promise.allSettled([
        db.checkHealth(),
        mongoFileService.checkHealth()
      ]);

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        postgresql: pgHealth.status === 'fulfilled' && pgHealth.value,
        mongodb: mongoHealth.status === 'fulfilled' && mongoHealth.value,
        uptime: process.uptime()
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

module.exports = new HealthChecker();