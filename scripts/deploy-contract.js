const { Keypair, Server, Networks, TransactionBuilder, Account, xdr } = require('stellar-sdk');
const fs = require('fs');
const path = require('path');

const CONTRACT_WASM_PATH = path.join(__dirname, '../contracts/split/target/wasm32v1-none/release/split.wasm');

async function deployContract() {
  const secretKey = 'SAIJSOK4NC55FH2RX6QWTN35J5ZSD3ENYVTJQCDSCP3QN7IK5A7COQJW';
  const keypair = Keypair.fromSecret(secretKey);

  console.log('Public Key:', keypair.publicKey());

  const server = new Server('https://horizon-testnet.stellar.org');

  const account = await server.loadAccount(keypair.publicKey());
  console.log('Account loaded. Balance:', account.balances[0].balance);

  const wasmBuffer = fs.readFileSync(CONTRACT_WASM_PATH);
  console.log('WASM file size:', wasmBuffer.length, 'bytes');

  const wasmHash = await server.uploadWasm(wasmBuffer);
  console.log('WASM uploaded. Hash:', wasmHash);

  const contractId = await server.createContract(
    keypair,
    Networks.TESTNET,
    wasmHash
  );

  console.log('Contract deployed!');
  console.log('Contract ID:', contractId);

  console.log('');
  console.log('=== CONTRACT DETAILS ===');
  console.log('CONTRACT_ID=' + contractId);
  console.log('========================');
}

deployContract()
  .then(() => console.log('\nDeployment complete!'))
  .catch((err) => {
    console.error('Deployment failed:', err.message);
    process.exit(1);
  });