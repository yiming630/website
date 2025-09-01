const { query } = require('./src/utils/database');

async function createContactDatabase() {
  console.log('🚀 Creating contact management database tables...');
  console.log('=====================================');
  
  try {
    // 1. Create contact_inquiries table
    console.log('📋 Creating contact_inquiries table...');
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
    console.log('   ✅ contact_inquiries table created');

    // 2. Create contact_categories table
    console.log('📂 Creating contact_categories table...');
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
    console.log('   ✅ contact_categories table created');

    // 3. Create contact_responses table
    console.log('💬 Creating contact_responses table...');
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
    console.log('   ✅ contact_responses table created');

    // 4. Create indexes
    console.log('⚡ Creating database indexes...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON contact_inquiries(email);
      CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON contact_inquiries(status);
      CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON contact_inquiries(created_at);
      CREATE INDEX IF NOT EXISTS idx_contact_responses_inquiry_id ON contact_responses(inquiry_id);
    `);
    console.log('   ✅ Database indexes created');

    // 5. Insert default contact categories
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
      await query(`
        INSERT INTO contact_categories (name, description, color, sort_order) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO UPDATE 
        SET description = EXCLUDED.description, 
            color = EXCLUDED.color, 
            sort_order = EXCLUDED.sort_order
      `, [category.name, category.description, category.color, category.sort]);
      console.log(`   ✅ ${category.name}`);
    }

    // 6. Create update trigger
    console.log('🔄 Creating update timestamp triggers...');
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
    console.log('   ✅ Update triggers created');

    // 7. Verify creation and show statistics
    console.log('📊 Verifying table creation...');
    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'contact%'
      ORDER BY table_name
    `);

    console.log('📋 Contact tables created:');
    for (const table of tableCheck.rows) {
      console.log(`   ✅ ${table.table_name}`);
    }

    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM contact_categories) as categories_count,
        (SELECT COUNT(*) FROM contact_inquiries) as inquiries_count
    `);

    const { categories_count, inquiries_count } = stats.rows[0];
    
    console.log('\n📈 Final Statistics:');
    console.log(`   📂 Contact Categories: ${categories_count}`);
    console.log(`   📧 Contact Inquiries: ${inquiries_count}`);

    console.log('\n🎉 SUCCESS: Contact database tables created!');
    console.log('=====================================');
    console.log('✅ Contact form is now ready to use');
    console.log('✅ GraphQL mutations available');
    console.log('✅ Admin management system ready');
    console.log('');
    console.log('Test the contact form at: http://localhost:3000');
    console.log('GraphQL Playground: http://localhost:4002/graphql');
    console.log('');

    return true;
  } catch (error) {
    console.error('\n❌ ERROR: Failed to create contact database');
    console.error('Error details:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await createContactDatabase();
    console.log('Contact database initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('Contact database initialization failed:', error);
    process.exit(1);
  }
}

main();