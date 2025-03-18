import { 
  Keypair, 
  Connection, 
  clusterApiUrl, 
  PublicKey,
  Transaction
} from "@solana/web3.js";

import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  createInitializeTransferFeeConfigInstruction,
  TOKEN_2022_PROGRAM_ID,
  getMint
} from "@solana/spl-token";

import bs58 from "bs58";

async function createSPLTokenWithTax() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const PRIVATE_KEY_BASE58 = "4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1";
  const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_BASE58));

  console.log("Wallet Address:", wallet.publicKey.toBase58());

  // Create the token mint with Token-2022 program
  const mint = await createMint(
    connection,
    wallet,
    wallet.publicKey,  // Mint Authority
    wallet.publicKey,  // Freeze Authority (optional)
    9,                 // Decimals
    undefined,
    TOKEN_2022_PROGRAM_ID // Use Token-2022 program
  );

  console.log("Token Mint Address:", mint.toBase58());

  // Check if transfer fee is already set
  try {
    const mintInfo = await getMint(
      connection,
      mint,
      "confirmed", 
      TOKEN_2022_PROGRAM_ID // ✅ Correct order of arguments
    );
    
    if (mintInfo.extensions && mintInfo.extensions.transferFeeConfig) {
      console.log("Transfer fee is already set. Skipping initialization.");
    } else {
      console.log("Initializing transfer fee...");

      // Define Tax Collector Address (receiver of tax fees)
      const taxReceiver = new PublicKey(wallet.publicKey); // Convert to PublicKey explicitly

      // Initialize Transfer Fee (e.g., 2% tax on every transfer)
      const feeBasisPoints = 200; // 2% fee (200 basis points)
      const maxFee = BigInt(10 * 10 ** 9); // Maximum fee per transfer (10 tokens)

      const feeConfigIx = createInitializeTransferFeeConfigInstruction(
        mint,
        wallet.publicKey, // Fee authority
        taxReceiver,
        feeBasisPoints,
        maxFee,
        TOKEN_2022_PROGRAM_ID
      );

      // Fetch recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

      // Create transaction and add instruction
      const transaction = new Transaction().add(feeConfigIx);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Sign the transaction
      transaction.sign(wallet);

      // Send the transaction
      const signature = await connection.sendTransaction(transaction, [wallet], {
        skipPreflight: false, 
        preflightCommitment: "confirmed"
      });

      // Confirm transaction
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, "confirmed");

      console.log("Transfer Fee Configured. Transaction ID:", signature);
    }
  } catch (error) {
    console.error("Error checking mint info:", error);
  }

  // Create an associated token account for the wallet
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    mint,
    wallet.publicKey,
    false, // Do not allow closed accounts
    "confirmed",
    TOKEN_2022_PROGRAM_ID
  );

  console.log("Token Account:", tokenAccount.address.toBase58());

  // Mint tokens to the wallet
  await mintTo(
    connection,
    wallet,
    mint,
    tokenAccount.address,
    wallet.publicKey,
    1000 * 10 ** 9, // Minting 1000 tokens
    [],
    TOKEN_2022_PROGRAM_ID
  );

  console.log("Minted 1000 tokens");

  return { mintAddress: mint.toBase58(), tokenAccount: tokenAccount.address.toBase58() };
}

createSPLTokenWithTax()
  .then(console.log)
  .catch(console.error);
