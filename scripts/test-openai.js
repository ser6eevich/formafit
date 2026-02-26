const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
    console.log("Testing OpenAI with key:", process.env.OPENAI_API_KEY ? "Present (starts with " + process.env.OPENAI_API_KEY.slice(0, 7) + ")" : "Missing");
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using mini for fast test
            messages: [{ role: "user", content: "Say 'Hello'" }],
        });
        console.log("Response:", completion.choices[0].message.content);
    } catch (e) {
        console.error("OpenAI Error:", e.message);
    }
}

main();
