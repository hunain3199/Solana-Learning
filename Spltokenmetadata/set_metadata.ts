#!/usr/bin/env ts-node

import bs58 from 'bs58';
import dotenv from 'dotenv';
dotenv.config();

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';

import {
  createInitializeMintInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMintToCheckedInstruction,
  TOKEN_PROGRAM_ID,
  MINT_SIZE
} from '@solana/spl-token';

import {
  createCreateMetadataAccountV3Instruction,
  DataV2,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata';

async function main() {
  const conn = new Connection(process.env.RPC_URL ?? 'https://api.testnet.solana.com', 'confirmed');

  const secret = JSON.parse(require('fs').readFileSync(process.env.KEYPAIR!, 'utf-8'));
  const payer = Keypair.fromSecretKey(new Uint8Array(secret));

  const balance = await conn.getBalance(payer.publicKey);
  if (balance < LAMPORTS_PER_SOL) {
    console.log('Airdropping 1 SOL to payer...');
    const sig = await conn.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
    await conn.confirmTransaction(sig);
  }

  console.log('Creating mint account...');
  const mint = Keypair.generate();

  const decimals = parseInt(process.env.DECIMALS ?? '6', 10);
  const totalSupply = BigInt((parseFloat(process.env.SUPPLY!) * 10 ** decimals).toString()).toString();

  const ata = getAssociatedTokenAddressSync(mint.publicKey, payer.publicKey);

  const metadataPda = (
    await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0];

  const metadataData: DataV2 = {
    name: process.env.NAME!.substring(0,32),
    symbol: process.env.SYMBOL!.substring(0,10),
    uri: process.env.TOKEN_METADATA_URI!,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null
  };

  const tx = new Transaction().add(
    // account for mint
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.publicKey,
      space: MINT_SIZE,
      lamports: await conn.getMinimumBalanceForRentExemption(MINT_SIZE),
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mint.publicKey,
      decimals,
      payer.publicKey,
      null,
      TOKEN_PROGRAM_ID
    ),
    createAssociatedTokenAccountInstruction(
      payer.publicKey,
      ata,
      payer.publicKey,
      mint.publicKey
    ),
    createMintToCheckedInstruction(
      mint.publicKey,
      ata,
      payer.publicKey,
      BigInt(parseInt(totalSupply)),
      decimals
    ),
    createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPda,
        mint: mint.publicKey,
        mintAuthority: payer.publicKey,
        payer: payer.publicKey,
        updateAuthority: payer.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: metadataData,
          isMutable: true,
          collectionDetails: null,
        },
      }
    )
  );

  tx.feePayer = payer.publicKey;
  tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;

  tx.sign(mint, payer);
  const serialized = tx.serialize({ requireAllSignatures: false });
  const txid = await conn.sendRawTransaction(serialized);
  await conn.confirmTransaction(txid);

  console.log(`✅ Mint: ${mint.publicKey.toBase58()}`);
  console.log(`✅ Supply minted: ${process.env.SUPPLY}`);
  console.log(`✅ Tx: https://explorer.solana.com/tx/${txid}?cluster=testnet`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
