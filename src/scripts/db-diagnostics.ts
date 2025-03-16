// File: scripts/db-diagnostics.ts
import { Pool } from 'pg';
import * as dns from 'dns';
import * as net from 'net';
import * as http from 'http';
import * as https from 'https';
import * as url from 'url';

// Run this script with: 
// ts-node scripts/db-diagnostics.ts

async function testDbConnection() {
  // Get the database URL from environment
  const dbUrl = process.env.XATA_DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ No XATA_DATABASE_URL found in environment variables');
    return;
  }

  // Parse the connection string
  try {
    console.log('🔍 Analyzing database connection string...');
    
    // Hide credentials in logs
    const parsedUrl = new URL(dbUrl);
    const host = parsedUrl.hostname;
    const port = parsedUrl.port || '5432';
    const database = parsedUrl.pathname.slice(1); // Remove leading slash
    
    console.log(`📊 Connection Details:
  • Host: ${host}
  • Port: ${port}
  • Database: ${database}
  • SSL Required: ${parsedUrl.searchParams.has('sslmode')}
    `);

    // 1. DNS Resolution Test
    console.log(`\n🔍 Testing DNS resolution for ${host}...`);
    try {
      const addresses = await dns.promises.lookup(host, { all: true });
      console.log(`✅ DNS resolution successful: ${addresses.map(a => a.address).join(', ')}`);
    } catch (err:unknown) {
      console.error(`❌ DNS resolution failed: ${err instanceof Error?err.message:String(err)}`);
      console.log('   This indicates the hostname cannot be found.');
      console.log('   Verify the hostname is correct and your DNS is working properly.');
    }

    // 2. Port Connection Test
    console.log(`\n🔍 Testing TCP connection to ${host}:${port}...`);
    const socket = new net.Socket();
    
    const portTest = new Promise<void>((resolve, reject) => {
      // Set a timeout for the connection attempt
      socket.setTimeout(10000);
      
      socket.on('connect', () => {
        console.log(`✅ TCP connection successful to ${host}:${port}`);
        socket.end();
        resolve();
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error(`Connection timed out after 10 seconds`));
      });
      
      socket.on('error', (err) => {
        reject(err);
      });
      
      socket.connect(parseInt(port), host);
    });
    
    try {
      await portTest;
    } catch (err:unknown) {
      console.error(`❌ TCP connection failed: ${err instanceof Error?err.message:String(err)}`);
      console.log('   This indicates a network connectivity issue or firewall blocking the connection.');
      console.log('   Check your network/firewall settings and verify the database server is running.');
    }

    // 3. Database Connection Test with minimal options
    console.log('\n🔍 Testing PostgreSQL connection with minimal options...');
    
    // Minimal connection options to isolate issues
    const minimalConfig = {
      connectionString: dbUrl,
      connectionTimeoutMillis: 15000, // 15 seconds timeout
      ssl: parsedUrl.searchParams.has('sslmode') ? {
        rejectUnauthorized: parsedUrl.searchParams.get('sslmode') !== 'require'
      } : undefined
    };
    
    const minimalPool = new Pool(minimalConfig);
    
    try {
      const client = await minimalPool.connect();
      console.log('✅ PostgreSQL connection successful!');
      
      // Test a simple query
      const result = await client.query('SELECT version()');
      console.log(`   Server version: ${result.rows[0].version}`);
      
      client.release();
    } catch (err:unknown) {
      console.error(`❌ PostgreSQL connection failed: ${err instanceof Error?err.message:String(err)}`);
      console.log('   Check database credentials, SSL settings, and database server status.');
    } finally {
      await minimalPool.end();
    }

    // 4. If Xata Connection - Test REST API endpoint
    if (host.includes('xata.io') || host.includes('xata.com')) {
      console.log('\n🔍 Testing Xata API accessibility...');
      
      // Try to access Xata status endpoint
      const apiTest = new Promise<void>((resolve, reject) => {
        https.get('https://status.xata.io/api/v2/status.json', (res) => {
          if (res.statusCode === 200) {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
              try {
                const status = JSON.parse(data);
                console.log(`✅ Xata API accessible. Status: ${status.status.description}`);
                resolve();
              } catch (e) {
                reject(new Error('Failed to parse Xata status response'));
              }
            });
          } else {
            reject(new Error(`Xata API returned status code ${res.statusCode}`));
          }
        }).on('error', (err) => {
          reject(err);
        });
      });
      
      try {
        await apiTest;
      } catch (err:unknown) {
        console.error(`❌ Xata API test failed: ${err instanceof Error?err.message:String(err)}`);
        console.log('   This might indicate general connectivity issues with Xata services.');
      }
    }

  } catch (err:unknown) {
    console.error(`❌ Failed to parse connection string: ${err instanceof Error?err.message:String(err)}`);
    console.log('   Verify your XATA_DATABASE_URL is correctly formatted.');
  }
}

// Run the tests
testDbConnection()
  .then(() => {
    console.log('\n🔄 Diagnostics completed');
  })
  .catch((err) => {
    console.error('\n❌ Diagnostic process failed:', err);
  })
  .finally(() => process.exit());