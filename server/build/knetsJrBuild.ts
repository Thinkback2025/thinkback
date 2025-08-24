/**
 * Knets Jr Independent Build System
 * Ensures Knets Jr can be built and deployed independently of main Knets app
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class KnetsJrBuilder {
  private readonly distPath: string;
  private readonly publicPath: string;

  constructor() {
    this.distPath = path.join(__dirname, '../../dist/knets-jr');
    this.publicPath = path.join(__dirname, '../public');
  }

  // Build Knets Jr independently
  async buildKnetsJr(): Promise<void> {
    console.log('🔨 Building Knets Jr independently...');

    try {
      // Ensure dist directory exists
      if (!fs.existsSync(this.distPath)) {
        fs.mkdirSync(this.distPath, { recursive: true });
      }

      // Copy Knets Jr files to independent dist folder
      const knetsJrFiles = [
        'knets-jr-pwa.html',
        'knets-jr-fresh.html',
        'cache-bust-knets-jr.html',
        'manifest.json',
        'service-worker.js',
        'knets-jr-health.json'
      ];

      for (const file of knetsJrFiles) {
        const sourcePath = path.join(this.publicPath, file);
        const destPath = path.join(this.distPath, file);
        
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`✅ Copied ${file} to independent build`);
        }
      }

      // Copy Knets Jr icons
      const iconFiles = fs.readdirSync(this.publicPath)
        .filter(file => file.includes('knets-jr') && file.endsWith('.png'));
      
      for (const iconFile of iconFiles) {
        const sourcePath = path.join(this.publicPath, iconFile);
        const destPath = path.join(this.distPath, iconFile);
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied ${iconFile} to independent build`);
      }

      // Generate build manifest
      const buildManifest = {
        app: 'knets-jr',
        version: '1.0.0',
        buildTime: new Date().toISOString(),
        independence: true,
        files: knetsJrFiles.concat(iconFiles),
        routes: [
          '/knets-jr',
          '/knets-jr-fresh',
          '/knets-jr-emergency',
          '/knets-jr/health'
        ]
      };

      fs.writeFileSync(
        path.join(this.distPath, 'build-manifest.json'),
        JSON.stringify(buildManifest, null, 2)
      );

      console.log('✅ Knets Jr built independently - ready for separate deployment');

    } catch (error) {
      console.error('❌ Knets Jr build failed:', error);
      throw error;
    }
  }

  // Verify independence
  verifyIndependence(): boolean {
    console.log('🔍 Verifying Knets Jr independence...');

    const checks = [
      { name: 'Separate dist folder', check: () => fs.existsSync(this.distPath) },
      { name: 'Build manifest exists', check: () => fs.existsSync(path.join(this.distPath, 'build-manifest.json')) },
      { name: 'Health endpoint ready', check: () => fs.existsSync(path.join(this.distPath, 'knets-jr-health.json')) },
      { name: 'PWA files present', check: () => fs.existsSync(path.join(this.distPath, 'knets-jr-pwa.html')) }
    ];

    let allPassed = true;
    for (const check of checks) {
      const passed = check.check();
      console.log(`${passed ? '✅' : '❌'} ${check.name}`);
      if (!passed) allPassed = false;
    }

    return allPassed;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const builder = new KnetsJrBuilder();
  
  builder.buildKnetsJr()
    .then(() => {
      const isIndependent = builder.verifyIndependence();
      console.log(isIndependent ? '🎉 Knets Jr is fully independent!' : '⚠️ Independence verification failed');
      process.exit(isIndependent ? 0 : 1);
    })
    .catch((error) => {
      console.error('Build failed:', error);
      process.exit(1);
    });
}