const { getContract } = require('../../fabric/fabricClient');

async function submitTransaction(txName, args = [], user = 'appUser') {
    const { contract, gateway } = await getContract(user);
    try {
        const result = await contract.submitTransaction(txName, ...args);
        return result.toString();
    } finally {
        await gateway.disconnect();
    }
}

async function evaluateTransaction(txName, args = [], user = 'appUser') {
    const { contract, gateway } = await getContract(user);
    try {
        const result = await contract.evaluateTransaction(txName, ...args);
        return result.toString();
    } finally {
        await gateway.disconnect();
    }
}

module.exports = { submitTransaction, evaluateTransaction };
