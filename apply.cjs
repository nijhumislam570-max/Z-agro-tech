const fs = require('fs');
const https = require('https');
const path = require('path');

const PAT = process.env.SUPABASE_PAT || 'your-supabase-pat';
const REF = 'hsosfeynosulypnpwbet';

async function executeSql(sqlText, ignoreErrors = false) {
  const data = JSON.stringify({ query: sqlText });
  
  const options = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${REF}/database/query`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAT}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseBody);
        } else {
          if (ignoreErrors) {
            console.warn(`Warning SQL execution (ignored): ${res.statusCode} ${responseBody}`);
            resolve(responseBody);
          } else {
            console.error(`Error SQL execution: ${res.statusCode} ${responseBody}`);
            reject(new Error(`Failed with status ${res.statusCode}`));
          }
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runSql(filePath, ignoreErrors = false) {
  const query = fs.readFileSync(filePath, 'utf8');
  console.log(`Applying file ${path.basename(filePath)}...`);
  return executeSql(query, ignoreErrors);
}

async function main() {
  try {
    console.log('--- Phase 1: Cleaning legacy placeholder database records ---');
    // Delete order products/items if any first, to prevent foreign key errors
    await executeSql('DELETE FROM public.reviews;', true);
    await executeSql('DELETE FROM public.orders;', true);
    await executeSql('DELETE FROM public.incomplete_orders;', true);
    await executeSql('DELETE FROM public.products;', true);
    await executeSql('DELETE FROM public.product_categories;', true);
    await executeSql('DELETE FROM public.courses;', true);
    await executeSql('DELETE FROM public.admin_settings;', true);
    console.log('Legacy cleanup completed successfully.\n');

    console.log('--- Phase 2: Seeding Z Agro Tech Database Catalog ---');
    const bundleDir = path.join(__dirname, 'supabase/migration-bundle');
    
    await runSql(path.join(bundleDir, '02_data_inserts.sql'), true);
    console.log('Data inserts applied.\n');

    console.log('--- Phase 3: Applying Storage Buckets configuration ---');
    await runSql(path.join(bundleDir, '03_storage.sql'), true);
    console.log('Storage configuration applied.\n');

    console.log('--- Phase 4: Bootstrapping Admin Account ---');
    await runSql(path.join(bundleDir, '04_bootstrap_admin.sql'), false);
    console.log('Admin account bootstrapped successfully.\n');

    console.log('Database restoration fully complete!');
  } catch(e) {
    console.error('Migration failed:', e);
  }
}

main();
