#!/usr/bin/env node

/**
 * Contact Database Initialization Script
 * =====================================
 * 
 * Purpose:
 * --------
 * This script creates the contact management tables and populates them
 * with default categories for the contact form system.
 * 
 * What it creates:
 * ----------------
 * 1. contact_inquiries table - Stores all contact form submissions
 * 2. contact_categories table - Predefined inquiry types
 * 3. contact_responses table - Admin responses to inquiries
 * 4. Default contact categories (产品咨询, 技术支持, etc.)
 * 5. Necessary indexes for performance
 * 
 * Usage:
 * ------
 * node database/init-contact.js
 * 
 * Prerequisites:
 * --------------
 * 1. PostgreSQL must be running locally
 * 2. Main database must exist with users table
 * 3. .env.local file must have valid database connection settings
 */

const db = require('./connection');

async function initContactTables() {
  try {
    console.log('========================================');
    console.log('   CONTACT DATABASE INITIALIZATION     ');
    console.log('========================================');
    console.log('');

    // Test database connection
    console.log('🔗 Testing database connection...');
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    // 1. Create contact_inquiries table
    console.log('📋 Creating contact_inquiries table...');
    await db.query(`
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
    console.log('   ✓ contact_inquiries table created');

    // 2. Create contact_categories table
    console.log('📂 Creating contact_categories table...');
    await db.query(`
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
    console.log('   ✓ contact_categories table created');

    // 3. Create contact_responses table
    console.log('💬 Creating contact_responses table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS contact_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inquiry_id UUID NOT NULL,
        admin_id UUID NOT NULL,
        response_text TEXT NOT NULL,
        is_public BOOLEAN DEFAULT TRUE,
        response_type VARCHAR(50) DEFAULT 'reply',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✓ contact_responses table created');

    // 4. Add foreign key constraints if users table exists
    console.log('🔗 Adding foreign key constraints...');
    try {
      // Check if users table exists first
      const usersCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        )
      `);

      if (usersCheck.rows[0].exists) {
        // Add foreign key constraints
        await db.query(`
          DO $$ 
          BEGIN
            -- Add constraint for contact_inquiries.user_id
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'fk_contact_inquiries_user_id'
            ) THEN
              ALTER TABLE contact_inquiries 
              ADD CONSTRAINT fk_contact_inquiries_user_id 
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
            END IF;

            -- Add constraint for contact_inquiries.assigned_to
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'fk_contact_inquiries_assigned_to'
            ) THEN
              ALTER TABLE contact_inquiries 
              ADD CONSTRAINT fk_contact_inquiries_assigned_to 
              FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;
            END IF;

            -- Add constraint for contact_responses.admin_id
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'fk_contact_responses_admin_id'
            ) THEN
              ALTER TABLE contact_responses 
              ADD CONSTRAINT fk_contact_responses_admin_id 
              FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE;
            END IF;

            -- Add constraint for contact_responses.inquiry_id
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'fk_contact_responses_inquiry_id'
            ) THEN
              ALTER TABLE contact_responses 
              ADD CONSTRAINT fk_contact_responses_inquiry_id 
              FOREIGN KEY (inquiry_id) REFERENCES contact_inquiries(id) ON DELETE CASCADE;
            END IF;
          END $$;
        `);
        console.log('   ✓ Foreign key constraints added');
      } else {
        console.log('   ⚠️  Users table not found, skipping foreign key constraints');
      }
    } catch (err) {
      console.log('   ⚠️  Could not add foreign key constraints:', err.message);
    }

    // 5. Create indexes for better performance
    console.log('⚡ Creating database indexes...');
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON contact_inquiries(email);
      CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON contact_inquiries(status);
      CREATE INDEX IF NOT EXISTS idx_contact_inquiries_priority ON contact_inquiries(priority);
      CREATE INDEX IF NOT EXISTS idx_contact_inquiries_inquiry_type ON contact_inquiries(inquiry_type);
      CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON contact_inquiries(created_at);
      CREATE INDEX IF NOT EXISTS idx_contact_responses_inquiry_id ON contact_responses(inquiry_id);
      CREATE INDEX IF NOT EXISTS idx_contact_responses_admin_id ON contact_responses(admin_id);
    `);
    console.log('   ✓ Database indexes created');

    // 6. Insert default contact categories
    console.log('📝 Inserting default contact categories...');
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
      await db.query(`
        INSERT INTO contact_categories (name, description, color, sort_order) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO UPDATE 
        SET description = EXCLUDED.description, 
            color = EXCLUDED.color, 
            sort_order = EXCLUDED.sort_order
      `, [category.name, category.description, category.color, category.sort]);
      console.log(`   ✓ ${category.name}`);
    }

    // 7. Create update trigger function
    console.log('🔄 Creating update timestamp trigger...');
    await db.query(`
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await db.query(`
      DROP TRIGGER IF EXISTS update_contact_inquiries_timestamp ON contact_inquiries;
      CREATE TRIGGER update_contact_inquiries_timestamp 
        BEFORE UPDATE ON contact_inquiries 
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    `);

    await db.query(`
      DROP TRIGGER IF EXISTS update_contact_responses_timestamp ON contact_responses;
      CREATE TRIGGER update_contact_responses_timestamp 
        BEFORE UPDATE ON contact_responses 
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    `);
    console.log('   ✓ Update triggers created');

    // 8. Verify tables were created
    console.log('📊 Verifying table creation...');
    const tableCheck = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'contact%'
      ORDER BY table_name
    `);

    console.log('   Contact tables found:');
    for (const table of tableCheck.rows) {
      console.log(`   ✓ ${table.table_name}`);
    }

    // 9. Get final statistics
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM contact_categories) as categories_count,
        (SELECT COUNT(*) FROM contact_inquiries) as inquiries_count,
        (SELECT COUNT(*) FROM contact_responses) as responses_count
    `);

    const { categories_count, inquiries_count, responses_count } = stats.rows[0];
    
    console.log('\n📈 Database Statistics:');
    console.log(`   • Contact Categories: ${categories_count}`);
    console.log(`   • Contact Inquiries: ${inquiries_count}`);
    console.log(`   • Contact Responses: ${responses_count}`);

    console.log('\n========================================');
    console.log('✅ CONTACT TABLES INITIALIZED SUCCESSFULLY!');
    console.log('========================================');
    console.log('');
    console.log('Contact Management Features:');
    console.log('----------------------------');
    console.log('✓ Contact form submissions will be stored in database');
    console.log('✓ 10 predefined inquiry categories available');
    console.log('✓ Admin response system ready');
    console.log('✓ Full audit trail with timestamps');
    console.log('✓ Support for authenticated and anonymous users');
    console.log('');
    console.log('Next Steps:');
    console.log('-----------');
    console.log('1. Test contact form on homepage: http://localhost:3000');
    console.log('2. Access GraphQL Playground: http://localhost:4002/graphql');
    console.log('3. Try the createContactInquiry mutation');
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR: Failed to initialize contact tables');
    console.error('');
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('Database connection failed. Ensure PostgreSQL is running.');
    } else if (error.code === '42P01') {
      console.error('');
      console.error('Required tables are missing. Run the main schema setup first.');
    }
    
    process.exit(1);
  } finally {
    // Close database connections
    await db.shutdown();
  }
}

// Run the initialization
if (require.main === module) {
  initContactTables();
}

module.exports = { initContactTables };