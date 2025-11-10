#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { platform } from 'os';
import { existsSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DB_NAME = 'space-blitz';
const MONGODB_URI = process.env.MONGODB_URI || `mongodb://localhost:27017/${DB_NAME}`;

console.log('🚀 Setting up MongoDB for Space Blitz...\n');

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function checkMongoDB() {
  console.log('🔍 Checking MongoDB installation...');
  try {
    execSync('mongod --version', { stdio: 'pipe' });
    console.log('✅ MongoDB is installed\n');
    return true;
  } catch (error) {
    console.log('❌ MongoDB is not installed\n');
    return false;
  }
}

async function installMongoDB() {
  const os = platform();
  console.log(`📦 Installing MongoDB for ${os}...\n`);

  if (os === 'win32') {
    console.log('Please install MongoDB Community Server manually:');
    console.log('1. Download from: https://www.mongodb.com/try/download/community');
    console.log('2. Run the MSI installer');
    console.log('3. Follow the installation wizard');
    console.log('4. Start MongoDB service from Services panel or command line\n');

    console.log('After installation, run this setup script again.');
    process.exit(1);
  } else if (os === 'darwin') {
    // macOS installation
    try {
      console.log('Installing MongoDB via Homebrew...');
      await runCommand('brew', ['tap', 'mongodb/brew']);
      await runCommand('brew', ['install', 'mongodb-community']);
      console.log('✅ MongoDB installed successfully\n');
    } catch (error) {
      console.log('❌ Failed to install MongoDB. Please install manually.');
      console.log('Visit: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/\n');
      throw error;
    }
  } else if (os === 'linux') {
    // Linux installation (Ubuntu/Debian)
    try {
      console.log('Installing MongoDB for Ubuntu/Debian...');
      await runCommand('sudo', ['apt-get', 'update']);
      await runCommand('sudo', ['apt-get', 'install', '-y', 'gnupg', 'curl']);
      await runCommand('curl', ['-fsSL', 'https://www.mongodb.org/static/pgp/server-7.0.asc', '|', 'sudo', 'gpg', '-o', '/usr/share/keyrings/mongodb-server-7.0.gpg', '--dearmor']);
      await runCommand('echo', ['"deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse"', '|', 'sudo', 'tee', '/etc/apt/sources.list.d/mongodb-org-7.0.list']);
      await runCommand('sudo', ['apt-get', 'update']);
      await runCommand('sudo', ['apt-get', 'install', '-y', 'mongodb-org']);
      console.log('✅ MongoDB installed successfully\n');
    } catch (error) {
      console.log('❌ Failed to install MongoDB. Please install manually.');
      console.log('Visit: https://docs.mongodb.com/manual/administration/install-on-linux/\n');
      throw error;
    }
  }
}

async function startMongoDB() {
  const os = platform();
  console.log('▶️  Starting MongoDB service...\n');

  try {
    if (os === 'win32') {
      // Windows - try to start service
      try {
        await runCommand('net', ['start', 'MongoDB']);
      } catch (error) {
        console.log('Could not start MongoDB service. Trying to start mongod directly...');
        // Try starting mongod directly (will run in foreground)
        console.log('MongoDB will run in foreground. Press Ctrl+C to stop.');
        await runCommand('mongod', ['--dbpath', 'C:\\data\\db'], { detached: true });
      }
    } else {
      // Linux/macOS
      await runCommand('sudo', ['systemctl', 'start', 'mongod']);
    }
    console.log('✅ MongoDB service started\n');
  } catch (error) {
    console.log('⚠️  Could not start MongoDB service automatically.');
    console.log('Please start MongoDB manually and run this setup again.\n');
    throw error;
  }
}

async function waitForMongoDB() {
  console.log('⏳ Waiting for MongoDB to be ready...');
  const maxAttempts = 30;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      execSync(`mongosh --eval "db.runCommand('ping')" --quiet`, { stdio: 'pipe' });
      console.log('✅ MongoDB is ready\n');
      return;
    } catch (error) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('MongoDB did not start within expected time');
}

async function createDatabase() {
  console.log('🗄️  Creating database and collections...\n');

  try {
    // Create database by connecting and running a command
    execSync(`mongosh "${MONGODB_URI}" --eval "db.runCommand('ping')" --quiet`, { stdio: 'pipe' });
    console.log(`✅ Database '${DB_NAME}' is ready\n`);
  } catch (error) {
    console.log('⚠️  Could not verify database connection, but continuing...\n');
  }
}

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');
  try {
    execSync('npm run migrate', { stdio: 'inherit' });
    console.log('✅ Migrations completed\n');
  } catch (error) {
    console.log('❌ Migration failed:', error.message);
    throw error;
  }
}

async function runSeed() {
  console.log('🌱 Seeding database...\n');
  try {
    execSync('npm run seed', { stdio: 'inherit' });
    console.log('✅ Database seeded successfully\n');
  } catch (error) {
    console.log('⚠️  Seeding failed (this is normal if MongoDB is not running):', error.message);
    console.log('You can run seeding manually later with: npm run seed\n');
  }
}

async function main() {
  try {
    const mongoInstalled = await checkMongoDB();

    if (!mongoInstalled) {
      await installMongoDB();
    }

    await startMongoDB();
    await waitForMongoDB();
    await createDatabase();
    await runMigrations();
    await runSeed();

    console.log('🎉 Setup completed successfully!');
    console.log('\nTo start the server:');
    console.log('  npm run dev    # Development mode');
    console.log('  npm run build && npm start  # Production mode');
    console.log('\nMongoDB URI:', MONGODB_URI);

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure MongoDB is installed and running');
    console.log('2. Check that port 27017 is not blocked by firewall');
    console.log('3. Try running individual commands manually');
    process.exit(1);
  }
}

main();