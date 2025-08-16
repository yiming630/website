const Joi = require('joi');
const ErrorHandler = require('./errorHandler');

class Validation {
  // User validation schemas
  static userRegistration = Joi.object({
    name: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[A-Za-z])(?=.*\d)/).required(),
    role: Joi.string().valid('READER', 'TRANSLATOR', 'ADMIN', 'ENTERPRISE').default('READER')
  });

  static userLogin = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  static userPreferences = Joi.object({
    defaultSourceLanguage: Joi.string().min(2).max(10),
    defaultTargetLanguage: Joi.string().min(2).max(10),
    defaultTranslationStyle: Joi.string().valid('GENERAL', 'ACADEMIC', 'BUSINESS', 'LEGAL', 'TECHNICAL', 'CREATIVE', 'MEDICAL', 'FINANCIAL'),
    autoSave: Joi.boolean(),
    emailNotifications: Joi.boolean(),
    theme: Joi.string().valid('light', 'dark', 'auto')
  });

  // Project validation schemas
  static projectCreation = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
    defaultSettings: Joi.object({
      defaultSourceLanguage: Joi.string().min(2).max(10).required(),
      defaultTargetLanguage: Joi.string().min(2).max(10).required(),
      defaultTranslationStyle: Joi.string().valid('GENERAL', 'ACADEMIC', 'BUSINESS', 'LEGAL', 'TECHNICAL', 'CREATIVE', 'MEDICAL', 'FINANCIAL').required(),
      defaultSpecialization: Joi.string().min(1).max(100).required(),
      requireReview: Joi.boolean().required()
    }).required(),
    collaboratorEmails: Joi.array().items(Joi.string().email())
  });

  static projectUpdate = Joi.object({
    name: Joi.string().min(1).max(255),
    description: Joi.string().max(1000),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
    defaultSettings: Joi.object({
      defaultSourceLanguage: Joi.string().min(2).max(10).required(),
      defaultTargetLanguage: Joi.string().min(2).max(10).required(),
      defaultTranslationStyle: Joi.string().valid('GENERAL', 'ACADEMIC', 'BUSINESS', 'LEGAL', 'TECHNICAL', 'CREATIVE', 'MEDICAL', 'FINANCIAL').required(),
      defaultSpecialization: Joi.string().min(1).max(100).required(),
      requireReview: Joi.boolean().required()
    })
  });

  // Document validation schemas
  static documentUpload = Joi.object({
    fileName: Joi.string().min(1).max(255).required(),
    fileSize: Joi.number().integer().min(1).max(100 * 1024 * 1024).required(), // Max 100MB
    sourceLanguage: Joi.string().min(2).max(10).required(),
    targetLanguage: Joi.string().min(2).max(10).required(),
    translationStyle: Joi.string().valid('GENERAL', 'ACADEMIC', 'BUSINESS', 'LEGAL', 'TECHNICAL', 'CREATIVE', 'MEDICAL', 'FINANCIAL').required(),
    specialization: Joi.string().min(1).max(100).required(),
    projectId: Joi.string().uuid(),
    outputFormats: Joi.array().items(Joi.string().valid('pdf', 'docx', 'txt', 'html')).min(1).required(),
    autoStart: Joi.boolean().default(false),
    bosObjectKey: Joi.string().max(500)
  });

  static documentContentUpdate = Joi.object({
    documentId: Joi.string().uuid().required(),
    content: Joi.string().max(1000000).required(), // Max 1MB of text
    editType: Joi.string().valid('original', 'translated').required(),
    selectionStart: Joi.number().integer().min(0),
    selectionEnd: Joi.number().integer().min(0)
  });

  // Chat validation schemas
  static chatMessage = Joi.object({
    documentId: Joi.string().uuid().required(),
    content: Joi.string().min(1).max(5000).required(),
    selectedText: Joi.string().max(1000),
    messageType: Joi.string().valid('text', 'translation_help', 'question', 'suggestion').required()
  });

  // Comment validation schemas
  static comment = Joi.object({
    documentId: Joi.string().uuid().required(),
    content: Joi.string().min(1).max(2000).required(),
    parentCommentId: Joi.string().uuid(),
    position: Joi.object({
      start: Joi.number().integer().min(0).required(),
      end: Joi.number().integer().min(0).required(),
      section: Joi.string().max(100)
    }).required()
  });

  // Sharing validation schemas
  static sharePermissions = Joi.object({
    canView: Joi.boolean().required(),
    canComment: Joi.boolean().required(),
    canEdit: Joi.boolean().required(),
    canShare: Joi.boolean().required(),
    canDownload: Joi.boolean().required()
  });

  // Validation methods
  static validate(schema, data) {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      throw ErrorHandler.createValidationError('validation', {
        message: 'Validation failed',
        details
      });
    }

    return value;
  }

  static validateUserRegistration(data) {
    return this.validate(this.userRegistration, data);
  }

  static validateUserLogin(data) {
    return this.validate(this.userLogin, data);
  }

  static validateUserPreferences(data) {
    return this.validate(this.userPreferences, data);
  }

  static validateProjectCreation(data) {
    return this.validate(this.projectCreation, data);
  }

  static validateProjectUpdate(data) {
    return this.validate(this.projectUpdate, data);
  }

  static validateDocumentUpload(data) {
    return this.validate(this.documentUpload, data);
  }

  static validateDocumentContentUpdate(data) {
    return this.validate(this.documentContentUpdate, data);
  }

  static validateChatMessage(data) {
    return this.validate(this.chatMessage, data);
  }

  static validateComment(data) {
    return this.validate(this.comment, data);
  }

  static validateSharePermissions(data) {
    return this.validate(this.sharePermissions, data);
  }

  // Utility validation methods
  static isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidLanguageCode(code) {
    const languageRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
    return languageRegex.test(code);
  }

  static isValidFileType(fileName) {
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.rtf', '.html', '.htm'];
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return allowedExtensions.includes(extension);
  }

  static isValidFileSize(size, maxSize = 100 * 1024 * 1024) { // Default 100MB
    return size > 0 && size <= maxSize;
  }
}

module.exports = Validation; 