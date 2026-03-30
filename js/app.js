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
      // Premium
      isPremium: false,
      premiumExpiry: 0,
      aiUsage: {},
      trialUsed: 0,
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
      // Check if only timerRemaining changed (skip full re-render to avoid flicker)
      var prev = S.roomData;
      var timerOnly = prev && data &&
        prev.status === data.status &&
        prev.currentQuestionIndex === data.currentQuestionIndex &&
        prev.lastAnswer === data.lastAnswer &&
        prev.buzzedBy === data.buzzedBy &&
        prev.hostScore === data.hostScore &&
        prev.hostLives === data.hostLives &&
        prev.timerRemaining !== data.timerRemaining;
      S.roomData = data;

      // Force fullscreen for players when host triggers it
      if (S.playerId && !S.user) {
        BB.checkForceFullscreen(data);
      }

      // Auto transition
      if (data.status === "ended") {
        clearBuzzTimer();
        if (["liveHost", "livePlayer", "hostWaiting", "playerWaiting"].indexOf(S.screen) >= 0) {
          S.screen = "results";
        }
      } else if (["buzzer_locked", "buzzer_open", "buzzed", "answered"].indexOf(data.status) >= 0) {
        if (S.screen === "hostWaiting") S.screen = "liveHost";
        if (S.screen === "playerWaiting") S.screen = "livePlayer";
        // Start 2-second buzz timer when someone buzzes (host only)
        if (data.status === "buzzed" && data.buzzedBy && S.user && S.screen === "liveHost") {
          startBuzzTimer();
        }
        // Clear buzz timer when answered
        if (data.status === "answered" || data.status === "buzzer_open") {
          clearBuzzTimer();
        }
      }
      // Skip full re-render if only timer changed (DOM updated directly by timer interval)
      if (timerOnly) return;
      render();
    });
  }
  function cleanupRoom() {
    try { clearGameTimer(); } catch(e) {}
    try { clearBuzzTimer(); } catch(e) {}
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
    var trialUsed = S.trialUsed || 0;
    // If not premium and trial exhausted, show upgrade modal
    if (!S.isPremium && trialUsed >= BB.TRIAL_LIMIT) {
      showModal(BB.ui.upgradeModal());
      return;
    }
    showModal(BB.ui.aiModal(S.aiUsage, S.isPremium, trialUsed));
  };
  // Premium Upgrade via ToyyibPay
  BB.app.upgradePremium = async function () {
    var btn = document.getElementById("upgradeBtn");
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loading-spinner"></span> Menyediakan pembayaran...'; }
    try {
      var data = await BB.fire.createBill();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (e) {
      console.error("Upgrade error:", e);
      showToast("Gagal: " + (e.message || "Cuba lagi."), "error");
      if (btn) { btn.disabled = false; btn.innerHTML = '👑 Bayar ' + BB.PREMIUM_PRICE; }
    }
  };

  BB.app.generateAI = async function () {
    var subjectEl = document.getElementById("aiSubject");
    var yearEl = document.getElementById("aiYear");
    var levelEl = document.getElementById("aiLevel");
    var topicEl = document.getElementById("aiTopic");
    var numEl = document.getElementById("aiNum");
    var langEl = document.getElementById("aiLang");
    var btn = document.getElementById("aiGenBtn");
    var subject = subjectEl ? subjectEl.value : "";
    var year = yearEl ? yearEl.value : "Tahun 4";
    var level = levelEl ? levelEl.value : "Sederhana";
    var topic = topicEl ? topicEl.value.trim() : "";
    var num = numEl ? parseInt(numEl.value) || 5 : 5;
    var lang = langEl ? langEl.value : "Malay";

    if (!subject && !topic) { showToast("Sila pilih subjek atau masukkan topik.", "error"); return; }

    // Build combined topic string
    var fullTopic = subject || "";
    if (topic) fullTopic += (fullTopic ? " - " : "") + topic;

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Menjana soalan...';
    try {
      var questions = await BB.fire.generateQuiz(fullTopic, num, lang, year, level, false);
      S.editorTitle = S.editorTitle || fullTopic;
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
    S.editorQuestions.push({ question: "", options: ["", "", "", ""], correctIndex: 0, points: 10, imageUrl: "" });
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

  // ─── IMAGE UPLOAD ───
  BB.app.handleImageUpload = async function (qi, input) {
    var file = input.files && input.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Gambar terlalu besar! Maks 5MB.", "error");
      input.value = "";
      return;
    }
    var label = document.getElementById("imgLabel" + qi);
    if (label) label.textContent = "⏳ Memuat naik...";
    try {
      var url = await BB.fire.uploadQuestionImage(S.user.uid, S.editingId, qi, file);
      S.editorQuestions[qi].imageUrl = url;
      render();
      showToast("Gambar dimuat naik!");
    } catch (e) {
      console.error("Upload error:", e);
      showToast("Gagal memuat naik gambar.", "error");
      if (label) label.textContent = "🖼️ Lampir Gambar";
    }
  };
  BB.app.showUrlInput = function (qi) {
    var wrap = document.getElementById("urlWrap" + qi);
    if (wrap) wrap.style.display = wrap.style.display === "none" ? "flex" : "none";
  };
  BB.app.attachUrl = function (qi) {
    var input = document.getElementById("urlInput" + qi);
    var url = input ? input.value.trim() : "";
    if (!url) { showToast("Sila masukkan URL gambar.", "error"); return; }
    if (!/^https?:\/\/.+/i.test(url)) { showToast("URL tidak sah. Mesti bermula dengan http:// atau https://", "error"); return; }
    S.editorQuestions[qi].imageUrl = url;
    render();
    showToast("Gambar URL dilampirkan!");
  };
  BB.app.removeImage = async function (qi) {
    var url = S.editorQuestions[qi].imageUrl;
    if (url) {
      BB.fire.deleteQuestionImage(url);
      S.editorQuestions[qi].imageUrl = "";
      render();
      showToast("Gambar dibuang.");
    }
  };

  // ─── SHOW AI IMAGE PROMPT INPUT ───
  BB.app.showAiImagePrompt = function (qi) {
    var wrap = document.getElementById("aiImgWrap" + qi);
    if (wrap) {
      wrap.style.display = wrap.style.display === "none" ? "flex" : "none";
      if (wrap.style.display === "flex") {
        var input = document.getElementById("aiImgPrompt" + qi);
        if (input) input.focus();
      }
    }
  };

  // ─── SEARCH IMAGES FROM WIKIMEDIA COMMONS ───
  BB.app._searchImages = {};

  BB.app.regenerateImage = async function (qi) {
    var promptInput = document.getElementById("aiImgPrompt" + qi);
    var prompt = promptInput ? promptInput.value.trim() : "";
    if (!prompt) { showToast("Sila masukkan kata kunci gambar. cth: lebah, gajah", "error"); return; }

    var searchBtn = document.querySelector("#aiImgWrap" + qi + " .ai-search-btn");
    if (searchBtn) { searchBtn.disabled = true; searchBtn.innerHTML = "⏳ Mencari..."; }

    var resultsDiv = document.getElementById("aiImgResults" + qi);
    if (resultsDiv) resultsDiv.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-dim);font-size:13px">⏳ Mencari gambar untuk "<b>' + BB.esc(prompt) + '</b>"...</div>';

    try {
      var apiUrl = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=" +
        encodeURIComponent(prompt + " file:jpg OR file:png OR file:jpeg") +
        "&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=300&format=json&origin=*";

      var resp = await fetch(apiUrl);
      var data = await resp.json();

      var images = [];
      if (data.query && data.query.pages) {
        var pages = Object.values(data.query.pages);
        pages.sort(function (a, b) { return (a.index || 0) - (b.index || 0); });
        pages.forEach(function (page) {
          if (page.imageinfo && page.imageinfo[0]) {
            var info = page.imageinfo[0];
            var mime = info.mime || "";
            if (mime.indexOf("image/") === 0 && mime.indexOf("svg") === -1) {
              if (info.thumburl && info.url) {
                images.push({ thumb: info.thumburl, full: info.url });
              }
            }
          }
        });
      }

      if (resultsDiv) {
        if (images.length === 0) {
          resultsDiv.innerHTML = '<div style="text-align:center;padding:16px;color:var(--danger);font-size:13px">Tiada gambar ditemui. Cuba kata kunci lain (dalam Bahasa Inggeris mungkin lebih banyak hasil).</div>';
        } else {
          var html = '<div style="font-size:12px;color:var(--text-dim);padding:4px 0;font-weight:600">Pilih gambar (' + images.length + ' hasil):</div>' +
            '<div class="ai-img-grid">';
          images.forEach(function (img, i) {
            html += '<div class="ai-img-option" onclick="BB.app.selectSearchImage(' + qi + ',' + i + ')">' +
              '<img src="' + BB.esc(img.thumb) + '" alt="Pilihan ' + (i + 1) + '" onerror="this.parentElement.style.display=\'none\'">' +
              '</div>';
          });
          html += '</div>';
          resultsDiv.innerHTML = html;
          BB.app._searchImages[qi] = images;
        }
      }
    } catch (e) {
      console.error("Image search error:", e);
      if (resultsDiv) resultsDiv.innerHTML = '<div style="text-align:center;padding:12px;color:var(--danger);font-size:13px">Gagal mencari gambar. Cuba lagi.</div>';
    }

    if (searchBtn) { searchBtn.disabled = false; searchBtn.innerHTML = "🔍 Cari"; }
  };

  BB.app.selectSearchImage = function (qi, index) {
    var images = BB.app._searchImages[qi];
    if (!images || !images[index]) return;
    S.editorQuestions[qi].imageUrl = images[index].full;
    delete BB.app._searchImages[qi];
    render();
    showToast("Gambar dipilih!");
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
        timerSeconds: 30,
        questions: qs.questions.map(function (q) {
          var qData = { question: q.question, options: q.options, correctIndex: q.correctIndex, points: q.points || 10 };
          if (q.imageUrl) qData.imageUrl = q.imageUrl;
          return qData;
        }),
      });
      listenRoom(code);
      S.roomCode = code; S.quizTitle = qs.title;
      S.screen = "hostWaiting"; render();
      showToast("Room " + code + " dibuat!");
    } catch (e) { console.error(e); showToast("Gagal buat room.", "error"); }
  };

  BB.app.cancelRoom = async function () {
    clearGameTimer();
    if (S.roomCode) try { await BB.fire.deleteRoom(S.roomCode); } catch (e) {}
    cleanupRoom(); S.screen = "dashboard"; render();
    showToast("Room dibatalkan.", "info");
  };

  // Timer interval references
  var timerInterval = null;
  var buzzTimerInterval = null;

  function clearGameTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  function clearBuzzTimer() {
    if (buzzTimerInterval) { clearInterval(buzzTimerInterval); buzzTimerInterval = null; }
  }

  function startBuzzTimer() {
    clearBuzzTimer();
    if (!S.roomData || !S.roomCode) return;
    var remaining = 4; // 4 half-seconds = 2 seconds (update every 500ms for smooth pie)
    S.roomData.buzzTimerRemaining = 2;
    BB.fire.setRoomField(S.roomCode, "buzzTimerRemaining", 2);
    buzzTimerInterval = setInterval(async function () {
      if (!S.roomData || S.roomData.status !== "buzzed") { clearBuzzTimer(); return; }
      remaining--;
      var secs = Math.ceil(remaining / 2);
      S.roomData.buzzTimerRemaining = secs;
      // Update pie timer DOM directly (host)
      var buzzTimerText = document.getElementById('buzz-timer-text');
      var buzzTimerFill = document.getElementById('buzz-timer-fill');
      if (buzzTimerText && buzzTimerFill) {
        var pct = Math.round((remaining / 4) * 100);
        var buzzColor = pct > 50 ? 'var(--accent3)' : 'var(--danger)';
        buzzTimerText.textContent = '⏱️ ' + secs + 's - ' + ((S.roomData.players && S.roomData.buzzedBy && S.roomData.players[S.roomData.buzzedBy]) ? S.roomData.players[S.roomData.buzzedBy].name : '');
        buzzTimerText.style.color = buzzColor;
        buzzTimerFill.style.width = pct + '%';
        buzzTimerFill.style.background = buzzColor;
      }
      // Sync to Firebase for player pie timer
      if (remaining % 2 === 0) {
        BB.fire.setRoomField(S.roomCode, "buzzTimerRemaining", secs);
      }
      if (remaining <= 0) {
        clearBuzzTimer();
        // Time's up - auto wrong for buzzed player
        await handleBuzzTimeout();
      }
    }, 500);
  }

  async function handleBuzzTimeout() {
    if (!S.roomCode || !S.roomData) return;
    var buzzedBy = S.roomData.buzzedBy;
    if (!buzzedBy) return;
    var qi = S.roomData.currentQuestionIndex || 0;
    var q = (S.roomData.questions || [])[qi];
    if (!q) return;
    BB.playWrongBuzzer();
    var currentLives = (S.roomData.players && S.roomData.players[buzzedBy] && S.roomData.players[buzzedBy].lives != null) ? S.roomData.players[buzzedBy].lives : 3;
    await BB.fire.updateRoom(S.roomCode, {
      status: "answered",
      buzzTimerRemaining: 0,
      lastAnswer: {
        playerId: buzzedBy,
        playerName: (S.roomData.players && S.roomData.players[buzzedBy]) ? S.roomData.players[buzzedBy].name : "Pemain",
        selectedIndex: -1,
        correct: false,
        points: q.points || 10,
        timeout: true,
      },
      ["players/" + buzzedBy + "/lives"]: Math.max(0, currentLives - 1),
    });
  }

  function startGameTimer() {
    clearGameTimer();
    var timerSec = S.roomData && S.roomData.timerSeconds ? S.roomData.timerSeconds : 0;
    if (!timerSec || timerSec <= 0) return;
    // Set initial value in Firebase and local state
    S.roomData.timerRemaining = timerSec;
    BB.fire.setRoomField(S.roomCode, "timerRemaining", timerSec);
    timerInterval = setInterval(async function () {
      if (!S.roomData) { clearGameTimer(); return; }
      var remaining = S.roomData.timerRemaining != null ? S.roomData.timerRemaining : timerSec;
      remaining--;
      if (remaining <= 0) {
        clearGameTimer();
        // Time's up! Handle timeout
        await handleTimeout();
      } else {
        // Update local state directly (no Firebase write = no re-render flicker)
        S.roomData.timerRemaining = remaining;
        // Update timer DOM directly instead of full re-render
        var timerText = document.getElementById('timer-text');
        var timerFill = document.getElementById('timer-fill');
        if (timerText && timerFill) {
          var pct = Math.round((remaining / timerSec) * 100);
          var timerColor = pct > 50 ? 'var(--success)' : pct > 20 ? 'var(--accent3)' : 'var(--danger)';
          timerText.textContent = '⏱️ ' + remaining + 's';
          timerText.style.color = timerColor;
          timerFill.style.width = pct + '%';
          timerFill.style.background = timerColor;
        }
        // Sync to Firebase less frequently (every 5 seconds) for multiplayer
        if (remaining % 5 === 0) {
          BB.fire.setRoomField(S.roomCode, "timerRemaining", remaining);
        }
      }
    }, 1000);
  }

  async function handleTimeout() {
    if (!S.roomCode || !S.roomData) return;
    var isSingle = (!S.roomData.players || Object.keys(S.roomData.players).length === 0) || S.roomData.singlePlayer;
    var qi = S.roomData.currentQuestionIndex || 0;
    var q = (S.roomData.questions || [])[qi];
    if (!q) return;

    BB.playWrongBuzzer();

    if (isSingle) {
      // Single player timeout - lose a life
      var hostLives = S.roomData.hostLives != null ? S.roomData.hostLives : 3;
      hostLives = Math.max(0, hostLives - 1);
      await BB.fire.updateRoom(S.roomCode, {
        status: "answered",
        hostLives: hostLives,
        timerRemaining: 0,
        lastAnswer: { playerId: "host", playerName: S.roomData.hostName || "Host", selectedIndex: -1, correct: false, points: q.points || 10, timeout: true },
      });
    } else {
      // Multiplayer timeout - all alive players lose a life
      var players = S.roomData.players || {};
      var updates = {};
      Object.keys(players).forEach(function (pid) {
        var lives = players[pid].lives != null ? players[pid].lives : 3;
        if (lives > 0) {
          updates["players/" + pid + "/lives"] = lives - 1;
        }
      });
      updates.status = "answered";
      updates.timerRemaining = 0;
      updates.lastAnswer = { playerId: "timeout", playerName: "Tiada siapa", selectedIndex: -1, correct: false, points: q.points || 10, timeout: true };
      await BB.fire.updateRoom(S.roomCode, updates);
    }
  }

  BB.app.setTimer = function (val) {
    if (!S.roomCode) return;
    BB.fire.setRoomField(S.roomCode, "timerSeconds", parseInt(val) || 0);
  };

  BB.app.startGame = async function () {
    if (!S.roomCode) return;
    try {
      var players = S.roomData && S.roomData.players ? S.roomData.players : {};
      var playerCount = Object.keys(players).length;
      var isSingle = playerCount === 0;

      // Initialize lives for all players
      var updates = {
        status: "buzzer_open",
        currentQuestionIndex: 0,
        buzzedBy: null,
        lastAnswer: null,
        singlePlayer: isSingle,
      };

      if (isSingle) {
        updates.hostLives = 3;
        updates.hostScore = 0;
      } else {
        Object.keys(players).forEach(function (pid) {
          updates["players/" + pid + "/lives"] = 3;
        });
      }

      await BB.fire.updateRoom(S.roomCode, updates);
      startGameTimer();
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
    // Check if player is eliminated
    if (S.roomData && S.roomData.players && S.roomData.players[S.playerId]) {
      var myLives = S.roomData.players[S.playerId].lives;
      if (myLives != null && myLives <= 0) {
        showToast("Anda sudah tersingkir!", "error");
        return;
      }
    }
    var won = await BB.fire.tryBuzz(S.roomCode, S.playerId);
    if (won) {
      await BB.fire.updateRoom(S.roomCode, { status: "buzzed", buzzTimerRemaining: 2 });
    }
  };

  // Single player answer (host answers directly)
  BB.app.singleAnswer = async function (selectedIndex) {
    if (!S.roomCode || !S.roomData) return;
    clearGameTimer();
    var questions = S.roomData.questions || [];
    var qi = S.roomData.currentQuestionIndex || 0;
    var q = questions[qi];
    if (!q) return;
    var correct = selectedIndex === q.correctIndex;
    var pts = q.points || 10;
    var hostScore = S.roomData.hostScore || 0;
    var hostLives = S.roomData.hostLives != null ? S.roomData.hostLives : 3;

    if (correct) {
      BB.playCorrectSound();
      hostScore += pts;
    } else {
      BB.playWrongBuzzer();
      hostLives = Math.max(0, hostLives - 1);
    }

    await BB.fire.updateRoom(S.roomCode, {
      status: "answered",
      hostScore: hostScore,
      hostLives: hostLives,
      timerRemaining: 0,
      lastAnswer: {
        playerId: "host",
        playerName: S.roomData.hostName || "Host",
        selectedIndex: selectedIndex,
        correct: correct,
        points: pts,
      },
    });
  };

  // Host answers on behalf of the buzzed player
  BB.app.hostAnswer = async function (selectedIndex) {
    if (!S.roomCode || !S.roomData) return;
    clearGameTimer();
    clearBuzzTimer();
    var buzzedBy = S.roomData.buzzedBy;
    if (!buzzedBy) return;
    var questions = S.roomData.questions || [];
    var qi = S.roomData.currentQuestionIndex || 0;
    var q = questions[qi];
    if (!q) return;
    var correct = selectedIndex === q.correctIndex;
    var pts = q.points || 10;
    var delta = correct ? pts : 0;

    // Play sound effect
    if (!correct) {
      BB.playWrongBuzzer();
    } else {
      BB.playCorrectSound();
    }

    // Update score (only add for correct, no negative)
    if (delta > 0) await BB.fire.updateScore(S.roomCode, buzzedBy, delta);

    // Update lives if wrong
    var updates = {
      status: "answered",
      timerRemaining: 0,
      lastAnswer: {
        playerId: buzzedBy,
        playerName: (S.roomData.players && S.roomData.players[buzzedBy]) ? S.roomData.players[buzzedBy].name : "Pemain",
        selectedIndex: selectedIndex,
        correct: correct,
        points: pts,
      },
    };
    if (!correct) {
      var currentLives = (S.roomData.players && S.roomData.players[buzzedBy] && S.roomData.players[buzzedBy].lives != null) ? S.roomData.players[buzzedBy].lives : 3;
      updates["players/" + buzzedBy + "/lives"] = Math.max(0, currentLives - 1);
    }
    await BB.fire.updateRoom(S.roomCode, updates);
  };

  // Legacy: player answer (disabled - host answers for them now)
  BB.app.answer = async function (selectedIndex) {
    // Players no longer answer directly - host does it for them
    return;
  };

  BB.app.nextQuestion = async function () {
    if (!S.roomCode) return;
    clearGameTimer();

    // Check if single player host has 0 lives
    if (S.roomData && S.roomData.singlePlayer && S.roomData.hostLives != null && S.roomData.hostLives <= 0) {
      await BB.fire.setRoomField(S.roomCode, "status", "ended");
      return;
    }

    // Check if all multiplayer players eliminated
    if (S.roomData && !S.roomData.singlePlayer && S.roomData.players) {
      var anyAlive = false;
      Object.values(S.roomData.players).forEach(function (p) {
        if ((p.lives != null ? p.lives : 3) > 0) anyAlive = true;
      });
      if (!anyAlive) {
        await BB.fire.setRoomField(S.roomCode, "status", "ended");
        return;
      }
    }

    var qi = (S.roomData.currentQuestionIndex || 0) + 1;
    await BB.fire.updateRoom(S.roomCode, { status: "buzzer_open", currentQuestionIndex: qi, buzzedBy: null, lastAnswer: null, timerRemaining: S.roomData.timerSeconds || 0 });
    startGameTimer();
  };

  BB.app.endGame = async function () {
    if (!S.roomCode) return;
    clearGameTimer();
    await BB.fire.setRoomField(S.roomCode, "status", "ended");
  };

  BB.app.backToDashboard = function () {
    clearGameTimer();
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
        // Listen for premium status + trial usage
        BB.fire.listenPremium(user.uid, function (isPremium, expiry, trialUsed) {
          S.isPremium = isPremium;
          S.premiumExpiry = expiry || 0;
          S.trialUsed = trialUsed || 0;
          if (S.screen === "dashboard") render();
        });
        // Listen for AI usage
        BB.fire.listenAiUsage(user.uid, function (usage) {
          S.aiUsage = usage;
        });
        // Check if returning from payment
        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("payment") === "success") {
          window.history.replaceState({}, "", window.location.pathname);
          showToast("Pembayaran sedang diproses. Premium akan aktif sebentar lagi!", "info");
        }
      } else {
        S.screen = "landing";
        S.isPremium = false;
        S.premiumExpiry = 0;
        S.aiUsage = {};
        S.trialUsed = 0;
      }
      render();
    });
  }

  // Start
  init();
})();
