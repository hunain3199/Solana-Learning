import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { createMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import * as mplTokenMetadata from "@metaplex-foundation/mpl-token-metadata";
import bs58 from "bs58";

// ✅ METADATA PROGRAM ID
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

async function createSPLTokenWithMetadata() {
    try {
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

        // 🎯 Load Wallet
        const PRIVATE_KEY_BASE58 = "4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1";
        const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_BASE58));

        console.log("✅ Wallet Address:", wallet.publicKey.toBase58());

        // 🪙 Create the Token Mint
        const mint = await createMint(
            connection,
            wallet,
            wallet.publicKey,
            wallet.publicKey,
            9,
            undefined,
            TOKEN_2022_PROGRAM_ID
        );

        console.log("✅ Token Mint Address:", mint.toBase58());

        // 🔥 Debug METADATA_PROGRAM_ID
        console.log("METADATA_PROGRAM_ID:", METADATA_PROGRAM_ID.toBase58());

        // 🔥 Get Metadata PDA
        const [metadataPDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
            ],
            METADATA_PROGRAM_ID
        );

        console.log("✅ Metadata PDA:", metadataPDA.toBase58());

        const metadataData = {
            name: "Token Name",
            symbol: "SYMBOL",
            uri: "https://uxuvorvfbryskrqyrtqls2imjznxae36lafn5unjyajobefel62q.arweave.net/pelXRqUMcSVGGIzguWkMTltwE35YCt7RqcAS4JCkX7U", // URI to the token metadata
            sellerFeeBasisPoints: 500,
            creators: null, // or an array of creator objects if applicable
            collection: null, // or provide collection details if you have a collection
            uses: null, // You can set this to null if not applicable
            collectionDetails: null, // Ensure collectionDetails is included
        };

        // ✅ Create Metadata Instruction using the correct function for version 2.13.0
        const metadataInstruction = mplTokenMetadata.createCreateMetadataAccountV3Instruction(
            {
                metadata: metadataPDA,
                mint: mint,
                mintAuthority: wallet.publicKey,
                payer: wallet.publicKey,
                updateAuthority: wallet.publicKey,
            },
            {
                createMetadataAccountArgsV3: {
                    data: metadataData,
                    isMutable: true,
                }
            }
        );

        // 🔥 Send Transaction
        const transaction = new Transaction().add(metadataInstruction);
        transaction.feePayer = wallet.publicKey;

        // Fetch the latest blockhash just before sending the transaction
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        // Send the transaction with retries
        try {
            const txid = await connection.sendAndConfirmTransaction(transaction, [wallet], {
                commitment: "confirmed",
                preflightCommitment: "processed",
                maxRetries: 5,  // Set retry count to handle timeouts or expired blockhashes
            });
            console.log("✅ Metadata Added! Transaction ID:", txid);
        } catch (retryError) {
            console.error("❌ Error during transaction retry:", retryError);
        }

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

createSPLTokenWithMetadata();
