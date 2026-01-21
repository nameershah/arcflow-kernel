import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import dotenv from 'dotenv';

dotenv.config();

// The "!" tells TypeScript: "I promise this value exists!"
const apiKey = process.env.CIRCLE_API_KEY!;
const entitySecret = process.env.CIRCLE_ENTITY_SECRET!;

if (!apiKey || !entitySecret) {
    console.error("❌ Error: Keys are missing from .env file");
    process.exit(1);
}

const client = initiateDeveloperControlledWalletsClient({
    apiKey: apiKey,
    entitySecret: entitySecret
});

async function main() {
    console.log("🔌 Testing connection to Circle...");
    try {
        const response = await client.listWalletSets();
        console.log("✅ SUCCESS: Connection established!");
        console.log(`💼 Wallet Sets Found: ${response.data?.walletSets?.length || 0}`);
    } catch (error: any) {
        console.error("❌ FAILED: Could not connect.");
        console.error(error.response?.data?.message || error.message);
    }
}
main();