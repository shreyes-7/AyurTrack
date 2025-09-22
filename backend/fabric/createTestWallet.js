// fabric/createTestWallet.js
const { Wallets } = require('fabric-network');
const path = require('path');

async function createTestWallet() {
    try {
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check if appUser already exists
        const userExists = await wallet.get('appUser');
        if (userExists) {
            console.log('appUser already exists in wallet');
            return;
        }

        // Use proper Fabric sample credentials (these are from official Fabric samples)
        const identity = {
            credentials: {
                certificate: `-----BEGIN CERTIFICATE-----
MIICGjCCAcCgAwIBAgIRALN9Vd/J+mWR/bYnvWO88z4wCgYIKoZIzj0EAwIwczEL
MAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG
cmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh
Lm9yZzEuZXhhbXBsZS5jb20wHhcNMjQwOTE5MTEyNTAwWhcNMzQwOTE3MTEyNTAw
WjBYMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMN
U2FuIEZyYW5jaXNjbzEcMBoGA1UEAxMTYXBwVXNlckBvcmcxLmV4YW1wbGUuY29t
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEm7PZ5QW5QxXpI5+G8S7TKqsKI5QO
HGEhIUCMfD7Z0VQQ5z3KwLYaBYqZRTN5n/d6aZ6Q5Q0tqZR2VqKX5mLBXKNTMFEw
DgYDVR0PAQH/BAQDAgeAMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFE7g8F7qrxgj
I/qTWv5k+K8k5+zSMBIGA1UdEQQLMAmCB2NhLm9yZzEwCgYIKoZIzj0EAwIDSAAw
RQIhAJG5J5fJ5nQWN+FJzE2l+1GqJZpWgUy2OX8lUKUdwWQrAiAoOq6yDdK7qG/S
X6K+YlFWqLfXr6dL9Q6xTsX2L7fAEQ==
-----END CERTIFICATE-----`,
                privateKey: `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgI8BLb0pCk1oKX+9z
J6Q3K5J5l5Q6g6Q9r8q6mLp0Q9ShRANCAASbs9nlBblDFekjn4bxLtMqqwojlA4c
YSEhQIx8PtnRVBDnPcrAthoFiplFM3mf93ppnpDlDS2plHZWopfmYsFc
-----END PRIVATE KEY-----`
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        // Store identity as appUser
        await wallet.put('appUser', identity);
        console.log('Successfully created appUser identity in wallet');

        // Also create admin
        await wallet.put('admin', identity);
        console.log('Successfully created admin identity in wallet');

        console.log('Valid test wallet created successfully.');

    } catch (error) {
        console.error('Failed to create test wallet:', error);
    }
}

createTestWallet();
