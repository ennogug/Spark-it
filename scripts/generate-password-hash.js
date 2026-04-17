#!/usr/bin/env node

const bcrypt = require('bcrypt');

const password = '20Vinc08:)';

console.log('Generating password hash for:', password);

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  
  console.log('\nPassword hash:');
  console.log(hash);
  console.log('\nCopy this hash to server.js PASSWORD_HASH variable');
  
  // Test the hash
  bcrypt.compare(password, hash, (err, result) => {
    if (err) {
      console.error('Error testing hash:', err);
      process.exit(1);
    }
    
    console.log('\nHash verification:', result ? 'SUCCESS' : 'FAILED');
  });
});
