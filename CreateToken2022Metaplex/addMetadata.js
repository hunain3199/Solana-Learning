import {
	createV1,
	findMetadataPda,
	mplTokenMetadata,
	TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { createMint, mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import { publicKey, signerIdentity, percentAmount, generateSigner } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import bs58 from "bs58";
import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

// ✅ Decode Base58 and create Keypair
const PRIVATE_KEY_BASE58 = "4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1";
const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_BASE58));

console.log("✅ Using Wallet Address:", wallet.publicKey.toBase58());

// ✅ Initialize UMI with Devnet
const umi = createUmi("https://api.devnet.solana.com")
	.use(mplTokenMetadata())
	.use(mplToolbox());

// ✅ Convert Web3.js Keypair to UMI Signer
const umiWallet = generateSigner(umi, wallet.secretKey);
umi.use(signerIdentity(umiWallet));

console.log("✅ UMI Identity Set:", umi.identity);

// ✅ Your SPL Token mint address
const mint = publicKey("AVLnUJRn3DZELKLHvJ9iuedLuBgGxbviGkdeTXpQktb2");

// ✅ Token metadata
const tokenMetadata = {
	name: "Hunain Token",
	symbol: "HT",
	uri: "https://go.web3approved.com/AYRjt",
};

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

// ✅ Function to add metadata
async function addMetadata() {
	try {
		// Check if the wallet has enough balance before proceeding
		const hasEnoughBalance = await checkBalance();
		if (!hasEnoughBalance) {
			console.log("❌ Transaction aborted due to insufficient funds.");
			return;
		}

		console.log("🔍 Checking metadata account existence...");
		const metadataAccountAddress = await findMetadataPda(umi, { mint });

		console.log("📌 Metadata Account Address:", metadataAccountAddress.toString());

		// Check if the metadata already exists before proceeding
		const metadataExists = await umi.rpc.getAccount(metadataAccountAddress);
		if (metadataExists) {
			console.log("⚠️ Metadata already exists! Aborting operation.");
			return;
		}

		console.log("🚀 Sending transaction...");
		const tx = await createV1(umi, {
			mint,
			authority: umi.identity, // Make sure this is the correct mint authority
			payer: umi.identity,
			updateAuthority: umi.identity, // Ensure update authority is set correctly
			name: tokenMetadata.name,
			symbol: tokenMetadata.symbol,
			uri: tokenMetadata.uri,
			sellerFeeBasisPoints: percentAmount(5.5),
			tokenStandard: TokenStandard.Fungible,
		}).sendAndConfirm(umi, { skipPreflight: false });

		console.log(`✅ Transaction successful: https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`);
	} catch (error) {
		console.error("🚨 Error sending transaction:", error);

		// If available, log transaction errors
		if (error.getLogs) {
			console.log("📝 Transaction Logs:", await error.getLogs());
		}
	}
}

// ✅ Run the function
addMetadata();
