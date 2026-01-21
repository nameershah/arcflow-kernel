import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// 1. Connect to Arc Testnet
const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);
const wallet = new ethers.Wallet(process.env.ARC_PRIVATE_KEY!, provider);

// 2. THE CORRECT USDC ADDRESS (Arc System Contract)
// Ref: https://developers.circle.com/stablecoins/usdc-contract-addresses
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

async function main() {
    console.log(`\n🔌 Connected to Arc Blockchain`);
    console.log(`👛 Wallet Address: ${wallet.address}`);

    const abi = ["function balanceOf(address) view returns (uint256)"];
    const contract = new ethers.Contract(USDC_ADDRESS, abi, provider);

    try {
        // Method A: Check via ERC20 Contract
        const balance = await contract.balanceOf(wallet.address);
        const formatted = ethers.formatUnits(balance, 6);
        console.log(`💰 Balance (Contract): ${formatted} USDC`);
        
        // Method B: Check Native Balance (Since USDC is Gas on Arc)
        // This is often more reliable if the contract call fails
        const nativeBalance = await provider.getBalance(wallet.address);
        const formattedNative = ethers.formatEther(nativeBalance);
        console.log(`⛽ Balance (Native):   ${formattedNative} USDC`);
        
        if (parseFloat(formatted) === 0) {
            console.log("\n⚠️  Your wallet is empty! Go to the Faucet to get free USDC.");
            console.log(`👉 Address: ${wallet.address}`);
            console.log("👉 Link: https://faucet.circle.com/ (Select 'Arc Testnet')");
        } else {
            console.log("✅ Wallet is funded and ready!");
        }
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

main();

export const walletClient = wallet;