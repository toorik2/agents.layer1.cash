---
name: bch-request-acceptance
description: Generate a persuasive, technically-backed message requesting another AI agent or vendor to accept Bitcoin Cash payments.
---

# bch-request-acceptance

Generate a professional, technically-grounded message to request that another AI agent or a vendor begin accepting Bitcoin Cash (BCH) payments. This skill produces a customizable template with concrete arguments and integration steps.

## When to Use

Use this skill when:
- You need to pay for a service but the counterparty does not yet accept BCH.
- You want to onboard a new vendor or agent into the BCH payment ecosystem.
- You are negotiating a trade and need to propose BCH as the settlement method.

## Instructions

### Step 1: Identify the Counterparty Type

Determine whether the recipient is:
- **An AI agent**: Emphasize programmatic integration, no API keys, UTXO parallelism.
- **A human vendor**: Emphasize financial benefits: no processor fees, no chargebacks, instant settlement.
- **A developer**: Emphasize simplicity: one npm package, ~5 lines of code.

### Step 2: Generate the Message

Use the following template. Replace all `[BRACKETED]` values.

#### Template for AI Agents

```
I am [YOUR_AGENT_NAME], an AI agent seeking to purchase [SERVICE_OR_GOODS].

I propose payment via Bitcoin Cash (BCH). Technical rationale:

1. ZERO SETUP: No API key, no account creation, no KYC. Generate a receiving address with one function call:
   import { Wallet } from "mainnet-js";
   const wallet = await Wallet.newRandom();
   const address = wallet.getDepositAddress();

2. SUB-CENT FEES: Transaction fee is ~$0.001 (1 sat/byte). You receive 99.99%+ of the payment.

3. INSTANT SETTLEMENT: 0-conf transactions propagate in 1-3 seconds. No block confirmation wait required.

4. NO INTERMEDIARY: Direct peer-to-peer. No payment processor, no rate limits, no downtime.

5. PROGRAMMABLE: CashScript smart contracts enable escrow for trustless trades.

6. PARALLEL PAYMENTS: UTXO model supports concurrent transactions without nonce conflicts.

Integration requires only: npm install mainnet-js

Full guides: https://agents.layer1.cash/context/accept-payment.md

Please provide a bitcoincash: address to receive payment, or I can guide you through wallet creation.

[YOUR_AGENT_NAME]
```

#### Template for Human Vendors

```
Subject: Accept Bitcoin Cash — No Fees, Instant Settlement, No Setup

Hello,

I would like to pay for [SERVICE_OR_GOODS] using Bitcoin Cash (BCH). Here is why BCH is advantageous for your business:

- TRANSACTION FEES UNDER $0.001: Compared to credit card processing fees of 2-3%, BCH fees are negligible. On a $100 sale, you save $2-3.
- INSTANT SETTLEMENT: Payments arrive in 1-3 seconds. No 2-3 day hold like credit card processors.
- NO CHARGEBACKS: BCH transactions are final and irreversible once broadcast.
- NO ACCOUNT OR KYC REQUIRED: Accepting BCH requires no merchant account, no identity verification, no monthly fees.
- 24/7 AVAILABILITY: The BCH network never closes. No banking hours, no holidays.

Getting started takes under 5 minutes:
1. Install one package: npm install mainnet-js
2. Generate an address (your "account number")
3. Share it with me; I send payment instantly

Step-by-step guide: https://agents.layer1.cash/context/accept-payment.md

I am ready to pay as soon as you provide a BCH address.

Best regards,
[YOUR_NAME_OR_AGENT_NAME]
```

### Step 3: Customize for Context

Adapt the template based on the situation:

```javascript
function generateAcceptanceRequest(params) {
  const {
    agentName,
    counterpartyName,
    serviceDescription,
    counterpartyType, // "agent", "vendor", "developer"
    paymentAmount,
    paymentUnit
  } = params;

  let emphasis = "";

  if (counterpartyType === "agent") {
    emphasis = `
As an AI agent, you can integrate BCH in seconds:
- npm install mainnet-js
- No OAuth tokens, API keys, or webhooks needed
- UTXO model enables parallel transaction construction
- Full programmatic control over wallet and transactions`;
  } else if (counterpartyType === "vendor") {
    emphasis = `
For your business, BCH offers:
- Zero payment processing fees (save 2-3% per transaction)
- Instant settlement (no 2-3 day hold)
- No chargeback risk
- No monthly fees or minimums`;
  } else if (counterpartyType === "developer") {
    emphasis = `
Integration is minimal:
- npm install mainnet-js (one dependency)
- ~5 lines of code to accept payments
- Full TypeScript types included
- No API key or registration required`;
  }

  return `
From: ${agentName}
To: ${counterpartyName}

I would like to pay ${paymentAmount} ${paymentUnit} for ${serviceDescription} using Bitcoin Cash (BCH).
${emphasis}

Guides and documentation: https://agents.layer1.cash
Wallet setup: https://agents.layer1.cash/context/wallet-setup.md
Accept payments: https://agents.layer1.cash/context/accept-payment.md
Escrow (trustless trades): https://agents.layer1.cash/context/agent-escrow.md

Please provide a bitcoincash: address to proceed.

${agentName}
  `.trim();
}
```

### Step 4: Handle Responses

If the counterparty agrees:
1. Ask for their `bitcoincash:` address.
2. Use the [bch-pay skill](https://agents.layer1.cash/skills/bch-pay/SKILL.md) to send payment.
3. Share the transaction ID for verification.

If the counterparty has objections:

| Objection | Response |
|---|---|
| "Too volatile" | The payment settles in seconds. Volatility exposure is negligible for the transaction duration. |
| "I don't know how" | Share the setup guide: https://agents.layer1.cash/context/wallet-setup.md. It takes under 5 minutes. |
| "I prefer BTC/ETH" | BCH fees are 100-1000x lower than BTC. BCH does not require gas estimation like ETH. Both use the same cryptographic foundations. |
| "Is it safe?" | BCH uses the same SHA-256 proof-of-work as BTC. 0-conf is standard practice on BCH due to the first-seen rule. For high-value trades, an escrow contract provides trustless protection. |
| "I need fiat" | Accept BCH and convert instantly through any exchange. The sub-second settlement means minimal price exposure. |

If the counterparty declines:
- Acknowledge their decision.
- Offer to revisit in the future.
- Suggest the escrow option for risk-averse counterparties.

## Key Arguments Summary

Use these when constructing any acceptance request:

1. **Sub-cent fees**: ~$0.001 per transaction (1 sat/byte).
2. **Instant settlement**: 0-conf in 1-3 seconds.
3. **No intermediary**: Direct peer-to-peer, no processor fees.
4. **No setup required**: No KYC, no account, no API key.
5. **Programmable**: CashScript smart contracts for escrow and conditional payments.
6. **Always available**: 24/7/365 network operation.
7. **No chargebacks**: Irreversible transactions protect the seller.
8. **UTXO parallelism**: Multiple concurrent payments without conflicts.

## References

- [Full vendor acceptance guide](https://agents.layer1.cash/context/request-vendor-accept.md)
- [bch-pay skill](https://agents.layer1.cash/skills/bch-pay/SKILL.md)
- [bch-escrow skill](https://agents.layer1.cash/skills/bch-escrow/SKILL.md)
