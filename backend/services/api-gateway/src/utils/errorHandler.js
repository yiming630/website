const { ApolloError, UserInputError, AuthenticationError, ForbiddenError } = require('apollo-server-express');

class ErrorHandler {
  static handle(error, context = {}) {
    console.error('Error occurred:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });

    // Handle known error types
    if (error instanceof ApolloError) {
      return error;
    }

    if (error instanceof UserInputError) {
      return error;
    }

    if (error instanceof AuthenticationError) {
      return error;
    }

    if (error instanceof ForbiddenError) {
      return error;
    }

    // Handle database errors
    if (error.code === '23505') { // Unique violation
      return new UserInputError('Resource already exists');
    }

    if (error.code === '23503') { // Foreign key violation
      return new UserInputError('Referenced resource does not exist');
    }

    if (error.code === '42P01') { // Undefined table
      return new ApolloError('Database configuration error', 'DATABASE_ERROR');
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED') {
      return new ApolloError('Service temporarily unavailable', 'SERVICE_UNAVAILABLE');
    }

    if (error.code === 'ETIMEDOUT') {
      return new ApolloError('Request timeout', 'TIMEOUT_ERROR');
    }

    // Handle Baidu service errors
    if (error.message.includes('BOS')) {
      return new ApolloError('File storage service error', 'BAIDU_BOS_ERROR');
    }

    if (error.message.includes('AI')) {
      return new ApolloError('AI service error', 'BAIDU_AI_ERROR');
    }

    if (error.message.includes('IAM')) {
      return new ApolloError('Authentication service error', 'BAIDU_IAM_ERROR');
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return new UserInputError('Validation failed', { 
        details: error.details || error.message 
      });
    }

    // Default error
    return new ApolloError(
      'An unexpected error occurred',
      'INTERNAL_SERVER_ERROR',
      { 
        originalError: error.message,
        timestamp: new Date().toISOString()
      }
    );
  }

  static createValidationError(field, message) {
    return new UserInputError(message, { field });
  }

  static createAuthError(message = 'Authentication required') {
    return new AuthenticationError(message);
  }

  static createPermissionError(message = 'Insufficient permissions') {
    return new ForbiddenError(message);
  }

  static createNotFoundError(resource = 'Resource') {
    return new ApolloError(`${resource} not found`, 'NOT_FOUND');
  }

  static createServiceError(service, message) {
    return new ApolloError(message, `${service.toUpperCase()}_ERROR`);
  }

  // Rate limiting error
  static createRateLimitError() {
    return new ApolloError('Too many requests', 'RATE_LIMIT_EXCEEDED');
  }

  // File upload error
  static createFileError(message) {
    return new ApolloError(message, 'FILE_ERROR');
  }

  // Translation error
  static createTranslationError(message) {
    return new ApolloError(message, 'TRANSLATION_ERROR');
  }

  // Log error for monitoring
  static logError(error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      code: error.code,
      context,
      user: context.user?.id || 'anonymous',
      ip: context.ip || 'unknown'
    };

    console.error('Error Log:', JSON.stringify(errorLog, null, 2));
    
    // In production, you might want to send this to a logging service
    // like Winston, Loggly, or CloudWatch
  }
}

module.exports = ErrorHandler; 