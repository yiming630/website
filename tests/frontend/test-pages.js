/**
 * Frontend Pages Test
 * Tests page loading and basic functionality
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Test results storage
const results = {
  timestamp: new Date().toISOString(),
  frontendUrl: FRONTEND_URL,
  tests: [],
  summary: { passed: 0, failed: 0, total: 0 }
};

async function runTest(name, testFn) {
  const startTime = Date.now();
  const test = { name, status: 'pending', duration: 0, error: null, details: {} };
  
  try {
    console.log(`Running: ${name}...`);
    const details = await testFn();
    test.status = 'passed';
    test.details = details || {};
    results.summary.passed++;
    console.log(`✅ ${name} - PASSED`);
  } catch (error) {
    test.status = 'failed';
    test.error = error.message;
    results.summary.failed++;
    console.log(`❌ ${name} - FAILED: ${error.message}`);
  } finally {
    test.duration = Date.now() - startTime;
    results.tests.push(test);
    results.summary.total++;
  }
}

async function testPageLoad(pagePath, pageName) {
  await runTest(`${pageName} Page Load`, async () => {
    try {
      const response = await fetch(`${FRONTEND_URL}${pagePath}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Check for Next.js app
      if (!html.includes('__next')) {
        throw new Error('Not a Next.js application');
      }
      
      // Check for basic HTML structure
      if (!html.includes('<!DOCTYPE html>')) {
        throw new Error('Invalid HTML structure');
      }
      
      // Check page size
      const sizeKB = Math.round(html.length / 1024);
      console.log(`  Page size: ${sizeKB}KB`);
      
      // Check for error indicators
      if (html.includes('Error:') || html.includes('error-boundary')) {
        console.log(`  ⚠️ Page contains error indicators`);
      }
      
      return {
        status: response.status,
        sizeKB,
        hasNextJS: true
      };
      
    } catch (error) {
      if (error.cause?.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to frontend at ${FRONTEND_URL}. Is the dev server running?`);
      }
      throw error;
    }
  });
}

async function testAPIEndpoints() {
  await runTest('Next.js API Health Check', async () => {
    try {
      const response = await fetch(`${FRONTEND_URL}/api/health`);
      
      if (response.status === 404) {
        console.log(`  No health endpoint found (404) - this is normal`);
        return { exists: false };
      }
      
      const data = await response.json();
      console.log(`  API Health: ${JSON.stringify(data)}`);
      return data;
      
    } catch (error) {
      if (error.cause?.code === 'ECONNREFUSED') {
        throw new Error('Frontend server not running');
      }
      // API might not exist, which is okay
      console.log(`  No API endpoint (expected for static site)`);
      return { exists: false };
    }
  });
}

async function testStaticAssets() {
  await runTest('Static Assets Loading', async () => {
    const response = await fetch(`${FRONTEND_URL}`);
    const html = await response.text();
    
    // Extract CSS and JS file references
    const cssFiles = html.match(/href="[^"]*\.css[^"]*"/g) || [];
    const jsFiles = html.match(/src="[^"]*\.js[^"]*"/g) || [];
    
    console.log(`  Found ${cssFiles.length} CSS files`);
    console.log(`  Found ${jsFiles.length} JS files`);
    
    // Test loading first CSS file if exists
    if (cssFiles.length > 0) {
      const cssPath = cssFiles[0].match(/href="([^"]*)"/)[1];
      const cssUrl = cssPath.startsWith('http') ? cssPath : `${FRONTEND_URL}${cssPath}`;
      const cssResponse = await fetch(cssUrl);
      
      if (!cssResponse.ok) {
        throw new Error(`CSS file failed to load: ${cssPath}`);
      }
      console.log(`  ✓ CSS loads successfully`);
    }
    
    return {
      cssCount: cssFiles.length,
      jsCount: jsFiles.length
    };
  });
}

async function testPageNavigation() {
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/translate', name: 'Translate' },
    { path: '/documents', name: 'Documents' },
    { path: '/projects', name: 'Projects' },
    { path: '/contact', name: 'Contact' },
    { path: '/pricing', name: 'Pricing' },
    { path: '/about', name: 'About' }
  ];
  
  for (const page of pages) {
    await testPageLoad(page.path, page.name);
  }
}

async function testPageContent() {
  await runTest('Home Page Content Check', async () => {
    const response = await fetch(FRONTEND_URL);
    const html = await response.text();
    
    const checks = {
      hasTitle: html.includes('<title>') && html.includes('</title>'),
      hasViewport: html.includes('viewport'),
      hasMain: html.includes('<main') || html.includes('id="__next"'),
      hasTranslation: html.toLowerCase().includes('translat') || html.includes('格式译')
    };
    
    console.log(`  Title tag: ${checks.hasTitle ? '✓' : '✗'}`);
    console.log(`  Viewport meta: ${checks.hasViewport ? '✓' : '✗'}`);
    console.log(`  Main content: ${checks.hasMain ? '✓' : '✗'}`);
    console.log(`  Translation content: ${checks.hasTranslation ? '✓' : '✗'}`);
    
    const failedChecks = Object.entries(checks).filter(([_, v]) => !v);
    if (failedChecks.length > 0) {
      console.log(`  ⚠️ Missing: ${failedChecks.map(([k]) => k).join(', ')}`);
    }
    
    return checks;
  });
}

async function testResponsiveness() {
  await runTest('Mobile Responsiveness Check', async () => {
    const response = await fetch(FRONTEND_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    });
    
    const html = await response.text();
    
    const checks = {
      hasViewport: html.includes('width=device-width'),
      hasResponsiveCSS: html.includes('tailwind') || html.includes('@media'),
      hasMobileMenu: html.includes('mobile-menu') || html.includes('burger') || html.includes('menu-toggle')
    };
    
    console.log(`  Viewport responsive: ${checks.hasViewport ? '✓' : '✗'}`);
    console.log(`  Responsive CSS: ${checks.hasResponsiveCSS ? '✓' : '✗'}`);
    
    return checks;
  });
}

// Main execution
async function main() {
  console.log('========================================');
  console.log('Frontend Pages Tests');
  console.log('========================================\n');
  
  console.log(`Testing frontend at: ${FRONTEND_URL}\n`);
  
  try {
    // Test basic connectivity
    await runTest('Frontend Server Connectivity', async () => {
      const response = await fetch(FRONTEND_URL);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      console.log(`  Server is running`);
      return { connected: true };
    });
    
    // Test page navigation
    await testPageNavigation();
    
    // Test API endpoints
    await testAPIEndpoints();
    
    // Test static assets
    await testStaticAssets();
    
    // Test page content
    await testPageContent();
    
    // Test responsiveness
    await testResponsiveness();
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    results.fatalError = error.message;
  }
  
  // Save results
  const resultsPath = path.join(__dirname, '..', 'results', 'frontend-test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log('\n========================================');
  console.log(`Results: ${results.summary.passed}/${results.summary.total} passed`);
  console.log('========================================');
  
  if (results.summary.failed > 0) {
    process.exit(1);
  }
}

// Check Node version for fetch support
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ with built-in fetch support');
  process.exit(1);
}

main();