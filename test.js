const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 10000;

// Test utilities
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// HTTP request utility
const makeRequest = async (url, options = {}) => {
  const fetch = (await import('node-fetch')).default;
  try {
    const response = await fetch(url, {
      timeout: TEST_TIMEOUT,
      ...options
    });
    const text = await response.text();
    return { status: response.status, text, headers: response.headers };
  } catch (error) {
    return { error: error.message };
  }
};

// Test suite
class FileContentTestSuite {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log('🧪 Starting File Content Test Suite...\n');
    
    for (const test of this.tests) {
      try {
        console.log(`📋 Running: ${test.name}`);
        await test.testFn();
        console.log(`✅ PASSED: ${test.name}\n`);
        this.passed++;
      } catch (error) {
        console.log(`❌ FAILED: ${test.name}`);
        console.log(`   Error: ${error.message}\n`);
        this.failed++;
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('📊 Test Summary:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
  }
}

// Main test execution
async function runTests() {
  const suite = new FileContentTestSuite();

  // Test 1: Check if server is running
  suite.test('Server is running and accessible', async () => {
    const response = await makeRequest(`${BASE_URL}/health`);
    assert.ok(!response.error, `Server not accessible: ${response.error}`);
    assert.strictEqual(response.status, 200, `Expected status 200, got ${response.status}`);
    
    const data = JSON.parse(response.text);
    assert.ok(data.status === 'healthy', `Expected healthy status, got ${data.status}`);
    console.log(`   Server health: ${data.status}`);
  });

  // Test 2: Check if index.html is served at root
  suite.test('Root route serves index.html content', async () => {
    const response = await makeRequest(`${BASE_URL}/`);
    assert.ok(!response.error, `Root route not accessible: ${response.error}`);
    assert.strictEqual(response.status, 200, `Expected status 200, got ${response.status}`);
    
    const html = response.text;
    assert.ok(html.includes('<!DOCTYPE html>'), 'HTML doctype not found');
    assert.ok(html.includes('<title>Focus Time Manager</title>'), 'Page title not found');
    assert.ok(html.includes('<div id="root"></div>'), 'Root div not found');
    assert.ok(html.includes('FocusTimeManager'), 'React component not found');
    
    console.log(`   HTML content length: ${html.length} characters`);
    console.log(`   Contains React component: ${html.includes('FocusTimeManager')}`);
  });

  // Test 3: Check if static files are served
  suite.test('Static files are served from public directory', async () => {
    const response = await makeRequest(`${BASE_URL}/index.html`);
    assert.ok(!response.error, `Static file not accessible: ${response.error}`);
    assert.strictEqual(response.status, 200, `Expected status 200, got ${response.status}`);
    
    const html = response.text;
    assert.ok(html.includes('<!DOCTYPE html>'), 'Static HTML not found');
    
    console.log(`   Static file served successfully`);
  });

  // Test 4: Check if API endpoints are working
  suite.test('API endpoints are accessible', async () => {
    // Test analytics endpoint
    const analyticsResponse = await makeRequest(`${BASE_URL}/api/analytics`);
    assert.ok(!analyticsResponse.error, `Analytics endpoint not accessible: ${analyticsResponse.error}`);
    assert.strictEqual(analyticsResponse.status, 200, `Expected status 200, got ${analyticsResponse.status}`);
    
    const analyticsData = JSON.parse(analyticsResponse.text);
    assert.ok(typeof analyticsData.totalSessions === 'number', 'Analytics data not properly formatted');
    
    console.log(`   Analytics endpoint: ${analyticsResponse.status}`);
    console.log(`   Total sessions: ${analyticsData.totalSessions}`);
  });

  // Test 5: Check if HTML contains all required elements
  suite.test('HTML contains all required UI elements', async () => {
    const response = await makeRequest(`${BASE_URL}/`);
    const html = response.text;
    
    // Check for session types
    assert.ok(html.includes('University PM Work'), 'University PM Work session type not found');
    assert.ok(html.includes('Family Time'), 'Family Time session type not found');
    assert.ok(html.includes('AI Research & Startup'), 'AI Research & Startup session type not found');
    
    // Check for React dependencies
    assert.ok(html.includes('react@18'), 'React 18 dependency not found');
    assert.ok(html.includes('react-dom@18'), 'React DOM 18 dependency not found');
    assert.ok(html.includes('babel.min.js'), 'Babel dependency not found');
    assert.ok(html.includes('tailwindcss'), 'Tailwind CSS dependency not found');
    
    console.log(`   All session types found`);
    console.log(`   All React dependencies loaded`);
  });

  // Test 6: Check if logs directory exists and is writable
  suite.test('Logs directory exists and is writable', async () => {
    const logsDir = path.join(process.cwd(), 'logs');
    
    try {
      await fs.access(logsDir);
      console.log(`   Logs directory exists: ${logsDir}`);
      
      // Test if we can write to it
      const testFile = path.join(logsDir, 'test-write.tmp');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      console.log(`   Logs directory is writable`);
    } catch (error) {
      throw new Error(`Logs directory issue: ${error.message}`);
    }
  });

  // Test 7: Check if package.json dependencies are installed
  suite.test('Required dependencies are installed', async () => {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    const nodeModules = await fs.readdir('node_modules');
    
    // Check if express is installed
    assert.ok(nodeModules.includes('express'), 'Express not found in node_modules');
    assert.ok(nodeModules.includes('cors'), 'CORS not found in node_modules');
    
    console.log(`   Express version: ${packageJson.dependencies.express}`);
    console.log(`   CORS version: ${packageJson.dependencies.cors}`);
  });

  // Test 8: Check if server can handle POST requests
  suite.test('Server can handle POST requests', async () => {
    const testSession = {
      sessionType: 'test',
      plannedDuration: 60,
      actualDuration: 45,
      distractionCount: 2,
      distractions: [{ distraction: 'test distraction', time: new Date().toLocaleTimeString() }],
      completedAt: new Date().toISOString(),
      wasCompleted: true
    };

    const response = await makeRequest(`${BASE_URL}/api/log-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSession)
    });

    assert.ok(!response.error, `POST request failed: ${response.error}`);
    assert.strictEqual(response.status, 200, `Expected status 200, got ${response.status}`);
    
    const data = JSON.parse(response.text);
    assert.ok(data.success, 'Session logging failed');
    
    console.log(`   POST request successful`);
    console.log(`   Session logged with ID: ${data.id}`);
  });

  // Test 9: Check if HTML content is properly formatted
  suite.test('HTML content is properly formatted', async () => {
    const response = await makeRequest(`${BASE_URL}/`);
    const html = response.text;
    
    // Check for proper HTML structure
    assert.ok(html.includes('<html lang="en">'), 'HTML lang attribute missing');
    assert.ok(html.includes('<meta charset="UTF-8">'), 'Meta charset missing');
    assert.ok(html.includes('<meta name="viewport"'), 'Viewport meta missing');
    
    // Check for proper script loading
    assert.ok(html.includes('type="text/babel"'), 'Babel script type missing');
    
    console.log(`   HTML structure is valid`);
    console.log(`   Scripts are properly configured`);
  });

  // Test 10: Check if server responds to invalid routes
  suite.test('Server handles invalid routes gracefully', async () => {
    const response = await makeRequest(`${BASE_URL}/nonexistent`);
    assert.ok(!response.error, `Invalid route request failed: ${response.error}`);
    
    // Should return 404 or serve index.html (SPA behavior)
    if (response.status === 404) {
      console.log(`   Invalid route returns 404 (expected)`);
    } else if (response.status === 200 && response.text.includes('<!DOCTYPE html>')) {
      console.log(`   Invalid route serves index.html (SPA behavior)`);
    } else {
      throw new Error(`Unexpected response for invalid route: ${response.status}`);
    }
  });

  await suite.run();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { FileContentTestSuite, runTests };
