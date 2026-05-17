const { Keypair, Server } = require('stellar-sdk');

async function fundTestnetAccount() {
  const keypair = Keypair.random();

  console.log('Generated new account:');
  console.log('Public Key:', keypair.publicKey());
  console.log('Secret Key:', keypair.secret());
  console.log('');

  try {
    console.log('Funding account from testnet faucet...');

    const response = await fetch(
      `https://friendbot.stellar.org?addr=${keypair.publicKey()}`,
      { method: 'GET' }
    );

    if (response.ok) {
      console.log('Account funded successfully!');

      const server = new Server('https://horizon-testnet.stellar.org');
      const account = await server.loadAccount(keypair.publicKey());
      console.log('Account balance:', account.balances[0].balance);
    } else {
      throw new Error('Friendbot funding failed');
    }
  } catch (error) {
    console.error('Error funding account:', error.message);
    process.exit(1);
  }

  console.log('');
  console.log('=== ACCOUNT DETAILS ===');
  console.log('PUBLIC_KEY=' + keypair.publicKey());
  console.log('SECRET_KEY=' + keypair.secret());
  console.log('=======================');

  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
  };
}

fundTestnetAccount()
  .then(() => console.log('\nDone!'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });