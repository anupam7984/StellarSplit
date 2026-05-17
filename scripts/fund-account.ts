import StellarSdk from 'stellar-sdk';

async function fundTestnetAccount() {
  const keypair = StellarSdk.Keypair.random();

  console.log('Generated new account:');
  console.log('Public Key:', keypair.publicKey());
  console.log('Secret Key:', keypair.secretKey());
  console.log('');

  const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

  try {
    console.log('Funding account from testnet faucet...');

    const response = await fetch(
      `https://friendbot.stellar.org?addr=${keypair.publicKey()}`,
      { method: 'GET' }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('Account funded successfully!');
      console.log('Balance:', data.balance);

      await server.loadAccount(keypair.publicKey());
      console.log('Account is now active on testnet.');
    } else {
      console.log('Failed to fund account. Trying alternative method...');

      const tx = new StellarSdk.TransactionBuilder(
        new StellarSdk.Account(keypair.publicKey(), '0'),
        {
          fee: '100',
          networkPassphrase: StellarSdk.Networks.TESTNET,
          timebounds: { minTime: 0, maxTime: Math.floor(Date.now() / 1000) + 60 },
        }
      )
        .setTimeout(30)
        .build();

      const txXDR = tx.toXDR();

      const horizonResponse = await fetch('https://horizon-testnet.stellar.org/friendbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `addr=${keypair.publicKey()}`,
      });

      if (horizonResponse.ok) {
        console.log('Account funded via Horizon friendbot!');
      } else {
        throw new Error('Friendbot funding failed');
      }
    }
  } catch (error) {
    console.error('Error funding account:', error);
    process.exit(1);
  }

  console.log('');
  console.log('=== ACCOUNT DETAILS ===');
  console.log('PUBLIC_KEY=' + keypair.publicKey());
  console.log('SECRET_KEY=' + keypair.secretKey());
  console.log('=======================');

  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secretKey(),
  };
}

fundTestnetAccount()
  .then(() => console.log('\nDone!'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });