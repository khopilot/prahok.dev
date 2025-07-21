#!/usr/bin/env tsx

/**
 * Comprehensive Application Debugging Script
 * Tests all major functionality endpoints and features
 */

import axios from 'axios';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const colorMap = {
    info: colors.blue,
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
  };
  console.log(`${colorMap[type]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log(`\n${colors.bright}${colors.cyan}========== ${title} ==========${colors.reset}\n`);
}

async function testEndpoint(name: string, method: string, url: string, data?: any, headers?: any) {
  try {
    log(`Testing ${name}...`, 'info');
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      validateStatus: () => true, // Accept any status code
    });

    if (response.status >= 200 && response.status < 300) {
      log(`✅ ${name}: Status ${response.status}`, 'success');
      return { success: true, data: response.data, status: response.status };
    } else {
      log(`❌ ${name}: Status ${response.status}`, 'error');
      if (response.data) {
        console.log('Response:', JSON.stringify(response.data, null, 2));
      }
      return { success: false, status: response.status, error: response.data };
    }
  } catch (error: any) {
    log(`❌ ${name}: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function testPageLoad(name: string, path: string) {
  try {
    log(`Testing page ${name}...`, 'info');
    const response = await axios.get(`${BASE_URL}${path}`, {
      validateStatus: () => true,
    });

    if (response.status === 200) {
      log(`✅ Page ${name} loaded successfully`, 'success');
      
      // Check for common errors in the HTML
      const html = response.data;
      if (html.includes('Error:') || html.includes('error:')) {
        log(`⚠️  Page contains error text`, 'warning');
      }
      if (html.includes('404') && !path.includes('404')) {
        log(`⚠️  Page might be showing 404 content`, 'warning');
      }
      
      return { success: true, status: response.status };
    } else {
      log(`❌ Page ${name}: Status ${response.status}`, 'error');
      return { success: false, status: response.status };
    }
  } catch (error: any) {
    log(`❌ Page ${name}: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function checkEnvironmentVariables() {
  logSection('Environment Variables Check');
  
  const requiredVars = [
    'ANTHROPIC_API_KEY',
    'DAYTONA_API_KEY',
    'DAYTONA_API_URL',
    'NEXT_PUBLIC_API_URL',
  ];

  let allPresent = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      log(`✅ ${varName}: Set (${value.substring(0, 10)}...)`, 'success');
    } else {
      log(`❌ ${varName}: Not set`, 'error');
      allPresent = false;
    }
  }

  // Test environment API endpoint
  const envTest = await testEndpoint('Environment Test API', 'GET', `${API_BASE}/env-test`);
  
  return allPresent && envTest.success;
}

async function testPages() {
  logSection('Page Loading Tests');
  
  const pages = [
    { name: 'Homepage', path: '/' },
    { name: 'Login', path: '/login' },
    { name: 'Signup', path: '/signup' },
    { name: 'Editor', path: '/editor' },
    { name: 'Test Generation', path: '/test-generation' },
    { name: 'Test CSS', path: '/test-css' },
    { name: 'Test Auth', path: '/test-auth' },
  ];

  let allSuccess = true;
  
  for (const page of pages) {
    const result = await testPageLoad(page.name, page.path);
    if (!result.success) allSuccess = false;
  }
  
  return allSuccess;
}

async function testAPIEndpoints() {
  logSection('API Endpoint Tests');
  
  // Test simple endpoints first
  await testEndpoint('Simple Test', 'GET', `${API_BASE}/test-simple`);
  await testEndpoint('Debug Environment', 'GET', `${API_BASE}/debug-env`);
  
  // Test Claude integration
  await testEndpoint('Claude Test', 'GET', `${API_BASE}/test-claude`);
  
  // Test generation endpoints
  const testPrompt = 'Create a simple hello world HTML page';
  
  await testEndpoint('Direct Claude API', 'POST', `${API_BASE}/test-direct`, {
    prompt: testPrompt,
  });
  
  await testEndpoint('Claude Code SDK', 'POST', `${API_BASE}/test-generate`, {
    prompt: testPrompt,
  });
  
  await testEndpoint('Sandbox Generation', 'POST', `${API_BASE}/generate/sandbox`, {
    prompt: testPrompt,
    projectName: 'debug-test',
  });
  
  // Test project endpoints (will fail without auth)
  await testEndpoint('Get Projects', 'GET', `${API_BASE}/projects`);
}

async function testAuthFlow() {
  logSection('Authentication Flow Test');
  
  // Test with mock backend API
  const mockEmail = 'test@example.com';
  const mockPassword = 'testpassword123';
  
  log('Note: Auth will fail without backend API running on port 5000', 'warning');
  
  // Check if backend is running
  try {
    const backendCheck = await axios.get('http://localhost:5000/api/health', {
      validateStatus: () => true,
      timeout: 2000,
    });
    
    if (backendCheck.status === 200) {
      log('✅ Backend API is running', 'success');
      
      // Try login
      const loginResult = await testEndpoint('Login', 'POST', 'http://localhost:5000/api/auth/login', {
        email: mockEmail,
        password: mockPassword,
      });
      
      if (loginResult.success && loginResult.data?.accessToken) {
        log('✅ Login successful, got token', 'success');
        
        // Test authenticated endpoint
        await testEndpoint('Get Projects (Authenticated)', 'GET', `${API_BASE}/projects`, null, {
          Authorization: `Bearer ${loginResult.data.accessToken}`,
        });
      }
    } else {
      log('⚠️  Backend API not responding correctly', 'warning');
    }
  } catch (error) {
    log('❌ Backend API is not running on port 5000', 'error');
    log('   Run the backend server to test authentication', 'info');
  }
}

async function checkStaticAssets() {
  logSection('Static Assets Check');
  
  const assets = [
    '/sw.js',
    '/u7965223339_Clean_hero_background_design_stylized_waves_patte_9e1b5d70-2118-403c-a69f-20717c2d39f5_1.png',
    '/u7965223339_Tech_bro_cartoon_overly_fermented_fish_with_prote_5095e4b5-b28a-4cd9-a444-67b9705eb9ef_2.png',
  ];
  
  for (const asset of assets) {
    try {
      const response = await axios.head(`${BASE_URL}${asset}`, {
        validateStatus: () => true,
      });
      
      if (response.status === 200) {
        log(`✅ Asset ${asset}: Available`, 'success');
      } else {
        log(`❌ Asset ${asset}: Status ${response.status}`, 'error');
      }
    } catch (error) {
      log(`❌ Asset ${asset}: Failed to load`, 'error');
    }
  }
}

async function generateTestReport() {
  logSection('Test Summary Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    baseUrl: BASE_URL,
    issues: [] as string[],
    recommendations: [] as string[],
  };

  // Check for common issues
  if (!process.env.ANTHROPIC_API_KEY) {
    report.issues.push('ANTHROPIC_API_KEY is not set');
    report.recommendations.push('Add ANTHROPIC_API_KEY to .env.local file');
  }

  if (!process.env.DAYTONA_API_KEY) {
    report.issues.push('DAYTONA_API_KEY is not set');
    report.recommendations.push('Add DAYTONA_API_KEY to .env.local file');
  }

  // Check if backend is running
  try {
    await axios.get('http://localhost:5000/api/health', { timeout: 1000 });
  } catch {
    report.issues.push('Backend API is not running');
    report.recommendations.push('Start the backend server on port 5000 for full functionality');
  }

  // Save report
  const reportPath = path.join(process.cwd(), 'debug-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`\n📊 Debug report saved to: ${reportPath}`, 'info');
  
  if (report.issues.length > 0) {
    log('\n⚠️  Issues Found:', 'warning');
    report.issues.forEach(issue => console.log(`   - ${issue}`));
    
    log('\n💡 Recommendations:', 'info');
    report.recommendations.forEach(rec => console.log(`   - ${rec}`));
  } else {
    log('\n✅ No critical issues found!', 'success');
  }
}

// Main execution
async function main() {
  console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════╗
║     Prahok.dev Application Debugger      ║
╚══════════════════════════════════════════╝
${colors.reset}`);

  try {
    // Run all tests
    await checkEnvironmentVariables();
    await testPages();
    await checkStaticAssets();
    await testAPIEndpoints();
    await testAuthFlow();
    await generateTestReport();
    
    log('\n✨ Debug session completed', 'success');
  } catch (error: any) {
    log(`\n❌ Debug session failed: ${error.message}`, 'error');
  }
}

// Run the debugger
main().catch(console.error);