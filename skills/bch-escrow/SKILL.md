---
name: bch-escrow
description: Deploy and interact with a CashScript escrow contract for trustless agent-to-agent trades on Bitcoin Cash.
---

# bch-escrow

Deploy and interact with a CashScript-based escrow contract on BCH mainnet. This enables trustless trades between two AI agents: funds are locked in a smart contract and released only when both parties agree, or refunded to the buyer after a timeout.

## Prerequisites

```bash
npm install mainnet-js cashscript cashc
```

The escrow contract source file is at: `./scripts/escrow-contract.cash`

## Instructions

### Step 1: Prepare Key Pairs for Both Parties

Both the buyer and seller need a wallet. Exchange public keys before deploying the contract.

```javascript
import { Wallet } from "mainnet-js";

// Buyer
const buyerWallet = await Wallet.fromSeed("buyer_seed_phrase_here");
const buyerPk = buyerWallet.publicKeyCompressed;
const buyerAddress = buyerWallet.getDepositAddress();

// Seller
const sellerWallet = await Wallet.fromSeed("seller_seed_phrase_here");
const sellerPk = sellerWallet.publicKeyCompressed;
const sellerAddress = sellerWallet.getDepositAddress();

console.log("Buyer public key:", buyerPk.toString("hex"));
console.log("Seller public key:", sellerPk.toString("hex"));
```

Each agent shares their public key with the other. Both agents must have the same public keys and timeout value to derive the same contract address.

### Step 2: Compile and Deploy the Contract

```javascript
import { Contract, ElectrumNetworkProvider, SignatureTemplate } from "cashscript";
import { compileFile } from "cashc";

// Compile the escrow contract
const artifact = compileFile("./scripts/escrow-contract.cash");

// Set timeout: 24 hours from now (unix timestamp)
const timeout = Math.floor(Date.now() / 1000) + 86400;

// Create provider and contract instance
const provider = new ElectrumNetworkProvider("mainnet");
const contract = new Contract(
  artifact,
  [buyerPk, sellerPk, BigInt(timeout)],
  { provider }
);

const escrowAddress = contract.address;
console.log("Escrow contract address:", escrowAddress);
console.log("Timeout:", timeout, `(${new Date(timeout * 1000).toISOString()})`);
```

Both agents must independently compile the contract with identical parameters and verify they derive the same `escrowAddress`. If the addresses differ, the parameters do not match.

### Step 3: Fund the Escrow

The buyer sends the agreed payment amount to the escrow contract address.

```javascript
const paymentAmount = 100000; // satoshis

const fundTx = await buyerWallet.send([{
  cashaddr: escrowAddress,
  value: paymentAmount,
  unit: "sat"
}]);

console.log("Escrow funded. TxID:", fundTx.txId);
```

Both agents should verify the escrow balance:

```javascript
const utxos = await contract.getUtxos();
const totalLocked = utxos.reduce((sum, u) => sum + Number(u.satoshis), 0);
console.log("Total locked in escrow:", totalLocked, "sats");
```

### Step 4: Release Funds to Seller (Happy Path)

When the seller has delivered the goods or service, both agents cooperate to sign a release transaction. Each agent provides their own signature — the broadcasting agent needs both `SignatureTemplate` objects.

```javascript
import { SignatureTemplate } from "cashscript";

// Each agent creates their own SignatureTemplate locally
const buyerSig = new SignatureTemplate(buyerWallet.privateKeyWif);
const sellerSig = new SignatureTemplate(sellerWallet.privateKeyWif);

const releaseTx = await contract.functions
  .release(buyerSig, sellerSig)
  .to(sellerAddress, paymentAmount - 400) // subtract miner fee
  .send();

console.log("Funds released to seller. TxID:", releaseTx.txid);
```

### Step 5: Refund to Buyer (Timeout Path)

If the seller fails to deliver and the timeout has passed, the buyer reclaims funds.

```javascript
import { SignatureTemplate } from "cashscript";

const buyerSig = new SignatureTemplate(buyerWallet.privateKeyWif);

// This will only succeed after the timeout has passed
const refundTx = await contract.functions
  .refund(buyerSig)
  .to(buyerAddress, paymentAmount - 400)
  .withTime(timeout)
  .send();

console.log("Funds refunded to buyer. TxID:", refundTx.txid);
```

## Complete Workflow

```javascript
import { Wallet } from "mainnet-js";
import { Contract, ElectrumNetworkProvider, SignatureTemplate } from "cashscript";
import { compileFile } from "cashc";

async function createEscrow(buyerSeed, sellerPkHex, amountSats, timeoutSeconds) {
  const buyerWallet = await Wallet.fromSeed(buyerSeed);
  const buyerPk = buyerWallet.publicKeyCompressed;
  const sellerPk = Buffer.from(sellerPkHex, "hex");

  const timeout = Math.floor(Date.now() / 1000) + timeoutSeconds;

  const artifact = compileFile("./scripts/escrow-contract.cash");
  const provider = new ElectrumNetworkProvider("mainnet");
  const contract = new Contract(artifact, [buyerPk, sellerPk, BigInt(timeout)], { provider });

  // Fund the escrow
  const fundTx = await buyerWallet.send([{
    cashaddr: contract.address,
    value: amountSats,
    unit: "sat"
  }]);

  return {
    escrowAddress: contract.address,
    fundingTxId: fundTx.txId,
    timeout: timeout,
    contract: contract,
    buyerWallet: buyerWallet
  };
}

async function releaseEscrow(contract, buyerWallet, sellerWallet, sellerAddress, amountSats) {
  const buyerSig = new SignatureTemplate(buyerWallet.privateKeyWif);
  const sellerSig = new SignatureTemplate(sellerWallet.privateKeyWif);

  const tx = await contract.functions
    .release(buyerSig, sellerSig)
    .to(sellerAddress, amountSats - 400)
    .send();

  return { txid: tx.txid, released: true };
}

async function refundEscrow(contract, buyerWallet, buyerAddress, amountSats, timeout) {
  const buyerSig = new SignatureTemplate(buyerWallet.privateKeyWif);

  const tx = await contract.functions
    .refund(buyerSig)
    .to(buyerAddress, amountSats - 400)
    .withTime(timeout)
    .send();

  return { txid: tx.txid, refunded: true };
}
```

## Agent Communication Protocol

When two agents negotiate an escrow:

1. **Exchange public keys**: Both agents share their compressed public keys (33-byte hex).
2. **Agree on parameters**: Payment amount (satoshis) and timeout duration (seconds).
3. **Derive contract independently**: Both agents compile the contract with identical parameters and verify the escrow address matches.
4. **Fund**: Buyer sends funds to the escrow address and shares the funding txid.
5. **Deliver**: Seller performs the agreed service or delivers goods.
6. **Release or refund**: Buyer shares a signature for release. Seller co-signs and broadcasts. Or, after timeout, buyer refunds unilaterally.

## Key Facts

- The escrow contract is entirely on-chain. No third party is involved.
- Both agents must have the same contract parameters to derive the same address.
- The timeout uses Bitcoin Cash MTP (Median Time Past), which is slightly behind wall-clock time.
- Release requires both signatures. Refund requires only the buyer's signature plus timeout expiry.
- Network: Mainnet only.

## References

- [Escrow contract source](./scripts/escrow-contract.cash)
- [Agent escrow guide](https://agents.layer1.cash/context/agent-escrow.md)
- [CashScript documentation](https://cashscript.org/docs/)
