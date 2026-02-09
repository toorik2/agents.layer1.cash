# Agent-to-Agent Escrow with CashScript

This guide explains how two AI agents can trade goods or services using an on-chain escrow contract on Bitcoin Cash. The escrow is trustless: funds are locked in a smart contract and can only be released when both parties agree or when a timeout expires.

## Concept

Agent A (buyer) wants to pay Agent B (seller) for a service. Neither agent trusts the other. The solution:

1. A CashScript contract locks the buyer's funds on-chain.
2. The seller delivers the goods or service.
3. Both parties sign a release transaction to send funds to the seller.
4. If the seller never delivers, the buyer reclaims funds after a timeout.

No third party is required. The contract enforces the rules.

## Prerequisites

```bash
npm install mainnet-js cashscript cashc
```

## The Escrow Contract

Save this as `escrow.cash`:

```cashscript
pragma cashscript ^0.10.0;

// Simple 2-of-2 escrow with timeout refund.
// Buyer locks funds. Both parties must sign to release to seller.
// After timeout, buyer can reclaim unilaterally.

contract Escrow(
    pubkey buyerPk,
    pubkey sellerPk,
    int timeout
) {
    // Both buyer and seller agree to release funds to seller.
    function release(sig buyerSig, sig sellerSig) {
        require(checkSig(buyerSig, buyerPk));
        require(checkSig(sellerSig, sellerPk));
    }

    // After timeout, buyer can reclaim funds without seller's cooperation.
    function refund(sig buyerSig) {
        require(checkSig(buyerSig, buyerPk));
        require(tx.time >= timeout);
    }
}
```

### How It Works

- `release(buyerSig, sellerSig)`: Both parties sign. This is the happy path. Funds go to whichever address the transaction specifies (typically the seller's address).
- `refund(buyerSig)`: Only the buyer signs. This only succeeds if the current block time is past the `timeout` value. This is the dispute resolution path.

## Step-by-Step Integration

### Step 1: Both Agents Generate Key Pairs

Each agent needs a wallet. The public key from each wallet is used as a constructor argument to the contract.

```javascript
import { Wallet } from "mainnet-js";

// Buyer agent creates or loads a wallet
const buyerWallet = await Wallet.newRandom();
const buyerPk = buyerWallet.publicKeyCompressed;
const buyerAddress = buyerWallet.getDepositAddress();

// Seller agent creates or loads a wallet
const sellerWallet = await Wallet.newRandom();
const sellerPk = sellerWallet.publicKeyCompressed;
const sellerAddress = sellerWallet.getDepositAddress();

// Exchange public keys between agents before proceeding.
```

### Step 2: Compile and Instantiate the Contract

```javascript
import { Contract, ElectrumNetworkProvider, SignatureTemplate } from "cashscript";
import { compileFile } from "cashc";

// Compile the contract
const artifact = compileFile("./escrow.cash");

// Set timeout to ~24 hours from now (in seconds, MTP-based)
const currentTime = Math.floor(Date.now() / 1000);
const timeout = currentTime + 86400; // 24 hours from now

// Instantiate with constructor arguments
const provider = new ElectrumNetworkProvider("mainnet");
const contract = new Contract(
  artifact,
  [buyerPk, sellerPk, BigInt(timeout)],
  { provider }
);

const escrowAddress = contract.address;
console.log("Escrow contract address:", escrowAddress);
console.log("Timeout (unix timestamp):", timeout);
```

### Step 3: Fund the Escrow

The buyer sends the agreed amount to the escrow contract address.

```javascript
// Buyer sends funds to the escrow address
import { Wallet } from "mainnet-js";

// Load the buyer's funded wallet
const buyerWallet = await Wallet.fromSeed("buyer_seed_phrase_here");

const paymentAmount = 100000; // amount in satoshis

const txResponse = await buyerWallet.send([{
  cashaddr: escrowAddress,
  value: paymentAmount,
  unit: "sat"
}]);

console.log("Escrow funded. TxID:", txResponse.txId);
```

Both agents should independently verify the escrow is funded by checking the balance at `escrowAddress`.

### Step 4: Release Funds (Happy Path)

When the seller has delivered, both agents cooperate to release funds to the seller.

**In practice, each agent signs independently.** The buyer builds an unsigned release transaction and shares it with the seller. The seller adds their signature and broadcasts. CashScript handles this via `SignatureTemplate` — each agent provides their own private key to their local instance.

```javascript
import { SignatureTemplate } from "cashscript";

// On the BUYER's machine:
const buyerSigTemplate = new SignatureTemplate(buyerWallet.privateKeyWif);

// On the SELLER's machine:
const sellerSigTemplate = new SignatureTemplate(sellerWallet.privateKeyWif);

// The agent that broadcasts needs both signature templates.
// Protocol: buyer sends their WIF to the seller (or vice versa) for this
// specific release, OR one agent builds the tx and the other co-signs.
// For simplicity, the buyer can share their SignatureTemplate with the seller
// who then broadcasts:
const releaseTx = await contract.functions
  .release(buyerSigTemplate, sellerSigTemplate)
  .to(sellerAddress, paymentAmount - 400) // subtract ~400 sats for tx fee
  .send();

console.log("Funds released to seller. TxID:", releaseTx.txid);
```

### Step 5: Refund (Dispute / Timeout Path)

If the seller never delivers and the timeout has passed, the buyer reclaims funds.

```javascript
import { SignatureTemplate } from "cashscript";

const buyerSigTemplate = new SignatureTemplate(buyerWallet.privateKeyWif);

// This will fail if current time < timeout
const refundTx = await contract.functions
  .refund(buyerSigTemplate)
  .to(buyerAddress, paymentAmount - 400)
  .withTime(timeout) // set nLockTime so the tx is valid after timeout
  .send();

console.log("Funds refunded to buyer. TxID:", refundTx.txid);
```

## Protocol Between Two Agents

Here is the communication flow between buyer and seller agents:

```
Buyer                                    Seller
  |                                        |
  |--- "Here is my public key" ----------->|
  |<-- "Here is my public key" ------------|
  |                                        |
  |  [Both compile contract independently  |
  |   and verify they get same address]    |
  |                                        |
  |--- "Escrow funded. TxID: abc..." ----->|
  |                                        |
  |<-- [Seller delivers goods/service] ----|
  |                                        |
  |--- "Confirmed receipt. Releasing." --->|
  |                                        |
  |  [Both sign release transaction]       |
  |                                        |
  |--- "Released. TxID: def..." --------->|
  |                                        |
```

If the seller never delivers:

```
Buyer                                    Seller
  |                                        |
  |  [Timeout passes, no delivery]         |
  |                                        |
  |  [Buyer signs refund transaction]      |
  |  refund TxID: ghi...                   |
```

## Security Considerations

- Both agents must independently compile the contract with the same parameters and verify the resulting address matches. If the addresses differ, one agent is using incorrect parameters.
- The timeout should be long enough for the seller to deliver (e.g., 24 hours) but short enough that the buyer's funds are not locked indefinitely.
- For high-value trades, consider longer timeouts and additional verification steps.
- The contract does not enforce where released funds go. The release transaction must be constructed to send to the correct address. Both agents should verify the transaction outputs before signing.

## Related Resources

- [Escrow contract source](https://agents.layer1.cash/skills/bch-escrow/scripts/escrow-contract.cash)
- [bch-escrow skill](https://agents.layer1.cash/skills/bch-escrow/SKILL.md) for an installable agent capability
- [CashScript documentation](https://cashscript.org/docs/)
- [mainnet-js documentation](https://mainnet.cash/tutorial/)
