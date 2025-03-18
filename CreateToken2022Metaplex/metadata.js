import {
    updateV1,
    findMetadataPda,
    createV1,
    mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { 
    publicKey, signerIdentity, percentAmount, generateSigner 
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import bs58 from "bs58";
import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

// ✅ Decode Base58 and create Keypair
const PRIVATE_KEY_BASE58 = "4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1";
const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_BASE58));

console.log("✅ Using Wallet Address:", wallet.publicKey.toBase58());

// ✅ Initialize UMI with Devnet
const umi = createUmi("https://api.devnet.solana.com")
    .use(mplTokenMetadata());

// ✅ Convert Web3.js Keypair to UMI Signer
const umiWallet = generateSigner(umi, wallet.secretKey);
umi.use(signerIdentity(umiWallet));

console.log("✅ UMI Identity Set:", umi.identity);

// ✅ Your SPL Token mint address
const mint = publicKey("AVLnUJRn3DZELKLHvJ9iuedLuBgGxbviGkdeTXpQktb2");

// ✅ Solana Connection for checking balance
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// ✅ Function to check balance
async function checkBalance() {
    try {
        const balanceLamports = await connection.getBalance(wallet.publicKey);
        const balanceSOL = balanceLamports / LAMPORTS_PER_SOL;
        console.log(`💰 Wallet Balance: ${balanceSOL.toFixed(4)} SOL`);

        if (balanceSOL < 0.01) {
            console.log("⚠️ Low balance detected! Please add more SOL to your wallet.");
            return false;
        }
        return true;
    } catch (error) {
        console.error("🚨 Error checking balance:", error);
        return false;
    }
}

// ✅ Function to create metadata
async function createMetadata() {
    try {
        console.log("🚀 Creating metadata...");

        // Define metadata properties
        const metadataData = {
            mint,
            updateAuthority: umi.identity,
            name: "MyToken",
            symbol: "MTK",
            uri: "https://example.com/metadata.json", // Replace with your actual metadata URI
            sellerFeeBasisPoints: percentAmount(5), // 5% royalties
        };

        const tx = await createV1(umi, metadataData)
            .sendAndConfirm(umi, { skipPreflight: false });

        console.log(`✅ Metadata Created: https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`);
    } catch (error) {
        console.error("🚨 Error creating metadata:", error);
    }
}

// ✅ Function to update metadata
async function updateMetadata() {
    try {
        console.log("🔍 Fetching metadata account...");
        
        const metadataResult = findMetadataPda(umi, { mint });
        console.log("Debug findMetadataPda Result:", metadataResult);
        
        if (!metadataResult || metadataResult.length === 0) {
            throw new Error("Metadata PDA could not be found. Check if mint address is correct.");
        }
        
        const [metadataAccountAddress] = metadataResult;
        console.log("📌 Metadata Account Address:", metadataAccountAddress.toString());

        if (!metadataAccountAddress) {
            throw new Error("Metadata PDA is undefined. Ensure mint address is correct.");
        }

        // Check if metadata exists
        const metadataAccount = await umi.rpc.getAccount(metadataAccountAddress);
        if (!metadataAccount || metadataAccount.exists === false) {
            console.log("❌ Metadata does not exist! Creating it first...");
            await createMetadata();
        }

        console.log("🚀 Updating metadata...");
        const tx = await updateV1(umi, {
            mint,
            authority: umi.identity,
            name: "MyUpdatedToken",
            symbol: "MUTK",
            uri: "https://go.web3approved.com/AYRjt",
            sellerFeeBasisPoints: percentAmount(7),
        }).sendAndConfirm(umi, { skipPreflight: false });

        console.log(`✅ Metadata Updated: https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`);
    } catch (error) {
        console.error("🚨 Error updating metadata:", error);
    }
}


// ✅ Run the function
updateMetadata();
