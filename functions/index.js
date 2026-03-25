const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");

admin.initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const toyyibpaySecret = defineSecret("TOYYIBPAY_SECRET");
const toyyibpayCategoryCode = defineSecret("TOYYIBPAY_CATEGORY_CODE");

// ─── HELPER: Get today's date string (Malaysia timezone) ───
function getTodayMY() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}

// ─── HELPER: Verify Firebase Auth token ───
async function verifyAuth(req) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    return await admin.auth().verifyIdToken(match[1]);
  } catch (e) {
    return null;
  }
}

// ═══════════════════════════════════════
//  GENERATE QUIZ (Premium Only + Daily Limit)
// ═══════════════════════════════════════
exports.generateQuiz = onRequest(
  {
    secrets: [geminiApiKey],
    timeoutSeconds: 60,
    memory: "256MiB",
    cors: true,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const decoded = await verifyAuth(req);
    if (!decoded) {
      res.status(401).json({ error: "Anda perlu login untuk guna AI." });
      return;
    }

    const uid = decoded.uid;

    // ─── Check Premium Status ───
    const userRef = admin.database().ref("buzzerBattle/users/" + uid);
    const userSnap = await userRef.once("value");
    const userData = userSnap.val() || {};

    if (!userData.premium) {
      res.status(403).json({ error: "Ciri ini hanya untuk pengguna Premium. Sila upgrade ke Premium (RM15) untuk guna Jana AI.", premiumRequired: true });
      return;
    }

    // ─── Check Daily Limit (60 questions/day) ───
    const today = getTodayMY();
    const usageRef = admin.database().ref("buzzerBattle/users/" + uid + "/aiUsage");
    const usageSnap = await usageRef.once("value");
    const usage = usageSnap.val() || {};
    const todayCount = (usage.date === today) ? (usage.count || 0) : 0;

    const { topic, numberOfQuestions, language, year, level } = req.body;
    const numQ = Math.min(Math.max(parseInt(numberOfQuestions) || 5, 1), 20);

    if (todayCount + numQ > 60) {
      const remaining = Math.max(0, 60 - todayCount);
      res.status(429).json({ error: "Had harian dicapai. Anda boleh jana " + remaining + " soalan lagi hari ini (had: 60 soalan/hari).", dailyLimit: true, remaining: remaining });
      return;
    }

    if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
      res.status(400).json({ error: "Sila masukkan topik yang sah." });
      return;
    }

    const lang = language || "Malay";
    const studentYear = year || "Tahun 4";
    const diffLevel = level || "Sederhana";

    const difficultyMap = {
      "Mudah": "easy (basic recall, simple facts, straightforward questions)",
      "Sederhana": "medium (requires understanding, some application of concepts)",
      "Susah": "hard (requires analysis, critical thinking, tricky options that test deep understanding)",
    };
    const diffDesc = difficultyMap[diffLevel] || difficultyMap["Sederhana"];

    const prompt = `Generate a quiz about "${topic.trim()}" with exactly ${numQ} multiple choice questions.

Target student: ${studentYear} (Malaysian education system - KSSR/KSSM curriculum)
Difficulty: ${diffLevel} - ${diffDesc}

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- Only ONE correct answer per question
- Questions should be in ${lang} language
- Questions MUST be appropriate for ${studentYear} students
- Difficulty level MUST be ${diffLevel}: ${diffDesc}
- Wrong options should be plausible but clearly incorrect for students at this level
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
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

      // ─── Update daily usage count ───
      await usageRef.set({
        date: today,
        count: todayCount + sanitized.length,
      });

      res.status(200).json({ questions: sanitized });
    } catch (error) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: "Gagal menjana soalan. Cuba lagi." });
    }
  }
);

// ═══════════════════════════════════════
//  CREATE TOYYIBPAY BILL (Premium Upgrade)
// ═══════════════════════════════════════
exports.createBill = onRequest(
  {
    secrets: [toyyibpaySecret, toyyibpayCategoryCode],
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: true,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const decoded = await verifyAuth(req);
    if (!decoded) {
      res.status(401).json({ error: "Sila login terlebih dahulu." });
      return;
    }

    const uid = decoded.uid;
    const email = decoded.email || "";
    const name = decoded.name || email;

    // Check if already premium
    const userSnap = await admin.database().ref("buzzerBattle/users/" + uid + "/premium").once("value");
    if (userSnap.val() === true) {
      res.status(400).json({ error: "Anda sudah Premium!" });
      return;
    }

    try {
      const callbackUrl = "https://us-central1-livequiz-953f6.cloudfunctions.net/paymentCallback";
      const returnUrl = "https://livequiz-953f6.firebaseapp.com/?payment=success";

      const params = new URLSearchParams();
      params.append("userSecretKey", toyyibpaySecret.value());
      params.append("categoryCode", toyyibpayCategoryCode.value());
      params.append("billName", "BuzzerBattle Premium");
      params.append("billDescription", "Upgrade ke Premium - Jana AI tanpa had");
      params.append("billPriceSetting", "1");
      params.append("billPayorInfo", "1");
      params.append("billAmount", "1500"); // RM15.00 in cents
      params.append("billReturnUrl", returnUrl);
      params.append("billCallbackUrl", callbackUrl);
      params.append("billExternalReferenceNo", uid);
      params.append("billTo", name);
      params.append("billEmail", email);
      params.append("billPhone", "");
      params.append("billSplitPayment", "0");
      params.append("billSplitPaymentArgs", "");
      params.append("billPaymentChannel", "2"); // FPX only
      params.append("billContentEmail", "Terima kasih kerana upgrade ke BuzzerBattle Premium!");
      params.append("billChargeToCustomer", "2"); // No extra charge

      const response = await fetch("https://toyyibpay.com/index.php/api/createBill", {
        method: "POST",
        body: params,
      });

      const data = await response.json();

      if (!data || !data[0] || !data[0].BillCode) {
        console.error("ToyyibPay createBill error:", data);
        res.status(500).json({ error: "Gagal mencipta bil pembayaran." });
        return;
      }

      const billCode = data[0].BillCode;

      // Save payment record
      await admin.database().ref("buzzerBattle/payments/" + billCode).set({
        uid: uid,
        email: email,
        amount: 15,
        status: "pending",
        createdAt: Date.now(),
      });

      res.status(200).json({
        billCode: billCode,
        paymentUrl: "https://toyyibpay.com/" + billCode,
      });
    } catch (error) {
      console.error("CreateBill error:", error);
      res.status(500).json({ error: "Gagal mencipta bil. Cuba lagi." });
    }
  }
);

// ═══════════════════════════════════════
//  PAYMENT CALLBACK (from ToyyibPay)
// ═══════════════════════════════════════
exports.paymentCallback = onRequest(
  {
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (req, res) => {
    // ToyyibPay sends callback as POST with form data
    const {
      refno,
      status,
      reason,
      billcode,
      order_id,
      amount,
      transaction_time,
    } = req.body || {};

    console.log("Payment callback received:", { refno, status, billcode, order_id, amount });

    if (!billcode) {
      res.status(400).send("Missing billcode");
      return;
    }

    try {
      const paymentRef = admin.database().ref("buzzerBattle/payments/" + billcode);
      const paymentSnap = await paymentRef.once("value");
      const payment = paymentSnap.val();

      if (!payment) {
        console.error("Payment record not found for billcode:", billcode);
        res.status(404).send("Payment not found");
        return;
      }

      // Status "1" = success, "2" = pending, "3" = failed
      if (status === "1") {
        const uid = payment.uid;

        // Upgrade user to premium
        await admin.database().ref("buzzerBattle/users/" + uid).update({
          premium: true,
          premiumSince: Date.now(),
        });

        // Update payment record
        await paymentRef.update({
          status: "paid",
          paidAt: Date.now(),
          refno: refno || "",
          transactionTime: transaction_time || "",
        });

        console.log("User upgraded to premium:", uid);
      } else {
        await paymentRef.update({
          status: status === "3" ? "failed" : "pending",
          reason: reason || "",
        });
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Payment callback error:", error);
      res.status(500).send("Error processing callback");
    }
  }
);
