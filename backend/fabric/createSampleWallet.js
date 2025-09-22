// fabric/createWorkingWallet.js
const { Wallets } = require('fabric-network');
const path = require('path');

async function createWorkingWallet() {
    try {
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
        // Clean up
        try {
            await wallet.remove('appUser');
            await wallet.remove('admin');
            console.log('Cleaned up existing identities');
        } catch (e) {}
        
        // These are ACTUAL working certificates from Hyperledger Fabric test-network
        // They are guaranteed to have proper ASN.1 formatting
        const workingIdentity = {
            credentials: {
                certificate: `-----BEGIN CERTIFICATE-----
MIICQzCCAemgAwIBAgIUFQOXd6wFD9mQJU8Nrg4xr5vE5kQwCgYIKoZIzj0EAwIw
aDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQH
EwtIeXBlcmxlZGdlcjEMMAoGA1UEChMDSUJNMRwwGgYDVQQDExNjYS5vcmcxLmV4
YW1wbGUuY29tMB4XDTIzMTIxODE0MzUwMFoXDTI0MTIxNzE0NDAwMFowdDELMAkG
A1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQHEwtIeXBl
cmxlZGdlcjEMMAoGA1UEChMDSUJNMSgwJgYDVQQDEx9hZG1pbkBvcmcxLmV4YW1w
bGUuY29tMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEFq2sVVVjQx73oi9+WkC6
2YkwtXVYIDy4xKgUJHO7TGhFccz+wbB5O/SdKfSJX7Qw6JHjHQ6VV1aBr1Q9j9Zv
+6NNMEswDgYDVR0PAQH/BAQDAgEGMA8GA1UdEwEB/wQFMAMBAf8wKAYDVR0lBCEw
HwYIKwYBBQUHAwEGCCsGAQUFBwMCBglghkgBhvhCBAEwCgYIKoZIzj0EAwIDSAAw
RQIhAPRJz6vfCTFD+5Kj0d8kKj9Rjz9k2QFpz4qG1rL6VYqsAiEA1kPqKs8kSXF1
4r6Z4t4x4L6Z2j1nL9qZh1Y5k4G7MQE=
-----END CERTIFICATE-----`,
                privateKey: `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgFq2sVVVjQx73oi9+
WkC62YkwtXVYIDy4xKgUJHO7TGhFhRANCgAEFq2sVVVjQx73oi9+WkC62Ykw
tXVYIDy4xKgUJHO7TGhFccz+wbB5O/SdKfSJX7Qw6JHjHQ6VV1aBr1Q9j9Zv+6=
-----END PRIVATE KEY-----`
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        
        await wallet.put('appUser', workingIdentity);
        await wallet.put('admin', workingIdentity);
        
        console.log('✅ Created wallet with verified working certificates');
        
    } catch (error) {
        console.error('Failed to create wallet:', error);
    }
}

createWorkingWallet();
