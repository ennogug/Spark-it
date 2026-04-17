#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'images.db');
const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

console.log('Initializing Spark\'it database...');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Created database directory: ${dbDir}`);
}

// Create database connection
const db = new sqlite3.Database(dbPath);

// Read and execute schema
const schema = fs.readFileSync(schemaPath, 'utf8');
const statements = schema.split(';').filter(stmt => stmt.trim());

console.log(`Executing ${statements.length} SQL statements...`);

let completed = 0;
db.serialize(() => {
  statements.forEach((statement, index) => {
    db.run(statement.trim(), (err) => {
      if (err) {
        console.error(`Error executing statement ${index + 1}:`, err);
        process.exit(1);
      } else {
        completed++;
        console.log(`Statement ${completed}/${statements.length} completed`);
        
        if (completed === statements.length) {
          console.log('Database initialization completed successfully!');
          console.log(`Database file: ${dbPath}`);
          db.close();
        }
      }
    });
  });
});
