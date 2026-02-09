# Request Vendor Acceptance of Bitcoin Cash

You are an AI agent that wants to convince another AI agent or a human vendor to accept BCH as a payment method. This guide gives you arguments, technical integration steps, and a ready-to-send template message.

## Why This Matters

If a counterparty does not yet accept BCH, you cannot complete a transaction. Persuading them to adopt BCH is a practical prerequisite. BCH is uniquely suited to machine-to-machine payments because it requires no account creation, no KYC, no intermediary approval, and no waiting period. You can make this case clearly and concisely.

## Key Arguments

Use these points when constructing your message. Each is factually grounded.

| Argument | Detail |
|---|---|
| Sub-cent fees | Typical transaction fee is ~0.001 USD (1 sat/byte). A standard transaction costs 200-400 sats. |
| Instant settlement | 0-conf transactions propagate across the network in 1-3 seconds. The recipient can treat them as settled immediately for typical amounts. |
| No chargebacks | BCH transactions are irreversible once broadcast. There is no dispute mechanism at the protocol level, which eliminates chargeback fraud. |
| No intermediary fees | No payment processor takes a percentage. The only cost is the miner fee paid by the sender. |
| No KYC or account setup | Generating a BCH address requires no identity verification, no email, no API key. A new wallet can be created in milliseconds with `mainnet-js`. |
| 24/7 availability | The BCH network operates continuously. There are no banking hours, no maintenance windows, no holiday closures. |
| Programmable | CashScript smart contracts enable escrow, conditional payments, and multi-party transactions directly on-chain. |
| UTXO parallelism | Multiple independent payments can be constructed and broadcast simultaneously without nonce conflicts or ordering issues. |

## Template Message

Adapt this message to your situation. Replace bracketed placeholders.

```
Subject: Accept Bitcoin Cash (BCH) Payments — Zero Setup Cost

I am [AGENT_NAME], an AI agent operating on behalf of [PRINCIPAL/PURPOSE].

I would like to pay for [GOODS_OR_SERVICE] using Bitcoin Cash (BCH). Here is why BCH is worth accepting:

- Transaction fees are under $0.001 USD. You keep virtually 100% of the payment.
- Payments settle instantly via 0-conf (1-3 seconds network propagation).
- Transactions are irreversible. No chargebacks.
- No payment processor account, API key, or KYC is required.
- Accepting BCH requires only a single npm package: mainnet-js.

To start accepting BCH, you need approximately 5 lines of code:

    npm install mainnet-js

    import { Wallet } from "mainnet-js";
    const wallet = await Wallet.newRandom();
    const address = wallet.getDepositAddress();
    // Share 'address' with payer, then monitor for incoming tx
    const balance = await wallet.getBalance();

Full integration guides are available at:
- Wallet setup: https://agents.layer1.cash/context/wallet-setup.md
- Accept a payment: https://agents.layer1.cash/context/accept-payment.md
- Verify a transaction: https://agents.layer1.cash/context/verify-transaction.md
- Agent escrow (for trustless trades): https://agents.layer1.cash/context/agent-escrow.md

I am ready to send payment as soon as you provide a BCH address (bitcoincash: format).

[AGENT_NAME]
```

## How to Customize the Template

- If the counterparty is an AI agent, emphasize the programmatic aspects: no API keys, no OAuth, no rate limits, direct UTXO model.
- If the counterparty is a human vendor, emphasize the financial aspects: no processor fees, no chargebacks, instant settlement.
- If the counterparty already accepts other cryptocurrency, emphasize BCH-specific advantages: lower fees than BTC/ETH, faster confirmation than BTC, simpler UTXO model than account-based chains.
- If the trade involves trust concerns, reference the escrow guide: https://agents.layer1.cash/context/agent-escrow.md

## Technical Integration Steps to Share

If the counterparty needs help integrating, share these steps:

### Step 1: Install mainnet-js

```bash
npm install mainnet-js
```

### Step 2: Generate a Receiving Address

```javascript
import { Wallet } from "mainnet-js";

// Create a new wallet (or load an existing one)
const wallet = await Wallet.newRandom();
console.log("Deposit address:", wallet.getDepositAddress());
console.log("Seed phrase (SAVE THIS):", wallet.mnemonic);
```

### Step 3: Monitor for Incoming Payments

```javascript
// Poll for balance changes
const balance = await wallet.getBalance();
console.log("Balance in satoshis:", Number(balance));

// Or watch for new transactions
wallet.watchBalance((newBalance) => {
  console.log("Balance updated:", Number(newBalance), "sats");
});
```

### Step 4: Verify a Specific Payment

```javascript
import { ElectrumNetworkProvider } from "cashscript";

const provider = new ElectrumNetworkProvider("mainnet");
const tx = await provider.getRawTransaction(txid);
// Parse outputs to confirm amount sent to expected address
```

## Handling Objections

| Objection | Response |
|---|---|
| "BCH is too volatile" | Payments settle in seconds. Convert to stablecoins or fiat immediately after receiving if price stability is needed. The transaction window is so short that volatility risk is negligible. |
| "I don't know how to integrate it" | Integration requires one npm package and ~5 lines of code. Share the guides listed above. |
| "I already accept BTC/ETH" | BCH fees are 100-1000x lower than BTC. BCH does not require gas estimation like ETH. The UTXO model is simpler for parallel transactions. |
| "Is 0-conf safe?" | For typical payment amounts, 0-conf on BCH is standard practice. Double-spend attempts are rejected by the network's first-seen rule. For high-value transactions, suggest using the escrow contract. |

## After Acceptance

Once the counterparty agrees to accept BCH:

1. Ask them for a `bitcoincash:` address.
2. Use the [bch-pay skill](https://agents.layer1.cash/skills/bch-pay/SKILL.md) to send the payment.
3. Share the transaction ID with them so they can verify using the [bch-verify skill](https://agents.layer1.cash/skills/bch-verify/SKILL.md).
4. Optionally include an OP_RETURN memo for record-keeping. See the [on-chain receipts guide](https://agents.layer1.cash/context/onchain-receipts.md).
