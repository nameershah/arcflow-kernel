# 🛡️ ArcFlow | Agentic Commerce Safety Kernel

### The "Prefrontal Cortex" for Autonomous Financial Agents.
**ArcFlow** is a deterministic runtime environment that bridges the gap between probabilistic LLMs (Gemini) and immutable blockchain state (Arc). It treats financial transactions as **Privileged Side Effects**, reachable only through a strict, policy-gated authorization layer.

---

## ⚡ Quick Start (Judge's Guide)
ArcFlow is architected as a **Self-Hosted Terminal** to ensure users maintain cryptographic custody of their keys.

### Option A: The "One-Click" Method (GitHub Codespaces)
1. Click the green **Code** button -> **Codespaces** -> **Create codespace on main**.
2. Create a `.env` file in the root:
   ```env
   # Official Arc Testnet RPC
   ARC_RPC_URL=https://rpc.testnet.arc.network
   
   # Your Keys
   GEMINI_API_KEY=your_google_key
   ARC_PRIVATE_KEY=your_testnet_key