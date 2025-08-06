import {
  Connection,
  clusterApiUrl,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
  AuthorityType,
} from "@solana/spl-token";
import {
  createCreateMetadataAccountV3Instruction,
  DataV2,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import bs58 from "bs58";

async function main() {
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

  const PRIVATE_KEY_BASE58 =
    "4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1";
  const payer = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_BASE58));
  console.log("Wallet:", payer.publicKey.toBase58());

  // Step 1: mint setup
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey, // mint authority
    payer.publicKey, // freeze authority
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
    BigInt(150_000_000) * BigInt(10 ** 9)
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
    uri: "https://coral-raw-donkey-280.mypinata.cloud/ipfs/bafkreiea56mfvum7nc27xzwx67ykp7gfkmd4qxfskd6cdiuhfk5rt23rlq",
    sellerFeeBasisPoints: 0,
    creators: [{ address: payer.publicKey, verified: true, share: 100 }],
    collection: null,
    uses: null,
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
        collectionDetails: null,
      },
    }
  );

  // Step 5: send metadata transaction
  const tx = new Transaction().add(metadataIx);
  const txid = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log("✅ Metadata added with tx:", txid);

  // ✅ Step 6: Remove mint authority
  await setAuthority(
    connection,
    payer,
    mint,
    payer.publicKey,
    AuthorityType.MintTokens,
    null
  );

  // ✅ Step 7: Remove freeze authority (optional but recommended)
  await setAuthority(
    connection,
    payer,
    mint,
    payer.publicKey,
    AuthorityType.FreezeAccount,
    null
  );

  console.log("❌ Mint and freeze authorities removed. Token is now immutable.");
}

main().catch(console.error);


//  spl token with disable mint and freeze authority
