import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

// 🔑 Your Base58-encoded Private Key
const PRIVATE_KEY_BASE58 =
  "4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1";

// 🎯 Decode Base58 Private Key and Create a Wallet
const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_BASE58));

console.log("✅ Using Wallet Address:", wallet.publicKey.toBase58());

// 🔗 Connect to Solana Devnet
const connection = new Connection(clusterApiUrl("devnet"));

// 🎨 Initialize Metaplex
const metaplex = Metaplex.make(connection).use(keypairIdentity(wallet));

async function mintNFT() {
  try {
      console.log("🚀 Minting NFT...");

      // Replace with your uploaded metadata URI
      const METADATA_URI = "https://rv7ujzn3s4nolx3gabyfrg4ikngqg5qqv6be323idutiaqkrzfxa.arweave.net/jX9E5buXGuXfZgBwWJuIU00DdhCvgk3raB0mgEFRyW4";

      // 🌟 Mint NFT
      const { nft } = await metaplex.nfts().create({
          uri: METADATA_URI, 
          name: "My First NFT",
          symbol: "MYNFT",
          sellerFeeBasisPoints: 500, // 5% royalty
          isMutable: true, // Make NFT metadata mutable
          maxSupply: 1, // Limit supply to 1
          mintAuthority: wallet, // Set mint authority
          updateAuthority: wallet, // Set update authority
      });

      console.log("🎉 NFT Minted Successfully!");
      console.log("📌 NFT Address:", nft.address.toBase58());
  } catch (error) {
      console.error("❌ Error Minting NFT:", error);
  }
}


// 🔥 Run the NFT Minting Function
mintNFT();
