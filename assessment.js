/**
 * ASSESSMENT TASK - MULTI-TURN CODING ASSISTANT CHATBOT
 *
 * A sophisticated coding assistant chatbot using the GPT-4o model
 * through GitHub's AI inference API.
 */

// Step 1: Import all required modules
import OpenAI from "openai";
import readline from "readline";
import { readFileSync } from "fs";
import { resolve } from "path";

// Manually load .env file (fixes ES module dotenv timing issue)
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const envFile = readFileSync(envPath, "utf-8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex !== -1) {
          const key = trimmed.substring(0, eqIndex).trim();
          const value = trimmed.substring(eqIndex + 1).trim();
          process.env[key] = value;
        }
      }
    }
  } catch (e) {
    console.error("⚠️  Could not read .env file:", e.message);
  }
}
loadEnv();

// Step 2: Initialize the OpenAI API with the GitHub token
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error("❌ GITHUB_TOKEN not found in your .env file.");
  console.error("Please make sure your .env file contains:");
  console.error("GITHUB_TOKEN=your_token_here");
  process.exit(1);
}

const client = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: token,
});

// Step 3: Set up readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Store conversation history to maintain context across exchanges
const conversationHistory = [
  {
    role: "system",
    content: `You are an expert coding assistant with deep knowledge across multiple programming languages and software development concepts. Your role is to:
    
- Help developers understand programming concepts clearly
- Provide accurate, working code examples
- Assist with debugging and troubleshooting
- Suggest best practices and clean code principles
- Support languages including JavaScript, Python, Java, C++, TypeScript, and more
- Explain complex topics in a simple, easy-to-understand way

Always format code examples using proper code blocks. Be concise but thorough in your explanations.`,
  },
];

// Helper function to send a message and get a response
async function chat(userMessage) {
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: conversationHistory,
    temperature: 0.7,
    max_tokens: 1024,
  });

  const assistantReply = response.choices[0].message.content;

  conversationHistory.push({
    role: "assistant",
    content: assistantReply,
  });

  return assistantReply;
}

// Helper function to prompt the user for input
function askUser(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

// Step 4: Main conversation loop
async function main() {
  console.log("=========================================");
  console.log("   💻 Coding Assistant - Powered by GPT-4o");
  console.log("=========================================");
  console.log("Welcome! I'm your personal coding assistant.");
  console.log("Ask me anything about programming, debugging,");
  console.log("code reviews, or software development concepts.");
  console.log('Type "exit" at any time to quit.\n');

  while (true) {
    const userInput = await askUser("You: ");

    if (userInput.toLowerCase().trim() === "exit") {
      console.log("\nGoodbye! Happy coding! 👋");
      rl.close();
      break;
    }

    if (!userInput.trim()) {
      console.log('(Please type a question or type "exit" to quit.)\n');
      continue;
    }

    try {
      console.log("\nBot: Thinking...");
      const reply = await chat(userInput.trim());
      console.log(`\nBot: ${reply}\n`);
      console.log("-----------------------------------------\n");
    } catch (error) {
      if (error.status === 401) {
        console.error("\n❌ Authentication Error: Your GITHUB_TOKEN is invalid or missing.");
        console.error("Please check your .env file and try again.\n");
      } else if (error.status === 429) {
        console.error("\n⚠️  Rate Limit Reached: Too many requests. Please wait a moment.\n");
      } else if (error.status === 500) {
        console.error("\n⚠️  Server Error: The AI service is temporarily unavailable.\n");
      } else {
        console.error(`\n❌ Unexpected Error: ${error.message}\n`);
      }
    }
  }
}

// Run the chatbot
main();