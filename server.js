import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();

app.use(cors({
  origin: "*"
}));

app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("❌ Missing GROQ_API_KEY in .env file");
  process.exit(1);
}

// 🧠 AI Security Linter Endpoint
app.post("/scan", async (req, res) => {
  try {
    const { code } = req.body;

    // Validate request
    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Code is required"
      });
    }

    const prompt = `
You are a senior cybersecurity code reviewer.

Scan the following code for:
- Hardcoded API keys
- SQL Injection risks
- Buffer overflow risks
- Unsafe functions
- Security vulnerabilities

Return:
1. Issues found
2. Severity (Low/Medium/High)
3. Fix suggestion

Code:
${code}
`;

    // 🔥 Call Groq API
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a security code auditor."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Extract AI response
    const result = response.data.choices[0].message.content;

    return res.json({
      success: true,
      analysis: result,
    });

  } catch (error) {
    console.error(
      "❌ Groq API Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      error: "AI scan failed",
      details: error.response?.data || error.message,
    });
  }
});

// Health check route
app.get("/", (req, res) => {
  res.send("✅ Secure Code Linter Backend Running");
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});