import {
    Connection,
    Keypair,
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
    getOrCreateAssociatedTokenAccount,
    mintTo,
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
  
    // === Create mint with Transfer Fee extension ===
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
        payer.publicKey, // Fee Config Authority
        payer.publicKey, // Withdraw Authority
        feeBasisPoints,
        maxFee,
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializeMintInstruction(
        mintPubkey,
        decimals,
        payer.publicKey, // Mint Authority
        null,            // No Freeze Authority
        TOKEN_2022_PROGRAM_ID
      )
    );
  
    await sendAndConfirmTransaction(connection, tx0, [payer, mintKeypair]);
    console.log("✅ Mint created with Transfer Fee extension.");
    console.log("🎯 Mint Public Key:", mintPubkey.toBase58());
  
    // === Get payer's token account and mint 150M tokens ===
    const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintPubkey,
      payer.publicKey,
      false,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
  
    const totalSupply = BigInt(150_000_000) * BigInt(10 ** decimals);
    await mintTo(connection, payer, mintPubkey, payerTokenAccount.address, payer.publicKey, totalSupply, [], undefined, TOKEN_2022_PROGRAM_ID);
    console.log("✅ Minted 150 million tokens to your own token account:", payerTokenAccount.address.toBase58());
  
    // === Revoke mint authority (no freeze authority to revoke) ===
    await setAuthority(
      connection,
      payer,
      mintPubkey,
      payer.publicKey,
      AuthorityType.MintTokens,
      null,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    console.log("✅ Mint authority revoked (token supply capped).");
  
    console.log("🎉 Deployment complete!");
  })();
  