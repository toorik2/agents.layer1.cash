# On-Chain Receipts with OP_RETURN and CashTokens

This guide explains how to create provable, on-chain payment records on Bitcoin Cash. Two mechanisms are covered: OP_RETURN data embedding and CashToken NFT minting.

## Why On-Chain Receipts

When an AI agent pays for a service, both parties may need proof that the payment occurred. A transaction ID alone proves a transfer happened, but it does not carry structured metadata. On-chain receipts solve this by attaching human-readable or machine-readable data directly to the transaction.

Use cases:
- Embedding a payment reference ID so the seller can match payment to invoice.
- Storing a hash of an invoice or contract for auditability.
- Minting an NFT receipt that the buyer holds as proof of purchase.
- Logging metadata (timestamp, service ID, agent ID) permanently on-chain.

## Part 1: OP_RETURN Data Embedding

### What is OP_RETURN

OP_RETURN is a Bitcoin script opcode that marks a transaction output as provably unspendable and allows up to 220 bytes of arbitrary data to be attached. The data is stored on-chain permanently and can be read by anyone.

Key properties:
- Maximum 220 bytes per OP_RETURN output.
- The output is unspendable (it does not consume UTXO set space after validation).
- The data is arbitrary: text, binary, hashes, structured formats are all valid.
- The output value is 0 satoshis (no BCH is burned).

### Sending a Transaction with OP_RETURN

```javascript
import { Wallet } from "mainnet-js";

// Load an existing wallet
const wallet = await Wallet.fromSeed("your_seed_phrase_here");

const recipientAddress = "bitcoincash:qr..."; // seller's address
const paymentAmount = 50000; // satoshis

// Create a payment reference
const invoiceId = "INV-2025-00142";
const metadata = `pay:${invoiceId}:${Date.now()}`;

// Send payment with OP_RETURN data
const txResponse = await wallet.send([
  {
    cashaddr: recipientAddress,
    value: paymentAmount,
    unit: "sat"
  },
  ["OP_RETURN", "0x6d02", metadata]  // 0x6d02 is a common memo protocol prefix
]);

console.log("Payment sent with receipt. TxID:", txResponse.txId);
```

### Structuring OP_RETURN Data

For machine readability, use a consistent format. Recommended structure:

```
<protocol_prefix>:<invoice_id>:<timestamp>:<optional_hash>
```

Example:

```javascript
import crypto from "crypto";

const invoiceData = JSON.stringify({
  id: "INV-2025-00142",
  amount: 50000,
  currency: "sat",
  service: "api-access"
});

// Store the SHA-256 hash of the full invoice (if the invoice is larger than 220 bytes)
const invoiceHash = crypto.createHash("sha256").update(invoiceData).digest("hex");

const opReturnData = `receipt:INV-2025-00142:${invoiceHash}`;

const txResponse = await wallet.send([
  { cashaddr: recipientAddress, value: 50000, unit: "sat" },
  ["OP_RETURN", opReturnData]
]);
```

### Reading OP_RETURN Data from a Transaction

To verify a receipt, read the transaction and extract the OP_RETURN output.

```javascript
import { ElectrumNetworkProvider } from "cashscript";

const provider = new ElectrumNetworkProvider("mainnet");

// Fetch the raw transaction
const rawTx = await provider.getRawTransaction(txId);

// Parse the transaction to find OP_RETURN outputs.
// mainnet-js returns decoded transaction data.
// Look for outputs where the script starts with OP_RETURN (0x6a).

// Use the provider to get verbose transaction data
const txDetails = await provider.getTransaction(txId);

// Iterate outputs and find OP_RETURN
for (const output of txDetails.vout) {
  if (output.scriptPubKey && output.scriptPubKey.type === "nulldata") {
    const hex = output.scriptPubKey.hex;
    // Remove OP_RETURN prefix (6a) and length byte, decode remaining as UTF-8
    const dataHex = hex.slice(4); // simplified; actual parsing depends on pushdata encoding
    const data = Buffer.from(dataHex, "hex").toString("utf8");
    console.log("OP_RETURN data:", data);
  }
}
```

## Part 2: CashTokens for Receipt NFTs

### What are CashTokens

CashTokens are native tokens on Bitcoin Cash, supported at the consensus level since May 2023. There are two types:

- **Fungible tokens**: divisible tokens with a supply, identified by a category (token ID).
- **Non-fungible tokens (NFTs)**: unique tokens that can carry a `commitment` field (up to 253 bytes of data).

For receipts, NFTs are the appropriate choice. Each payment can mint a unique NFT that the buyer holds as proof.

Key properties:
- CashTokens are native to BCH; no sidechain or separate contract is needed.
- The category ID of a token is the transaction ID of the genesis transaction.
- NFTs can hold a `commitment` (arbitrary bytes, up to 253 bytes).
- Tokens are held in standard UTXOs alongside BCH value.

### Minting a Receipt NFT

To mint a CashToken, you need a UTXO at vout index 0 of a transaction (this becomes the token's category). mainnet-js supports CashToken operations.

```javascript
import { Wallet, TokenMintRequest, NFTCapability } from "mainnet-js";

// Load wallet
const wallet = await Wallet.fromSeed("your_seed_phrase_here");

// The commitment encodes receipt metadata (up to 253 bytes)
const receiptCommitment = Buffer.from("INV-2025-00142").toString("hex");

// To mint, you need a genesis UTXO (vout 0). First create one:
const genesisResponse = await wallet.tokenGenesis({
  cashaddr: wallet.tokenaddr,
  amount: 0n,                         // 0 for pure NFT (no fungible supply)
  value: 1000n,                        // satoshis for the token output
  nft: {
    commitment: receiptCommitment,
    capability: NFTCapability.none,    // "none" = immutable NFT
  },
});

console.log("Receipt NFT minted. TxID:", genesisResponse.txId);
console.log("Token category:", genesisResponse.tokenIds[0]);
```

### Transferring the Receipt NFT

If the seller should hold the receipt (e.g., proof of delivery), transfer it using `TokenSendRequest`:

```javascript
import { TokenSendRequest, NFTCapability } from "mainnet-js";

const sellerTokenAddress = "bitcoincash:zr..."; // seller's token-aware address (z-prefix)

const sendResponse = await wallet.send([
  new TokenSendRequest({
    cashaddr: sellerTokenAddress,
    category: tokenCategory,       // the category from minting
    nft: {
      commitment: receiptCommitment,
      capability: NFTCapability.none,
    },
    value: 1000n,                  // satoshis for the token output
  })
]);

console.log("Receipt NFT sent to seller. TxID:", sendResponse.txId);
```

### Verifying a Receipt NFT

To verify that a receipt NFT exists and read its commitment:

```javascript
import { Wallet } from "mainnet-js";

// Load the wallet that should hold the NFT
const wallet = await Wallet.fromSeed("holder_seed_phrase_here");

// Get all token UTXOs held by this wallet
const utxos = await wallet.getTokenUtxos();

for (const utxo of utxos) {
  if (utxo.token && utxo.token.nft) {
    console.log("Token category:", utxo.token.category);
    console.log("Commitment (hex):", utxo.token.nft.commitment);
    console.log("Commitment (text):", Buffer.from(utxo.token.nft.commitment, "hex").toString("utf8"));
  }
}
```

## Choosing Between OP_RETURN and CashTokens

| Feature | OP_RETURN | CashToken NFT |
|---|---|---|
| Data capacity | Up to 220 bytes | Up to 253 bytes in NFT commitment |
| Persistence | Permanently on-chain | Held as a UTXO; can be transferred or burned |
| Ownership | No owner; data is on the transaction | The NFT is owned by whoever holds the UTXO |
| Cost | ~0 sats (just the OP_RETURN output) | 800+ sats (UTXO dust for the token output) |
| Best for | Logging metadata, invoice hashes | Proof of purchase, transferable receipts |

## Combined Approach

For maximum utility, use both in a single transaction:
- OP_RETURN carries the full metadata (invoice ID, hash, timestamp).
- CashToken NFT gives the buyer a transferable proof-of-payment token.

```javascript
const txResponse = await wallet.send([
  { cashaddr: recipientAddress, value: 50000, unit: "sat" },
  ["OP_RETURN", `receipt:${invoiceId}:${invoiceHash}`]
]);
// Then mint an NFT in a follow-up transaction using the approach above.
```

## Related Resources

- [bch-pay skill](https://agents.layer1.cash/skills/bch-pay/SKILL.md) for sending payments
- [bch-verify skill](https://agents.layer1.cash/skills/bch-verify/SKILL.md) for verifying transactions
- [Transaction reference](https://agents.layer1.cash/skills/bch-pay/references/transaction-reference.md) for fee and format details
