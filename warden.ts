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


// 1. Define the tool correctly
const githubTool = new FunctionTool({
    name: "fetch_repo_data",
    description: "Fetches package.json from a GitHub URL for auditing.",
    parameters: z.object({
        url: z.string().describe("The GitHub repository URL to fetch package.json from"),
    }),
    execute: async ({ url }) => {
        const { fetchRepoData } = await import('./src/tools/github.js');
        return fetchRepoData(url); // pass url as plain string, not { url }
    },
});

// 2. Define the agent correctly
export const rootAgent = new LlmAgent({
    name: "github_warden",           // no spaces
    model: "gemini-2.5-flash",       // plain string, not new Gemini({})
    instruction: "You are an expert security auditor. Use tools to analyze repos.",
    tools: [githubTool],
});

// 3. Set up Runner and Session
const sessionService = new InMemorySessionService();
const runner = new Runner({
    agent: rootAgent,
    appName: 'github_warden',
    sessionService,
});

const userId = 'user1';
const sessionId = 'session1';
await sessionService.createSession({ appName: 'github_warden', userId, sessionId });

// 4. Terminal chat loop
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("--- GitHub Warden: System Online ---");
console.log("Type your request (e.g., 'Audit https://github.com/user/repo') or 'exit' to quit");

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

        askQuestion(); // loop back for next input
    });
};

askQuestion();