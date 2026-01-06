
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key found in env");
        return;
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Error fetching models: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
            return;
        }

        const data = await response.json();
        const models = data.models?.map(m => m.name.replace('models/', '')) || [];
        console.log("Available Models:", models);

        // Find a suitable flash model
        const flashModel = models.find(m => m.includes('flash'));
        if (flashModel) {
            console.log(`\nFound Flash model: ${flashModel}. Testing...`);
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: flashModel });
            const result = await model.generateContent("Test");
            console.log("Success! Response:", result.response.text());
        } else {
            console.log("No Flash model found. Available models:", models);
        }

    } catch (error) {
        console.error("Critical Error:", error);
    }
}

// Check local .env.local because this script runs in node
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

listModels();
