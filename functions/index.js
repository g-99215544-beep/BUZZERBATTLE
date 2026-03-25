const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// This reads the secret you stored with:
// firebase functions:secrets:set GEMINI_API_KEY
const geminiApiKey = defineSecret("GEMINI_API_KEY");

exports.generateQuiz = onCall(
  {
    // Grant this function access to the secret
    secrets: [geminiApiKey],
    // Allow calls from your GitHub Pages domain
    cors: true,
    // Limit execution time and memory
    timeoutSeconds: 60,
    memory: "256MiB",
    // Rate limiting: max 10 calls per minute per user
    enforceAppCheck: false,
  },
  async (request) => {
    // Only authenticated users (hosts) can generate quizzes
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Anda perlu login untuk guna AI."
      );
    }

    const { topic, numberOfQuestions, language } = request.data;

    // Validate input
    if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
      throw new HttpsError("invalid-argument", "Sila masukkan topik yang sah.");
    }

    const numQ = Math.min(Math.max(parseInt(numberOfQuestions) || 5, 1), 20);
    const lang = language || "Malay";

    // Build prompt
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
      // Initialize Gemini with the secret API key
      const genAI = new GoogleGenerativeAI(geminiApiKey.value());
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = text;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const questions = JSON.parse(jsonStr);

      // Validate structure
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Invalid response format");
      }

      // Sanitize each question
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

      return { questions: sanitized };
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new HttpsError(
        "internal",
        "Gagal menjana soalan. Cuba lagi."
      );
    }
  }
);
