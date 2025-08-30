const { query } = require('../utils/database');

const configResolvers = {
  Query: {
    // Get supported languages
    supportedLanguages: async () => {
      try {
        const result = await query(
          'SELECT * FROM languages ORDER BY name ASC'
        );
        return result.rows;
      } catch (error) {
        console.error('Error fetching supported languages:', error);
        throw new Error('Failed to fetch supported languages');
      }
    },

    // Get translation specializations
    translationSpecializations: async () => {
      try {
        const result = await query(
          'SELECT * FROM translation_specializations ORDER BY title ASC'
        );
        return result.rows;
      } catch (error) {
        console.error('Error fetching translation specializations:', error);
        throw new Error('Failed to fetch translation specializations');
      }
    }
  }
};

module.exports = configResolvers;