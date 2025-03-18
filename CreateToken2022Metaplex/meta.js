import * as mpl from "@metaplex-foundation/mpl-token-metadata";
import * as web3 from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsPublicKey, toWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import fs from "fs";
import bs58 from "bs58";

// Private Key Integration
const PRIVATE_KEY_BASE58 = "4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1";
const wallet = web3.Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_BASE58));

console.log("✅ Using Wallet Address:", wallet.publicKey.toBase58());


async function main() {
  console.log("Let's name some tokens");
  const mint = new web3.PublicKey(
    "AVLnUJRn3DZELKLHvJ9iuedLuBgGxbviGkdeTXpQktb2"
  );
  const pID = new web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
  const seed1 = Buffer.from(anchor.utils.bytes.utf8.encode("metadata"));
  const seed2 = pID.toBytes();
  const seed3 = mint.toBytes();

  const [metadataPDA, _bump] = web3.PublicKey.findProgramAddressSync(
    [seed1, seed2, seed3],
    pID
  );

  const umi = createUmi("https://api.devnet.solana.com");

  const accounts = {
    metadata: metadataPDA,
    mint,
    mintAuthority: wallet.publicKey,
    payer: wallet.publicKey,
    updateAuthority: wallet.publicKey,
  };

  const dataV2 = {
    name: "Gizmo Coin",
    symbol: "$GIZMO",
    uri: "https://uxm26fljyvkiy7m45ll3iehqk6jzthykw3eiqasnnmpmbhpbli.arweave.net/pdmvFWnFVIx9nOrXtB-DwV5OZnwq2yIgCTWsewJ3hWs",
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  const args = {
    createMetadataAccountArgsV2: {
      data: dataV2,
      isMutable: true,
    },
  };

  const fullArgs = { ...accounts, ...args };
  const connection = new web3.Connection("https://api.devnet.solana.com");
  const metadataBuilder = mpl.updateMetadataAccountV2(umi, fullArgs);

  (async () => {
    const ix = metadataBuilder.getInstructions()[0];
    ix.keys = ix.keys.map((key) => {
      const newKey = { ...key };
      newKey.pubkey = toWeb3JsPublicKey(key.pubkey);
      return newKey;
    });

    const tx = new web3.Transaction().add(ix);
    const sig = await web3.sendAndConfirmTransaction(connection, tx, [wallet]);
    console.log("✅ Transaction Signature:", sig);
  })();
}

main();
