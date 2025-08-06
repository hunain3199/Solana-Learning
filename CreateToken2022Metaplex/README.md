# SPL Token 2022 with Metadata - EckoSync

This project contains scripts to create SPL Token 2022 tokens with transfer fees and metadata support.

## 🎯 **Successfully Created Token**

Your EckoSync token has been successfully created with the following specifications:

- **Mint Address:** `ATtmKbdCF84s5VQbygS5vpc4q2UZmzJx1BcjxA6FRfhe`
- **Name:** EckoSync
- **Symbol:** ESYNC
- **Decimals:** 9
- **Total Supply:** 150,000,000 tokens
- **Transfer Fee:** 2.5% (max 5 tokens)
- **Network:** Solana Testnet

## 📁 **Available Scripts**

### 1. `tt.js` - Basic Token with Transfer Fees ✅
Creates an SPL Token 2022 with transfer fees only (no metadata).
```bash
node tt.js
```

### 2. `create-token-with-metadata.js` - Complete Token with Metadata
Creates an SPL Token 2022 with both transfer fees and embedded metadata.
```bash
node create-token-with-metadata.js
```

### 3. `add-metadata.js` - Add Metadata to Existing Token
Adds metadata to an existing SPL Token 2022 mint.
```bash
node add-metadata.js
```

### 4. `metadata.js` - Reference Implementation
Original working metadata implementation for reference.

### 5. `upload-metadata.js` - Metadata Helper
Helper script to generate and upload metadata to IPFS.

## 🔧 **Token Specifications**

### EckoSync Token Details:
- **Name:** EckoSync
- **Symbol:** ESYNC
- **Description:** A revolutionary SPL token on Solana blockchain
- **Metadata URI:** https://coral-raw-donkey-280.mypinata.cloud/ipfs/bafkreiea56mfvum7nc27xzwx67ykp7gfkmd4qxfskd6cdiuhfk5rt23rlq
- **Transfer Fee:** 2.5% (maximum 5 tokens)
- **Total Supply:** 150,000,000 tokens
- **Decimals:** 9

## 🚀 **Next Steps**

### Option 1: Use Current Token (Recommended)
Your token is already created and functional. You can:
- Transfer tokens between accounts
- The 2.5% transfer fee will be automatically applied
- Use the token in DeFi applications

### Option 2: Create New Token with Metadata
If you want a token with embedded metadata:
```bash
node create-token-with-metadata.js
```

### Option 3: Add Metadata to Existing Token
To add metadata to your current token:
1. Update the mint address in `add-metadata.js`
2. Run: `node add-metadata.js`

## 📊 **Token Features**

✅ **Transfer Fees:** 2.5% fee on all transfers  
✅ **Supply Capped:** 150M total supply  
✅ **Mint Authority Revoked:** No more tokens can be minted  
✅ **SPL Token 2022 Standard:** Latest token standard  
✅ **Testnet Ready:** Deployed on Solana testnet  

## 🔗 **Useful Links**

- **Solana Explorer:** https://explorer.solana.com/address/ATtmKbdCF84s5VQbygS5vpc4q2UZmzJx1BcjxA6FRfhe?cluster=testnet
- **Token Metadata:** https://coral-raw-donkey-280.mypinata.cloud/ipfs/bafkreiea56mfvum7nc27xzwx67ykp7gfkmd4qxfskd6cdiuhfk5rt23rlq
- **SPL Token 2022 Documentation:** https://spl.solana.com/token-2022

## 💡 **Notes**

- The token is currently on **testnet**
- To deploy to mainnet, change `clusterApiUrl("testnet")` to `clusterApiUrl("mainnet-beta")`
- Transfer fees are collected by the fee authority (your wallet)
- The token can be used in any SPL Token 2022 compatible wallet or application 