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
    createInitializeMetadataPointerInstruction,
  } from '@solana/spl-token';
  import {
    createInitializeInstruction,
    createUpdateFieldInstruction,
    pack
  } from '@solana/spl-token-metadata';
  import bs58 from 'bs58';
  
  (async () => {
    const payer = Keypair.fromSecretKey(
      bs58.decode("4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1")
    );
    const connection = new Connection(clusterApiUrl("testnet"), "confirmed");
  
    // Replace this with your actual mint address
    const mintAddress = "ATtmKbdCF84s5VQbygS5vpc4q2UZmzJx1BcjxA6FRfhe"; // Replace with your mint address
    
    // Define metadata for your token
    const metadata = {
      name: 'EckoSync',
      symbol: 'ESYNC',
      uri: 'https://coral-raw-donkey-280.mypinata.cloud/ipfs/bafkreiea56mfvum7nc27xzwx67ykp7gfkmd4qxfskd6cdiuhfk5rt23rlq',
      additionalMetadata: []
    };
    
    // Create a new metadata account
    const metadataKeypair = Keypair.generate();
    const metadataSpace = 1 + 32 + 32 + 32 + 200 + 200 + 200; // Approximate space for metadata
    const metadataRent = await connection.getMinimumBalanceForRentExemption(metadataSpace);
    
    console.log("🔧 Adding metadata to existing token...");
    console.log("🎯 Mint Address:", mintAddress);
    
    const tx = new Transaction().add(
      // Create metadata account
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: metadataKeypair.publicKey,
        space: metadataSpace,
        lamports: metadataRent,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      // Initialize metadata
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mintAddress,
        metadata: metadataKeypair.publicKey,
        mintAuthority: payer.publicKey,
        updateAuthority: payer.publicKey,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri
      }),
      // Add custom metadata field
      createUpdateFieldInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: metadataKeypair.publicKey,
        updateAuthority: payer.publicKey,
        field: 'description',
        value: 'EckoSync Token - A revolutionary SPL token on Solana blockchain with transfer fees'
      })
    );
  
    await sendAndConfirmTransaction(connection, tx, [payer, metadataKeypair]);
    console.log("✅ Metadata added successfully!");
    console.log("📝 Token Name:", metadata.name);
    console.log("🔤 Token Symbol:", metadata.symbol);
    console.log("🔗 Metadata URI:", metadata.uri);
    console.log("📋 Metadata Account:", metadataKeypair.publicKey.toBase58());
  })(); 