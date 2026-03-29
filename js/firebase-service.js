/* ═══════════════════════════════════════════
   BUZZERBATTLE - FIREBASE SERVICE
   ═══════════════════════════════════════════ */

(function () {
  var db, auth, provider, storage;

  BB.fire = {
    init: function () {
      var app = firebase.initializeApp(BB.FIREBASE_CONFIG);
      db = firebase.database();
      auth = firebase.auth();
      storage = firebase.storage();
      provider = new firebase.auth.GoogleAuthProvider();
    },

    // ─── AUTH ───
    onAuthChange: function (cb) {
      auth.onAuthStateChanged(cb);
    },
    loginGoogle: function () {
      return auth.signInWithPopup(provider).catch(function (err) {
        // If popup blocked or unauthorized domain, try redirect
        if (err.code === "auth/unauthorized-domain" ||
            err.code === "auth/popup-blocked" ||
            err.code === "auth/popup-closed-by-user") {
          return auth.signInWithRedirect(provider);
        }
        throw err;
      });
    },
    handleRedirectResult: function () {
      return auth.getRedirectResult();
    },
    logout: function () {
      return auth.signOut();
    },

    // ─── QUIZ CRUD ───
    listenQuizSets: function (uid, cb) {
      var ref = db.ref("buzzerBattle/users/" + uid + "/quizSets");
      ref.on("value", function (snap) {
        var data = snap.val() || {};
        var arr = Object.entries(data).map(function (e) {
          var id = e[0], v = e[1];
          return {
            id: id, title: v.title, createdAt: v.createdAt,
            questionCount: v.questions ? Object.keys(v.questions).length : 0,
            questions: v.questions ? Object.values(v.questions) : [],
          };
        });
        arr.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
        cb(arr);
      });
      return ref;
    },
    saveQuiz: function (uid, quizId, title, questions) {
      var qObj = {};
      questions.forEach(function (q, i) { qObj["q" + i] = q; });
      var data = { title: title, questions: qObj, createdAt: Date.now() };
      if (quizId) {
        return db.ref("buzzerBattle/users/" + uid + "/quizSets/" + quizId).update(data);
      } else {
        return db.ref("buzzerBattle/users/" + uid + "/quizSets").push().set(data);
      }
    },
    deleteQuiz: function (uid, quizId) {
      return db.ref("buzzerBattle/users/" + uid + "/quizSets/" + quizId).remove();
    },

    // ─── ROOM ───
    roomExists: function (code) {
      return db.ref("buzzerBattle/rooms/" + code).once("value").then(function (s) { return s.exists(); });
    },
    getRoomOnce: function (code) {
      return db.ref("buzzerBattle/rooms/" + code).once("value").then(function (s) { return s.val(); });
    },
    createRoom: function (code, payload) {
      payload.createdAt = firebase.database.ServerValue.TIMESTAMP;
      return db.ref("buzzerBattle/rooms/" + code).set(payload);
    },
    deleteRoom: function (code) {
      return db.ref("buzzerBattle/rooms/" + code).remove();
    },
    listenRoom: function (code, cb) {
      var ref = db.ref("buzzerBattle/rooms/" + code);
      ref.on("value", function (snap) { cb(snap.val()); });
      return ref;
    },
    stopListenRoom: function (code) {
      db.ref("buzzerBattle/rooms/" + code).off();
    },
    updateRoom: function (code, data) {
      return db.ref("buzzerBattle/rooms/" + code).update(data);
    },
    setRoomField: function (code, field, value) {
      return db.ref("buzzerBattle/rooms/" + code + "/" + field).set(value);
    },

    // ─── PLAYER ───
    addPlayer: function (code, name) {
      var ref = db.ref("buzzerBattle/rooms/" + code + "/players").push();
      return ref.set({
        name: name, score: 0,
        joinedAt: firebase.database.ServerValue.TIMESTAMP,
      }).then(function () { return ref.key; });
    },
    removePlayer: function (code, playerId) {
      return db.ref("buzzerBattle/rooms/" + code + "/players/" + playerId).remove();
    },

    // ─── BUZZER (transaction) ───
    tryBuzz: function (code, playerId) {
      var ref = db.ref("buzzerBattle/rooms/" + code + "/buzzedBy");
      return ref.transaction(function (current) {
        if (current === null) return playerId;
        return undefined; // abort
      }).then(function () {
        return ref.once("value");
      }).then(function (snap) {
        return snap.val() === playerId;
      });
    },

    // ─── SCORE ───
    updateScore: function (code, playerId, delta) {
      var ref = db.ref("buzzerBattle/rooms/" + code + "/players/" + playerId + "/score");
      return ref.transaction(function (current) { return (current || 0) + delta; });
    },

    // ─── PREMIUM STATUS ───
    listenPremium: function (uid, cb) {
      var ref = db.ref("buzzerBattle/users/" + uid);
      ref.on("value", function (snap) {
        var data = snap.val() || {};
        var expiry = data.premiumExpiry || 0;
        var isActive = Date.now() < expiry;
        var trialUsed = data.trialUsed || 0;
        cb(isActive, expiry, trialUsed);
      });
      return ref;
    },
    listenAiUsage: function (uid, cb) {
      var ref = db.ref("buzzerBattle/users/" + uid + "/aiUsage");
      ref.on("value", function (snap) { cb(snap.val() || {}); });
      return ref;
    },

    // ─── PAYMENT ───
    createBill: async function () {
      var user = firebase.auth().currentUser;
      if (!user) throw new Error("Not authenticated");
      var token = await user.getIdToken();
      var url = BB.CLOUD_FUNCTIONS_URL + "/createBill";
      var resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
        body: JSON.stringify({}),
      });
      if (!resp.ok) {
        var err = await resp.json().catch(function () { return {}; });
        throw new Error(err.error || "Gagal mencipta bil pembayaran");
      }
      return await resp.json();
    },

    // ─── IMAGE UPLOAD (Firebase Storage) ───
    uploadQuestionImage: function (uid, quizId, questionIndex, file) {
      var path = "buzzerBattle/" + uid + "/quizImages/" + (quizId || "new") + "/q" + questionIndex + "_" + Date.now();
      var ref = storage.ref(path);
      return ref.put(file).then(function () {
        return ref.getDownloadURL();
      });
    },
    deleteQuestionImage: function (imageUrl) {
      if (!imageUrl) return Promise.resolve();
      try {
        var ref = storage.refFromURL(imageUrl);
        return ref.delete().catch(function () { /* ignore if already deleted */ });
      } catch (e) {
        return Promise.resolve();
      }
    },

    // ─── AI QUIZ GENERATION ───
    generateQuiz: async function (topic, numberOfQuestions, language, year, level, withImages) {
      var user = firebase.auth().currentUser;
      if (!user) throw new Error("Not authenticated");
      var token = await user.getIdToken();
      var url = BB.CLOUD_FUNCTIONS_URL + "/generateQuiz";
      var resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
        body: JSON.stringify({ topic: topic, numberOfQuestions: numberOfQuestions, language: language, year: year || "", level: level || "Sederhana", withImages: !!withImages }),
      });
      if (!resp.ok) {
        var err = await resp.json().catch(function () { return {}; });
        throw new Error(err.error || "Gagal menjana soalan");
      }
      var data = await resp.json();
      return data.questions;
    },

    // ─── REGENERATE IMAGE URL FOR A QUESTION ───
    regenerateImage: async function (question, correctAnswer, language) {
      var user = firebase.auth().currentUser;
      if (!user) throw new Error("Not authenticated");
      var token = await user.getIdToken();
      var url = BB.CLOUD_FUNCTIONS_URL + "/regenerateImage";
      var resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
        body: JSON.stringify({ question: question, correctAnswer: correctAnswer, language: language || "Malay" }),
      });
      if (!resp.ok) {
        var err = await resp.json().catch(function () { return {}; });
        throw new Error(err.error || "Gagal menjana gambar");
      }
      var data = await resp.json();
      return data.imageUrl;
    },
  };
})();
