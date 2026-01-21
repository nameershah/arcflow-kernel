import { GoogleGenerativeAI } from "@google/generative-ai";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// --- 1. SETUP THE WALLET (The Hands) ---
const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);
const wallet = new ethers.Wallet(process.env.ARC_PRIVATE_KEY!, provider);
// Arc Testnet USDC System Contract
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000"; 

// Function to actually move money
async function sendPayment(to: string, amount: string) {
    // 1. CLEAN THE INPUTS (The "Self-Healing" Logic)
    // Fix Amount: Remove "USDC" text if present
    const cleanAmount = amount.replace(/[^0-9.]/g, '');
    
    // Fix Address: Convert to lowercase to bypass "Bad Checksum" errors
    const cleanAddress = to.toLowerCase();
    
    console.log(`\n🤖 AI is sending ${cleanAmount} USDC to ${cleanAddress}...`);
    
    const abi = ["function transfer(address to, uint256 amount) returns (bool)"];
    const contract = new ethers.Contract(USDC_ADDRESS, abi, wallet);

    try {
        const tx = await contract.transfer(cleanAddress, ethers.parseUnits(cleanAmount, 6));
        console.log(`⏳ Transaction sent! Hash: ${tx.hash}`);
        await tx.wait(1); // Wait for confirmation
        
        const link = `https://explorer.testnet.arc.network/tx/${tx.hash}`;
        console.log(`✅ SUCCESS! Proof: ${link}`);
        return `Transaction Successful! View Proof here: ${link}`;
    } catch (error: any) {
        return `Transaction Failed: ${error.message}`;
    }
}

// --- 2. SETUP THE BRAIN ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const tools = {
    functionDeclarations: [{
        name: "send_payment",
        description: "Send USDC cryptocurrency to a specific address on the Arc blockchain.",
        parameters: {
            type: "OBJECT",
            properties: {
                to: { type: "STRING", description: "The wallet address to send money to" },
                amount: { type: "STRING", description: "The amount of USDC to send (e.g. '0.1')" },
            },
            required: ["to", "amount"],
        },
    }],
};

// --- 3. MODELS LIST (Stick to what works) ---
const MODEL_LIST = [
    "gemini-3-flash",      
    "gemini-2.5-flash",    // The winner!
];

async function runAgent() {
    console.log("⏳ Initializing Agent..."); 
    
    const prompt = "Please send 0.1 USDC to this address: 0x937402B657c91D9E74fcf373187F1758c0D8E933";
    console.log(`\n💬 User: "${prompt}"`);

    for (const modelName of MODEL_LIST) {
        console.log(`\n🔄 Attempting with model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName, tools: [tools] });
            const chat = model.startChat();
            
            const result = await chat.sendMessage(prompt);
            const calls = result.response.functionCalls();

            if (calls && calls.length > 0) {
                const call = calls[0];
                if (call.name === "send_payment") {
                    const { to, amount } = call.args;
                    const status = await sendPayment(to as string, amount as string);
                    
                    const result2 = await chat.sendMessage([{
                        functionResponse: {
                            name: "send_payment",
                            response: { result: status }
                        }
                    }]);
                    console.log(`\n🤖 AI: ${result2.response.text()}`);
                }
            } else {
                console.log(`\n🤖 AI: ${result.response.text()}`);
            }
            return; // Exit on success

        } catch (error: any) {
            console.warn(`❌ Model ${modelName} failed. Trying next...`);
        }
    }
    console.error("\n💀 All models failed. Please wait 60 seconds and try again.");
}

runAgent();