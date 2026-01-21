import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.CIRCLE_API_KEY?.trim() || "";
const parts = apiKey.split(':');

console.log("\n🔎 DIAGNOSTIC REPORT:");
console.log("---------------------------------------------------");
console.log(`📏 Total Length:  ${apiKey.length} characters`);
console.log(`🧩 Key Parts:     ${parts.length} (Should be 3)`);
console.log(`🏷️  Prefix:        ${parts[0]}`);
console.log("---------------------------------------------------\n");

if (parts.length !== 3) {
    console.error("❌ CRITICAL ERROR: Your key is incomplete.");
    console.error("   It must have 3 parts separated by colons (:).");
    console.error("   You likely missed the end when copying.");
    process.exit(1);
}

if (apiKey.length < 60) {
    console.error("❌ CRITICAL ERROR: Your key is too short.");
    console.error("   A valid key is usually 70+ characters long.");
    process.exit(1);
}

// If we get here, the key format is VALID. Now we test the connection.
async function testConnection() {
    console.log("🔄 Key looks valid. Testing connection to Circle...");
    try {
        await axios.get('https://api-sandbox.circle.com/v1/w3s/config/entity/publicKey', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        console.log("✅ SUCCESS! The key is working."); 
        console.log("   (You can now revert to the previous script to register the secret)");
    } catch (error: any) {
        console.error("❌ FAILED: Circle rejected this key.");
        console.error("   Reason: " + (error.response?.data?.message || error.message));
    }
}

testConnection();