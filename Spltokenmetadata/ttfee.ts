// tokentax_meta.ts
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
  AuthorityType,
} from '@solana/spl-token';
import {
  createCreateMetadataAccountV3Instruction,
  DataV2,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import bs58 from 'bs58';

(async () => {
  const payer = Keypair.fromSecretKey(
    bs58.decode('4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1')
  );
  const connection = new Connection(clusterApiUrl('testnet'), 'confirmed');
  const bal = await connection.getBalance(payer.publicKey);
  if (bal < 0.01 * LAMPORTS_PER_SOL) throw new Error('Insufficient SOL.');

  const decimals = 9;
  const feeBps = 250;
  const maxFee = BigInt(5_000_000_000);

  // Create mint with Transfer Fee
  const mintKeypair = Keypair.generate();
  const mintPubkey = mintKeypair.publicKey;
  const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
  const rent = await connection.getMinimumBalanceForRentExemption(mintLen);

  const txMint = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintPubkey,
      space: mintLen,
      lamports: rent,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeTransferFeeConfigInstruction(
      mintPubkey,
      payer.publicKey,
      payer.publicKey,
      feeBps,
      maxFee,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mintPubkey,
      decimals,
      payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID
    )
  );
  await sendAndConfirmTransaction(connection, txMint, [payer, mintKeypair]);
  console.log('✅ Mint created:', mintPubkey.toBase58());

  // Derive metadata PDA
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintPubkey.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );

  const tokenData: DataV2 = {
    name: 'EckoSync',
    symbol: 'ESYNC',
    uri: 'https://coral-raw-donkey-280.mypinata.cloud/ipfs/bafkreiea56mfvum7nc27xzwx67ykp7gfkmd4qxfskd6cdiuhfk5rt23rlq',
    sellerFeeBasisPoints: 0,
    creators: [{ address: payer.publicKey, verified: true, share: 100 }],
    collection: null,
    uses: null,
  };

  const metadataIx = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPDA,
      mint: mintPubkey,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    { createMetadataAccountArgsV3: { data: tokenData, isMutable: true, collectionDetails: null } }
  );
  await sendAndConfirmTransaction(connection, new Transaction().add(metadataIx), [payer]);
  console.log('✅ Metadata added:', metadataPDA.toBase58());

  // Mint tokens to your ATA
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mintPubkey,
    payer.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
  const totalSupply = BigInt(150_000_000) * BigInt(10 ** decimals);
  await mintTo(connection, payer, mintPubkey, ata.address, payer.publicKey, totalSupply, [], undefined, TOKEN_2022_PROGRAM_ID);
  console.log('✅ Minted 150M tokens to ATA:', ata.address.toBase58());

  // Revoke mint & freeze authority
  await setAuthority(connection, payer, mintPubkey, payer.publicKey, AuthorityType.MintTokens, null, [], undefined, TOKEN_2022_PROGRAM_ID);
  await setAuthority(connection, payer, mintPubkey, payer.publicKey, AuthorityType.FreezeAccount, null, [], undefined, TOKEN_2022_PROGRAM_ID);
  console.log('❌ Mint & freeze authority revoked.');

  console.log('🎉 Token-2022 with metadata deployed successfully!');
})();
