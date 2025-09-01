const { query } = require('./src/utils/database');

async function createContactTables() {
  console.log('🚀 Creating contact management tables...');
  
  try {
    // Create contact_inquiries table
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

    console.log('✅ Created contact_inquiries table');

    // Create contact_categories table
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

    console.log('✅ Created contact_categories table');

    // Create contact_responses table
    await query(`
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

    console.log('✅ Created contact_responses table');

    // Insert default contact categories
    await query(`
      INSERT INTO contact_categories (name, description, color, sort_order) VALUES
      ('产品咨询', '关于产品功能和使用的问题', '#3B82F6', 1),
      ('技术支持', '技术问题和故障排除', '#EF4444', 2),
      ('使用帮助', '使用指南和操作帮助', '#10B981', 3),
      ('账户问题', '账户相关的问题和请求', '#F59E0B', 4),
      ('翻译质量反馈', '对翻译结果的反馈和建议', '#8B5CF6', 5),
      ('功能建议', '新功能建议和改进意见', '#06B6D4', 6),
      ('商务合作', '商业合作和合作伙伴关系', '#EC4899', 7),
      ('价格咨询', '定价和计费相关问题', '#84CC16', 8),
      ('Bug反馈', 'Bug报告和问题反馈', '#F97316', 9),
      ('其他问题', '其他类型的咨询和问题', '#6B7280', 10)
      ON CONFLICT (name) DO NOTHING
    `);

    console.log('✅ Inserted default contact categories');

    // Create indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON contact_inquiries(email);
      CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON contact_inquiries(status);
      CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON contact_inquiries(created_at);
    `);

    console.log('✅ Created indexes');

    // Test the tables by querying categories
    const result = await query('SELECT COUNT(*) as count FROM contact_categories');
    console.log(`📋 Contact categories count: ${result.rows[0].count}`);

    console.log('🎉 Contact management tables created successfully!');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create contact tables:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await createContactTables();
    console.log('Table creation process completed!');
    process.exit(0);
  } catch (error) {
    console.error('Table creation failed:', error);
    process.exit(1);
  }
}

main();