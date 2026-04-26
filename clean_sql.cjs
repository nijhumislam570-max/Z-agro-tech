const fs = require('fs');
const content = fs.readFileSync('supabase/migration-bundle/02_data_inserts.sql', 'utf8');
const cleaned = content.split('\n').filter(line => !line.trim().startsWith('\\')).join('\n');
fs.writeFileSync('supabase/migration-bundle/02_data_inserts.sql', cleaned);
console.log('Cleaned 02_data_inserts.sql');
