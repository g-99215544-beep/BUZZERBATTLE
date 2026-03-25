/* ═══════════════════════════════════════════
   BUZZERBATTLE - FIREBASE SERVICE
   ═══════════════════════════════════════════ */

(function () {
  var db, auth, provider;

  BB.fire = {
    init: function () {
      var app = firebase.initializeApp(BB.FIREBASE_CONFIG);
      db = firebase.database();
      auth = firebase.auth();
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

    // ─── AI QUIZ GENERATION ───
    generateQuiz: function (topic, numberOfQuestions, language) {
      var fn = firebase.app().functions("us-central1").httpsCallable("generateQuiz");
      return fn({ topic: topic, numberOfQuestions: numberOfQuestions, language: language })
        .then(function (result) { return result.data.questions; });
    },
  };
})();
