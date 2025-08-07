const { query } = require('../../../databases/connection');
const Configuration = require('../../../shared/models/Configuration');

const configResolvers = {
  Query: {
    supportedLanguages: async () => {
      try {
        return await Configuration.getLanguages();
      } catch (error) {
        console.error('Error getting supported languages:', error);
        throw new Error('Failed to fetch supported languages');
      }
    },

    translationSpecializations: async () => {
      try {
        return await Configuration.getTranslationSpecializations();
      } catch (error) {
        console.error('Error getting translation specializations:', error);
        throw new Error('Failed to fetch translation specializations');
      }
    }
  }
};

module.exports = configResolvers;