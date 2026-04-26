const fs = require('fs');
const https = require('https');
const path = require('path');

const PAT = 'sbp_4d71848bc7eefbfa93f51c9e980d3dd8b767ea66';
const REF = 'vbrpgfbhqrxdgjtqqynb';

async function runSql(filePath, ignoreErrors = false) {
  const query = fs.readFileSync(filePath, 'utf8');
  console.log(`Applying ${path.basename(filePath)}...`);
  
  const data = JSON.stringify({ query });
  
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
          console.log(`Success ${path.basename(filePath)}`);
          resolve(responseBody);
        } else {
          if (ignoreErrors) {
            console.warn(`Warning ${path.basename(filePath)} (ignored): ${res.statusCode} ${responseBody}`);
            resolve(responseBody);
          } else {
            console.error(`Error ${path.basename(filePath)}: ${res.statusCode} ${responseBody}`);
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

async function main() {
  try {
    const bundleDir = path.join(__dirname, 'supabase/migration-bundle');
    
    await runSql(path.join(bundleDir, '02_data_inserts.sql'), true);
    await runSql(path.join(bundleDir, '03_storage.sql'));
    await runSql(path.join(bundleDir, '04_bootstrap_admin.sql'));
  } catch(e) {
    console.error(e);
  }
}

main();
