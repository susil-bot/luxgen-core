/**
 * LUXGEN BACKEND STARTUP WITH COMPREHENSIVE HEALTH CHECK
 * Runs health check before starting the backend server
 */

const SimpleHealthChecker = require('./simpleHealthCheck');
const { spawn } = require('child_process');
const path = require('path');

class BackendStarter {
  constructor() {
    this.healthChecker = new SimpleHealthChecker();
    this.serverProcess = null;
  }

  async start() {
    console.log('🚀 LUXGEN BACKEND STARTUP WITH HEALTH CHECK');
    console.log('==========================================');
    
    try {
      // Step 1: Run essential health check
      console.log('\n🏥 Running essential health check...');
      const healthResults = await this.healthChecker.runEssentialChecks();
      
      // Step 2: Check if health check passed
      if (healthResults.overall === 'failed') {
        console.log('\n❌ Health check failed - Backend startup aborted');
        console.log('Please fix the issues above before starting the backend');
        process.exit(1);
      }
      
      // Step 3: Start the backend server
      console.log('\n🚀 Starting backend server...');
      await this.startBackendServer();
      
    } catch (error) {
      console.error('💥 Startup failed:', error);
      process.exit(1);
    }
  }

  async startBackendServer() {
    return new Promise((resolve, reject) => {
      const serverPath = path.join(__dirname, '..', 'index.js');
      
      console.log(`📡 Starting server: node ${serverPath}`);
      
      this.serverProcess = spawn('node', [serverPath], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..', '..')
      });
      
      this.serverProcess.on('error', (error) => {
        console.error('❌ Failed to start server:', error);
        reject(error);
      });
      
      this.serverProcess.on('exit', (code, signal) => {
        if (code !== 0) {
          console.error(`❌ Server exited with code ${code} and signal ${signal}`);
          reject(new Error(`Server exited with code ${code}`));
        } else {
          console.log('✅ Server stopped gracefully');
          resolve();
        }
      });
      
      // Handle process termination
      process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        this.stopServer();
      });
      
      process.on('SIGTERM', () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        this.stopServer();
      });
      
      // Give server a moment to start
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          console.log('✅ Backend server started successfully');
          console.log('🌐 Server is running and ready to accept requests');
          resolve();
        }
      }, 2000);
    });
  }

  stopServer() {
    if (this.serverProcess && !this.serverProcess.killed) {
      console.log('🛑 Stopping server...');
      this.serverProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds if graceful shutdown fails
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          console.log('💀 Force killing server...');
          this.serverProcess.kill('SIGKILL');
        }
      }, 5000);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const starter = new BackendStarter();
  starter.start()
    .then(() => {
      console.log('🎉 Backend startup completed successfully');
    })
    .catch(error => {
      console.error('💥 Backend startup failed:', error);
      process.exit(1);
    });
}

module.exports = BackendStarter;
