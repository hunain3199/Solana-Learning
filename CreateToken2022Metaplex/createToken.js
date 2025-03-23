import { 
    Keypair, 
    Connection, 
    clusterApiUrl, 
    PublicKey
} from "@solana/web3.js";

import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_2022_PROGRAM_ID
} from "@solana/spl-token";

import bs58 from "bs58";

async function createSPLTokenWithTax() {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    const PRIVATE_KEY_BASE58 = "4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1";
    const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_BASE58));

    console.log("Wallet Address:", wallet.publicKey.toBase58());

    // Create the token mint with Token-2022 program
    const mint = await createMint(
        connection,
        wallet,
        wallet.publicKey,  // Mint Authority
        wallet.publicKey,  // Freeze Authority (optional)
        9,                 // Decimals
        undefined,
        TOKEN_2022_PROGRAM_ID // Use Token-2022 program
    );

    console.log("Token Mint Address:", mint.toBase58());

    // Create an associated token account for the wallet
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        mint,
        wallet.publicKey,
        false, // Do not allow closed accounts
        "confirmed",
        TOKEN_2022_PROGRAM_ID
    );

    console.log("Token Account Address:", tokenAccount.address.toBase58());

    // Mint tokens to the wallet
    await mintTo(
        connection,
        wallet,
        mint,
        tokenAccount.address,
        wallet.publicKey,
        1000 * 10 ** 9, // Minting 1000 tokens
        [],
        TOKEN_2022_PROGRAM_ID
    );

    console.log("✅ Minted 1000 tokens");

    return { mintAddress: mint.toBase58(), tokenAccount: tokenAccount.address.toBase58() };
}

createSPLTokenWithTax()
    .then(console.log)
    .catch(console.error);
