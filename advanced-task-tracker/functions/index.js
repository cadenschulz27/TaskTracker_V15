const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Firebase Admin SDK
initializeApp();

// Initialize the Gemini AI client with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateSubtasks = onCall(async (request) => {
    // 1. Authenticate the user
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be logged in to use this feature.");
    }

    // 2. Validate the incoming data
    const { taskName, taskDescription } = request.data;
    if (!taskName || typeof taskName !== "string" || taskName.trim().length === 0) {
        throw new HttpsError("invalid-argument", "The function must be called with a valid 'taskName'.");
    }

    try {
        // 3. Construct the prompt for the AI model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            Based on the following task, generate a checklist of specific, actionable subtasks.
            
            Task Name: "${taskName}"
            Task Description: "${taskDescription || 'No description provided.'}"

            Rules:
            - Provide between 3 and 7 subtasks.
            - Each subtask should be a short, clear action item.
            - Return the response as a simple JavaScript array of strings. For example: ["First subtask", "Second subtask", "Third subtask"]
            - Do not include any other text, explanation, or markdown formatting. Only return the array.
        `;

        // 4. Call the AI model and get the response
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        // 5. Clean and parse the AI's response
        // The AI is asked to return a JS array string, e.g., '["item1", "item2"]'
        // We need to safely parse this into a real array.
        const arrayString = responseText.trim().replace(/^`{3}json\n?/, "").replace(/`{3}$/, "");
        const subtasks = JSON.parse(arrayString);

        if (!Array.isArray(subtasks)) {
             throw new Error("AI did not return a valid array.");
        }

        // 6. Return the array of subtasks to the client
        return { subtasks };

    } catch (error) {
        console.error("Error calling Gemini API or parsing response:", error);
        throw new HttpsError("internal", "An error occurred while generating subtasks.", error.message);
    }
});