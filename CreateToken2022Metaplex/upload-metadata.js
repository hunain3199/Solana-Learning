import fs from 'fs';
import path from 'path';

// This is a helper script to show how to upload metadata to IPFS
// You can use services like Pinata, NFT.Storage, or Infura IPFS

const metadata = {
  "name": "EckoSync",
  "symbol": "ESYNC",
  "description": "EckoSync Token - A revolutionary SPL token on Solana blockchain",
  "image": "https://your-image-url.com/token-image.png",
  "external_url": "https://your-website.com",
  "attributes": [
    {
      "trait_type": "Token Standard",
      "value": "SPL Token 2022"
    },
    {
      "trait_type": "Transfer Fee",
      "value": "2.5%"
    },
    {
      "trait_type": "Max Fee",
      "value": "5 tokens"
    },
    {
      "trait_type": "Total Supply",
      "value": "150,000,000"
    },
    {
      "trait_type": "Decimals",
      "value": "9"
    }
  ],
  "properties": {
    "files": [
      {
        "type": "image/png",
        "uri": "https://your-image-url.com/token-image.png"
      }
    ],
    "category": "image",
    "creators": [
      {
        "address": "YOUR_WALLET_ADDRESS_HERE",
        "share": 100
      }
    ]
  }
};

// Save metadata to file
fs.writeFileSync('token-metadata.json', JSON.stringify(metadata, null, 2));

console.log('✅ Metadata saved to token-metadata.json');
console.log('');
console.log('📝 Next steps:');
console.log('1. Upload token-metadata.json to IPFS (Pinata, NFT.Storage, etc.)');
console.log('2. Get the IPFS URI (e.g., ipfs://Qm... or https://gateway.pinata.cloud/ipfs/Qm...)');
console.log('3. Update the uri field in tt.js with your IPFS URI');
console.log('4. Run your token creation script');
console.log('');
console.log('🔗 Popular IPFS services:');
console.log('- Pinata: https://pinata.cloud/');
console.log('- NFT.Storage: https://nft.storage/');
console.log('- Infura IPFS: https://infura.io/product/ipfs'); 