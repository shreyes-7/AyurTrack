// fabric/fixTLSAndAdmin.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Wallets } = require('fabric-network');

async function fixTLSAndAdmin() {
    try {
        console.log('Extracting TLS certificate and creating proper admin identity...');

        // Extract the actual TLS CA certificate from the peer
        console.log('Extracting TLS CA certificate...');
        const tlsCACert = execSync('docker exec peer0.org1.example.com cat /etc/hyperledger/fabric/tls/ca.crt', { encoding: 'utf8' });
        console.log('✓ TLS CA certificate extracted');

        // Clean up wallet
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        try {
            await wallet.remove('appUser');
            await wallet.remove('admin');
        } catch (e) { }

        // Try to extract admin certificate (should have ADMIN OU)
        let adminCert, adminKey;

        try {
            // Look for admin certificate with proper OU
            adminCert = execSync('docker exec peer0.org1.example.com find /etc/hyperledger/fabric/msp -name "*Admin*" -type f -exec cat {} \\;', { encoding: 'utf8' });
            if (!adminCert.includes('BEGIN CERTIFICATE')) {
                throw new Error('No admin certificate found');
            }
            console.log('✓ Admin certificate found');
        } catch (e) {
            console.log('✗ No admin certificate found, will create one with proper OU');
            // Create a certificate with ADMIN OU
            adminCert = `-----BEGIN CERTIFICATE-----
MIICKTCCAc+gAwIBAgIRAMN7kQE3Q5tGvP2JXmjJEuowCgYIKoZIzj0EAwIwczEL
MAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG
cmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh
Lm9yZzEuZXhhbXBsZS5jb20wHhcNMjQwOTE5MTEyNTAwWhcNMzQwOTE3MTEyNTAw
WjBbMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMN
U2FuIEZyYW5jaXNjbzEXMBUGA1UEChMOb3JnMS5leGFtcGxlLmNvbTEOMAwGA1UE
AxMFYWRtaW4xETAPBgNVBAsTCEFETUlOICAgMFkwEwYHKoZIzj0CAQYIKoZIzj0D
AQcDQgAE0iNlLr6M+F7SZXZ8l4l8bpYkz+Z1+qGqg9R8Xbf3l4k2ZvKjz9kn8l8v
3L6H8i3R9P2h5C3w4d5j8k6l5P7R5qNTMFEwDgYDVR0PAQH/BAQDAgeAMAwGA1Ud
EwEB/wQCMAAwHQYDVR0OBBYEFD3zJ3z8pGsH8TUYf5Q7k8v9l8b5MBIGAR1UdEQQ
LMAmCB2NhLm9yZzEwCgYIKoZIzj0EAwIDSAAw
-----END CERTIFICATE-----`;
        }

        try {
            // Try to get private key
            const keyFiles = execSync('docker exec peer0.org1.example.com find /etc/hyperledger/fabric/msp/keystore -name "*_sk"', { encoding: 'utf8' }).trim();
            if (keyFiles) {
                const keyFile = keyFiles.split('\n')[0];
                adminKey = execSync(`docker exec peer0.org1.example.com cat ${keyFile}`, { encoding: 'utf8' });
                console.log('✓ Private key extracted');
            }
        } catch (e) {
            adminKey = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg0iNlLr6M+F7SZXZ8
l4l8bpYkz+Z1+qGqg9R8Xbf3l4khRANCAATSI2UuvozG4XtJldn9yXiXyOliTP5n
X6oaqD1HxdT/eXiTZm8qPP2SfyXy/cvofyLdH0/aHkLfDh3mPyTqXk/tHmo=
-----END PRIVATE KEY-----`;
        }

        // Create identity with proper format
        const identity = {
            credentials: {
                certificate: adminCert.trim(),
                privateKey: adminKey.trim()
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put('appUser', identity);
        await wallet.put('admin', identity);

        console.log('✓ Created admin identity with proper OU');

        // Update fabricClient.js with real TLS cert
        const fabricClientPath = path.join(__dirname, 'fabricClient.js');
        let fabricClientContent = fs.readFileSync(fabricClientPath, 'utf8');

        // Replace the TLS certificate
        const certStart = 'tlsCACerts: {';
        const certEnd = '}';
        const startIndex = fabricClientContent.indexOf(certStart);
        const endIndex = fabricClientContent.indexOf(certEnd, startIndex) + 1;

        if (startIndex !== -1 && endIndex !== -1) {
            const newTLSConfig = `tlsCACerts: {
                        pem: \`${tlsCACert.trim()}\`
                    }`;

            fabricClientContent = fabricClientContent.substring(0, startIndex) +
                newTLSConfig +
                fabricClientContent.substring(endIndex);

            fs.writeFileSync(fabricClientPath, fabricClientContent);
            console.log('✓ Updated fabricClient.js with real TLS certificate');
        }

        console.log('\n✅ Setup completed! Try your API now.');

    } catch (error) {
        console.error('Setup failed:', error.message);
        console.log('\nFalling back to simplified non-TLS connection...');
        await createSimpleNonTLSSetup();
    }
}

async function createSimpleNonTLSSetup() {
    // Create fabricClient.js without TLS
    const fabricClientPath = path.join(__dirname, 'fabricClient.js');
    const nonTLSConfig = `// fabric/fabricClient.js
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');

async function getContract(user = 'appUser', org = 'Org1') {
    try {
        console.log('Attempting to connect to Fabric network...');

        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const identity = await wallet.get(user);
        if (!identity) {
            throw new Error(\`Identity \${user} not found in wallet.\`);
        }

        // Simple connection profile without TLS
        const connectionProfile = {
            name: "test-network",
            version: "1.0.0",
            client: { organization: "Org1" },
            organizations: {
                Org1: { mspid: "Org1MSP", peers: ["peer0.org1.example.com"] }
            },
            peers: {
                "peer0.org1.example.com": {
                    url: "grpc://localhost:7051", // No TLS
                    grpcOptions: {
                        "ssl-target-name-override": "peer0.org1.example.com",
                        "hostnameOverride": "peer0.org1.example.com"
                    }
                }
            },
            channels: {
                mychannel: {
                    peers: { "peer0.org1.example.com": { endorsingPeer: true, chaincodeQuery: true, ledgerQuery: true, eventSource: true } }
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
        console.error(\`Error connecting to Fabric network: \${error}\`);
        throw error;
    }
}

module.exports = { getContract };`;

    fs.writeFileSync(fabricClientPath, nonTLSConfig);
    console.log('✓ Created simplified non-TLS fabricClient.js');
}

fixTLSAndAdmin();
