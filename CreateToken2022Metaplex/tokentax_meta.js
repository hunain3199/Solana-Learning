import {
    Connection, Keypair, SystemProgram, Transaction,
    sendAndConfirmTransaction, clusterApiUrl, LAMPORTS_PER_SOL,
    PublicKey
  } from "@solana/web3.js";
  import {
    ExtensionType, TOKEN_2022_PROGRAM_ID, getMintLen,
    createInitializeMetadataPointerInstruction,
    createInitializeMintInstruction,
    createInitializeTransferFeeConfigInstruction,
    getOrCreateAssociatedTokenAccount, mintTo,
    setAuthority, AuthorityType, TYPE_SIZE, LENGTH_SIZE
  } from "@solana/spl-token";
  import {
    createInitializeInstruction, createUpdateFieldInstruction, pack
  } from "@solana/spl-token-metadata";
  import bs58 from "bs58";
  
  (async () => {
    const payer = Keypair.fromSecretKey(bs58.decode("4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1"));
    const conn = new Connection(clusterApiUrl("testnet"), "confirmed");
    const bal = await conn.getBalance(payer.publicKey);
    if (bal < 0.05 * LAMPORTS_PER_SOL) throw new Error("Fund payer with ≥0.05 SOL");
  
    const decimals = 9, feeBps = 250, maxFee = BigInt(5_000_000_000);
    const metadata = {
      name: "EckoSync",
      symbol: "ESYNC",
      uri: "https://coral-raw-donkey-280.mypinata.cloud/ipfs/bafkreiea56mfvum7nc27xzwx67ykp7gfkmd4qxfskd6cdiuhfk5rt23rlq",
      additionalMetadata: []
    };
  
    // Step 1: compute base space with only MetadataPointer extension
    const baseLen = getMintLen([ExtensionType.MetadataPointer]);
  
    // Estimate metadata size for rent pace
    const dummy = { mint: Keypair.generate().publicKey, ...metadata };
    const metadataSize = TYPE_SIZE + LENGTH_SIZE + pack(dummy).length;
    const totalSpace = baseLen + metadataSize;
    const lam = await conn.getMinimumBalanceForRentExemption(totalSpace);
  
    const mint = Keypair.generate();
  
    // Step 2: Build initialization tx
    const tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: totalSpace,
        lamports: lam,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeMetadataPointerInstruction(
        mint.publicKey, payer.publicKey, mint.publicKey, TOKEN_2022_PROGRAM_ID
      ),
      createInitializeMintInstruction(
        mint.publicKey, decimals, payer.publicKey, null, TOKEN_2022_PROGRAM_ID
      ),
      createInitializeTransferFeeConfigInstruction(
        mint.publicKey, payer.publicKey, payer.publicKey, feeBps, maxFee, TOKEN_2022_PROGRAM_ID
      ),
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mint.publicKey,
        metadata: mint.publicKey,
        mintAuthority: payer.publicKey,
        updateAuthority: payer.publicKey,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
      }),
      createUpdateFieldInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mint.publicKey,
        updateAuthority: payer.publicKey,
        field: "notes",
        value: "Metadata via Token‑2022 extensions"
      })
    );
  
    await sendAndConfirmTransaction(conn, tx, [payer, mint]);
    console.log("✅ Token2022 mint created with metadata:", mint.publicKey.toBase58());
  
    // Step 3: Mint tokens to ATA
    const ata = await getOrCreateAssociatedTokenAccount(
      conn, payer, mint.publicKey, payer.publicKey, false,
      undefined, undefined, TOKEN_2022_PROGRAM_ID
    );
    await mintTo(
      conn, payer, mint.publicKey, ata.address, payer.publicKey,
      BigInt(150_000_000) * BigInt(10 ** decimals),
      [], undefined, TOKEN_2022_PROGRAM_ID
    );
    console.log("✅ Minted 150M tokens to ATA:", ata.address.toBase58());
  
    // Step 4: revoke authorities
    await setAuthority(conn, payer, mint.publicKey, payer.publicKey,
      AuthorityType.MintTokens, null, [], undefined, TOKEN_2022_PROGRAM_ID);
    await setAuthority(conn, payer, mint.publicKey, payer.publicKey,
      AuthorityType.FreezeAccount, null, [], undefined, TOKEN_2022_PROGRAM_ID);
    console.log("🔒 Mint & freeze authorities revoked — Done!");
  })();
  