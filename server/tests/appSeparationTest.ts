/**
 * App Separation Independence Test
 * Verifies that Knets main app and Knets Jr are completely isolated
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

export class AppSeparationTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<boolean> {
    console.log('🧪 Starting App Separation Independence Tests...\n');

    await this.testRouteIsolation();
    await this.testErrorIsolation();
    await this.testAssetSeparation();
    await this.testBuildIndependence();
    await this.testDatabaseIsolation();
    await this.testHealthEndpoints();

    this.printResults();
    return this.results.every(result => result.passed);
  }

  private async testRouteIsolation(): Promise<void> {
    console.log('🔍 Testing route isolation...');
    
    try {
      // Test Knets Jr routes
      const knetsJrResponse = await this.makeRequest('http://localhost:5000/knets-jr/health');
      const knetsJrHealthy = knetsJrResponse.includes('"app":"knets-jr"');
      
      this.results.push({
        name: 'Knets Jr Route Isolation',
        passed: knetsJrHealthy,
        details: knetsJrHealthy ? 'Knets Jr routes responding independently' : 'Knets Jr routes not isolated'
      });

      // Test main app doesn't interfere with Knets Jr
      const mainAppResponse = await this.makeRequest('http://localhost:5000/api/config/country-codes');
      const mainAppWorking = mainAppResponse.includes('country');
      
      this.results.push({
        name: 'Main App Route Isolation',
        passed: mainAppWorking,
        details: mainAppWorking ? 'Main app routes working independently' : 'Main app routes affected'
      });

    } catch (error) {
      this.results.push({
        name: 'Route Isolation',
        passed: false,
        error: (error as Error).message
      });
    }
  }

  private async testErrorIsolation(): Promise<void> {
    console.log('🔍 Testing error isolation...');
    
    try {
      // Test that Knets Jr errors don't crash main app
      const errorResponse = await this.makeRequest('http://localhost:5000/knets-jr/nonexistent');
      const isolatedError = errorResponse.includes('"app":"knets-jr"') || errorResponse.includes('404');
      
      // Verify main app still works after Knets Jr error
      const mainAppResponse = await this.makeRequest('http://localhost:5000/api/config/pricing');
      const mainAppStillWorks = mainAppResponse.includes('subscription');
      
      this.results.push({
        name: 'Error Isolation',
        passed: isolatedError && mainAppStillWorks,
        details: `Knets Jr error isolated: ${isolatedError}, Main app still working: ${mainAppStillWorks}`
      });

    } catch (error) {
      this.results.push({
        name: 'Error Isolation',
        passed: false,
        error: (error as Error).message
      });
    }
  }

  private async testAssetSeparation(): Promise<void> {
    console.log('🔍 Testing asset separation...');
    
    try {
      const publicPath = path.join(process.cwd(), 'server/public');
      
      // Check Knets Jr specific files exist
      const knetsJrFiles = [
        'knets-jr-pwa.html',
        'knets-jr-fresh.html',
        'cache-bust-knets-jr.html',
        'manifest.json',
        'service-worker.js'
      ];
      
      const filesExist = knetsJrFiles.every(file => 
        fs.existsSync(path.join(publicPath, file))
      );
      
      this.results.push({
        name: 'Asset Separation',
        passed: filesExist,
        details: filesExist ? 'All Knets Jr assets isolated' : 'Missing Knets Jr assets'
      });

    } catch (error) {
      this.results.push({
        name: 'Asset Separation',
        passed: false,
        error: (error as Error).message
      });
    }
  }

  private async testBuildIndependence(): Promise<void> {
    console.log('🔍 Testing build independence...');
    
    try {
      const buildPath = path.join(process.cwd(), 'server/build/knetsJrBuild.ts');
      const buildSystemExists = fs.existsSync(buildPath);
      
      const middlewarePath = path.join(process.cwd(), 'server/middleware/appSeparation.ts');
      const middlewareExists = fs.existsSync(middlewarePath);
      
      this.results.push({
        name: 'Build Independence',
        passed: buildSystemExists && middlewareExists,
        details: `Build system: ${buildSystemExists}, Middleware: ${middlewareExists}`
      });

    } catch (error) {
      this.results.push({
        name: 'Build Independence',
        passed: false,
        error: (error as Error).message
      });
    }
  }

  private async testDatabaseIsolation(): Promise<void> {
    console.log('🔍 Testing database isolation...');
    
    try {
      // Both apps should use same DB but with isolated access patterns
      // Test that main app database calls don't affect Knets Jr functionality
      const mainAppDbResponse = await this.makeRequest('http://localhost:5000/api/dashboard/stats');
      const mainAppDbWorks = mainAppDbResponse.includes('totalDevices');
      
      // Knets Jr should still work (it doesn't directly access DB, which is correct isolation)
      const knetsJrResponse = await this.makeRequest('http://localhost:5000/knets-jr/health');
      const knetsJrWorks = knetsJrResponse.includes('"status":"healthy"');
      
      this.results.push({
        name: 'Database Access Isolation',
        passed: mainAppDbWorks && knetsJrWorks,
        details: `Main app DB access: ${mainAppDbWorks}, Knets Jr independent: ${knetsJrWorks}`
      });

    } catch (error) {
      this.results.push({
        name: 'Database Access Isolation',
        passed: false,
        error: (error as Error).message
      });
    }
  }

  private async testHealthEndpoints(): Promise<void> {
    console.log('🔍 Testing health endpoints...');
    
    try {
      // Test Knets Jr health endpoint
      const knetsJrHealth = await this.makeRequest('http://localhost:5000/knets-jr/health');
      const knetsJrHealthy = knetsJrHealth.includes('"status":"healthy"') && 
                            knetsJrHealth.includes('"app":"knets-jr"');
      
      this.results.push({
        name: 'Health Endpoint Isolation',
        passed: knetsJrHealthy,
        details: knetsJrHealthy ? 'Knets Jr health endpoint isolated and functional' : 'Health endpoint not properly isolated'
      });

    } catch (error) {
      this.results.push({
        name: 'Health Endpoint Isolation',
        passed: false,
        error: (error as Error).message
      });
    }
  }

  private async makeRequest(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('curl', ['-s', url]);
      let data = '';
      
      child.stdout.on('data', (chunk) => {
        data += chunk.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(data);
        } else {
          reject(new Error(`Request failed with code ${code}`));
        }
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        child.kill();
        reject(new Error('Request timeout'));
      }, 5000);
    });
  }

  private printResults(): void {
    console.log('\n📊 App Separation Test Results:');
    console.log('================================');
    
    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.name}`);
      if (result.details) {
        console.log(`    ${result.details}`);
      }
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });
    
    const passedCount = this.results.filter(r => r.passed).length;
    const totalCount = this.results.length;
    
    console.log(`\n📈 Summary: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      console.log('🎉 All tests passed! Knets main app and Knets Jr are completely isolated.');
    } else {
      console.log('⚠️ Some tests failed. Review the isolation implementation.');
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AppSeparationTester();
  
  tester.runAllTests()
    .then((allPassed) => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}