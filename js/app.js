/* ═══════════════════════════════════════════
   BUZZERBATTLE - APP CONTROLLER
   ═══════════════════════════════════════════ */

(function () {
  var root = document.getElementById("app");
  var modalRoot = null;
  var toastTimer = null;

  BB.app = {
    state: {
      screen: "loading",
      user: null,
      quizSets: [],
      // Editor
      editorTitle: "",
      editorQuestions: [],
      editingId: null,
      // Room
      roomCode: null,
      roomData: null,
      playerId: null,
      playerName: "",
      quizTitle: "",
      // Delete
      deleteId: null,
      deleteTitle: "",
    },
  };

  var S = BB.app.state;

  // ─── RENDER ───
  function render() {
    var html = "";
    switch (S.screen) {
      case "loading":
        html = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px"><div style="color:var(--accent3);animation:pulse 1.5s infinite">' + BB.SVG.zap + '</div><p style="color:var(--text-dim);font-size:14px">Memuatkan BuzzerBattle...</p></div>';
        break;
      case "landing":
        html = BB.ui.landing();
        break;
      case "dashboard":
        html = BB.ui.dashboard(S.user, S.quizSets);
        break;
      case "editor":
        html = BB.ui.editor(S.editorTitle, S.editorQuestions, !!S.editingId);
        break;
      case "hostWaiting":
        html = BB.ui.hostWaiting(S.roomCode, S.roomData, S.quizTitle);
        break;
      case "playerJoinName":
        html = BB.ui.playerJoinName(S.roomCode);
        break;
      case "playerWaiting":
        html = BB.ui.playerWaiting(S.roomCode, S.playerName, S.roomData);
        break;
      case "liveHost":
        html = BB.ui.hostLive(S.roomData);
        break;
      case "livePlayer":
        html = BB.ui.playerLive(S.roomData, S.playerId, S.playerName);
        break;
      case "results":
        html = BB.ui.results(S.roomData, !!S.user);
        break;
    }
    root.innerHTML = html;

    // Post-render: update editor save button
    if (S.screen === "editor") updateSaveBtn();
  }

  function updateSaveBtn() {
    var btn = document.getElementById("saveBtn");
    if (!btn) return;
    var ok = S.editorTitle.trim() && S.editorQuestions.length > 0 &&
      S.editorQuestions.every(function (q) { return q.question.trim() && q.options.every(function (o) { return o.trim(); }); });
    btn.disabled = !ok;
    btn.style.background = ok ? "linear-gradient(135deg,var(--success),#00c853)" : "#e0e4ea";
    btn.style.color = ok ? "#fff" : "var(--text-dim)";
    btn.style.boxShadow = ok ? "0 0 20px rgba(0,230,118,0.3)" : "none";
  }

  // ─── TOAST ───
  function showToast(msg, type) {
    type = type || "success";
    if (toastTimer) clearTimeout(toastTimer);
    var existing = document.querySelector(".toast");
    if (existing) existing.remove();
    var div = document.createElement("div");
    div.className = "toast " + type;
    div.textContent = msg;
    document.body.appendChild(div);
    toastTimer = setTimeout(function () { div.remove(); }, 2500);
  }

  // ─── MODAL ───
  function showModal(html) {
    if (!modalRoot) { modalRoot = document.createElement("div"); modalRoot.id = "modal"; document.body.appendChild(modalRoot); }
    modalRoot.innerHTML = html;
  }
  BB.app.closeModal = function () { if (modalRoot) modalRoot.innerHTML = ""; };

  // ─── FULLSCREEN ───
  BB.toggleFS = async function () {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      try { await screen.orientation.lock("landscape"); } catch (e) {}
      // If host, broadcast fullscreen to all players
      if (S.roomCode && S.user) {
        BB.fire.setRoomField(S.roomCode, "forceFullscreen", true);
      }
    } else {
      document.exitFullscreen();
      try { screen.orientation.unlock(); } catch (e) {}
      if (S.roomCode && S.user) {
        BB.fire.setRoomField(S.roomCode, "forceFullscreen", false);
      }
    }
  };

  // Player: auto-enter fullscreen when host triggers it
  BB.checkForceFullscreen = async function (roomData) {
    if (!roomData || !roomData.forceFullscreen) return;
    if (document.fullscreenElement) return;
    try {
      await document.documentElement.requestFullscreen();
      try { await screen.orientation.lock("landscape"); } catch (e) {}
    } catch (e) {}
  };

  // ─── NAV ───
  BB.app.go = function (screen) {
    if (screen === "landing") { cleanupRoom(); S.playerId = null; S.playerName = ""; }
    S.screen = screen;
    render();
  };

  // ─── ROOM LISTENER ───
  var roomListenerCode = null;
  function listenRoom(code) {
    cleanupRoom();
    roomListenerCode = code;
    BB.fire.listenRoom(code, function (data) {
      if (!data) { S.roomData = null; return; }
      S.roomData = data;

      // Force fullscreen for players when host triggers it
      if (S.playerId && !S.user) {
        BB.checkForceFullscreen(data);
      }

      // Auto transition
      if (data.status === "ended") {
        if (["liveHost", "livePlayer", "hostWaiting", "playerWaiting"].indexOf(S.screen) >= 0) {
          S.screen = "results";
        }
      } else if (["buzzer_locked", "buzzer_open", "buzzed", "answered"].indexOf(data.status) >= 0) {
        if (S.screen === "hostWaiting") S.screen = "liveHost";
        if (S.screen === "playerWaiting") S.screen = "livePlayer";
      }
      render();
    });
  }
  function cleanupRoom() {
    if (roomListenerCode) { BB.fire.stopListenRoom(roomListenerCode); roomListenerCode = null; }
    S.roomData = null; S.roomCode = null;
  }

  // ═══════════════════════════════════════
  //  AUTH
  // ═══════════════════════════════════════
  BB.app.login = async function () {
    try {
      await BB.fire.loginGoogle();
    } catch (e) {
      console.error("Login error:", e.code, e.message);
      if (e.code === "auth/unauthorized-domain") {
        showToast("Domain tidak dibenarkan. Sila hubungi admin.", "error");
      } else {
        showToast("Login gagal: " + (e.message || "Cuba lagi."), "error");
      }
    }
  };
  BB.app.logout = async function () {
    cleanupRoom();
    await BB.fire.logout();
    S.user = null; S.quizSets = [];
    S.screen = "landing"; render();
  };

  // ═══════════════════════════════════════
  //  QUIZ CRUD
  // ═══════════════════════════════════════
  BB.app.newQuiz = function () {
    S.editingId = null; S.editorTitle = ""; S.editorQuestions = [];
    S.screen = "editor"; render();
  };
  BB.app.editQuiz = function (id) {
    var qs = S.quizSets.find(function (q) { return q.id === id; });
    if (!qs) return;
    S.editingId = id;
    S.editorTitle = qs.title;
    S.editorQuestions = JSON.parse(JSON.stringify(qs.questions));
    S.screen = "editor"; render();
  };

  // AI Quiz Generation
  BB.app.showAiModal = function () {
    showModal(BB.ui.aiModal());
  };
  BB.app.generateAI = async function () {
    var topicEl = document.getElementById("aiTopic");
    var numEl = document.getElementById("aiNum");
    var langEl = document.getElementById("aiLang");
    var btn = document.getElementById("aiGenBtn");
    var topic = topicEl ? topicEl.value.trim() : "";
    var num = numEl ? parseInt(numEl.value) || 5 : 5;
    var lang = langEl ? langEl.value : "Malay";
    if (!topic) { showToast("Sila masukkan topik.", "error"); return; }

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Menjana soalan...';
    try {
      var questions = await BB.fire.generateQuiz(topic, num, lang);
      S.editorTitle = S.editorTitle || topic;
      S.editorQuestions = S.editorQuestions.concat(questions);
      BB.app.closeModal();
      render();
      showToast(questions.length + " soalan dijana oleh AI!");
    } catch (e) {
      console.error("AI generate error:", e);
      showToast("Gagal menjana: " + (e.message || "Cuba lagi."), "error");
      btn.disabled = false;
      btn.innerHTML = '🤖 Jana Soalan';
    }
  };

  // Editor actions
  BB.app.addQ = function () {
    S.editorQuestions.push({ question: "", options: ["", "", "", ""], correctIndex: 0, points: 10 });
    render();
    setTimeout(function () { window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }, 100);
  };
  BB.app.removeQ = function (qi) {
    S.editorQuestions.splice(qi, 1); render();
  };
  BB.app.updateQ = function (qi, field, value) {
    S.editorQuestions[qi][field] = value; updateSaveBtn();
  };
  BB.app.updateOpt = function (qi, oi, value) {
    S.editorQuestions[qi].options[oi] = value; updateSaveBtn();
  };
  BB.app.setCorrect = function (qi, oi) {
    S.editorQuestions[qi].correctIndex = oi; render();
  };

  BB.app.saveQuiz = async function () {
    var t = S.editorTitle; var q = S.editorQuestions;
    if (!t.trim() || q.length === 0) return;
    try {
      await BB.fire.saveQuiz(S.user.uid, S.editingId, t, q);
      showToast(S.editingId ? "Quiz dikemaskini!" : "Quiz disimpan!");
      S.screen = "dashboard"; render();
    } catch (e) { showToast("Gagal menyimpan.", "error"); }
  };

  // Delete
  BB.app.confirmDeleteQuiz = function (id) {
    var qs = S.quizSets.find(function (q) { return q.id === id; });
    if (!qs) return;
    S.deleteId = id; S.deleteTitle = qs.title;
    showModal(BB.ui.deleteModal(qs.title));
  };
  BB.app.doDelete = async function () {
    try {
      await BB.fire.deleteQuiz(S.user.uid, S.deleteId);
      showToast("Quiz dipadam!");
    } catch (e) { showToast("Gagal.", "error"); }
    BB.app.closeModal();
  };

  // ═══════════════════════════════════════
  //  ROOM: HOST
  // ═══════════════════════════════════════
  BB.app.startBattle = async function (quizId) {
    var qs = S.quizSets.find(function (q) { return q.id === quizId; });
    if (!qs) return;
    try {
      var code = BB.generateRoomCode();
      var attempts = 0;
      while (attempts < 10) {
        var exists = await BB.fire.roomExists(code);
        if (!exists) break;
        code = BB.generateRoomCode(); attempts++;
      }
      await BB.fire.createRoom(code, {
        hostUid: S.user.uid,
        hostName: S.user.displayName || S.user.email,
        quizTitle: qs.title,
        status: "waiting",
        currentQuestionIndex: 0,
        buzzedBy: null,
        maxPlayers: 3,
        questions: qs.questions.map(function (q) {
          return { question: q.question, options: q.options, correctIndex: q.correctIndex, points: q.points || 10 };
        }),
      });
      listenRoom(code);
      S.roomCode = code; S.quizTitle = qs.title;
      S.screen = "hostWaiting"; render();
      showToast("Room " + code + " dibuat!");
    } catch (e) { console.error(e); showToast("Gagal buat room.", "error"); }
  };

  BB.app.cancelRoom = async function () {
    if (S.roomCode) try { await BB.fire.deleteRoom(S.roomCode); } catch (e) {}
    cleanupRoom(); S.screen = "dashboard"; render();
    showToast("Room dibatalkan.", "info");
  };

  BB.app.startGame = async function () {
    if (!S.roomCode) return;
    try {
      await BB.fire.updateRoom(S.roomCode, { status: "buzzer_open", currentQuestionIndex: 0, buzzedBy: null, lastAnswer: null });
    } catch (e) { showToast("Gagal mulakan.", "error"); }
  };

  BB.app.copyCode = function () {
    if (S.roomCode) {
      navigator.clipboard.writeText(S.roomCode);
      var btn = document.getElementById("copyBtn");
      if (btn) { btn.innerHTML = BB.SVG.check + " Disalin!"; btn.style.color = "var(--success)"; btn.style.borderColor = "var(--success)"; }
      setTimeout(function () { if (btn) { btn.innerHTML = BB.SVG.copy + " Salin"; btn.style.color = "var(--accent2)"; btn.style.borderColor = "var(--accent2)"; } }, 1500);
    }
  };

  // ═══════════════════════════════════════
  //  ROOM: PLAYER
  // ═══════════════════════════════════════
  BB.app.formatCode = function (el) {
    el.value = el.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    var btn = document.getElementById("joinBtn");
    if (btn) {
      var ok = el.value.length === 6;
      btn.disabled = !ok;
      btn.style.background = ok ? "linear-gradient(135deg,var(--accent2),#00b0ff)" : "#e0e4ea";
      btn.style.color = ok ? "#fff" : "var(--text-dim)";
      btn.style.boxShadow = ok ? "0 4px 16px rgba(0,153,221,0.25)" : "none";
    }
  };

  BB.app.joinRoom = async function () {
    var code = document.getElementById("joinCode").value.trim();
    if (code.length !== 6) return;
    try {
      var data = await BB.fire.getRoomOnce(code);
      if (!data) { showToast("Room tidak wujud!", "error"); return; }
      if (data.status !== "waiting") { showToast("Room sudah bermula.", "error"); return; }
      var cnt = data.players ? Object.keys(data.players).length : 0;
      if (cnt >= (data.maxPlayers || 3)) { showToast("Room penuh! (Max 3)", "error"); return; }
      S.roomCode = code; S.screen = "playerJoinName"; render();
    } catch (e) { showToast("Gagal semak room.", "error"); }
  };

  BB.app.checkName = function (el) {
    var count = document.getElementById("nameCount");
    if (count) count.textContent = el.value.length + "/20";
    var btn = document.getElementById("joinNameBtn");
    var ok = el.value.trim().length >= 2;
    if (btn) {
      btn.disabled = !ok;
      btn.style.background = ok ? "linear-gradient(135deg,var(--accent2),#00b0ff)" : "#e0e4ea";
      btn.style.color = ok ? "#fff" : "var(--text-dim)";
      btn.style.boxShadow = ok ? "0 4px 16px rgba(0,153,221,0.25)" : "none";
    }
  };

  BB.app.submitName = async function () {
    var input = document.getElementById("playerNameInput");
    var name = input ? input.value.trim() : "";
    if (name.length < 2) return;
    try {
      var data = await BB.fire.getRoomOnce(S.roomCode);
      if (!data) { showToast("Room hilang.", "error"); S.screen = "landing"; render(); return; }
      if (data.status !== "waiting") { showToast("Room sudah bermula.", "error"); S.screen = "landing"; render(); return; }
      var cnt = data.players ? Object.keys(data.players).length : 0;
      if (cnt >= (data.maxPlayers || 3)) { showToast("Room penuh!", "error"); S.screen = "landing"; render(); return; }

      var roomCode = S.roomCode;
      var pid = await BB.fire.addPlayer(roomCode, name);
      listenRoom(roomCode);
      S.roomCode = roomCode; S.playerId = pid; S.playerName = name;
      S.screen = "playerWaiting"; render();
      showToast("Selamat datang, " + name + "!");
    } catch (e) { showToast("Gagal join.", "error"); }
  };

  BB.app.playerLeave = async function () {
    if (S.roomCode && S.playerId) try { await BB.fire.removePlayer(S.roomCode, S.playerId); } catch (e) {}
    cleanupRoom(); S.playerId = null; S.playerName = "";
    S.screen = "landing"; render();
    showToast("Keluar dari room.", "info");
  };

  // ═══════════════════════════════════════
  //  GAME: LIVE QUIZ ACTIONS
  // ═══════════════════════════════════════
  // Buzzer is always open now - this is kept for compatibility
  BB.app.unlockBuzzer = async function () {
    if (!S.roomCode) return;
    await BB.fire.updateRoom(S.roomCode, { status: "buzzer_open", buzzedBy: null, lastAnswer: null });
  };

  BB.app.buzz = async function () {
    if (!S.roomCode || !S.playerId) return;
    var won = await BB.fire.tryBuzz(S.roomCode, S.playerId);
    if (won) await BB.fire.setRoomField(S.roomCode, "status", "buzzed");
  };

  // Host answers on behalf of the buzzed player
  BB.app.hostAnswer = async function (selectedIndex) {
    if (!S.roomCode || !S.roomData) return;
    var buzzedBy = S.roomData.buzzedBy;
    if (!buzzedBy) return;
    var questions = S.roomData.questions || [];
    var qi = S.roomData.currentQuestionIndex || 0;
    var q = questions[qi];
    if (!q) return;
    var correct = selectedIndex === q.correctIndex;
    var pts = q.points || 10;
    var delta = correct ? pts : -Math.floor(pts / 2);

    // Play sound effect
    if (!correct) {
      BB.playWrongBuzzer();
    } else {
      BB.playCorrectSound();
    }

    await BB.fire.updateScore(S.roomCode, buzzedBy, delta);
    var players = S.roomData.players || {};
    await BB.fire.updateRoom(S.roomCode, {
      status: "answered",
      lastAnswer: {
        playerId: buzzedBy,
        playerName: players[buzzedBy] ? players[buzzedBy].name : "Pemain",
        selectedIndex: selectedIndex,
        correct: correct,
        points: pts,
      },
    });
  };

  // Legacy: player answer (disabled - host answers for them now)
  BB.app.answer = async function (selectedIndex) {
    // Players no longer answer directly - host does it for them
    return;
  };

  BB.app.nextQuestion = async function () {
    if (!S.roomCode) return;
    var qi = (S.roomData.currentQuestionIndex || 0) + 1;
    await BB.fire.updateRoom(S.roomCode, { status: "buzzer_open", currentQuestionIndex: qi, buzzedBy: null, lastAnswer: null });
  };

  BB.app.endGame = async function () {
    if (!S.roomCode) return;
    await BB.fire.setRoomField(S.roomCode, "status", "ended");
  };

  BB.app.backToDashboard = function () {
    cleanupRoom(); S.screen = "dashboard"; render();
  };

  // ═══════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════
  function init() {
    BB.fire.init();
    // Handle redirect login result (if user was redirected for auth)
    BB.fire.handleRedirectResult().catch(function (e) {
      if (e.code === "auth/unauthorized-domain") {
        showToast("Domain tidak dibenarkan untuk login. Hubungi admin.", "error");
      } else if (e.code) {
        console.error("Redirect auth error:", e.code, e.message);
      }
    });
    BB.fire.onAuthChange(function (user) {
      S.user = user;
      if (user) {
        S.screen = "dashboard";
        BB.fire.listenQuizSets(user.uid, function (sets) {
          S.quizSets = sets;
          if (S.screen === "dashboard") render();
        });
      } else {
        S.screen = "landing";
      }
      render();
    });
  }

  // Start
  init();
})();
