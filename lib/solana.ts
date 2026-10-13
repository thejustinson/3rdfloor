import {
  deployRwaToken2022Mint,
  settleInvestorToken2022Ata,
} from '@3rdfloor/sdk/solana';

export async function createTokenMint(
  decimals: number = 0,
  name: string = 'Unknown',
  symbol: string = 'UNK',
  uri: string = '',
  supply: number = 0
): Promise<{
  mintAddress: string;
  mintAuthority: string;
  freezeAuthority: string;
  transactionSignature: string;
}> {
  const payerKeyStr = process.env.SOLANA_PAYER_KEY;
  if (!payerKeyStr) {
    throw new Error('SOLANA_PAYER_KEY is missing in environment variables.');
  }

  const res = await deployRwaToken2022Mint({
    rpcUrl: 'https://api.devnet.solana.com',
    payer: payerKeyStr,
    name,
    symbol,
    uri,
    decimals,
    initialSupply: supply,
  });

  return {
    mintAddress: res.mintAddress,
    mintAuthority: res.mintAuthority,
    freezeAuthority: res.freezeAuthority,
    transactionSignature: res.transactionSignature,
  };
}

export async function allocateTokensToInvestor(
  mintAddressStr: string,
  investorWalletStr: string,
  amount: number,
  decimals: number = 0
): Promise<{ transactionSignature: string; destinationWallet: string }> {
  const payerKeyStr = process.env.SOLANA_PAYER_KEY;
  if (!payerKeyStr) {
    throw new Error('SOLANA_PAYER_KEY is missing in environment variables.');
  }

  const res = await settleInvestorToken2022Ata({
    rpcUrl: 'https://api.devnet.solana.com',
    payer: payerKeyStr,
    mintAddress: mintAddressStr,
    investorWallet: investorWalletStr,
    amount,
    decimals,
  });

  return {
    transactionSignature: res.transactionSignature,
    destinationWallet: res.destinationWallet,
  };
}
