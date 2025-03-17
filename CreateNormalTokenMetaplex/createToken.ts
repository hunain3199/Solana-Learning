import { Keypair, Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, transfer, AccountLayout } from "@solana/spl-token";

import bs58 from "bs58";

async function createSPLToken() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const PRIVATE_KEY_BASE58 = "4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1";
  const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_BASE58));
  console.log("Wallet Address:", wallet.publicKey.toBase58());

  // Load wallet from .env private key


  // Create a new SPL Token
  const mint = await createMint(
    connection,
    wallet,
    wallet.publicKey,  // Mint Authority
    wallet.publicKey,  // Freeze Authority (can be null)
    9                 // Decimals
  );

  console.log("Token Mint Address:", mint.toBase58());

  // Create an associated token account for the wallet
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    mint,
    wallet.publicKey
  );

  console.log("Token Account:", tokenAccount.address.toBase58());

  // Mint tokens to the wallet
  await mintTo(
    connection,
    wallet,
    mint,
    tokenAccount.address,
    wallet.publicKey,
    1000 * 10 ** 9 // Minting 1000 tokens (considering 9 decimals)
  );

  console.log("Minted 1000 tokens");

  return { mintAddress: mint.toBase58(), tokenAccount: tokenAccount.address.toBase58() };
}

createSPLToken()
  .then(console.log)
  .catch(console.error);
