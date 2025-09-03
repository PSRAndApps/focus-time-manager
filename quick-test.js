const http = require('http');

// Quick test configuration
const PORT = 3000;
const HOST = 'localhost';

// Simple test function
function testEndpoint(path, expectedContent = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          if (expectedContent) {
            if (data.includes(expectedContent)) {
              resolve(`✅ ${path} - Content found: "${expectedContent}"`);
            } else {
              reject(`❌ ${path} - Expected content "${expectedContent}" not found`);
            }
          } else {
            resolve(`✅ ${path} - Status: ${res.statusCode}`);
          }
        } else {
          reject(`❌ ${path} - Status: ${res.statusCode}`);
        }
      });
    });

    req.on('error', (err) => {
      reject(`❌ ${path} - Error: ${err.message}`);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(`❌ ${path} - Timeout`);
    });

    req.end();
  });
}

// Run quick tests
async function runQuickTests() {
  console.log('🚀 Running Quick File Content Tests...\n');
  
  const tests = [
    { path: '/health', expected: 'healthy' },
    { path: '/', expected: 'Focus Time Manager' },
    { path: '/', expected: 'University PM Work' },
    { path: '/', expected: 'Family Time' },
    { path: '/', expected: 'AI Research & Startup' },
    { path: '/', expected: 'React' },
    { path: '/api/analytics', expected: 'totalSessions' }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await testEndpoint(test.path, test.expected);
      console.log(result);
      passed++;
    } catch (error) {
      console.log(error);
      failed++;
    }
  }

  console.log(`\n📊 Quick Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your application is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

// Run tests
runQuickTests().catch(console.error);
