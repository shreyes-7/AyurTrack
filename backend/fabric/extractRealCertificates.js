'use strict';

const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        console.log('🔧 Creating wallet identities from test network certificates...');
        
        // Create wallet directory
        const walletPath = path.join(__dirname, 'wallet');
        if (!fs.existsSync(walletPath)) {
            fs.mkdirSync(walletPath, { recursive: true });
            console.log(`📁 Created wallet directory: ${walletPath}`);
        }
        
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Correct path to your test network certificates
        const org1AdminPath = path.resolve(
            __dirname, '..', '..', 'fabric', 'fabric-samples', 'test-network', 
            'organizations', 'peerOrganizations', 'org1.example.com', 'users', 
            'Admin@org1.example.com', 'msp'
        );

        const certPath = path.join(org1AdminPath, 'signcerts', 'cert.pem');
        const keyDir = path.join(org1AdminPath, 'keystore');

        console.log(`🔍 Looking for certificate: ${certPath}`);
        console.log(`🔍 Looking for keys in: ${keyDir}`);

        // Verify certificate file exists
        if (!fs.existsSync(certPath)) {
            throw new Error(`❌ Certificate file not found: ${certPath}`);
        }

        // Verify keystore directory exists
        if (!fs.existsSync(keyDir)) {
            throw new Error(`❌ Keystore directory not found: ${keyDir}`);
        }

        // Read certificate
        const certificate = fs.readFileSync(certPath, 'utf8');
        console.log('✅ Certificate loaded successfully');

        // Find and read private key
        const keyFiles = fs.readdirSync(keyDir);
        const privateKeyFile = keyFiles.find(file => 
            file.endsWith('_sk') || file.includes('priv') || file.endsWith('.pem')
        );

        if (!privateKeyFile) {
            console.log('Available files in keystore:', keyFiles);
            throw new Error(`❌ No private key file found in ${keyDir}`);
        }

        const privateKeyPath = path.join(keyDir, privateKeyFile);
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        console.log(`✅ Private key loaded: ${privateKeyFile}`);

        // Create X.509 identity
        const identity = {
            credentials: {
                certificate: certificate,
                privateKey: privateKey,
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        // Store both admin and appUser (use same identity for both)
        await wallet.put('admin', identity);
        await wallet.put('appUser', identity);

        console.log('✅ Admin identity created and stored');
        console.log('✅ AppUser identity created and stored');

        // Verify identities
        const adminExists = await wallet.get('admin');
        const appUserExists = await wallet.get('appUser');

        console.log('\n📋 VERIFICATION:');
        console.log(`   Admin identity: ${adminExists ? '✅ Found' : '❌ Missing'}`);
        console.log(`   AppUser identity: ${appUserExists ? '✅ Found' : '❌ Missing'}`);
        console.log(`   Wallet location: ${walletPath}`);

        console.log('\n🎉 SUCCESS! Your backend can now connect to Fabric network.');
        console.log('💡 You can now test your backend API calls.');

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        
        console.log('\n🔧 TROUBLESHOOTING TIPS:');
        console.log('1. Verify test network is in the expected location:');
        const expectedPath = path.resolve(__dirname, '..', '..', 'fabric', 'fabric-samples', 'test-network');
        console.log(`   Expected: ${expectedPath}`);
        console.log(`   Check: ls -la "${expectedPath}"`);
        
        console.log('\n2. Verify certificate files exist:');
        const certDir = path.resolve(__dirname, '..', '..', 'fabric', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'Admin@org1.example.com', 'msp');
        console.log(`   Check: ls -la "${certDir}/signcerts/"`);
        console.log(`   Check: ls -la "${certDir}/keystore/"`);
        
        process.exit(1);
    }
}

main();
