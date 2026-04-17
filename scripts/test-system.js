#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== Spark\'it System Test ===\n');

// Test 1: Verify project structure
console.log('1. Checking project structure...');
const requiredFiles = [
  'server.js',
  'package.json',
  'index.html',
  'login.html',
  'database/schema.sql',
  'scripts/init-database.js',
  'scripts/generate-password-hash.js',
  '.gitignore',
  '.env.example',
  'README.md',
  'DEPLOYMENT.md'
];

const requiredDirs = [
  'database',
  'scripts',
  'uploads'
];

let structureTest = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.log(`  ERROR: Missing file: ${file}`);
    structureTest = false;
  } else {
    console.log(`  OK: ${file}`);
  }
});

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`  ERROR: Missing directory: ${dir}`);
    structureTest = false;
  } else {
    console.log(`  OK: ${dir}/`);
  }
});

if (structureTest) {
  console.log('  Project structure: PASSED\n');
} else {
  console.log('  Project structure: FAILED\n');
}

// Test 2: Verify package.json
console.log('2. Checking package.json...');
try {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredScripts = ['start', 'dev', 'init-db', 'setup'];
  const requiredDeps = ['express', 'multer', 'sqlite3', 'sharp', 'cors', 'express-session', 'bcrypt'];
  
  let packageTest = true;
  
  requiredScripts.forEach(script => {
    if (!packageJson.scripts[script]) {
      console.log(`  ERROR: Missing script: ${script}`);
      packageTest = false;
    } else {
      console.log(`  OK: Script "${script}" found`);
    }
  });
  
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep]) {
      console.log(`  ERROR: Missing dependency: ${dep}`);
      packageTest = false;
    } else {
      console.log(`  OK: Dependency "${dep}" found`);
    }
  });
  
  if (packageTest) {
    console.log('  Package.json: PASSED\n');
  } else {
    console.log('  Package.json: FAILED\n');
  }
} catch (error) {
  console.log(`  ERROR: Cannot read package.json: ${error.message}\n`);
}

// Test 3: Verify database schema
console.log('3. Checking database schema...');
try {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  const requiredTables = ['images', 'image_tags'];
  const requiredColumns = {
    images: ['id', 'filename', 'original_filename', 'file_path', 'file_size', 'mime_type', 'uploaded_at', 'upload_token', 'checksum'],
    image_tags: ['id', 'image_id', 'tag', 'created_at']
  };
  
  let schemaTest = true;
  
  requiredTables.forEach(table => {
    if (!schema.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
      console.log(`  ERROR: Missing table: ${table}`);
      schemaTest = false;
    } else {
      console.log(`  OK: Table "${table}" found`);
    }
  });
  
  Object.entries(requiredColumns).forEach(([table, columns]) => {
    columns.forEach(column => {
      if (!schema.includes(column)) {
        console.log(`  ERROR: Missing column "${column}" in table "${table}"`);
        schemaTest = false;
      } else {
        console.log(`  OK: Column "${column}" in table "${table}" found`);
      }
    });
  });
  
  if (schemaTest) {
    console.log('  Database schema: PASSED\n');
  } else {
    console.log('  Database schema: FAILED\n');
  }
} catch (error) {
  console.log(`  ERROR: Cannot read schema.sql: ${error.message}\n`);
}

// Test 4: Verify HTML files
console.log('4. Checking HTML files...');
try {
  const indexPath = path.join(__dirname, '..', 'index.html');
  const loginPath = path.join(__dirname, '..', 'login.html');
  
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const loginContent = fs.readFileSync(loginPath, 'utf8');
  
  let htmlTest = true;
  
  // Check index.html
  if (!indexContent.includes('Spark\'it')) {
    console.log('  ERROR: index.html missing Spark\'it branding');
    htmlTest = false;
  } else {
    console.log('  OK: index.html contains Spark\'it branding');
  }
  
  if (!indexContent.includes('checkAuthStatus')) {
    console.log('  ERROR: index.html missing authentication check');
    htmlTest = false;
  } else {
    console.log('  OK: index.html contains authentication check');
  }
  
  // Check login.html
  if (!loginContent.includes('password')) {
    console.log('  ERROR: login.html missing password field');
    htmlTest = false;
  } else {
    console.log('  OK: login.html contains password field');
  }
  
  if (!loginContent.includes('/api/login')) {
    console.log('  ERROR: login.html missing login API call');
    htmlTest = false;
  } else {
    console.log('  OK: login.html contains login API call');
  }
  
  if (htmlTest) {
    console.log('  HTML files: PASSED\n');
  } else {
    console.log('  HTML files: FAILED\n');
  }
} catch (error) {
  console.log(`  ERROR: Cannot read HTML files: ${error.message}\n`);
}

// Test 5: Verify server.js configuration
console.log('5. Checking server.js configuration...');
try {
  const serverPath = path.join(__dirname, '..', 'server.js');
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  const requiredImports = ['express', 'multer', 'sqlite3', 'bcrypt', 'express-session'];
  const requiredRoutes = ['/login', '/api/login', '/api/logout', '/api/auth-status', '/api/upload', '/api/images'];
  const passwordHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  
  let serverTest = true;
  
  requiredImports.forEach(imp => {
    if (!serverContent.includes(`require('${imp}')`)) {
      console.log(`  ERROR: Missing import: ${imp}`);
      serverTest = false;
    } else {
      console.log(`  OK: Import "${imp}" found`);
    }
  });
  
  requiredRoutes.forEach(route => {
    if (!serverContent.includes(route)) {
      console.log(`  ERROR: Missing route: ${route}`);
      serverTest = false;
    } else {
      console.log(`  OK: Route "${route}" found`);
    }
  });
  
  if (!serverContent.includes(passwordHash)) {
    console.log('  ERROR: Missing password hash');
    serverTest = false;
  } else {
    console.log('  OK: Password hash found');
  }
  
  if (serverTest) {
    console.log('  Server configuration: PASSED\n');
  } else {
    console.log('  Server configuration: FAILED\n');
  }
} catch (error) {
  console.log(`  ERROR: Cannot read server.js: ${error.message}\n`);
}

// Test 6: Verify .gitignore
console.log('6. Checking .gitignore...');
try {
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  
  const requiredIgnores = ['node_modules/', 'uploads/', 'database/images.db', '.env'];
  
  let gitignoreTest = true;
  
  requiredIgnores.forEach(ignore => {
    if (!gitignoreContent.includes(ignore)) {
      console.log(`  ERROR: Missing .gitignore entry: ${ignore}`);
      gitignoreTest = false;
    } else {
      console.log(`  OK: .gitignore entry "${ignore}" found`);
    }
  });
  
  if (gitignoreTest) {
    console.log('  .gitignore: PASSED\n');
  } else {
    console.log('  .gitignore: FAILED\n');
  }
} catch (error) {
  console.log(`  ERROR: Cannot read .gitignore: ${error.message}\n`);
}

console.log('=== Test Complete ===');
console.log('\nTo deploy to GitHub:');
console.log('1. git add .');
console.log('2. git commit -m "Initial deployment"');
console.log('3. git push origin main');
console.log('\nAfter deployment:');
console.log('1. Clone the repository');
console.log('2. Run: npm run setup');
console.log('3. Run: npm start');
console.log('4. Visit: http://localhost:3000');
console.log('5. Login with: 20Vinc08:)');
