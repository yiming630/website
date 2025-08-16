#!/usr/bin/env node

/**
 * Database Initialization Script - LOCAL TESTING ONLY
 * ====================================================
 * 
 * Purpose:
 * --------
 * This script initializes the database with test data for local development.
 * It creates sample users, projects, and documents to help you test the application.
 * 
 * Prerequisites:
 * --------------
 * 1. PostgreSQL must be running locally
 * 2. Database must exist (created by schema.sql or reset.js)
 * 3. .env.local file must have valid database connection settings
 * 
 * What it creates:
 * ----------------
 * 1. Test users with different roles:
 *    - test@example.com (password: test123) - Regular translator
 *    - admin@example.com (password: admin123) - Admin user
 *    - demo@example.com (password: demo123) - Demo account
 * 
 * 2. Sample projects for testing:
 *    - Active translation project
 *    - Draft project
 *    - Completed project
 * 
 * 3. Sample documents with different statuses:
 *    - Uploaded documents waiting for translation
 *    - Documents in progress
 *    - Completed translations
 * 
 * Usage:
 * ------
 * node database/init.js
 * 
 * Or if added to package.json scripts:
 * npm run db:init
 * 
 * Options:
 * --------
 * --minimal    Create only essential test data (1 user, 1 project)
 * --full       Create comprehensive test data (default)
 * 
 * Safety:
 * -------
 * - Will not overwrite existing users (checks for duplicates)
 * - Safe to run multiple times (idempotent for users)
 * - Only works with local database connections
 * 
 * After running this script:
 * --------------------------
 * You can log in with any of the test accounts and start testing immediately.
 * All test data is clearly marked and can be easily identified.
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Safety check - ensure we're only running on localhost
if (!process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1')) {
  console.error('🚨 ERROR: This script can only be run on local databases!');
  console.error('Database URL must contain "localhost" or "127.0.0.1"');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// Parse command line arguments
const args = process.argv.slice(2);
const isMinimal = args.includes('--minimal');
const isFull = !isMinimal || args.includes('--full');

async function initDatabase() {
  try {
    await client.connect();
    
    console.log('========================================');
    console.log('   DATABASE INITIALIZATION - TEST DATA  ');
    console.log('========================================');
    console.log('');
    console.log('✅ Connected to PostgreSQL');
    console.log('Database: ' + process.env.DB_NAME);
    console.log('Mode: ' + (isMinimal ? 'Minimal' : 'Full'));
    console.log('');

    // Create test users
    console.log('👤 Creating test users...');
    
    const users = [
      {
        email: 'test@example.com',
        password: 'test123',
        name: 'Test User',
        type: 'translator',
        description: 'Regular translator account for testing'
      }
    ];

    if (isFull) {
      users.push(
        {
          email: 'admin@example.com',
          password: 'admin123',
          name: 'Admin User',
          type: 'admin',
          description: 'Administrator account with full access'
        },
        {
          email: 'demo@example.com',
          password: 'demo123',
          name: 'Demo User',
          type: 'translator',
          description: 'Demo account for presentations'
        }
      );
    }

    const createdUsers = [];
    
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const result = await client.query(`
        INSERT INTO users (email, password_hash, full_name, user_type, preferences)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO UPDATE
        SET full_name = EXCLUDED.full_name
        RETURNING id, email, full_name, user_type
      `, [
        userData.email, 
        hashedPassword, 
        userData.name, 
        userData.type,
        JSON.stringify({ theme: 'light', language: 'en' })
      ]);

      if (result.rows.length > 0) {
        createdUsers.push(result.rows[0]);
        console.log(`   ✓ ${userData.description}`);
        console.log(`     Email: ${userData.email} | Password: ${userData.password}`);
      }
    }

    // Create test projects
    console.log('\n📁 Creating test projects...');
    
    const testUserId = createdUsers[0].id;
    const projects = [
      {
        name: 'Technical Documentation Translation',
        description: 'Translating software documentation from English to Chinese',
        status: 'active',
        source: 'en',
        target: 'zh'
      }
    ];

    if (isFull) {
      projects.push(
        {
          name: 'Marketing Materials',
          description: 'Product brochures and marketing content translation',
          status: 'draft',
          source: 'en',
          target: 'zh'
        },
        {
          name: 'Completed Legal Documents',
          description: 'Legal contract translation project (completed)',
          status: 'completed',
          source: 'en',
          target: 'zh'
        }
      );
    }

    const createdProjects = [];
    
    for (const projectData of projects) {
      const result = await client.query(`
        INSERT INTO projects (
          user_id, name, description, source_language, 
          target_language, status, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, status
      `, [
        testUserId,
        projectData.name,
        projectData.description,
        projectData.source,
        projectData.target,
        projectData.status,
        JSON.stringify({ 
          test_data: true,
          created_by: 'init_script',
          priority: 'normal'
        })
      ]);
      
      createdProjects.push(result.rows[0]);
      console.log(`   ✓ ${projectData.name} (${projectData.status})`);
    }

    // Create sample documents
    if (isFull) {
      console.log('\n📄 Creating sample documents...');
      
      const documents = [
        {
          projectId: createdProjects[0].id,
          filename: 'user_manual.pdf',
          type: 'pdf',
          status: 'uploaded',
          size: 2048000,
          wordCount: 5000,
          pageCount: 20
        },
        {
          projectId: createdProjects[0].id,
          filename: 'api_reference.docx',
          type: 'docx',
          status: 'processing',
          size: 1024000,
          wordCount: 3000,
          pageCount: 15
        },
        {
          projectId: createdProjects[0].id,
          filename: 'readme.txt',
          type: 'txt',
          status: 'completed',
          size: 10240,
          wordCount: 500,
          pageCount: 2
        }
      ];

      for (const doc of documents) {
        await client.query(`
          INSERT INTO documents (
            project_id, original_filename, file_type, file_size_bytes,
            status, word_count, page_count, original_content, metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          doc.projectId,
          doc.filename,
          doc.type,
          doc.size,
          doc.status,
          doc.wordCount,
          doc.pageCount,
          'Sample content for testing purposes...',
          JSON.stringify({ test_data: true })
        ]);
        
        console.log(`   ✓ ${doc.filename} (${doc.status})`);
      }
    }

    // Verify database state
    console.log('\n📊 Database Statistics:');
    
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM projects) as project_count,
        (SELECT COUNT(*) FROM documents) as document_count
    `);
    
    const { user_count, project_count, document_count } = stats.rows[0];
    console.log(`   • Users: ${user_count}`);
    console.log(`   • Projects: ${project_count}`);
    console.log(`   • Documents: ${document_count}`);

    console.log('\n========================================');
    console.log('✅ DATABASE INITIALIZATION COMPLETE!');
    console.log('========================================');
    console.log('');
    console.log('Test Accounts Created:');
    console.log('----------------------');
    for (const userData of users) {
      console.log(`📧 ${userData.email}`);
      console.log(`   Password: ${userData.password}`);
      console.log(`   Role: ${userData.type}`);
      console.log('');
    }
    console.log('You can now start the application and log in with any test account.');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ ERROR: Failed to initialize database');
    console.error('');
    console.error('Error details:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('Is PostgreSQL running? Try:');
      console.error('  brew services start postgresql@16');
    } else if (error.code === '42P01') {
      console.error('');
      console.error('Tables do not exist. Run the reset script first:');
      console.error('  node database/reset.js');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run initialization
initDatabase();