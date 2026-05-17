import pkg from '@stellar/freighter-api';
import stellarPkg from '@stellar/stellar-sdk';
const { Keypair, Networks, TransactionBuilder, Account, xdr } = stellarPkg;

const NETWORK_PASSPHRASE = Networks.TESTNET;
const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';

const freighterApi = pkg;

export async function connectWallet(): Promise<string> {
  try {
    if (typeof window !== 'undefined' && (window as any).stellar?.freighter) {
      const isConnected = await (window as any).stellar.freighter.isConnected();
      if (!isConnected) {
        throw new Error('Freighter wallet is not connected');
      }
      const publicKey = await (window as any).stellar.freighter.getPublicKey();
      if (!publicKey) {
        throw new Error('No public key found');
      }
      return publicKey;
    }
    throw new Error('Freighter not installed');
  } catch (e: any) {
    throw new Error(e.message || 'Failed to connect wallet');
  }
}

export async function getPublicKey_(): Promise<string | null> {
  try {
    if (typeof window !== 'undefined' && (window as any).stellar?.freighter) {
      const isConnected = await (window as any).stellar.freighter.isConnected();
      if (!isConnected) return null;
      return await (window as any).stellar.freighter.getPublicKey();
    }
    return null;
  } catch {
    return null;
  }
}

export async function signTransaction_(xdrString: string): Promise<string> {
  if (typeof window !== 'undefined' && (window as any).stellar?.freighter) {
    return await (window as any).stellar.freighter.signTransaction(xdrString, { network: NETWORK_PASSPHRASE });
  }
  throw new Error('Freighter not available');
}

export async function sendPayment(to: string, amount: string): Promise<string> {
  const publicKey = await connectWallet();
  
  const server = new stellarPkg.Horizon.Server(HORIZON_URL);
  const account = await server.loadAccount(publicKey);
  
  const transaction = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      stellarPkg.Operation.payment({
        destination: to,
        asset: stellarPkg.Asset.native(),
        amount: amount,
      })
    )
    .setTimeout(30)
    .build();

  const signedXDR = await signTransaction_(transaction.toXDR());
  
  const txEnvelope = xdr.TransactionEnvelope.fromXDR(signedXDR, 'base64');
  const tx = new stellarPkg.Transaction(txEnvelope, NETWORK_PASSPHRASE);
  
  const result = await server.submitTransaction(tx);
  return result.hash;
}

export { Keypair, Networks, TransactionBuilder, Account, xdr, stellarPkg as stellarSdk };