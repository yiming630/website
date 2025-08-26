/**
 * Test script for the unified translation API
 * Tests the GraphQL mutations and queries for translation functionality
 */

const axios = require('axios');

// GraphQL endpoint
const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

// Test queries and mutations
const queries = {
  // Get supported languages
  getSupportedLanguages: `
    query GetSupportedLanguages {
      supportedLanguages {
        code
        name
        nativeName
        isAutoDetected
        supportedAsSource
        supportedAsTarget
      }
    }
  `,

  // Get translation specializations
  getTranslationSpecializations: `
    query GetTranslationSpecializations {
      translationSpecializations {
        key
        title
        description
        requiresExpertise
      }
    }
  `,

  // Translate text
  translateText: `
    mutation TranslateText($input: TranslateTextInput!) {
      translateText(input: $input) {
        originalText
        translatedText
        sourceLanguage
        targetLanguage
        style
        createdAt
      }
    }
  `,

  // Improve translation
  improveTranslation: `
    mutation ImproveTranslation($input: ImproveTranslationInput!) {
      improveTranslation(input: $input) {
        originalText
        originalTranslation
        improvedTranslation
        sourceLanguage
        targetLanguage
        feedback
        createdAt
      }
    }
  `,

  // Upload document
  uploadDocument: `
    mutation UploadDocument($input: UploadDocumentInput!) {
      uploadDocument(input: $input) {
        id
        originalFilename
        status
        fileType
        fileSizeBytes
        metadata
      }
    }
  `
};

// Helper function to make GraphQL requests
async function graphqlRequest(query, variables = {}) {
  try {
    const response = await axios.post(
      GRAPHQL_ENDPOINT,
      {
        query,
        variables
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.errors) {
      console.error('GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
      return null;
    }

    return response.data.data;
  } catch (error) {
    console.error('Request Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Test functions
async function testSupportedLanguages() {
  console.log('\n📋 Testing Supported Languages Query...');
  const data = await graphqlRequest(queries.getSupportedLanguages);
  
  if (data?.supportedLanguages) {
    console.log('✅ Supported Languages:', data.supportedLanguages.length);
    console.log('   Sample:', data.supportedLanguages.slice(0, 3).map(l => `${l.code}: ${l.name}`).join(', '));
  } else {
    console.log('❌ Failed to get supported languages');
  }
}

async function testTranslationSpecializations() {
  console.log('\n📋 Testing Translation Specializations Query...');
  const data = await graphqlRequest(queries.getTranslationSpecializations);
  
  if (data?.translationSpecializations) {
    console.log('✅ Translation Specializations:', data.translationSpecializations.length);
    console.log('   Available:', data.translationSpecializations.map(s => s.title).join(', '));
  } else {
    console.log('❌ Failed to get translation specializations');
  }
}

async function testTextTranslation() {
  console.log('\n🔄 Testing Text Translation...');
  
  const input = {
    text: 'Hello, this is a test of the translation API.',
    sourceLanguage: 'en',
    targetLanguage: 'zh',
    style: 'general'
  };
  
  console.log('   Input:', input.text);
  console.log('   From:', input.sourceLanguage, '→ To:', input.targetLanguage);
  
  const data = await graphqlRequest(queries.translateText, { input });
  
  if (data?.translateText) {
    console.log('✅ Translation successful!');
    console.log('   Result:', data.translateText.translatedText);
  } else {
    console.log('❌ Translation failed');
  }
}

async function testAutoDetectTranslation() {
  console.log('\n🔄 Testing Auto-Detect Translation...');
  
  const input = {
    text: '这是一个中文测试句子。',
    sourceLanguage: 'auto',
    targetLanguage: 'en',
    style: 'general'
  };
  
  console.log('   Input:', input.text);
  console.log('   Auto-detecting source language...');
  
  const data = await graphqlRequest(queries.translateText, { input });
  
  if (data?.translateText) {
    console.log('✅ Translation successful!');
    console.log('   Detected language:', data.translateText.sourceLanguage);
    console.log('   Result:', data.translateText.translatedText);
  } else {
    console.log('❌ Translation failed');
  }
}

async function testImproveTranslation() {
  console.log('\n📝 Testing Translation Improvement...');
  
  const input = {
    originalText: 'The quick brown fox jumps over the lazy dog.',
    currentTranslation: '快速的棕色狐狸跳过懒狗。',
    sourceLanguage: 'en',
    targetLanguage: 'zh',
    feedback: 'Please make it more natural and fluent in Chinese.'
  };
  
  console.log('   Original:', input.originalText);
  console.log('   Current:', input.currentTranslation);
  console.log('   Feedback:', input.feedback);
  
  const data = await graphqlRequest(queries.improveTranslation, { input });
  
  if (data?.improveTranslation) {
    console.log('✅ Improvement successful!');
    console.log('   Improved:', data.improveTranslation.improvedTranslation);
  } else {
    console.log('❌ Improvement failed');
  }
}

async function testDocumentUpload() {
  console.log('\n📄 Testing Document Upload...');
  
  const input = {
    title: 'Test Document.pdf',
    sourceLanguage: 'auto',
    targetLanguage: 'zh',
    translationStyle: 'ACADEMIC',
    specialization: 'technical',
    fileUrl: 'http://localhost:4000/files/test/document.pdf',
    fileSize: 1024000,
    fileType: 'pdf'
  };
  
  console.log('   Title:', input.title);
  console.log('   Style:', input.translationStyle);
  console.log('   Specialization:', input.specialization);
  
  const data = await graphqlRequest(queries.uploadDocument, { input });
  
  if (data?.uploadDocument) {
    console.log('✅ Document uploaded successfully!');
    console.log('   Document ID:', data.uploadDocument.id);
    console.log('   Status:', data.uploadDocument.status);
  } else {
    console.log('❌ Document upload failed');
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Translation API Tests...');
  console.log('================================');
  
  // Check if server is running
  try {
    await axios.get('http://localhost:4000/health');
    console.log('✅ Server is running');
  } catch (error) {
    console.error('❌ Server is not running. Please start the backend server first.');
    console.log('   Run: cd backend && npm start');
    process.exit(1);
  }
  
  // Run tests
  await testSupportedLanguages();
  await testTranslationSpecializations();
  
  // Only test translation features if OpenRouter API key is configured
  if (process.env.OPENROUTER_API_KEY) {
    await testTextTranslation();
    await testAutoDetectTranslation();
    await testImproveTranslation();
  } else {
    console.log('\n⚠️  Skipping translation tests - OPENROUTER_API_KEY not configured');
    console.log('   To enable translation tests, set OPENROUTER_API_KEY in your .env.local file');
  }
  
  await testDocumentUpload();
  
  console.log('\n================================');
  console.log('✅ All tests completed!');
}

// Run tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});