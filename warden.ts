import 'dotenv/config';
import {
    LlmAgent,
    FunctionTool,
    Runner,
    InMemorySessionService,
    isFinalResponse
} from '@google/adk';
import { Content } from '@google/genai';
import { z } from 'zod';
import * as readline from 'readline';

// --- TOOLS SECTION ---

// Tool 1: GitHub Package Data
const githubTool = new FunctionTool({
    name: "fetch_repo_data",
    description: "Fetches package.json from a GitHub URL for auditing.",
    parameters: z.object({
        url: z.string().describe("The GitHub repository URL"),
    }),
   execute: async ({ url }) => {
    const module = await import('./src/tools/github.js');
    return module.fetchRepoData(url);
},
});

// Tool 2: README Data
const readmeTool = new FunctionTool({
    name: "fetch_readme",
    description: "Fetches the README.md to understand the project's purpose.",
    parameters: z.object({
        url: z.string().describe("The GitHub repository URL"),
    }),
    execute: async ({ url }) => {
    const module = await import('./src/tools/readme.js');
    return module.fetchReadme(url);
},
});

// --- AGENT SECTION ---

export const rootAgent = new LlmAgent({
    name: "github_warden",
    // Change "gemini-3.5-flash" to "gemini-1.5-flash" 
    // (In 2026, 1.5 remains the standard stable endpoint for tool-calling)
    model: "gemini-2.5-flash", 
    instruction: "You are a master auditor. Use tools to analyze repos.",
    tools: [githubTool, readmeTool],
});

// --- RUNNER & SESSION SECTION ---

const sessionService = new InMemorySessionService();
const runner = new Runner({
    agent: rootAgent,
    appName: 'github_warden',
    sessionService,
});

const userId = 'user1';
const sessionId = 'session1';
await sessionService.createSession({ appName: 'github_warden', userId, sessionId });

// --- INTERFACE SECTION ---

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("--- GitHub Warden: System Online (Multi-Tool Mode) ---");
console.log("Type your request or 'exit' to quit");

const askQuestion = () => {
    rl.question('\nYou > ', async (input) => {
        if (input.toLowerCase() === 'exit') {
            rl.close();
            return;
        }

        const userMessage: Content = { parts: [{ text: input }], role: 'user' };
        process.stdout.write('\nAgent > ');

        for await (const event of runner.runAsync({ userId, sessionId, newMessage: userMessage })) {
            if (isFinalResponse(event) && event.content?.parts?.length) {
                const text = event.content.parts.map(p => p.text ?? '').join('');
                console.log(text);
            }
        }
        askQuestion();
    });
};

askQuestion();