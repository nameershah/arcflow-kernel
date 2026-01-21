import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- SECURITY CONFIGURATION ---
const MAX_LIMIT_USDC = 50.0; 
const WHITELISTED_VENDORS = [
    "0x937402b657c91d9e74fcf373187f1758c0d8e933", 
    "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
];

// --- SYSTEM PROTOCOL ---
const SYSTEM_INSTRUCTION = `
ROLE: ArcFlow Deterministic Financial Kernel.
NETWORK: Arc Testnet (Circle Infrastructure).

PROTOCOL:
1. OUTPUT_FORMAT: JSON-RPC style brevity. No conversational filler.
2. DATA_STRICTNESS: Extract exact values. 
3. TONE: Neutral, efficient, system-level.

INTERACTION_MODEL:
- User: "Send 10 USDC to 0x..." 
- System: "INTENT_RECEIVED. Awaiting Authorization."
`;

// --- BLOCKCHAIN ADAPTER ---
// NOTE: In production, use a secrets manager, not process.env
const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);
const wallet = new ethers.Wallet(process.env.ARC_PRIVATE_KEY!, provider);
const USDC_CONTRACT_ADDRESS = "0x3600000000000000000000000000000000000000"; 

// --- KERNEL LOGIC ---
async function executePayment(to: string, amount: string) {
    const cleanAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    const cleanAddress = to.toLowerCase();
    
    // RISK ENGINE INITIALIZATION
    let riskScore = 0;
    let riskFactors = [];

    // HEURISTIC 1: IDENTITY VERIFICATION
    if (!WHITELISTED_VENDORS.includes(cleanAddress)) {
        riskScore += 40;
        riskFactors.push("UNKNOWN_ENTITY");
    }

    // HEURISTIC 2: VOLUME ANALYSIS
    if (cleanAmount > 20) {
        riskScore += 50;
        riskFactors.push("HIGH_VOLUME_TX");
    }

    const analysis = {
        timestamp: new Date().toISOString(),
        risk_score: riskScore,
        factors: riskFactors,
        status: "PENDING"
    };

    // GATE 1: CRITICAL RISK
    if (riskScore >= 80) {
        analysis.status = "BLOCKED_CRITICAL";
        return { 
            output: `[BLOCK] Risk Threshold Exceeded (${riskScore}/100). Execution Halted.`,
            analysis 
        };
    }

    // GATE 2: HARD CAP
    if (cleanAmount > MAX_LIMIT_USDC) {
        analysis.status = "BLOCKED_POLICY";
        return { 
            output: `[BLOCK] Policy Limit Exceeded (Req: ${cleanAmount} > Cap: ${MAX_LIMIT_USDC}).`,
            analysis 
        };
    }

    // EXECUTION LAYER
    const abi = ["function transfer(address to, uint256 amount) returns (bool)"];
    const contract = new ethers.Contract(USDC_CONTRACT_ADDRESS, abi, wallet);

    try {
        analysis.status = "BROADCASTED";
        const tx = await contract.transfer(cleanAddress, ethers.parseUnits(amount, 6));
        await tx.wait(1);
        return { 
            output: `[SUCCESS] TX_HASH: ${tx.hash}`,
            analysis 
        };
    } catch (error: any) {
        analysis.status = "FAILED_EVM";
        return { 
            output: `[ERROR] RPC Rejection: ${error.message}`,
            analysis 
        };
    }
}

// --- AI ORCHESTRATOR ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const tools = {
    functionDeclarations: [{
        name: "execute_payment",
        description: "Execute a USDC transfer on Arc Testnet.",
        parameters: {
            type: "OBJECT",
            properties: {
                to: { type: "STRING", description: "Wallet address (0x...)" },
                amount: { type: "STRING", description: "Amount in USDC" },
            },
            required: ["to", "amount"],
        },
    }],
};

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    systemInstruction: SYSTEM_INSTRUCTION, 
    tools: [tools] 
});

app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;
    
    try {
        const chat = model.startChat({ history: history || [] });
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const calls = response.functionCalls();

        if (calls && calls.length > 0) {
            const call = calls[0];
            if (call.name === "execute_payment") {
                const { to, amount } = call.args;
                
                const { output, analysis } = await executePayment(to as string, amount as string);
                
                const result2 = await chat.sendMessage([{
                    functionResponse: {
                        name: "execute_payment",
                        response: { result: output }
                    }
                }]);
                
                return res.json({ 
                    reply: result2.response.text(), 
                    action: "TX_ATTEMPT", 
                    details: { to, amount, output, analysis }
                });
            }
        }

        return res.json({ reply: response.text() });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;

// Vercel Serverless Handling
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 ArcFlow Terminal Online: http://localhost:${PORT}`));
}

export default app;