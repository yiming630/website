const { query, transaction } = require('../../databases/connection');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.role = data.role;
    this.plan = data.plan;
    this.preferences = data.preferences;
    this.isVerified = data.is_verified;
    this.lastLogin = data.last_login;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Database error while finding user');
    }
  }

  static async findByEmail(email) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Database error while finding user');
    }
  }

  static async create(userData) {
    try {
      const {
        name,
        email,
        password,
        role = 'READER',
        plan = 'free'
      } = userData;

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const result = await query(
        `INSERT INTO users (name, email, password_hash, role, plan, preferences)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [name, email, passwordHash, role, plan, JSON.stringify({})]
      );

      return new User(result.rows[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.code === '23505') { // Unique violation
        throw new Error('User with this email already exists');
      }
      throw new Error('Database error while creating user');
    }
  }

  static async update(id, userData) {
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic update query
      Object.keys(userData).forEach(key => {
        if (userData[key] !== undefined) {
          if (key === 'preferences') {
            updateFields.push(`${key} = $${paramIndex}`);
            values.push(JSON.stringify(userData[key]));
          } else {
            updateFields.push(`${key} = $${paramIndex}`);
            values.push(userData[key]);
          }
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);
      const result = await query(
        `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW()
         WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return new User(result.rows[0]);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Database error while updating user');
    }
  }

  static async delete(id) {
    try {
      const result = await query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Database error while deleting user');
    }
  }

  static async validatePassword(email, password) {
    try {
      const result = await query(
        'SELECT id, password_hash FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const { id, password_hash } = result.rows[0];
      const isValid = await bcrypt.compare(password, password_hash);

      if (!isValid) {
        return null;
      }

      return await this.findById(id);
    } catch (error) {
      console.error('Error validating password:', error);
      throw new Error('Database error while validating password');
    }
  }

  static async updateLastLogin(id) {
    try {
      await query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't throw error for non-critical update
    }
  }

  async getProjects() {
    try {
      const result = await query(
        `SELECT p.* FROM projects p 
         WHERE p.owner_id = $1 
         OR p.id IN (
           SELECT pc.project_id FROM project_collaborators pc 
           WHERE pc.user_id = $1
         )
         ORDER BY p.updated_at DESC`,
        [this.id]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw new Error('Database error while getting projects');
    }
  }

  async getDocuments(limit = 20, offset = 0) {
    try {
      const result = await query(
        `SELECT d.* FROM documents d 
         WHERE d.owner_id = $1 
         OR d.id IN (
           SELECT dc.document_id FROM document_collaborators dc 
           WHERE dc.user_id = $1
         )
         ORDER BY d.updated_at DESC
         LIMIT $2 OFFSET $3`,
        [this.id, limit, offset]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting user documents:', error);
      throw new Error('Database error while getting documents');
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      plan: this.plan,
      preferences: this.preferences,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;
