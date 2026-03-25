const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");

admin.initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

exports.generateQuiz = onRequest(
  {
    secrets: [geminiApiKey],
    timeoutSeconds: 60,
    memory: "256MiB",
    cors: true,
  },
  async (req, res) => {
    // Only allow POST
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    // Verify Firebase Auth token
    const authHeader = req.headers.authorization || "";
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) {
      res.status(401).json({ error: "Anda perlu login untuk guna AI." });
      return;
    }

    try {
      await admin.auth().verifyIdToken(match[1]);
    } catch (e) {
      res.status(401).json({ error: "Token tidak sah." });
      return;
    }

    const { topic, numberOfQuestions, language } = req.body;

    if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
      res.status(400).json({ error: "Sila masukkan topik yang sah." });
      return;
    }

    const numQ = Math.min(Math.max(parseInt(numberOfQuestions) || 5, 1), 20);
    const lang = language || "Malay";

    const prompt = `Generate a quiz about "${topic.trim()}" with exactly ${numQ} multiple choice questions.

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- Only ONE correct answer per question
- Questions should be in ${lang} language
- Difficulty: suitable for school students
- Each question is worth 10 points

Return ONLY a valid JSON array, no markdown, no explanation. Format:
[
  {
    "question": "Soalan di sini?",
    "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
    "correctIndex": 0,
    "points": 10
  }
]

correctIndex is 0-based (0=A, 1=B, 2=C, 3=D).`;

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey.value());
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      let jsonStr = text;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const questions = JSON.parse(jsonStr);

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Invalid response format");
      }

      const sanitized = questions.map(function (q) {
        return {
          question: String(q.question || ""),
          options: (q.options || []).slice(0, 4).map(function (o) {
            return String(o);
          }),
          correctIndex: Math.min(Math.max(parseInt(q.correctIndex) || 0, 0), 3),
          points: parseInt(q.points) || 10,
        };
      });

      res.status(200).json({ questions: sanitized });
    } catch (error) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: "Gagal menjana soalan. Cuba lagi." });
    }
  }
);
