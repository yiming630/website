const express = require('express');
const { query } = require('../utils/database');

const router = express.Router();

router.post('/init-all-tables', async (req, res) => {
  try {
    console.log('🚀 Creating all required database tables...');
    
    // 1. Create users table if it doesn't exist
    console.log('👤 Creating users table...');
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        password_salt VARCHAR(255) NULL,
        role VARCHAR(50) DEFAULT 'TRANSLATOR',
        plan VARCHAR(50) DEFAULT 'free',
        preferences JSONB DEFAULT '{}',
        email_verified BOOLEAN DEFAULT FALSE,
        email_verified_at TIMESTAMP NULL,
        account_status VARCHAR(20) DEFAULT 'pending',
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 2. Create projects table
    console.log('📁 Creating projects table...');
    await query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        owner_id UUID NOT NULL,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create documents table
    console.log('📄 Creating documents table...');
    await query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'PROCESSING',
        progress INTEGER DEFAULT 0,
        source_language VARCHAR(10) NOT NULL,
        target_language VARCHAR(10) NOT NULL,
        translation_style VARCHAR(50) DEFAULT 'GENERAL',
        specialization VARCHAR(100) DEFAULT 'general',
        original_content TEXT,
        translated_content TEXT,
        file_url VARCHAR(500),
        file_size INTEGER,
        file_type VARCHAR(50),
        project_id UUID,
        owner_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Add foreign key constraints for main tables
    console.log('🔗 Adding foreign key constraints...');
    await query(`
      DO $$ 
      BEGIN
        -- Projects foreign key
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_projects_owner_id'
        ) THEN
          ALTER TABLE projects 
          ADD CONSTRAINT fk_projects_owner_id 
          FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;

        -- Documents foreign keys
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_documents_owner_id'
        ) THEN
          ALTER TABLE documents 
          ADD CONSTRAINT fk_documents_owner_id 
          FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_documents_project_id'
        ) THEN
          ALTER TABLE documents 
          ADD CONSTRAINT fk_documents_project_id 
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // 5. Create contact_inquiries table
    console.log('📧 Creating contact_inquiries table...');
    await query(`
      CREATE TABLE IF NOT EXISTS contact_inquiries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        inquiry_type VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'new',
        priority VARCHAR(20) DEFAULT 'normal',
        assigned_to UUID NULL,
        admin_notes TEXT NULL,
        ip_address INET NULL,
        user_agent TEXT NULL,
        source VARCHAR(50) DEFAULT 'website',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        last_response_at TIMESTAMP NULL
      )
    `);

    // 2. Create contact_categories table
    await query(`
      CREATE TABLE IF NOT EXISTS contact_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT NULL,
        color VARCHAR(7) DEFAULT '#3B82F6',
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create contact_responses table
    await query(`
      CREATE TABLE IF NOT EXISTS contact_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inquiry_id UUID NOT NULL REFERENCES contact_inquiries(id) ON DELETE CASCADE,
        admin_id UUID NOT NULL,
        response_text TEXT NOT NULL,
        is_public BOOLEAN DEFAULT TRUE,
        response_type VARCHAR(50) DEFAULT 'reply',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Create indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON contact_inquiries(email);
      CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON contact_inquiries(status);
      CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON contact_inquiries(created_at);
      CREATE INDEX IF NOT EXISTS idx_contact_responses_inquiry_id ON contact_responses(inquiry_id);
    `);

    // 5. Insert default contact categories
    const categories = [
      { name: '产品咨询', description: '关于产品功能和使用的问题', color: '#3B82F6', sort: 1 },
      { name: '技术支持', description: '技术问题和故障排除', color: '#EF4444', sort: 2 },
      { name: '使用帮助', description: '使用指南和操作帮助', color: '#10B981', sort: 3 },
      { name: '账户问题', description: '账户相关的问题和请求', color: '#F59E0B', sort: 4 },
      { name: '翻译质量反馈', description: '对翻译结果的反馈和建议', color: '#8B5CF6', sort: 5 },
      { name: '功能建议', description: '新功能建议和改进意见', color: '#06B6D4', sort: 6 },
      { name: '商务合作', description: '商业合作和合作伙伴关系', color: '#EC4899', sort: 7 },
      { name: '价格咨询', description: '定价和计费相关问题', color: '#84CC16', sort: 8 },
      { name: 'Bug反馈', description: 'Bug报告和问题反馈', color: '#F97316', sort: 9 },
      { name: '其他问题', description: '其他类型的咨询和问题', color: '#6B7280', sort: 10 }
    ];

    for (const category of categories) {
      await query(`
        INSERT INTO contact_categories (name, description, color, sort_order) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO UPDATE 
        SET description = EXCLUDED.description, 
            color = EXCLUDED.color, 
            sort_order = EXCLUDED.sort_order
      `, [category.name, category.description, category.color, category.sort]);
    }

    // 6. Create update trigger
    await query(`
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await query(`
      DROP TRIGGER IF EXISTS update_contact_inquiries_timestamp ON contact_inquiries;
      CREATE TRIGGER update_contact_inquiries_timestamp 
        BEFORE UPDATE ON contact_inquiries 
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    `);

    await query(`
      DROP TRIGGER IF EXISTS update_contact_responses_timestamp ON contact_responses;
      CREATE TRIGGER update_contact_responses_timestamp 
        BEFORE UPDATE ON contact_responses 
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    `);

    // 7. Create indexes for main tables
    console.log('⚡ Creating additional indexes...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
      CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON documents(owner_id);
      CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
      CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
    `);

    // 8. Get statistics
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM projects) as projects_count,
        (SELECT COUNT(*) FROM documents) as documents_count,
        (SELECT COUNT(*) FROM contact_categories) as categories_count,
        (SELECT COUNT(*) FROM contact_inquiries) as inquiries_count
    `);

    const { users_count, projects_count, documents_count, categories_count, inquiries_count } = stats.rows[0];
    
    console.log('✅ All database tables created successfully!');
    console.log(`👤 Users: ${users_count}`);
    console.log(`📁 Projects: ${projects_count}`);
    console.log(`📄 Documents: ${documents_count}`);
    console.log(`📂 Contact Categories: ${categories_count}`);
    console.log(`📧 Contact Inquiries: ${inquiries_count}`);

    res.json({
      success: true,
      message: 'All database tables created successfully!',
      data: {
        usersCount: parseInt(users_count),
        projectsCount: parseInt(projects_count),
        documentsCount: parseInt(documents_count),
        categoriesCount: parseInt(categories_count),
        inquiriesCount: parseInt(inquiries_count),
        tablesCreated: ['users', 'projects', 'documents', 'contact_inquiries', 'contact_categories', 'contact_responses'],
        indexesCreated: 9,
        triggersCreated: 2
      }
    });

  } catch (error) {
    console.error('❌ Failed to create contact tables:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contact database tables',
      error: error.message
    });
  }
});

module.exports = router;