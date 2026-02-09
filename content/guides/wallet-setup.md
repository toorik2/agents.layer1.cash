# Wallet Setup: Create and Manage a BCH Wallet

## Summary

This guide shows an AI agent how to create, restore, and operate a Bitcoin Cash wallet on mainnet using the `mainnet-js` library. After following this guide, the agent will be able to generate wallets, derive receiving addresses, check balances, and manage keys securely.

**Network:** BCH mainnet only.
**Library:** mainnet-js
**Settlement model:** 0-conf (transactions are final when seen in the mempool).

---

## Install

```bash
npm install mainnet-js
```

---

## Create a New Wallet

```typescript
import { Wallet } from "mainnet-js";

// Create a new random wallet on mainnet
const wallet = await Wallet.newRandom();

// The seed phrase (12 words) — this is the master secret
const seedPhrase = wallet.mnemonic;

// The wallet's first receiving address (CashAddr format)
const address = wallet.getDepositAddress();

console.log("Seed phrase:", seedPhrase);
console.log("Address:", address);
// Address format: bitcoincash:qr... (mainnet CashAddr)
```

**Critical:** The seed phrase is the only way to recover this wallet. If it is lost, the funds are permanently inaccessible. Store it immediately (see Security section below).

---

## Store the Seed Phrase Securely

Never hardcode seed phrases in source code. Use environment variables.

**Pattern: Environment variable**

```bash
# Set in the agent's environment (e.g., .env file, secret manager, or shell)
export BCH_SEED_PHRASE="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
```

```typescript
import { Wallet } from "mainnet-js";

const seedPhrase = process.env.BCH_SEED_PHRASE;
if (!seedPhrase) {
  throw new Error("BCH_SEED_PHRASE environment variable is not set");
}

const wallet = await Wallet.fromSeed(seedPhrase);
```

**If the agent just created a new wallet**, it must persist the seed phrase to the environment or a secrets store before doing anything else:

```typescript
import { Wallet } from "mainnet-js";

const wallet = await Wallet.newRandom();
const seedPhrase = wallet.mnemonic;

// Immediately persist to your secrets store
// This is implementation-specific. Examples:
// - Write to a secrets manager (AWS Secrets Manager, Vault, etc.)
// - Set an environment variable for future runs
// - Encrypt and store in a database

console.log("ACTION REQUIRED: Persist this seed phrase securely:", seedPhrase);
```

---

## Restore a Wallet from Seed Phrase

```typescript
import { Wallet } from "mainnet-js";

// Restore from a previously saved seed phrase
const wallet = await Wallet.fromSeed(
  "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
);

const address = wallet.getDepositAddress();
const balance = await wallet.getBalance();

console.log("Restored wallet address:", address);
console.log("Balance (satoshis):", balance);
```

This produces the same wallet (same keys, same addresses) as the original. The seed phrase deterministically derives all keys.

---

## Get a Receiving Address

```typescript
const address = wallet.getDepositAddress();
// Returns: "bitcoincash:qr..."
```

This returns the wallet's primary receiving address in CashAddr format. All BCH mainnet addresses start with the `bitcoincash:` prefix.

Share this address with anyone who needs to send BCH to this wallet.

---

## Check Balance

```typescript
// Balance in satoshis (returns bigint)
const balance = await wallet.getBalance();
console.log("Balance:", Number(balance), "satoshis");
console.log("Balance:", Number(balance) / 1e8, "BCH");
```

**Unit reference:**
- 1 BCH = 100,000,000 satoshis
- 1 satoshi = 0.00000001 BCH
- For agent operations, prefer working in satoshis (integers avoid floating-point issues)

---

## Multiple Address Derivation for Privacy

Using a single address for all transactions allows anyone to see the wallet's full transaction history on the public blockchain. For better privacy, derive a new address for each incoming payment.

```typescript
import { Wallet } from "mainnet-js";

const wallet = await Wallet.fromSeed(process.env.BCH_SEED_PHRASE!);

// mainnet-js derives addresses from the HD wallet path
// Use wallet.getDepositAddress() for the default address
// For per-payment addresses, create named wallets with derivation paths

// Approach: create a wallet with a unique derivation path per payment
async function getAddressForPayment(index: number): Promise<string> {
  const derivedWallet = await Wallet.fromSeed(
    process.env.BCH_SEED_PHRASE!,
    `m/44'/145'/0'/0/${index}`
  );
  return derivedWallet.getDepositAddress();
}

// Usage: const addr = await getAddressForPayment(0);
//        const addr2 = await getAddressForPayment(1);
```

Alternatively, the simplest approach is to generate a fresh wallet per payment session. This gives perfect address separation but requires tracking multiple seed phrases:

```typescript
import { Wallet } from "mainnet-js";

// Generate a fresh wallet for a specific payment
const paymentWallet = await Wallet.newRandom();
const paymentAddress = paymentWallet.getDepositAddress();

// Share paymentAddress with the payer
// After payment received, sweep funds to main wallet if desired
```

---

## Complete Setup Example

This is a full initialization routine an agent should run on startup:

```typescript
import { Wallet } from "mainnet-js";

async function initializeWallet(): Promise<Wallet> {
  const seedPhrase = process.env.BCH_SEED_PHRASE;

  if (seedPhrase) {
    // Restore existing wallet
    const wallet = await Wallet.fromSeed(seedPhrase);
    const balance = await wallet.getBalance();
    console.log(`Wallet restored. Address: ${wallet.getDepositAddress()}`);
    console.log(`Balance: ${balance} satoshis`);
    return wallet;
  }

  // No existing wallet — create a new one
  const wallet = await Wallet.newRandom();
  console.log(`New wallet created. Address: ${wallet.getDepositAddress()}`);
  console.log(`IMPORTANT: Persist this seed phrase: ${wallet.mnemonic}`);
  console.log(`Balance: 0 satoshis (new wallet)`);

  // The agent MUST persist wallet.mnemonic to BCH_SEED_PHRASE
  // before restarting, or the wallet and any funds will be lost.

  return wallet;
}

const wallet = await initializeWallet();
```

---

## Security Rules

1. **Never log seed phrases in production.** The `console.log` calls above are for illustration. In production, write the seed phrase directly to a secrets store, not to stdout or log files.

2. **Use environment variables or a secrets manager.** Never hardcode seed phrases in source files, config files committed to version control, or Dockerfiles.

3. **Principle of least privilege.** If the agent only needs to receive and verify payments, it does not need the sending capability. Consider using a watch-only setup (address only, no seed phrase) for monitoring, and a separate secured process for sending.

4. **Minimize on-wallet balance.** Keep only the amount needed for near-term operations on the hot wallet. Sweep excess funds to a more secure wallet (e.g., hardware wallet or cold storage).

5. **Never expose the seed phrase via API, HTTP response, or any external interface.** The seed phrase grants full control over all funds, past and future, derived from that seed.

6. **Backup the seed phrase in a secondary location.** If the primary secrets store fails, the backup ensures funds are recoverable.
