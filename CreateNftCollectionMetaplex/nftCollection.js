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
  "https://x5tui5g3x7q34odc52vm5vkdm5z6osukrwz37zt5skedbo3vigea.arweave.net/v2dEdNu_4b44Yu6qztVDZ3PnSoqNs7_mfZKIMLt1QYg", // Example URI 1
  "https://lzkpufvlduynu7lc4qwkkrsk3tgeu3blkul4or5kqhrezdpa5paq.arweave.net/XlT6FqsdMNp9YuQspUZK3MxKbCtVF8dHqoHiTI3g68E", // Example URI 2
  "https://t5prgxdcl5rexphkmvu4ugxsb7pjbu37k3wuyvdnmvrfemosgv2q.arweave.net/n18TXGJfYku86mVpyhryD96Q039W7UxUbWViUjHSNXU", // Example URI 3
];

const COLLECTION_NAME = "Hunain NFT Collection";
const COLLECTION_SYMBOL = "HColl";

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
