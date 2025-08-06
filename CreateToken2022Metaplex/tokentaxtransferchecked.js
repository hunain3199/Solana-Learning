import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  createAccount,
  mintTo,
  transferCheckedWithFee,
  withdrawWithheldTokensFromAccounts,
  setAuthority,
  AuthorityType,
} from '@solana/spl-token';
import bs58 from 'bs58';

(async () => {
  const payer = Keypair.fromSecretKey(
    bs58.decode("4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1")
  );
  const connection = new Connection(clusterApiUrl("testnet"), "confirmed");

  const balance = await connection.getBalance(payer.publicKey);
  if (balance < 0.01 * LAMPORTS_PER_SOL) {
    throw new Error("Insufficient SOL in payer account.");
  }

  const decimals = 9;
  const feeBasisPoints = 250; // 2.5%
  const maxFee = BigInt(5_000_000_000);

  // Create mint with TransferFee extension
  const mintKeypair = Keypair.generate();
  const mintPubkey = mintKeypair.publicKey;
  const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
  const rent = await connection.getMinimumBalanceForRentExemption(mintLen);

  const tx0 = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintPubkey,
      space: mintLen,
      lamports: rent,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeTransferFeeConfigInstruction(
      mintPubkey,
      payer.publicKey, // Fee config authority
      payer.publicKey, // Withdraw authority
      feeBasisPoints,
      maxFee,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mintPubkey,
      decimals,
      payer.publicKey, // Mint authority
      null,            // No freeze authority
      TOKEN_2022_PROGRAM_ID
    )
  );

  await sendAndConfirmTransaction(connection, tx0, [payer, mintKeypair]);
  console.log("✅ Mint created with Transfer Fee extension.");
  console.log("🎯 Mint Public Key:", mintPubkey.toBase58());

  // Mint total supply to owner account
  const owner = Keypair.generate();
  const ownerAccount = await createAccount(
    connection,
    payer,
    mintPubkey,
    owner.publicKey,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
  const totalSupply = BigInt(150_000_000) * BigInt(10 ** decimals);
  await mintTo(connection, payer, mintPubkey, ownerAccount, payer.publicKey, totalSupply, [], undefined, TOKEN_2022_PROGRAM_ID);
  console.log("✅ Minted 150 million tokens to owner.");

  // Set up fixed recipient
  const recipientPubkey = new PublicKey("9uZEeDkjXQtzf3grcEC3im4mDwLig6Zq6N5zkiS8da15");
  const recipientAccount = await createAccount(
    connection,
    payer,
    mintPubkey,
    recipientPubkey,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
  console.log("✅ Recipient token account created.");

  // Transfer with 2.5% fee
  const transferAmount = BigInt(1_000_000) * BigInt(10 ** decimals);
  const rawFee = (transferAmount * BigInt(feeBasisPoints)) / BigInt(10_000);
  const fee = rawFee > maxFee ? maxFee : rawFee;

  await transferCheckedWithFee(
    connection,
    payer,
    ownerAccount,
    mintPubkey,
    recipientAccount,
    owner, // ✅ SIGNER (was owner.publicKey)
    transferAmount,
    decimals,
    fee,
    [], 
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
  console.log("✅ Transferred 1M tokens with fee.");

  // Correct withdrawal: single PublicKey, empty signer array
  const sigWithdraw = await withdrawWithheldTokensFromAccounts(
    connection,
    payer,
    mintPubkey,
    recipientAccount,
    payer.publicKey,
    [],
    [recipientAccount],
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
  console.log("✅ Withheld fee withdrawn:", sigWithdraw);
  console.log("✅ Withheld fee withdrawn to recipient.");

  // Revoke mint & freeze authorities
  await setAuthority(connection, payer, mintPubkey, payer.publicKey, AuthorityType.MintTokens, null, [], undefined, TOKEN_2022_PROGRAM_ID);
  // await setAuthority(connection, payer, mintPubkey, payer.publicKey, AuthorityType.FreezeAccount, null, [], undefined, TOKEN_2022_PROGRAM_ID);
  console.log("✅ Mint and freeze authorities revoked.");

  console.log("🎉 Token-2022 deployment complete!");
})();
