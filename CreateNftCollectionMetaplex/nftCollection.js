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

// 🖼 NFT Metadata URIs for the collection
const METADATA_URIS = [
  "https://fhywitw4j4tbbgr4bmddvnbd2fwe7tybe6y6oj7cqyzyqnwr6ivq.arweave.net/KfFkTtxPJhCaPAsGOrQj0WxPzwEnsecn4oYziDbR8is", // Example URI 1
  "https://zplcyq7xeqfuf5rrnrhzcdjhts7kdlpae62zf373iwxluhntmofq.arweave.net/y9YsQ_ckC0L2MWxPkQ0nnL6hreAntZLv-0Wuuh2zY4s", // Example URI 2
  "https://5ppcnvewvph5gv6sy7qyjhpi63p55gx6rcy4qxvww6h74ni3ekba.arweave.net/694m1Jarz9NX0sfhhJ3o9t_emv6IschetreP_jUbIoI", // Example URI 3
];

const COLLECTION_NAME = "BRDIGITECH Collection";
const COLLECTION_SYMBOL = "BRD";

async function mintNFTs() {
  try {
    console.log("🚀 Minting NFT Collection...");

    // Loop through the metadata URIs and mint each NFT
    for (let i = 0; i < METADATA_URIS.length; i++) {
      const METADATA_URI = METADATA_URIS[i];

      // 🌟 Create the Mint Account and Mint NFT
      const { nft } = await metaplex.nfts().create({
        uri: METADATA_URI, 
        name: `${COLLECTION_NAME} #${i + 1}`, // Naming each NFT in the collection
        symbol: COLLECTION_SYMBOL,
        sellerFeeBasisPoints: 500, // 5% royalty
        isMutable: true, // Make NFT metadata mutable
        maxSupply: 1, // Limit supply to 1 per NFT
        mintAuthority: wallet, // Set mint authority
        updateAuthority: wallet, // Set update authority
      });

      console.log(`🎉 NFT #${i + 1} Minted Successfully!`);
      console.log("📌 NFT Address:", nft.address.toBase58());
    }

    console.log("🎉 All NFTs in the collection have been minted successfully!");
  } catch (error) {
    console.error("❌ Error Minting NFTs:", error);
  }
}

// 🔥 Run the NFT Minting Function
mintNFTs();
