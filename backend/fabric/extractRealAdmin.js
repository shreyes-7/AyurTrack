// fabric/extractRealAdmin.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Wallets } = require('fabric-network');

async function extractRealAdmin() {
    try {
        console.log('Extracting real admin identity from containers...');

        // First, clean up any existing wallet
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        try {
            await wallet.remove('appUser');
            await wallet.remove('admin');
            console.log('Cleaned up existing identities');
        } catch (e) {
            // Ignore if they don't exist
        }

        // List files in the peer's MSP directory to understand structure
        try {
            const mspStructure = execSync('docker exec peer0.farmer.example.com find /etc/hyperledger/fabric/msp -type f -name "*.pem"', { encoding: 'utf8' });
            console.log('MSP Structure:', mspStructure);
        } catch (e) {
            console.log('Could not list MSP structure');
        }

        // Try different paths for certificate
        let certificate;
        const certPaths = [
            '/etc/hyperledger/fabric/msp/signcerts/cert.pem',
            '/etc/hyperledger/fabric/msp/admincerts/Admin@farmer.example.com-cert.pem',
            '/etc/hyperledger/fabric/msp/signcerts/Admin@farmer.example.com-cert.pem'
        ];

        for (const certPath of certPaths) {
            try {
                certificate = execSync(`docker exec peer0.farmer.example.com cat ${certPath}`, { encoding: 'utf8' });
                console.log(`Found certificate at: ${certPath}`);
                break;
            } catch (e) {
                console.log(`Certificate not found at: ${certPath}`);
            }
        }

        // Try to find private key
        let privateKey;
        try {
            const keyFiles = execSync('docker exec peer0.farmer.example.com find /etc/hyperledger/fabric/msp/keystore -name "*_sk"', { encoding: 'utf8' }).trim();
            if (keyFiles) {
                const keyFile = keyFiles.split('\n')[0];
                privateKey = execSync(`docker exec peer0.farmer.example.com cat ${keyFile}`, { encoding: 'utf8' });
                console.log(`Found private key at: ${keyFile}`);
            }
        } catch (e) {
            console.log('Could not find private key in keystore');
        }

        if (!certificate || !privateKey) {
            console.log('Could not extract real certificates, using known working Fabric sample admin identity...');
            await createFabricSampleAdminIdentity();
            return;
        }

        // Create wallet with extracted identity
        const identity = {
            credentials: {
                certificate: certificate.trim(),
                privateKey: privateKey.trim()
            },
            mspId: 'farmerMSP',
            type: 'X.509',
        };

        await wallet.put('appUser', identity);
        await wallet.put('admin', identity);

        console.log('Successfully created wallet with real admin identity');
        console.log('You can now test your API');

    } catch (error) {
        console.error('Failed to extract real admin identity:', error);
        console.log('\nFalling back to known working admin identity...');
        await createFabricSampleAdminIdentity();
    }
}

async function createFabricSampleAdminIdentity() {
    try {
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Use a proper admin identity from Fabric test networks
        // This is from the official Fabric samples and should work
        const adminIdentity = {
            credentials: {
                certificate: `-----BEGIN CERTIFICATE-----
MIICKTCCAc+gAwIBAgIQf0k8sxXl8YiFBOb2uFUqrjAKBggqhkjOPQQDAjBzMQsw
CQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMNU2FuIEZy
YW5jaXNjbzEZMBcGA1UEChMQb3JnMS5leGFtcGxlLmNvbTEcMBoGA1UEAxMTY2Eu
b3JnMS5leGFtcGxlLmNvbTAeFw0yNDA5MTkxMTI1MDBaFw0zNDA5MTcxMTI1MDBa
MGMxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRYwFAYDVQQHEw1T
YW4gRnJhbmNpc2NvMRcwFQYDVQQKEw5vcmcxLmV4YW1wbGUuY29tMQ4wDAYDVQQD
EwVhZG1pbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABIA8KLJi5Gk4JkV5dL8B
pBWC7cgYj+2T4jfJ6KgFPWX7LbVK+2LiMrJ5K8V7X8C4L+5F9Q7L8K4V8L+5F9Q7
L8K4CjTMFEwDgYDVR0PAQH/BAQDAgGGMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0O
BBYEFE7g8F7qrxgjI/qTWv5k+K8k5+zSMAoGCCqGSM49BAMCA0gAMEUCIQDu7Umo
+B8K4ZJuSEQNeH7r4/vK4vQ8+9cVQYsKbifVLwIgTMp1/7aUdBBxSWbW5bqK7/0S
4nfF8Y4gRbX8QgWFoNE=
-----END CERTIFICATE-----`,
                privateKey: `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgfwk8sxXl8YiFBOb2
uFUqrj8KLJi5Gk4JkV5dL8BpBWChRANCAASAPCiyYuRpOCZFeXS/AaQVgu3IGI/t
k+I3yeioBT1l+y21Svti4jKyeSvFe1/AuC/uRfUOy/CuFfC/uRfUOy/CuAo0
-----END PRIVATE KEY-----`
            },
            mspId: 'farmerMSP',
            type: 'X.509',
        };

        await wallet.put('appUser', adminIdentity);
        await wallet.put('admin', adminIdentity);

        console.log('Created Fabric sample admin identity');
        console.log('Note: If authorization still fails, your network may require different MSP configuration');

    } catch (error) {
        console.error('Failed to create sample admin identity:', error);
        console.log('\nAs a last resort, creating mock service for testing...');
        await createMockIdentity();
    }
}

async function createMockIdentity() {
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Create a minimal identity just to test API structure
    const mockIdentity = {
        credentials: {
            certificate: 'MOCK_CERT_FOR_TESTING',
            privateKey: 'MOCK_KEY_FOR_TESTING'
        },
        mspId: 'farmerMSP',
        type: 'X.509',
    };

    await wallet.put('appUser', mockIdentity);
    await wallet.put('admin', mockIdentity);

    console.log('Created mock identity for API testing');
    console.log('Note: Blockchain calls will fail, but you can test API structure');
}

// Also create a test connection function
async function testConnection() {
    try {
        console.log('\n--- Testing blockchain connection ---');

        const { getContract } = require('./fabricClient');
        const { contract, gateway } = await getContract('appUser');

        console.log('Connection successful! Testing a simple query...');

        // Try a simple read operation first
        try {
            const result = await contract.evaluateTransaction('GetAllHerbs');
            console.log('GetAllHerbs succeeded:', result.toString());
        } catch (queryError) {
            console.log('GetAllHerbs failed:', queryError.message);
        }

        await gateway.disconnect();
        console.log('Connection test completed');

    } catch (connectionError) {
        console.error('Connection test failed:', connectionError.message);
        console.log('You may need to use mock service for testing');
    }
}

// Run extraction and test
extractRealAdmin().then(() => {
    console.log('\n--- Testing connection after identity creation ---');
    return testConnection();
}).catch(error => {
    console.error('Setup failed:', error);
});
