// fabric/extractRealCertificates.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Wallets } = require('fabric-network');

async function extractRealCertificates() {
    try {
        console.log('Extracting REAL certificates from your running peer...\n');

        // Clean up wallet first
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        try {
            await wallet.remove('appUser');
            await wallet.remove('admin');
            console.log('✓ Cleaned existing wallet');
        } catch (e) { }

        // Extract certificate
        console.log('Extracting certificate...');
        const certificate = execSync('docker exec peer0.org1.example.com cat /etc/hyperledger/fabric/msp/signcerts/cert.pem', { encoding: 'utf8' });
        console.log('✓ Certificate extracted');
        console.log('Certificate preview:', certificate.substring(0, 100) + '...');

        // Extract private key
        console.log('\nExtracting private key...');
        const keyFiles = execSync('docker exec peer0.org1.example.com find /etc/hyperledger/fabric/msp/keystore -name "*_sk"', { encoding: 'utf8' }).trim();

        if (!keyFiles) {
            throw new Error('No private key files found in keystore');
        }

        const keyFile = keyFiles.split('\n')[0];
        console.log('Key file found:', keyFile);

        const privateKey = execSync(`docker exec peer0.org1.example.com cat ${keyFile}`, { encoding: 'utf8' });
        console.log('✓ Private key extracted');
        console.log('Private key preview:', privateKey.substring(0, 50) + '...');

        // Validate certificate format
        const certTrimmed = certificate.trim();
        if (!certTrimmed.startsWith('-----BEGIN CERTIFICATE-----') || !certTrimmed.endsWith('-----END CERTIFICATE-----')) {
            throw new Error('Invalid certificate format');
        }

        // Validate private key format
        const keyTrimmed = privateKey.trim();
        if (!keyTrimmed.startsWith('-----BEGIN PRIVATE KEY-----') &&
            !keyTrimmed.startsWith('-----BEGIN EC PRIVATE KEY-----')) {
            throw new Error('Invalid private key format');
        }

        console.log('\n✓ Certificate and key format validation passed');

        // Save certificates to files for inspection
        fs.writeFileSync(path.join(__dirname, 'extracted_cert.pem'), certTrimmed);
        fs.writeFileSync(path.join(__dirname, 'extracted_key.pem'), keyTrimmed);
        console.log('✓ Saved certificates to files for inspection');

        // Create identity
        const identity = {
            credentials: {
                certificate: certTrimmed,
                privateKey: keyTrimmed
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        // Test the identity before saving
        console.log('\nTesting identity validity...');
        try {
            const provider = wallet.getProviderRegistry().getProvider(identity.type);
            await provider.getUserContext(identity, 'testUser');
            console.log('✓ Identity validation successful');
        } catch (validationError) {
            console.error('✗ Identity validation failed:', validationError.message);

            // Try to decode the certificate to see what's wrong
            console.log('\nAnalyzing certificate...');
            try {
                const { execSync } = require('child_process');
                const certInfo = execSync(`echo "${certTrimmed}" | openssl x509 -text -noout`, { encoding: 'utf8' });
                console.log('Certificate info:', certInfo.substring(0, 500));
            } catch (opensslError) {
                console.log('OpenSSL not available, cannot analyze certificate');
            }

            throw validationError;
        }

        // Save to wallet
        await wallet.put('appUser', identity);
        await wallet.put('admin', identity);

        console.log('✓ Successfully created wallet with real certificates');

        return true;

    } catch (error) {
        console.error('Failed to extract real certificates:', error.message);

        if (error.message.includes('docker exec')) {
            console.log('\n❌ Docker command failed. Make sure:');
            console.log('1. Docker is running');
            console.log('2. peer0.org1.example.com container is running');
            console.log('3. You have the correct container name');
            console.log('\nTry running: docker ps | grep peer0.org1');
        }

        return false;
    }
}

// Also create a function to test connection with extracted certs
async function testConnectionWithRealCerts() {
    try {
        console.log('\n--- Testing connection with real certificates ---');

        // Update fabricClient to use non-TLS for testing
        const fabricClientPath = path.join(__dirname, 'fabricClient.js');
        const simpleClient = `const { Gateway, Wallets } = require('fabric-network');
const path = require('path');

async function getContract(user = 'appUser', org = 'Org1') {
    try {
        console.log('Connecting with extracted certificates...');
        
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
        const identity = await wallet.get(user);
        if (!identity) {
            throw new Error(\`Identity \${user} not found\`);
        }
        
        const connectionProfile = {
            name: "test-network",
            version: "1.0.0",
            client: { organization: "Org1" },
            organizations: {
                Org1: { mspid: "Org1MSP", peers: ["peer0.org1.example.com"] }
            },
            peers: {
                "peer0.org1.example.com": {
                    url: "grpc://localhost:7051",
                    grpcOptions: {
                        "ssl-target-name-override": "peer0.org1.example.com"
                    }
                }
            },
            channels: {
                mychannel: {
                    peers: { "peer0.org1.example.com": { endorsingPeer: true, chaincodeQuery: true } }
                }
            }
        };
        
        const gateway = new Gateway();
        await gateway.connect(connectionProfile, {
            wallet, identity: user, discovery: { enabled: false }
        });
        
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('herbaltrace');
        
        return { contract, gateway };
    } catch (error) {
        throw error;
    }
}

module.exports = { getContract };`;

        fs.writeFileSync(fabricClientPath, simpleClient);
        console.log('✓ Updated fabricClient.js for testing');

        // Test the connection
        const { getContract } = require('./fabricClient');
        const { contract, gateway } = await getContract('appUser');

        console.log('✓ Connection successful!');

        // Try a simple query
        const result = await contract.evaluateTransaction('GetAllHerbs');
        console.log('✓ Query successful!');
        console.log('Result:', result.toString().substring(0, 200) + '...');

        await gateway.disconnect();

        console.log('\n🎉 SUCCESS! Your blockchain connection is working!');
        console.log('You can now test your API endpoints.');

    } catch (error) {
        console.error('Connection test failed:', error.message);

        if (error.message.includes('ECONNREFUSED') || error.message.includes('not connected')) {
            console.log('\n💡 Try these solutions:');
            console.log('1. Make sure your peer is running: docker ps | grep peer0.org1');
            console.log('2. Try with TLS enabled (grpcs://) if your peer requires it');
            console.log('3. Check if peer is listening on port 7051: docker port peer0.org1.example.com');
        }
    }
}

// Run extraction and test
extractRealCertificates()
    .then((success) => {
        if (success) {
            return testConnectionWithRealCerts();
        }
    })
    .catch(error => console.error('Setup failed:', error.message));
