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
  } from "@metaplex-foundation/mpl-token-metadata";
  import bs58 from "bs58";
  
  async function main() {
    const connection = new Connection(clusterApiUrl("testnet"), "confirmed");
  
    const PRIVATE_KEY_BASE58 =
      "4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1";
    const ardriveLink =
      "https://app.ardrive.io/#/file/f509832b-345a-4c85-8e69-8369db1e3781/view";
  
    const payer = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_BASE58));
    console.log("Wallet:", payer.publicKey.toBase58());
  
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
  
    const totalSupply = BigInt(100_000_000) * BigInt(10 ** 9);
    await mintTo(connection, payer, mint, ata.address, payer.publicKey, totalSupply);
    console.log("Mint Address:", mint.toBase58());
  
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer()
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    console.log("Metadata PDA:", metadataPDA.toBase58());
  
    const tokenData: DataV2 = {
      name: "EckoSync",
      symbol: "ESYNC",
      uri: ardriveLink, // ← this is the ArDrive HTML viewer link
      sellerFeeBasisPoints: 0,
      creators: [
        { address: payer.publicKey, verified: true, share: 100 }
      ],
      collection: null,
      uses: null
    };
  
    const metadataIx = createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint,
        mintAuthority: payer.publicKey,
        payer: payer.publicKey,
        updateAuthority: payer.publicKey
      },
      {
        createMetadataAccountArgsV3: {
          data: tokenData,
          isMutable: true,
          collectionDetails: null
        }
      }
    );
  
    const tx = new Transaction().add(metadataIx);
    const txid = await sendAndConfirmTransaction(connection, tx, [payer]);
    console.log("✅ Metadata added. Tx:", txid);
  }
  
  main().catch(console.error);
  