import {
    Connection,
    clusterApiUrl,
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction
  } from "@solana/web3.js";
  import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo
  } from "@solana/spl-token";
  import {
    createCreateMetadataAccountV3Instruction,
    DataV2,
    PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID
  } from "@metaplex-foundation/mpl-token-metadata"; // make sure you're on v2.x
  import bs58 from "bs58";
  
  async function main() {
    const connection = new Connection(clusterApiUrl("testnet"), "confirmed");
    const PRIVATE_KEY_BASE58 = "4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1";
    const payer = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_BASE58));
    console.log("Wallet:", payer.publicKey.toBase58());
  
    // Step 1: mint setup
    const mint = await createMint(
      connection,
      payer,
      payer.publicKey,
      payer.publicKey,
      9
    );
  
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey
    );
  
    await mintTo(
      connection,
      payer,
      mint,
      ata.address,
      payer.publicKey,
      BigInt(100_000_000) * BigInt(10 ** 9)
    );
  
    console.log("Mint Address:", mint.toBase58());
  
    // Step 2: derive metadata PDA
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
  
    // Step 3: Build metadata
    const tokenData: DataV2 = {
      name: "EckoSync",
      symbol: "ESYNC",
      uri: "https://fuchsia-known-mollusk-20.mypinata.cloud/ipfs/bafkreigk6wmwk4urmfj3axf7x5aqc6xh3ob4uf42pq3z4xjy4pzhqcjf7u",
      sellerFeeBasisPoints: 0,
      // 🔑 Here's the fix — use PublicKey, *not* string
      creators: [
        { address: payer.publicKey, verified: true, share: 100 }
      ],
      collection: null,
      uses: null
    };
  
    // Step 4: metadata instruction
    const metadataIx = createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint,
        mintAuthority: payer.publicKey,
        payer: payer.publicKey,
        updateAuthority: payer.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: tokenData,
          isMutable: true,
          collectionDetails: null
        }
      }
    );
  
    // Step 5: send meta + mint instructions together
    const tx = new Transaction().add(metadataIx);
    const txid = await sendAndConfirmTransaction(connection, tx, [payer]);
    console.log("✅ Metadata added with tx:", txid);
  }
  
  main().catch(console.error);
  