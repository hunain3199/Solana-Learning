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
    createInitializeMetadataPointerInstruction,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    setAuthority,
    AuthorityType,
  } from '@solana/spl-token';
  import {
    createInitializeInstruction,
    createUpdateFieldInstruction,
  } from '@solana/spl-token-metadata';
  import bs58 from 'bs58';
  
  (async () => {
    const connection = new Connection(clusterApiUrl('testnet'), 'confirmed');
    const payer = Keypair.fromSecretKey(
      bs58.decode('4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1')
    );
  
    const balance = await connection.getBalance(payer.publicKey);
    if (balance < 0.01 * LAMPORTS_PER_SOL) {
      throw new Error("Insufficient SOL in payer account.");
    }
  
    const mint = Keypair.generate();
    const decimals = 9;
  
    // Calculate space needed for extensions
    const baseLen = getMintLen([ExtensionType.MetadataPointer, ExtensionType.TransferFeeConfig]);
    const lamports = await connection.getMinimumBalanceForRentExemption(baseLen);
  
    const feeBps = 250;           // 2.5 % transfer fee
    const maxFee = BigInt(5_000_000_000); // max fee: 5 tokens (with 9 decimals)
  
    console.log("🚀 Creating new EckoSync token with metadata and transfer fees...");
  
    // build transaction in correct order
    const tx = new Transaction()
      .add(
        SystemProgram.createAccount({
          fromPubkey: payer.publicKey,
          newAccountPubkey: mint.publicKey,
          space: baseLen,
          lamports,
          programId: TOKEN_2022_PROGRAM_ID
        })
      )
      .add(
        // initialize MetadataPointer extension
        createInitializeMetadataPointerInstruction(
          mint.publicKey,
          payer.publicKey,
          mint.publicKey,
          TOKEN_2022_PROGRAM_ID
        )
      )
      .add(
        // initialize transfer fee configuration
        createInitializeTransferFeeConfigInstruction(
          mint.publicKey,
          payer.publicKey,
          payer.publicKey,
          feeBps,
          maxFee,
          TOKEN_2022_PROGRAM_ID
        )
      )
      .add(
        // initialize the mint itself
        createInitializeMintInstruction(
          mint.publicKey,
          decimals,
          payer.publicKey,
          null,
          TOKEN_2022_PROGRAM_ID
        )
      );
  
    // send transaction
    await sendAndConfirmTransaction(connection, tx, [payer, mint]);
    console.log('✅ Mint with transfer fees and metadata pointer created:', mint.publicKey.toBase58());
  
    // Now add metadata in a separate transaction
    console.log("📝 Adding metadata...");
    
    // Add more SOL to the mint account for metadata storage
    const additionalRent = await connection.getMinimumBalanceForRentExemption(1000); // Extra space for metadata
    const transferTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: mint.publicKey,
        lamports: additionalRent
      })
    );
    
    await sendAndConfirmTransaction(connection, transferTx, [payer]);
    console.log("✅ Added additional SOL for metadata storage");
    
    const metadataTx = new Transaction().add(
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mint.publicKey,
        metadata: mint.publicKey,
        mintAuthority: payer.publicKey,
        updateAuthority: payer.publicKey,
        name: 'EckoSync',
        symbol: 'ESYNC',
        uri: 'https://coral-raw-donkey-280.mypinata.cloud/ipfs/bafkreiea56mfvum7nc27xzwx67ykp7gfkmd4qxfskd6cdiuhfk5rt23rlq'
      }),
      createUpdateFieldInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mint.publicKey,
        updateAuthority: payer.publicKey,
        field: 'description',
        value: 'EckoSync Token - A revolutionary SPL token on Solana blockchain with transfer fees'
      })
    );
  
    await sendAndConfirmTransaction(connection, metadataTx, [payer]);
    console.log('✅ Metadata added successfully!');
  
    // mint supply to payer's ATA
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint.publicKey,
      payer.publicKey,
      false,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    await mintTo(
      connection,
      payer,
      mint.publicKey,
      ata.address,
      payer.publicKey,
      BigInt(150_000_000) * BigInt(10 ** decimals),
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    console.log('✅ Minted 150 million tokens to:', ata.address.toBase58());
  
    // revoke mint authority to lock the supply
    await setAuthority(
      connection,
      payer,
      mint.publicKey,
      payer.publicKey,
      AuthorityType.MintTokens,
      null,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    console.log('✅ Mint authority revoked.');
  
    console.log('🎉 Deployment complete!');
    console.log('💰 Transfer Fee: 2.5% (max 5 tokens)');
    console.log('📊 Total Supply: 150,000,000 tokens');
    console.log('📝 Token Name: EckoSync');
    console.log('🔤 Token Symbol: ESYNC');
    console.log('🔗 Metadata URI: https://coral-raw-donkey-280.mypinata.cloud/ipfs/bafkreiea56mfvum7nc27xzwx67ykp7gfkmd4qxfskd6cdiuhfk5rt23rlq');
  })(); 