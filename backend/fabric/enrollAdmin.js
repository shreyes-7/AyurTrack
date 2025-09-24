const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // CORRECTED PATH
        const ccpPath = path.resolve(__dirname, '..', '..', 'fabric', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');

        let ccp; // Declare ccp in the correct scope

        // Check if the connection profile exists
        if (!fs.existsSync(ccpPath)) {
            console.log(`Connection profile not found at: ${ccpPath}`);
            console.log('Using inline configuration instead...');

            // Use fallback configuration
            ccp = {
                "name": "test-network-org1",
                "version": "1.0.0",
                "client": {
                    "organization": "Org1"
                },
                "certificateAuthorities": {
                    "ca.org1.example.com": {
                        "url": "https://localhost:7054",
                        "caName": "ca-org1",
                        "tlsCACerts": {
                            "pem": ["-----BEGIN CERTIFICATE-----\nMIICFjCCAb2gAwIBAgIUe8/d1WNqwL9xLgubDoaZI+i/CNkwCgYIKoZIzj0EAwIw\naDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\nEwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt\nY2Etc2VydmVyMB4XDTI1MDkyMjEzMjEwMFoXDTQwMDkxODEzMjEwMFowaDELMAkG\nA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQKEwtIeXBl\ncmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMtY2Etc2Vy\ndmVyMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEzlCHVk6a1PuWArpX1Ld4zdLq\nZmW3IK505JfN/ojYfrKhWs3CE2kG6HpO/aRDKL32eiZtfR1jNDtFKCe/GeKgJqNF\nMEMwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwHQYDVR0OBBYE\nFCERi9dLG8dtfJCjiW9JFubnqC8bMAoGCCqGSM49BAMCA0cAMEQCIHIH7UB1PIry\nen8teokwBVDcX13HEMbk+3W9cEN7QAByAiBeMp0P7gPSGmEFBpYrEX2d7Bd+dSzJ\nh3Ucxo5xHQETsw==\n-----END CERTIFICATE-----\n"]
                        },
                        "httpOptions": {
                            "verify": false
                        }
                    }
                }
            };
        } else {
            console.log(`Using connection profile: ${ccpPath}`);
            ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8')); // Fixed: assign to ccp, not const ccp
        }

        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, {
            trustedRoots: caTLSCACerts,
            verify: false
        }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get('admin');
        if (identity) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            console.log('Deleting existing identity to create fresh one...');
            // Delete the existing identity to force recreation
            await wallet.remove('admin');
        }

        // Enroll the admin user, and import the new identity into the wallet.
        console.log('Enrolling admin user...');
        const enrollment = await ca.enroll({
            enrollmentID: 'admin',
            enrollmentSecret: 'adminpw'
        });

        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put('admin', x509Identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        console.error('Full error details:', error.stack);
        process.exit(1);
    }
}

main();
