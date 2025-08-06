import {
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    clusterApiUrl,
    LAMPORTS_PER_SOL
  } from '@solana/web3.js';
  import {
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    getMintLen,
    createInitializeMetadataPointerInstruction,
    createInitializeMintInstruction,
    createInitializeTransferFeeConfigInstruction,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    setAuthority,
    AuthorityType
  } from '@solana/spl-token';
  import {
    createInitializeInstruction,
    createUpdateFieldInstruction,
    pack
  } from '@solana/spl-token-metadata';
  import bs58 from 'bs58';
  
  (async () => {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const payer = Keypair.fromSecretKey(
      bs58.decode('4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1')  // fund with ≥0.05 SOL on devnet
    );
  
    const mint = Keypair.generate();
    const decimals = 9;
  
    // metadata to embed in the mint
    const metadata = {
      mint: mint.publicKey,
      name: 'EckoSync',
      symbol: 'ESYNC',
      uri: 'https://coral-raw-donkey-280.mypinata.cloud/ipfs/bafkreiea56mfvum7nc27xzwx67ykp7gfkmd4qxfskd6cdiuhfk5rt23rlq',
      additionalMetadata: []
    };
  
    // calculate the exact space needed: pointer + overhead + metadata payload
    const baseLen = getMintLen([ExtensionType.MetadataPointer]);
    const metadataBytes = pack(metadata).length;
    const overhead = 2 /* TYPE_SIZE */ + 4 /* LENGTH_SIZE */;
    const totalSpace = baseLen + overhead + metadataBytes;
    const lamports = await connection.getMinimumBalanceForRentExemption(totalSpace);
  
    const feeBps = 250;           // 2.5 % transfer fee
    const maxFee = BigInt(5_000_000_000); // max fee: 5 tokens (with 9 decimals)
  
    // build transaction in correct order
    const tx = new Transaction()
      .add(
        SystemProgram.createAccount({
          fromPubkey: payer.publicKey,
          newAccountPubkey: mint.publicKey,
          space: totalSpace,
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
        // initialize the mint itself
        createInitializeMintInstruction(
          mint.publicKey,
          decimals,
          payer.publicKey,
          null,
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
        // write the metadata into the mint account
        createInitializeInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          mint: mint.publicKey,
          metadata: mint.publicKey,
          mintAuthority: payer.publicKey,
          updateAuthority: payer.publicKey,
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadata.uri
        })
      )
      .add(
        // optional: add a custom field
        createUpdateFieldInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mint.publicKey,
          updateAuthority: payer.publicKey,
          field: 'notes',
          value: 'Token‑2022 with embedded metadata'
        })
      );
  
    // send transaction
    await sendAndConfirmTransaction(connection, tx, [payer, mint]);
    console.log('Mint with metadata created:', mint.publicKey.toBase58());
  
    // mint supply to payer’s ATA
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
  
    // revoke mint and freeze authorities to lock the supply
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
    await setAuthority(
      connection,
      payer,
      mint.publicKey,
      payer.publicKey,
      AuthorityType.FreezeAccount,
      null,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    console.log('Mint and freeze authorities revoked.');
  })();
  