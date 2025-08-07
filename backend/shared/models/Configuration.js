const { query } = require('../../databases/connection');

class Configuration {
  static async getLanguages() {
    try {
      const result = await query(
        'SELECT * FROM languages ORDER BY name ASC'
      );

      return result.rows.map(row => ({
        code: row.code,
        name: row.name,
        nativeName: row.native_name,
        isAutoDetected: row.is_auto_detected,
        supportedAsSource: row.supported_as_source,
        supportedAsTarget: row.supported_as_target
      }));
    } catch (error) {
      console.error('Error getting languages:', error);
      throw new Error('Database error while getting languages');
    }
  }

  static async getLanguageByCode(code) {
    try {
      const result = await query(
        'SELECT * FROM languages WHERE code = $1',
        [code]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        code: row.code,
        name: row.name,
        nativeName: row.native_name,
        isAutoDetected: row.is_auto_detected,
        supportedAsSource: row.supported_as_source,
        supportedAsTarget: row.supported_as_target
      };
    } catch (error) {
      console.error('Error getting language by code:', error);
      throw new Error('Database error while getting language');
    }
  }

  static async getSourceLanguages() {
    try {
      const result = await query(
        'SELECT * FROM languages WHERE supported_as_source = true ORDER BY name ASC'
      );

      return result.rows.map(row => ({
        code: row.code,
        name: row.name,
        nativeName: row.native_name,
        isAutoDetected: row.is_auto_detected,
        supportedAsSource: row.supported_as_source,
        supportedAsTarget: row.supported_as_target
      }));
    } catch (error) {
      console.error('Error getting source languages:', error);
      throw new Error('Database error while getting source languages');
    }
  }

  static async getTargetLanguages() {
    try {
      const result = await query(
        'SELECT * FROM languages WHERE supported_as_target = true ORDER BY name ASC'
      );

      return result.rows.map(row => ({
        code: row.code,
        name: row.name,
        nativeName: row.native_name,
        isAutoDetected: row.is_auto_detected,
        supportedAsSource: row.supported_as_source,
        supportedAsTarget: row.supported_as_target
      }));
    } catch (error) {
      console.error('Error getting target languages:', error);
      throw new Error('Database error while getting target languages');
    }
  }

  static async getTranslationSpecializations() {
    try {
      const result = await query(
        'SELECT * FROM translation_specializations ORDER BY title ASC'
      );

      return result.rows.map(row => ({
        key: row.key,
        title: row.title,
        description: row.description,
        requiresExpertise: row.requires_expertise
      }));
    } catch (error) {
      console.error('Error getting translation specializations:', error);
      throw new Error('Database error while getting specializations');
    }
  }

  static async getSpecializationByKey(key) {
    try {
      const result = await query(
        'SELECT * FROM translation_specializations WHERE key = $1',
        [key]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        key: row.key,
        title: row.title,
        description: row.description,
        requiresExpertise: row.requires_expertise
      };
    } catch (error) {
      console.error('Error getting specialization by key:', error);
      throw new Error('Database error while getting specialization');
    }
  }

  static async addLanguage(languageData) {
    try {
      const {
        code,
        name,
        nativeName,
        isAutoDetected = false,
        supportedAsSource = true,
        supportedAsTarget = true
      } = languageData;

      const result = await query(
        `INSERT INTO languages (code, name, native_name, is_auto_detected, supported_as_source, supported_as_target)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [code, name, nativeName, isAutoDetected, supportedAsSource, supportedAsTarget]
      );

      const row = result.rows[0];
      return {
        code: row.code,
        name: row.name,
        nativeName: row.native_name,
        isAutoDetected: row.is_auto_detected,
        supportedAsSource: row.supported_as_source,
        supportedAsTarget: row.supported_as_target
      };
    } catch (error) {
      console.error('Error adding language:', error);
      if (error.code === '23505') { // Unique violation
        throw new Error('Language with this code already exists');
      }
      throw new Error('Database error while adding language');
    }
  }

  static async updateLanguage(code, languageData) {
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic update query
      Object.keys(languageData).forEach(key => {
        if (languageData[key] !== undefined) {
          const dbKey = key === 'nativeName' ? 'native_name' :
                       key === 'isAutoDetected' ? 'is_auto_detected' :
                       key === 'supportedAsSource' ? 'supported_as_source' :
                       key === 'supportedAsTarget' ? 'supported_as_target' : key;
          
          updateFields.push(`${dbKey} = $${paramIndex}`);
          values.push(languageData[key]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(code);
      const result = await query(
        `UPDATE languages SET ${updateFields.join(', ')}
         WHERE code = $${paramIndex}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Language not found');
      }

      const row = result.rows[0];
      return {
        code: row.code,
        name: row.name,
        nativeName: row.native_name,
        isAutoDetected: row.is_auto_detected,
        supportedAsSource: row.supported_as_source,
        supportedAsTarget: row.supported_as_target
      };
    } catch (error) {
      console.error('Error updating language:', error);
      throw new Error('Database error while updating language');
    }
  }

  static async deleteLanguage(code) {
    try {
      const result = await query(
        'DELETE FROM languages WHERE code = $1 RETURNING code',
        [code]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting language:', error);
      throw new Error('Database error while deleting language');
    }
  }

  static async addSpecialization(specializationData) {
    try {
      const {
        key,
        title,
        description,
        requiresExpertise = false
      } = specializationData;

      const result = await query(
        `INSERT INTO translation_specializations (key, title, description, requires_expertise)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [key, title, description, requiresExpertise]
      );

      const row = result.rows[0];
      return {
        key: row.key,
        title: row.title,
        description: row.description,
        requiresExpertise: row.requires_expertise
      };
    } catch (error) {
      console.error('Error adding specialization:', error);
      if (error.code === '23505') { // Unique violation
        throw new Error('Specialization with this key already exists');
      }
      throw new Error('Database error while adding specialization');
    }
  }

  static async updateSpecialization(key, specializationData) {
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic update query
      Object.keys(specializationData).forEach(field => {
        if (specializationData[field] !== undefined) {
          const dbKey = field === 'requiresExpertise' ? 'requires_expertise' : field;
          updateFields.push(`${dbKey} = $${paramIndex}`);
          values.push(specializationData[field]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(key);
      const result = await query(
        `UPDATE translation_specializations SET ${updateFields.join(', ')}
         WHERE key = $${paramIndex}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Specialization not found');
      }

      const row = result.rows[0];
      return {
        key: row.key,
        title: row.title,
        description: row.description,
        requiresExpertise: row.requires_expertise
      };
    } catch (error) {
      console.error('Error updating specialization:', error);
      throw new Error('Database error while updating specialization');
    }
  }

  static async deleteSpecialization(key) {
    try {
      const result = await query(
        'DELETE FROM translation_specializations WHERE key = $1 RETURNING key',
        [key]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting specialization:', error);
      throw new Error('Database error while deleting specialization');
    }
  }

  static async validateLanguagePair(sourceLanguage, targetLanguage) {
    try {
      const result = await query(
        `SELECT 
           (SELECT supported_as_source FROM languages WHERE code = $1) as source_valid,
           (SELECT supported_as_target FROM languages WHERE code = $2) as target_valid`,
        [sourceLanguage, targetLanguage]
      );

      if (result.rows.length === 0) {
        return { valid: false, error: 'Language codes not found' };
      }

      const { source_valid, target_valid } = result.rows[0];

      if (source_valid === null) {
        return { valid: false, error: 'Source language not supported' };
      }

      if (target_valid === null) {
        return { valid: false, error: 'Target language not supported' };
      }

      if (!source_valid) {
        return { valid: false, error: 'Source language not supported for translation' };
      }

      if (!target_valid) {
        return { valid: false, error: 'Target language not supported for translation' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error validating language pair:', error);
      throw new Error('Database error while validating language pair');
    }
  }

  static async validateSpecialization(specialization) {
    try {
      const result = await query(
        'SELECT key FROM translation_specializations WHERE key = $1',
        [specialization]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error validating specialization:', error);
      throw new Error('Database error while validating specialization');
    }
  }
}

module.exports = Configuration;
