# StellarSplit

A decentralized on-chain bill splitting application built on the Stellar blockchain.

## Overview

StellarSplit allows groups of people to create shared "tabs", log expenses against them, and settle up in XLM directly between participants — no intermediary required.

## Prerequisites

- Node.js 18+
- Rust 1.80+
- Stellar CLI (soroban)
- Freighter wallet (for frontend)

## Project Structure

```
stellarsplit/
├── contracts/split/     # Soroban smart contract (Rust)
├── frontend/            # Next.js 14 app (TypeScript)
├── scripts/              # Deployment scripts
└── docs/                 # Documentation
```

## Setup

### 1. Smart Contract

```bash
cd contracts/split
cargo build --target wasm32v1-none --release
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create `.env.local`:
```bash
NEXT_PUBLIC_CONTRACT_ID=<deployed-contract-id>
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC=https://soroban-testnet.stellar.org
```

Run development server:
```bash
npm run dev
```

## Deployment

### Deploy Contract to Testnet

```bash
# Generate a funded key or use existing
# Fund the account using Stellar testnet faucet

cd contracts/split
stellar contract deploy \
  --source <your-key-name> \
  --network testnet \
  --wasm target/wasm32v1-none/release/split.wasm
```

### Deploy Frontend to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Features

- Create tabs with members
- Add expenses with custom split
- Calculate settlements automatically
- Pay settlements directly in XLM
- Close tabs when ready to settle

## License

MIT