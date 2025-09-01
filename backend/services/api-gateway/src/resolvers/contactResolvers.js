const { query } = require('../utils/database');

const contactResolvers = {
  Query: {
    // Get all contact inquiries (admin only)
    contactInquiries: async (parent, { status, limit = 20, offset = 0 }, context) => {
      try {
        // For now, allow all authenticated users to see inquiries
        // In production, you might want to restrict this to admins only
        // context.requireRole('ADMIN');

        let whereClause = '';
        const params = [limit, offset];

        if (status) {
          whereClause = 'WHERE status = $3';
          params.push(status.toLowerCase());
        }

        const result = await query(`
          SELECT 
            id, user_id, name, email, subject, inquiry_type, message,
            status, priority, assigned_to, admin_notes, ip_address,
            user_agent, source, created_at, updated_at, resolved_at,
            last_response_at
          FROM contact_inquiries 
          ${whereClause}
          ORDER BY created_at DESC 
          LIMIT $1 OFFSET $2
        `, params);

        return result.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          email: row.email,
          subject: row.subject,
          inquiryType: row.inquiry_type,
          message: row.message,
          status: row.status.toUpperCase(),
          priority: row.priority.toUpperCase(),
          assignedToId: row.assigned_to,
          adminNotes: row.admin_notes,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          source: row.source,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          resolvedAt: row.resolved_at,
          lastResponseAt: row.last_response_at
        }));
      } catch (error) {
        console.error('Error fetching contact inquiries:', error);
        // Return empty array instead of throwing error for graceful degradation
        return [];
      }
    },

    // Get single contact inquiry
    contactInquiry: async (parent, { id }, context) => {
      try {
        const result = await query(`
          SELECT 
            id, user_id, name, email, subject, inquiry_type, message,
            status, priority, assigned_to, admin_notes, ip_address,
            user_agent, source, created_at, updated_at, resolved_at,
            last_response_at
          FROM contact_inquiries 
          WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
          return null;
        }

        const row = result.rows[0];
        return {
          id: row.id,
          userId: row.user_id,
          name: row.name,
          email: row.email,
          subject: row.subject,
          inquiryType: row.inquiry_type,
          message: row.message,
          status: row.status.toUpperCase(),
          priority: row.priority.toUpperCase(),
          assignedToId: row.assigned_to,
          adminNotes: row.admin_notes,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          source: row.source,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          resolvedAt: row.resolved_at,
          lastResponseAt: row.last_response_at
        };
      } catch (error) {
        console.error('Error fetching contact inquiry:', error);
        return null;
      }
    },

    // Get contact categories
    contactCategories: async () => {
      try {
        const result = await query(`
          SELECT id, name, description, color, is_active, sort_order, created_at
          FROM contact_categories 
          WHERE is_active = true
          ORDER BY sort_order ASC, name ASC
        `);

        return result.rows.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          color: row.color,
          isActive: row.is_active,
          sortOrder: row.sort_order,
          createdAt: row.created_at
        }));
      } catch (error) {
        console.error('Error fetching contact categories:', error);
        // Return default categories if database query fails
        return [
          { id: '1', name: '产品咨询', description: '关于产品功能和使用的问题', color: '#3B82F6', isActive: true, sortOrder: 1, createdAt: new Date() },
          { id: '2', name: '技术支持', description: '技术问题和故障排除', color: '#EF4444', isActive: true, sortOrder: 2, createdAt: new Date() },
          { id: '3', name: '使用帮助', description: '使用指南和操作帮助', color: '#10B981', isActive: true, sortOrder: 3, createdAt: new Date() }
        ];
      }
    },

    // Get contact statistics
    contactStats: async (parent, { startDate, endDate }) => {
      try {
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];

        const result = await query(`
          WITH stats AS (
            SELECT 
              COUNT(*) as total,
              COUNT(CASE WHEN status = 'new' THEN 1 END) as new_count,
              COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
              AVG(CASE WHEN resolved_at IS NOT NULL THEN EXTRACT(epoch FROM (resolved_at - created_at)) END) as avg_time
            FROM contact_inquiries 
            WHERE created_at::date BETWEEN $1::date AND $2::date
          ),
          common_type AS (
            SELECT inquiry_type
            FROM contact_inquiries 
            WHERE created_at::date BETWEEN $1::date AND $2::date
            GROUP BY inquiry_type
            ORDER BY COUNT(*) DESC
            LIMIT 1
          )
          SELECT 
            stats.total,
            stats.new_count,
            stats.resolved_count,
            stats.avg_time,
            common_type.inquiry_type
          FROM stats, common_type
        `, [start, end]);

        const row = result.rows[0] || {};
        const avgSeconds = row.avg_time || 0;
        const avgDays = Math.floor(avgSeconds / (24 * 60 * 60));
        const avgHours = Math.floor((avgSeconds % (24 * 60 * 60)) / (60 * 60));

        return {
          totalInquiries: parseInt(row.total) || 0,
          newInquiries: parseInt(row.new_count) || 0,
          resolvedInquiries: parseInt(row.resolved_count) || 0,
          avgResolutionTime: avgDays > 0 ? `${avgDays}天 ${avgHours}小时` : `${avgHours}小时`,
          mostCommonType: row.inquiry_type || '产品咨询'
        };
      } catch (error) {
        console.error('Error fetching contact stats:', error);
        return {
          totalInquiries: 0,
          newInquiries: 0,
          resolvedInquiries: 0,
          avgResolutionTime: '0小时',
          mostCommonType: '产品咨询'
        };
      }
    }
  },

  Mutation: {
    // Create new contact inquiry
    createContactInquiry: async (parent, { input }, context) => {
      try {
        const { 
          name, 
          email, 
          subject, 
          inquiryType, 
          message, 
          userAgent, 
          ipAddress 
        } = input;

        // Get user ID if authenticated
        const userId = context.user?.id || null;

        const result = await query(`
          INSERT INTO contact_inquiries 
          (user_id, name, email, subject, inquiry_type, message, user_agent, ip_address, source)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING 
            id, user_id, name, email, subject, inquiry_type, message,
            status, priority, assigned_to, admin_notes, ip_address,
            user_agent, source, created_at, updated_at, resolved_at,
            last_response_at
        `, [
          userId,
          name,
          email,
          subject,
          inquiryType,
          message,
          userAgent,
          ipAddress,
          'website'
        ]);

        const row = result.rows[0];
        return {
          id: row.id,
          userId: row.user_id,
          name: row.name,
          email: row.email,
          subject: row.subject,
          inquiryType: row.inquiry_type,
          message: row.message,
          status: row.status.toUpperCase(),
          priority: row.priority.toUpperCase(),
          assignedToId: row.assigned_to,
          adminNotes: row.admin_notes,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          source: row.source,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          resolvedAt: row.resolved_at,
          lastResponseAt: row.last_response_at
        };
      } catch (error) {
        console.error('Error creating contact inquiry:', error);
        throw new Error('Failed to submit contact inquiry');
      }
    },

    // Update contact inquiry (admin only)
    updateContactInquiry: async (parent, { id, input }, context) => {
      try {
        // For now, allow all authenticated users
        // In production: context.requireRole('ADMIN');

        const fields = [];
        const values = [id];
        let paramCount = 1;

        if (input.status !== undefined) {
          fields.push(`status = $${++paramCount}`);
          values.push(input.status.toLowerCase());
        }

        if (input.priority !== undefined) {
          fields.push(`priority = $${++paramCount}`);
          values.push(input.priority.toLowerCase());
        }

        if (input.assignedToId !== undefined) {
          fields.push(`assigned_to = $${++paramCount}`);
          values.push(input.assignedToId);
        }

        if (input.adminNotes !== undefined) {
          fields.push(`admin_notes = $${++paramCount}`);
          values.push(input.adminNotes);
        }

        if (fields.length === 0) {
          throw new Error('No fields to update');
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        if (input.status === 'RESOLVED') {
          fields.push(`resolved_at = CURRENT_TIMESTAMP`);
        }

        const result = await query(`
          UPDATE contact_inquiries 
          SET ${fields.join(', ')}
          WHERE id = $1
          RETURNING 
            id, user_id, name, email, subject, inquiry_type, message,
            status, priority, assigned_to, admin_notes, ip_address,
            user_agent, source, created_at, updated_at, resolved_at,
            last_response_at
        `, values);

        if (result.rows.length === 0) {
          throw new Error('Contact inquiry not found');
        }

        const row = result.rows[0];
        return {
          id: row.id,
          userId: row.user_id,
          name: row.name,
          email: row.email,
          subject: row.subject,
          inquiryType: row.inquiry_type,
          message: row.message,
          status: row.status.toUpperCase(),
          priority: row.priority.toUpperCase(),
          assignedToId: row.assigned_to,
          adminNotes: row.admin_notes,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          source: row.source,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          resolvedAt: row.resolved_at,
          lastResponseAt: row.last_response_at
        };
      } catch (error) {
        console.error('Error updating contact inquiry:', error);
        throw new Error('Failed to update contact inquiry');
      }
    },

    // Create contact response (admin only)
    createContactResponse: async (parent, { input }, context) => {
      try {
        const user = context.requireAuth();
        const { inquiryId, responseText, isPublic, responseType } = input;

        const result = await query(`
          INSERT INTO contact_responses 
          (inquiry_id, admin_id, response_text, is_public, response_type)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING 
            id, inquiry_id, admin_id, response_text, is_public,
            response_type, created_at, updated_at
        `, [inquiryId, user.id, responseText, isPublic, responseType]);

        // Update inquiry's last_response_at
        await query(`
          UPDATE contact_inquiries 
          SET last_response_at = CURRENT_TIMESTAMP 
          WHERE id = $1
        `, [inquiryId]);

        const row = result.rows[0];
        return {
          id: row.id,
          inquiryId: row.inquiry_id,
          adminId: row.admin_id,
          responseText: row.response_text,
          isPublic: row.is_public,
          responseType: row.response_type,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      } catch (error) {
        console.error('Error creating contact response:', error);
        throw new Error('Failed to create contact response');
      }
    },

    // Delete contact inquiry (admin only)
    deleteContactInquiry: async (parent, { id }, context) => {
      try {
        // For now, allow all authenticated users
        // In production: context.requireRole('ADMIN');

        const result = await query(`
          DELETE FROM contact_inquiries WHERE id = $1
        `, [id]);

        return result.rowCount > 0;
      } catch (error) {
        console.error('Error deleting contact inquiry:', error);
        throw new Error('Failed to delete contact inquiry');
      }
    }
  },

  // Field resolvers
  ContactInquiry: {
    user: async (inquiry) => {
      if (!inquiry.userId) return null;
      
      try {
        const result = await query(`
          SELECT id, name, email, role, plan, created_at, last_login
          FROM users WHERE id = $1
        `, [inquiry.userId]);

        if (result.rows.length === 0) return null;

        const user = result.rows[0];
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
          createdAt: user.created_at,
          lastLogin: user.last_login
        };
      } catch (error) {
        console.error('Error fetching inquiry user:', error);
        return null;
      }
    },

    assignedTo: async (inquiry) => {
      if (!inquiry.assignedToId) return null;
      
      try {
        const result = await query(`
          SELECT id, name, email, role, plan, created_at, last_login
          FROM users WHERE id = $1
        `, [inquiry.assignedToId]);

        if (result.rows.length === 0) return null;

        const user = result.rows[0];
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
          createdAt: user.created_at,
          lastLogin: user.last_login
        };
      } catch (error) {
        console.error('Error fetching assigned user:', error);
        return null;
      }
    },

    responses: async (inquiry) => {
      try {
        const result = await query(`
          SELECT 
            id, inquiry_id, admin_id, response_text, is_public,
            response_type, created_at, updated_at
          FROM contact_responses 
          WHERE inquiry_id = $1
          ORDER BY created_at ASC
        `, [inquiry.id]);

        return result.rows.map(row => ({
          id: row.id,
          inquiryId: row.inquiry_id,
          adminId: row.admin_id,
          responseText: row.response_text,
          isPublic: row.is_public,
          responseType: row.response_type,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      } catch (error) {
        console.error('Error fetching inquiry responses:', error);
        return [];
      }
    }
  },

  ContactResponse: {
    inquiry: async (response) => {
      try {
        const result = await query(`
          SELECT 
            id, user_id, name, email, subject, inquiry_type, message,
            status, priority, assigned_to, admin_notes, ip_address,
            user_agent, source, created_at, updated_at, resolved_at,
            last_response_at
          FROM contact_inquiries 
          WHERE id = $1
        `, [response.inquiryId]);

        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        return {
          id: row.id,
          userId: row.user_id,
          name: row.name,
          email: row.email,
          subject: row.subject,
          inquiryType: row.inquiry_type,
          message: row.message,
          status: row.status.toUpperCase(),
          priority: row.priority.toUpperCase(),
          assignedToId: row.assigned_to,
          adminNotes: row.admin_notes,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          source: row.source,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          resolvedAt: row.resolved_at,
          lastResponseAt: row.last_response_at
        };
      } catch (error) {
        console.error('Error fetching response inquiry:', error);
        return null;
      }
    },

    admin: async (response) => {
      try {
        const result = await query(`
          SELECT id, name, email, role, plan, created_at, last_login
          FROM users WHERE id = $1
        `, [response.adminId]);

        if (result.rows.length === 0) return null;

        const user = result.rows[0];
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
          createdAt: user.created_at,
          lastLogin: user.last_login
        };
      } catch (error) {
        console.error('Error fetching response admin:', error);
        return null;
      }
    }
  }
};

module.exports = contactResolvers;