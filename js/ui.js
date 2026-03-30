/* ═══════════════════════════════════════════
   BUZZERBATTLE - UI RENDERERS
   ═══════════════════════════════════════════ */

BB.ui = {};

// ─── Fullscreen Button ───
BB.ui.fsBtn = function () {
  var isFull = !!document.fullscreenElement;
  return '<button class="fs-btn" onclick="BB.toggleFS()" title="Fullscreen">' +
    (isFull ? BB.SVG.exitFS : BB.SVG.fullscreen) + '</button>';
};

// ─── Helper: Player Slot ───
BB.ui.playerSlot = function (player, index) {
  var color = BB.SLOT_COLORS[index % 3];
  if (!player) {
    return '<div class="player-slot empty">' +
      '<div class="avatar" style="background:#f0f2f5;border:1px solid var(--border)">?</div>' +
      '<div><p style="font-weight:700;font-size:18px;color:var(--text-dim)">Slot ' + (index + 1) + ' — Menunggu...</p></div></div>';
  }
  return '<div class="player-slot filled" style="border-color:' + color + ';box-shadow:0 0 20px ' + color + '33">' +
    '<div class="avatar" style="background:' + color + '22;border:2px solid ' + color + '">' + BB.PLAYER_EMOJIS[index] + '</div>' +
    '<div><p style="font-weight:700;font-size:18px">' + BB.esc(player.name) + '</p>' +
    '<p style="font-size:12px;color:var(--text-dim)">Telah masuk ✓</p></div></div>';
};

// ─── Escape HTML ───
BB.esc = function (s) {
  var d = document.createElement("div"); d.textContent = s; return d.innerHTML;
};

// ─── Question Image Helper ───
BB.ui.qImg = function (q) {
  if (!q || !q.imageUrl) return '';
  return '<div class="q-image-live"><img src="' + BB.esc(q.imageUrl) + '" alt="Gambar soalan"></div>';
};

// ═══════════════════════════════════════
//  LANDING PAGE
// ═══════════════════════════════════════
BB.ui.landing = function () {
  return '<div class="screen-landing">' +
    '<div class="landing-orb pink"></div><div class="landing-orb cyan"></div>' +
    '<div class="landing-logo">' + BB.SVG.zap + '</div>' +
    '<h1 class="landing-title">BUZZER<br>BATTLE</h1>' +
    '<p class="landing-sub">Siapa Paling Laju?</p>' +
    '<button class="bb-btn" onclick="BB.app.login()" style="background:linear-gradient(135deg,var(--accent),#ff6b6b);color:#fff;font-size:18px;padding:18px 48px;margin-bottom:20px;width:100%;max-width:340px;box-shadow:0 4px 16px rgba(255,62,108,0.25)">🎤  HOST (Login Google)</button>' +
    '<div class="landing-divider"><span>ATAU</span></div>' +
    '<div style="width:100%;max-width:340px;margin-top:12px">' +
      '<input class="bb-input code-input" id="joinCode" placeholder="Masukkan Kod Room" maxlength="6" oninput="BB.app.formatCode(this)">' +
      '<button class="bb-btn" id="joinBtn" onclick="BB.app.joinRoom()" disabled style="background:#e0e4ea;color:var(--text-dim);font-size:18px;padding:16px 0;width:100%">🎮  JOIN GAME</button>' +
    '</div>' +
    '<p style="color:var(--text-dim);font-size:12px;margin-top:48px;opacity:0.5">BuzzerBattle © 2026</p></div>';
};

// ═══════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════
BB.ui.dashboard = function (user, quizSets) {
  var name = BB.esc(user.displayName || user.email);
  var isPremium = BB.app.state.isPremium;
  var premiumExpiry = BB.app.state.premiumExpiry;
  var premiumBadge;
  if (isPremium) {
    var expiryStr = new Date(premiumExpiry).toLocaleDateString("ms-MY", { timeZone: "Asia/Kuala_Lumpur", day: "numeric", month: "short", year: "numeric" });
    premiumBadge = '<span class="premium-badge" title="Tamat: ' + expiryStr + '">👑 PREMIUM &middot; ' + expiryStr + '</span>';
  } else if (premiumExpiry > 0) {
    premiumBadge = '<button class="upgrade-badge" onclick="BB.app.showAiModal()" style="background:#fff3e0;color:#e65100;border-color:#ff9800">🔄 Renew Premium</button>';
  } else {
    premiumBadge = '<button class="upgrade-badge" onclick="BB.app.showAiModal()">⚡ Upgrade Premium</button>';
  }
  var cards = '';
  if (quizSets.length === 0) {
    cards = '<div style="text-align:center;padding:60px;color:var(--text-dim)"><div style="font-size:48px;margin-bottom:16px;opacity:0.3">📝</div><p style="font-size:16px">Belum ada quiz. Buat quiz pertama anda!</p></div>';
  } else {
    cards = '<div class="flex flex-col gap-14">';
    quizSets.forEach(function (qs) {
      cards += '<div class="quiz-card">' +
        '<div style="flex:1;min-width:180px"><h3 style="font-size:18px;font-weight:700;margin-bottom:4px">' + BB.esc(qs.title) + '</h3>' +
        '<p style="color:var(--text-dim);font-size:13px">' + qs.questionCount + ' soalan</p></div>' +
        '<div class="quiz-card-actions">' +
          '<button class="bb-btn" onclick="BB.app.editQuiz(\'' + qs.id + '\')" style="background:#f0f7ff;color:var(--accent2);border:1px solid var(--accent2);padding:8px 14px;font-size:13px">' + BB.SVG.edit + ' Edit</button>' +
          '<button class="bb-btn" onclick="BB.app.confirmDeleteQuiz(\'' + qs.id + '\')" style="background:#fff5f5;color:var(--danger);border:1px solid var(--danger);padding:8px 14px;font-size:13px">' + BB.SVG.trash + ' Padam</button>' +
          '<button class="bb-btn" onclick="BB.app.startBattle(\'' + qs.id + '\')" style="background:linear-gradient(135deg,var(--accent),#ff6b6b);color:#fff;padding:8px 18px;font-size:13px;box-shadow:0 4px 12px rgba(255,62,108,0.2)">' + BB.SVG.play + ' Mula</button>' +
        '</div></div>';
    });
    cards += '</div>';
  }

  return '<div class="screen-dashboard">' + BB.ui.fsBtn() +
    '<div class="dashboard-inner">' +
      '<div class="dashboard-header"><div>' +
        '<h1 class="dashboard-title">BUZZER BATTLE</h1>' +
        '<p style="color:var(--text-dim);font-size:14px;margin-top:4px">Selamat datang, <span style="color:var(--accent2);font-weight:600">' + name + '</span> ' + premiumBadge + '</p>' +
      '</div>' +
      '<button class="bb-btn" onclick="BB.app.logout()" style="background:transparent;color:var(--text-dim);border:1px solid var(--border);padding:8px 16px;font-size:13px">' + BB.SVG.logout + ' Log Keluar</button></div>' +
      '<button class="bb-btn" onclick="BB.app.newQuiz()" style="background:linear-gradient(135deg,var(--accent2),#00b0ff);color:#fff;font-size:16px;padding:16px 32px;margin-bottom:32px;box-shadow:0 4px 16px rgba(0,153,221,0.25)">' + BB.SVG.plus + ' Buat Quiz Baru</button>' +
      cards +
    '</div></div>';
};

// ═══════════════════════════════════════
//  QUIZ EDITOR
// ═══════════════════════════════════════
BB.ui.editor = function (title, questions, isEdit) {
  var qs = '';
  questions.forEach(function (q, qi) {
    var opts = '';
    q.options.forEach(function (opt, oi) {
      var isCorrect = q.correctIndex === oi;
      var c = BB.OPT_COLORS[oi];
      opts += '<div style="display:flex;align-items:center;gap:8px">' +
        '<button class="opt-btn" onclick="BB.app.setCorrect(' + qi + ',' + oi + ')" style="background:' + (isCorrect ? c : 'transparent') + ';color:' + (isCorrect ? (oi === 2 ? '#000' : '#fff') : c) + ';border-color:' + c + '">' +
          (isCorrect ? BB.SVG.check : BB.OPT_LABELS[oi]) + '</button>' +
        '<input class="bb-input" placeholder="Pilihan ' + BB.OPT_LABELS[oi] + '" value="' + BB.esc(opt) + '" oninput="BB.app.updateOpt(' + qi + ',' + oi + ',this.value)" style="padding:10px 14px;font-size:14px"></div>';
    });

    qs += '<div class="question-card">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">' +
        '<div style="display:flex;align-items:center;gap:10px"><span class="question-num">' + (qi + 1) + '</span></div>' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<span style="font-size:12px;color:var(--text-dim)">Markah:</span>' +
          '<input class="bb-input" type="number" value="' + (q.points || 10) + '" min="1" oninput="BB.app.updateQ(' + qi + ',\'points\',parseInt(this.value)||10)" style="width:60px;padding:6px 8px;text-align:center;font-size:14px">' +
          '<button class="bb-btn" onclick="BB.app.removeQ(' + qi + ')" style="background:transparent;color:var(--danger);border:none;padding:6px">' + BB.SVG.trash + '</button>' +
        '</div></div>' +
      '<textarea class="bb-input" placeholder="Tulis soalan..." oninput="BB.app.updateQ(' + qi + ',\'question\',this.value)" rows="2" style="margin-bottom:12px;font-weight:500;font-size:15px">' + BB.esc(q.question) + '</textarea>' +
      '<div class="q-image-wrap">' +
        (q.imageUrl
          ? '<div class="q-image-preview"><img src="' + BB.esc(q.imageUrl) + '" alt="Gambar soalan" onerror="this.parentElement.innerHTML=\'<span style=color:var(--danger);font-size:12px>❌ Gambar gagal dimuatkan</span>\'">' +
            '<button class="q-image-remove" onclick="BB.app.removeImage(' + qi + ')" title="Buang gambar">✕</button></div>'
          : '') +
        '<div class="q-image-actions">' +
          '<label class="q-image-btn" id="imgLabel' + qi + '">' +
            '<input type="file" accept="image/*" onchange="BB.app.handleImageUpload(' + qi + ',this)" style="display:none">' +
            '📁 Fail' +
          '</label>' +
          '<button class="q-image-btn" onclick="BB.app.showUrlInput(' + qi + ')" type="button">🔗 URL</button>' +
          '<button class="q-image-btn" id="regenBtn' + qi + '" onclick="BB.app.showAiImagePrompt(' + qi + ')" type="button" style="background:rgba(156,39,176,0.08);color:#9c27b0;border-color:rgba(156,39,176,0.3)" title="Jana gambar dari AI">🤖 Jana Gambar AI</button>' +
        '</div>' +
        '<div class="q-url-input" id="urlWrap' + qi + '" style="display:none">' +
          '<input class="bb-input" id="urlInput' + qi + '" placeholder="https://contoh.com/gambar.jpg" style="flex:1;padding:8px 12px;font-size:13px">' +
          '<button class="bb-btn" onclick="BB.app.attachUrl(' + qi + ')" style="background:var(--accent2);color:#fff;padding:8px 14px;font-size:13px;white-space:nowrap">Lampir</button>' +
        '</div>' +
        '<div class="ai-img-wrap" id="aiImgWrap' + qi + '" style="display:none">' +
          '<div class="q-url-input" style="display:flex">' +
            '<input class="bb-input" id="aiImgPrompt' + qi + '" placeholder="cth: bee, cat, Malaysia flag" style="flex:1;padding:8px 12px;font-size:13px" onkeydown="if(event.key===\'Enter\'){event.preventDefault();BB.app.regenerateImage(' + qi + ')}">' +
            '<button class="bb-btn ai-search-btn" onclick="BB.app.regenerateImage(' + qi + ')" style="background:linear-gradient(135deg,#9c27b0,#e040fb);color:#fff;padding:8px 14px;font-size:13px;white-space:nowrap">🔍 Cari</button>' +
          '</div>' +
          '<div id="aiImgResults' + qi + '" class="ai-img-results"></div>' +
        '</div>' +
      '</div>' +
      '<div class="options-grid">' + opts + '</div></div>';
  });

  return '<div class="screen-editor">' + BB.ui.fsBtn() +
    '<div class="editor-inner">' +
      '<div style="display:flex;align-items:center;gap:16px;margin-bottom:28px">' +
        '<button class="bb-btn" onclick="BB.app.go(\'dashboard\')" style="background:#ffffff;color:var(--text);border:1px solid var(--border);width:44px;height:44px;padding:0;border-radius:12px;box-shadow:0 2px 6px rgba(0,0,0,0.06)">' + BB.SVG.back + '</button>' +
        '<h2 class="font-bungee" style="font-size:22px;background:linear-gradient(135deg,var(--accent2),var(--accent3));-webkit-background-clip:text;-webkit-text-fill-color:transparent">' + (isEdit ? 'Edit Quiz' : 'Quiz Baru') + '</h2></div>' +
      '<div style="margin-bottom:28px"><label style="color:var(--text-dim);font-size:13px;font-weight:600;display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Tajuk Quiz</label>' +
        '<input class="bb-input" id="quizTitle" placeholder="cth: Matematik Tahun 4" value="' + BB.esc(title) + '" oninput="BB.app.state.editorTitle=this.value" style="font-size:18px;font-weight:600"></div>' +
      qs +
      '<div style="display:flex;gap:12px;margin-bottom:20px">' +
        '<button class="bb-btn" onclick="BB.app.addQ()" style="flex:1;background:transparent;color:var(--accent2);border:2px dashed var(--accent2);font-size:15px;padding:18px 0;border-radius:16px">' + BB.SVG.plus + ' Tambah Soalan</button>' +
        '<button class="bb-btn" onclick="BB.app.showAiModal()" style="flex:1;background:' + (BB.app.state.isPremium ? 'linear-gradient(135deg,#9c27b0,#e040fb)' : 'linear-gradient(135deg,#ff9800,#ff5722)') + ';color:#fff;font-size:15px;padding:18px 0;border-radius:16px;box-shadow:0 0 20px ' + (BB.app.state.isPremium ? 'rgba(156,39,176,0.3)' : 'rgba(255,152,0,0.3)') + '">' + (BB.app.state.isPremium ? '🤖 Jana AI' : (BB.app.state.trialUsed >= BB.TRIAL_LIMIT ? '👑 Jana AI' : '🎁 Jana AI (' + Math.max(0, BB.TRIAL_LIMIT - (BB.app.state.trialUsed || 0)) + ')')) + '</button>' +
      '</div>' +
      '<button class="bb-btn" id="saveBtn" onclick="BB.app.saveQuiz()" style="font-size:17px;padding:16px 0;width:100%">💾 Simpan (' + questions.length + ' soalan)</button>' +
    '</div></div>';
};

// ═══════════════════════════════════════
//  HOST WAITING ROOM
// ═══════════════════════════════════════
BB.ui.hostWaiting = function (roomCode, roomData, quizTitle) {
  var players = roomData && roomData.players ? Object.entries(roomData.players).map(function (e) { return { id: e[0], name: e[1].name, score: e[1].score }; }) : [];
  var slots = '';
  for (var i = 0; i < 3; i++) slots += BB.ui.playerSlot(players[i], i);
  var isSingle = players.length === 0;
  var timerVal = (roomData && roomData.timerSeconds) || 30;
  var shuffleOn = roomData && roomData.shuffleQuestions;

  return '<div class="screen-waiting">' + BB.ui.fsBtn() +
    '<h2 class="font-bungee" style="font-size:clamp(18px,4vw,24px);color:var(--accent3);margin-bottom:4px">⚡ WAITING ROOM</h2>' +
    '<p style="color:var(--text-dim);font-size:14px;margin-bottom:32px">Quiz: <span style="color:var(--text);font-weight:600">' + BB.esc(quizTitle) + '</span></p>' +
    '<div class="room-code-box"><p style="color:var(--text-dim);font-size:13px;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;font-weight:600">Kod Room</p>' +
      '<div class="room-code-display">' + roomCode + '</div>' +
      '<button class="bb-btn" onclick="BB.app.copyCode()" id="copyBtn" style="margin-top:14px;background:transparent;color:var(--accent2);border:1px solid var(--accent2);padding:6px 18px;font-size:12px">' + BB.SVG.copy + ' Salin</button></div>' +
    // Game settings
    '<div style="width:100%;max-width:500px;margin-bottom:24px;background:#ffffff;border-radius:16px;padding:20px 24px;border:1px solid var(--border);box-shadow:0 2px 8px rgba(0,0,0,0.06)">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">' +
        '<div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">⏱️</span><span style="font-weight:700;font-size:16px">Masa Setiap Soalan</span></div>' +
        '<select class="bb-input" id="timerSelect" onchange="BB.app.setTimer(this.value)" style="width:auto;padding:8px 14px;font-size:15px;font-weight:700">' +
          '<option value="15"' + (timerVal === 15 ? ' selected' : '') + '>15 saat</option>' +
          '<option value="30"' + (timerVal === 30 ? ' selected' : '') + '>30 saat</option>' +
          '<option value="45"' + (timerVal === 45 ? ' selected' : '') + '>45 saat</option>' +
          '<option value="60"' + (timerVal === 60 ? ' selected' : '') + '>60 saat</option>' +
          '<option value="90"' + (timerVal === 90 ? ' selected' : '') + '>90 saat</option>' +
          '<option value="0"' + (timerVal === 0 ? ' selected' : '') + '>Tiada had masa</option>' +
        '</select>' +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
        '<div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">🔀</span><span style="font-weight:700;font-size:16px">Kocak Susunan Soalan</span></div>' +
        '<label class="toggle-switch"><input type="checkbox" onchange="BB.app.setShuffle(this)"' + (shuffleOn ? ' checked' : '') + '><span class="toggle-slider"></span></label>' +
      '</div></div>' +
    '<div style="width:100%;max-width:500px;margin-bottom:32px">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">' + BB.SVG.users + '<span style="font-weight:700;font-size:16px">Pemain (' + players.length + '/3)</span></div>' +
      '<div class="flex flex-col gap-12">' + slots + '</div></div>' +
    '<div style="display:flex;gap:14px;width:100%;max-width:500px">' +
      '<button class="bb-btn" onclick="BB.app.cancelRoom()" style="flex:1;background:#f0f2f5;color:var(--text-dim);border:1px solid var(--border);padding:16px 0;font-size:15px">✕ Batal</button>' +
      '<button class="bb-btn" onclick="BB.app.startGame()" style="flex:2;padding:16px 0;font-size:18px;letter-spacing:2px;background:linear-gradient(135deg,var(--accent),#ff6b6b);color:#fff;box-shadow:0 4px 16px rgba(255,62,108,0.25)">' + (isSingle ? '🎮 SINGLE PLAYER' : '🚀 START') + '</button></div>' +
    (isSingle ? '<p style="color:var(--accent2);font-size:13px;margin-top:16px;font-weight:600">Tiada pemain? Tekan untuk bermain solo!</p>' : '') +
  '</div>';
};

// ═══════════════════════════════════════
//  PLAYER JOIN NAME
// ═══════════════════════════════════════
BB.ui.playerJoinName = function (roomCode) {
  return '<div class="screen-live-player">' +
    '<div style="animation:slideUp 0.4s ease;text-align:center;width:100%;max-width:400px">' +
      '<div style="color:var(--accent2);margin-bottom:16px">' + BB.SVG.zap + '</div>' +
      '<h2 class="font-bungee" style="font-size:24px;margin-bottom:4px">JOIN GAME</h2>' +
      '<div class="font-bungee" style="font-size:36px;color:var(--accent2);letter-spacing:0.15em;margin-bottom:32px">' + roomCode + '</div>' +
      '<input class="bb-input" id="playerNameInput" placeholder="Nama Anda / Kumpulan" maxlength="20" oninput="BB.app.checkName(this)" style="text-align:center;font-size:20px;font-weight:700;margin-bottom:6px">' +
      '<p id="nameCount" style="color:var(--text-dim);font-size:11px;margin-bottom:24px">0/20</p>' +
      '<button class="bb-btn" id="joinNameBtn" onclick="BB.app.submitName()" disabled style="font-size:18px;padding:18px 0;width:100%;margin-bottom:14px;background:#e0e4ea;color:var(--text-dim)">⚡ MASUK ROOM</button>' +
      '<button class="bb-btn" onclick="BB.app.go(\'landing\')" style="background:transparent;color:var(--text-dim);border:1px solid var(--border);padding:10px 0;width:100%;font-size:14px">← Kembali</button>' +
    '</div></div>';
};

// ═══════════════════════════════════════
//  PLAYER WAITING
// ═══════════════════════════════════════
BB.ui.playerWaiting = function (roomCode, playerName, roomData) {
  var players = roomData && roomData.players ? Object.entries(roomData.players).map(function (e) { return { id: e[0], name: e[1].name }; }) : [];
  var list = '';
  players.forEach(function (p, i) {
    var isMe = p.name === playerName;
    list += '<div style="background:' + (isMe ? 'rgba(0,153,221,0.06)' : '#ffffff') + ';border:1px solid ' + (isMe ? 'var(--accent2)' : 'var(--border)') + ';border-radius:12px;padding:12px 18px;display:flex;align-items:center;gap:12px;animation:popIn 0.4s ease;box-shadow:0 2px 6px rgba(0,0,0,0.04)">' +
      '<span style="font-size:20px">' + BB.PLAYER_EMOJIS[i] + '</span><span style="font-weight:700;font-size:16px">' + BB.esc(p.name) + '</span>' +
      (isMe ? '<span style="margin-left:auto;font-size:11px;color:var(--accent2);font-weight:600">ANDA</span>' : '') + '</div>';
  });

  return '<div class="screen-live-player">' +
    '<div style="animation:slideUp 0.4s ease;text-align:center;width:100%;max-width:420px">' +
      '<span style="font-size:48px">🎮</span>' +
      '<h2 class="font-bungee" style="font-size:22px;margin-top:16px;margin-bottom:4px">Anda Telah Masuk!</h2>' +
      '<p style="color:var(--accent2);font-weight:700;font-size:20px;margin-bottom:24px">' + BB.esc(playerName) + '</p>' +
      '<div class="flex flex-col gap-10 mb-32">' + list + '</div>' +
      '<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:24px"><span class="waiting-dot"></span><span class="waiting-dot"></span><span class="waiting-dot"></span><span style="color:var(--text-dim);font-size:14px;margin-left:8px">Menunggu host...</span></div>' +
      '<button class="bb-btn" onclick="BB.app.playerLeave()" style="background:transparent;color:var(--danger);border:1px solid rgba(255,62,108,0.25);padding:10px 24px;font-size:13px">Keluar Room</button>' +
    '</div></div>';
};

// ═══════════════════════════════════════
//  HOST LIVE QUIZ
// ═══════════════════════════════════════
BB.ui.hostLive = function (roomData) {
  var questions = roomData.questions || [];
  var qi = roomData.currentQuestionIndex || 0;
  var q = questions[qi];
  var status = roomData.status || "buzzer_locked";
  var buzzedBy = roomData.buzzedBy || null;
  var lastAnswer = roomData.lastAnswer || null;
  var players = roomData.players ? Object.entries(roomData.players).map(function (e) { return { id: e[0], name: e[1].name, score: e[1].score || 0, lives: e[1].lives != null ? e[1].lives : 3 }; }) : [];
  var sorted = players.slice().sort(function (a, b) { return b.score - a.score; });
  var buzzerName = buzzedBy ? (players.find(function (p) { return p.id === buzzedBy; }) || {}).name || "" : "";
  var isLast = qi >= questions.length - 1;
  var isSingle = !players.length || roomData.singlePlayer;
  var timerSeconds = roomData.timerSeconds || 0;
  var timerRemaining = roomData.timerRemaining != null ? roomData.timerRemaining : -1;

  if (!q) return '<div class="screen-live-host">Tiada soalan.</div>';

  // Lives display helper
  function livesHtml(lives, size) {
    var h = '';
    var s = size || 11;
    for (var i = 0; i < 3; i++) h += '<span style="font-size:' + s + 'px">' + (i < lives ? '❤️' : '🖤') + '</span>';
    return h;
  }

  // Compact scoreboard for multiplayer (inline, like solo score)
  var mpScorebar = '';
  if (!isSingle) {
    var chips = '';
    sorted.forEach(function (p, i) {
      var chipColor = BB.SLOT_COLORS[i] || 'var(--border)';
      var eliminated = p.lives <= 0;
      chips += '<div class="mp-score-chip" style="border-color:' + chipColor + ';' + (eliminated ? 'opacity:0.4;' : '') + '">' +
        '<span style="font-size:14px">' + BB.PLAYER_EMOJIS[i] + '</span>' +
        '<span style="font-weight:700;font-size:12px">' + BB.esc(p.name) + (eliminated ? ' 💀' : '') + '</span>' +
        '<span>' + livesHtml(p.lives) + '</span>' +
        '<span class="font-bungee" style="font-size:14px;color:var(--accent3)">' + p.score + '</span>' +
      '</div>';
    });
    mpScorebar = '<div class="mp-scorebar">' + chips + '</div>';
  }

  // Timer bar
  var timerBar = '';
  if (timerSeconds > 0 && timerRemaining >= 0 && !lastAnswer) {
    var pct = Math.round((timerRemaining / timerSeconds) * 100);
    var timerColor = pct > 50 ? 'var(--success)' : pct > 20 ? 'var(--accent3)' : 'var(--danger)';
    timerBar = '<div class="timer-bar-wrap" style="width:100%;max-width:900px;margin:0 auto 4px"><div style="display:flex;align-items:center;margin-bottom:2px"><span id="timer-text" style="font-weight:700;color:' + timerColor + ';font-size:14px">⏱️ ' + timerRemaining + 's</span></div>' +
      '<div style="background:#e0e4ea;border-radius:8px;height:6px;overflow:hidden"><div id="timer-fill" style="background:' + timerColor + ';height:100%;border-radius:8px;width:' + pct + '%;transition:width 1s linear"></div></div></div>';
  }

  // Buzz timer bar (3 seconds for host to answer)
  var buzzTimerBar = '';
  if (buzzedBy && status === "buzzed") {
    var buzzRemaining = roomData.buzzTimerRemaining != null ? roomData.buzzTimerRemaining : 3;
    var buzzPct = Math.round((buzzRemaining / 3) * 100);
    var buzzColor = buzzPct > 50 ? 'var(--accent3)' : 'var(--danger)';
    buzzTimerBar = '<div style="width:100%;max-width:900px;margin:0 auto 4px"><div style="display:flex;align-items:center;margin-bottom:2px"><span id="buzz-timer-text" style="font-weight:700;color:' + buzzColor + ';font-size:14px">⏱️ ' + buzzRemaining + 's - ' + BB.esc(buzzerName) + '</span></div>' +
      '<div style="background:#e0e4ea;border-radius:8px;height:6px;overflow:hidden"><div id="buzz-timer-fill" style="background:' + buzzColor + ';height:100%;border-radius:8px;width:' + buzzPct + '%;transition:width 0.5s linear"></div></div></div>';
  }

  // Options - unified for both solo and multiplayer
  var opts = '';
  if ((status === "buzzer_open" || status === "buzzer_locked") && !lastAnswer && !buzzedBy) {
    if (isSingle) {
      // Single player: clickable answers
      q.options.forEach(function (opt, oi) {
        var optColor = BB.OPT_COLORS[oi];
        opts += '<button class="answer-option-btn" onclick="BB.app.singleAnswer(' + oi + ')" style="border-color:' + optColor + '">' +
          '<span class="font-bungee" style="font-size:22px;color:' + optColor + ';width:40px;flex-shrink:0;text-align:center">' + BB.OPT_LABELS[oi] + '</span>' +
          '<span style="font-size:clamp(18px,2.5vw,24px)">' + BB.esc(opt) + '</span></button>';
      });
    } else {
      // Multiplayer waiting: display-only options
      q.options.forEach(function (opt, oi) {
        var optColor = BB.OPT_COLORS[oi];
        opts += '<div class="answer-option-btn disabled" style="border-color:' + optColor + ';cursor:default">' +
          '<span class="font-bungee" style="font-size:22px;color:' + optColor + ';width:40px;flex-shrink:0;text-align:center">' + BB.OPT_LABELS[oi] + '</span>' +
          '<span style="font-size:clamp(18px,2.5vw,24px)">' + BB.esc(opt) + '</span></div>';
      });
    }
  } else if (buzzedBy && status === "buzzed") {
    // Multiplayer buzzed: host clicks answer for player
    q.options.forEach(function (opt, oi) {
      var optColor = BB.OPT_COLORS[oi];
      opts += '<button class="answer-option-btn" onclick="BB.app.hostAnswer(' + oi + ')" style="border-color:' + optColor + '">' +
        '<span class="font-bungee" style="font-size:22px;color:' + optColor + ';width:40px;flex-shrink:0;text-align:center">' + BB.OPT_LABELS[oi] + '</span>' +
        '<span style="font-size:clamp(18px,2.5vw,24px)">' + BB.esc(opt) + '</span></button>';
    });
  } else if (lastAnswer) {
    // After answer: show correct/wrong highlights
    q.options.forEach(function (opt, oi) {
      var isCorrect = oi === q.correctIndex;
      var isWrong = lastAnswer.selectedIndex === oi && !lastAnswer.correct;
      var bgColor = isCorrect ? 'rgba(0,200,83,0.15)' : isWrong ? 'rgba(255,62,108,0.1)' : '#f5f7fa';
      var borderColor = isCorrect ? 'var(--success)' : isWrong ? 'var(--danger)' : '#e0e4ea';
      var labelColor = isCorrect ? 'var(--success)' : isWrong ? 'var(--danger)' : '#999';
      opts += '<div class="option-display' + (isCorrect ? ' correct' : '') + (isWrong ? ' wrong' : '') + '" style="background:' + bgColor + ';border-color:' + borderColor + ';padding:10px 14px">' +
        '<span class="option-label" style="color:' + labelColor + ';font-size:16px;width:28px">' + BB.OPT_LABELS[oi] + '</span>' +
        '<span class="option-text" style="font-size:clamp(14px,2vw,18px)">' + BB.esc(opt) + '</span>' +
        (isCorrect ? '<span style="margin-left:auto;font-size:16px;color:var(--success)">✓</span>' : '') +
        (isWrong ? '<span style="margin-left:auto;font-size:16px;color:var(--danger)">✗</span>' : '') +
      '</div>';
    });
  }

  // Action area (result + next/end buttons only)
  var action = '';
  if (!isSingle && (status === "buzzer_open" || status === "buzzer_locked") && !buzzedBy && !lastAnswer) {
    action = '<div style="text-align:center;animation:pulse 1s infinite"><div style="display:flex;align-items:center;justify-content:center;gap:8px"><span class="font-bungee" style="font-size:16px;color:var(--accent2)">MENUNGGU BUZZER...</span></div></div>';
  } else if (lastAnswer) {
    var emoji = lastAnswer.correct ? "🎉" : "❌";
    var resultLabel = lastAnswer.timeout ? '⏰ MASA TAMAT!' : (lastAnswer.correct ? 'BETUL! +' + lastAnswer.points : 'SALAH! −1 ❤️');
    var resultColor = lastAnswer.correct ? 'var(--success)' : 'var(--danger)';
    var resultText = isSingle ? resultLabel : (BB.esc(lastAnswer.playerName) + ': ' + resultLabel);
    if (lastAnswer.timeout) emoji = "⏰";
    action = '<div style="text-align:center;animation:popIn 0.4s ease"><div style="font-size:36px;margin-bottom:4px">' + emoji + '</div>' +
      '<p style="font-size:18px;font-weight:800;color:' + resultColor + '">' + resultText + '</p>' +
      '<div style="display:flex;gap:12px;margin-top:12px;justify-content:center">' +
        (!isLast ? '<button class="bb-btn" onclick="BB.app.nextQuestion()" style="background:linear-gradient(135deg,var(--accent2),#00b0ff);color:#fff;font-size:14px;padding:12px 24px;box-shadow:0 4px 12px rgba(0,153,221,0.2)">Soalan Seterusnya →</button>' : '') +
        '<button class="bb-btn" onclick="BB.app.endGame()" style="' + (isLast ? 'background:linear-gradient(135deg,var(--accent),#ff6b6b);color:#fff;box-shadow:0 4px 12px rgba(255,62,108,0.2)' : 'background:#f0f2f5;color:var(--text-dim);border:1px solid var(--border)') + ';font-size:14px;padding:12px 24px">' + (isLast ? '🏆 LIHAT KEPUTUSAN' : '⏹ TAMAT AWAL') + '</button>' +
      '</div></div>';
  }

  // Single player score display
  var spScore = '';
  if (isSingle) {
    var hostLives = roomData.hostLives != null ? roomData.hostLives : 3;
    var hostScore = roomData.hostScore || 0;
    spScore = '<div class="solo-score-inline">' +
      '<span style="font-weight:700;font-size:12px;color:var(--text-dim)">' + BB.esc(roomData.hostName || 'Host') + (hostLives <= 0 ? ' 💀' : '') + '</span>' +
      '<span style="margin:0 4px">' + livesHtml(hostLives) + '</span>' +
      '<span class="font-bungee" style="font-size:16px;color:var(--accent3)">' + hostScore + '</span></div>';
  }

  // Timeout overlay
  var isTimeout = lastAnswer && lastAnswer.timeout;

  // Unified layout for both solo and multiplayer (everything fits one screen)
  return '<div class="screen-live-host solo-screen">' + BB.ui.fsBtn() +
    '<div class="solo-header-row">' +
      '<div><span class="live-tag">⚡ ' + (isSingle ? 'SOLO' : 'LIVE') + '</span><span style="color:var(--text-dim);font-size:13px;margin-left:8px">Soalan ' + (qi + 1) + '/' + questions.length + '</span></div>' +
      (isSingle ? spScore : '') +
    '</div>' +
    (isSingle ? '' : mpScorebar) +
    timerBar +
    buzzTimerBar +
    '<div style="flex:1;display:flex;flex-direction:column;max-width:900px;margin:0 auto;width:100%;min-height:0;overflow-y:auto">' +
      '<div class="host-question-card' + (isTimeout ? ' timed-out' : '') + '">' +
        (q.imageUrl ?
          '<div class="host-q-top">' +
            '<div class="host-q-img">' + BB.ui.qImg(q) + '</div>' +
            '<div class="host-q-text">' +
              '<h2 class="host-q-title">' + BB.esc(q.question) + '</h2>' +
            '</div>' +
          '</div>'
        :
          '<h2 class="host-q-title" style="text-align:center;margin-bottom:8px">' + BB.esc(q.question) + '</h2>'
        ) +
        (isTimeout ? '<div class="timeout-overlay"><span>⏰ MASA TAMAT!</span></div>' : '') +
        '<div class="solo-options-grid">' + opts + '</div>' +
      '</div>' +
      (action ? '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;max-width:500px;margin:4px auto 0;flex-shrink:0">' + action + '</div>' : '') +
    '</div>' +
  '</div>';
};

// ═══════════════════════════════════════
//  PLAYER LIVE QUIZ
// ═══════════════════════════════════════
BB.ui.playerLive = function (roomData, playerId, playerName) {
  var status = roomData.status || "buzzer_locked";
  var buzzedBy = roomData.buzzedBy || null;
  var lastAnswer = roomData.lastAnswer || null;
  var qi = roomData.currentQuestionIndex || 0;
  var questions = roomData.questions || [];
  var q = questions[qi];
  var players = roomData.players || {};
  var myData = players[playerId] || {};
  var myScore = myData.score || 0;
  var myLives = myData.lives != null ? myData.lives : 3;
  var iWon = buzzedBy === playerId;
  var amEliminated = myLives <= 0;

  if (!q) return '<div class="screen-live-player"><p style="font-size:24px;font-weight:700">Menunggu...</p></div>';

  // Lives & score header (always visible)
  function livesHtml(lives) {
    var h = '';
    for (var i = 0; i < 3; i++) h += '<span style="font-size:18px">' + (i < lives ? '❤️' : '🖤') + '</span>';
    return h;
  }
  var headerBar = '<div style="display:flex;align-items:center;justify-content:space-between;width:100%;max-width:400px;margin-bottom:16px">' +
    '<div style="display:flex;align-items:center;gap:6px">' + livesHtml(myLives) + (amEliminated ? '<span style="font-weight:700;color:var(--danger);font-size:13px;margin-left:4px">TERSINGKIR!</span>' : '') + '</div>' +
    '<div style="background:#ffffff;border-radius:12px;padding:8px 16px;border:1px solid var(--border);box-shadow:0 2px 6px rgba(0,0,0,0.06)"><span style="color:var(--text-dim);font-size:13px">Markah: </span><span class="font-bungee" style="font-size:20px;color:var(--accent3)">' + myScore + '</span></div>' +
  '</div>';

  // Answer revealed
  if (lastAnswer) {
    var myAnswer = lastAnswer.playerId === playerId;
    var isTimeout = lastAnswer.timeout;
    var topEmoji = isTimeout ? '⏰' : (myAnswer ? (lastAnswer.correct ? '🎉' : '😢') : '📊');
    var topText = isTimeout ? '<p class="font-bungee" style="font-size:28px;color:var(--danger)">MASA TAMAT!</p><p style="font-size:16px;color:var(--danger);margin-top:4px">−1 ❤️</p>' :
      (myAnswer ?
        '<p class="font-bungee" style="font-size:32px;color:' + (lastAnswer.correct ? 'var(--success)' : 'var(--danger)') + '">' + (lastAnswer.correct ? 'BETUL!' : 'SALAH!') + '</p>' +
        '<p style="font-size:24px;font-weight:700;color:' + (lastAnswer.correct ? 'var(--success)' : 'var(--danger)') + ';margin-top:8px">' + (lastAnswer.correct ? '+' + lastAnswer.points : '−1 ❤️') + '</p>'
        :
        '<p style="font-size:20px;font-weight:700">' + BB.esc(lastAnswer.playerName) + ' ' + (lastAnswer.correct ? 'menjawab betul!' : 'menjawab salah!') + '</p>'
      );
    return '<div class="screen-live-player"><div style="animation:popIn 0.4s ease;text-align:center;width:100%;max-width:400px">' +
      headerBar +
      '<div style="font-size:64px;margin-bottom:16px">' + topEmoji + '</div>' +
      topText +
      '<p style="color:var(--text-dim);font-size:15px;margin-top:24px">Menunggu soalan seterusnya...</p></div></div>';
  }

  // Someone buzzed - show pie timer for winner, "terlambat" for others
  if (buzzedBy && status === "buzzed") {
    var buzzRemaining = roomData.buzzTimerRemaining != null ? roomData.buzzTimerRemaining : 3;
    var buzzerPlayerName = "";
    Object.entries(players).forEach(function (e) { if (e[0] === buzzedBy) buzzerPlayerName = e[1].name; });

    if (iWon) {
      // Winner sees pie countdown timer
      var piePct = Math.round((buzzRemaining / 3) * 100);
      var pieColor = piePct > 50 ? '#00e5ff' : '#ff3e6c';
      var pieDeg = Math.round((buzzRemaining / 3) * 360);
      return '<div class="screen-live-player"><div style="animation:popIn 0.3s ease;text-align:center;width:100%;max-width:400px">' +
        headerBar +
        '<div style="font-size:36px;margin-bottom:8px">🔥</div>' +
        '<p class="font-bungee" style="font-size:24px;color:var(--success);margin-bottom:16px">ANDA MENANG BUZZ!</p>' +
        '<div class="pie-timer" id="pie-timer" style="--pie-deg:' + pieDeg + 'deg;--pie-color:' + pieColor + '">' +
          '<span class="pie-timer-text font-bungee" id="pie-timer-text">' + buzzRemaining + '</span>' +
        '</div>' +
        '<p style="color:var(--text-dim);font-size:16px;margin-top:16px">Sebut jawapan anda!<br>Host akan tekan untuk anda.</p>' +
      '</div></div>';
    } else {
      return '<div class="screen-live-player"><div style="animation:slideUp 0.3s ease;text-align:center;width:100%;max-width:400px">' +
        headerBar +
        '<div style="font-size:48px;margin-bottom:8px">😱</div>' +
        '<p class="font-bungee" style="font-size:22px;color:var(--accent);margin-bottom:8px">TERLAMBAT!</p>' +
        '<p style="color:var(--text-dim);font-size:16px"><span style="color:var(--accent2);font-weight:700">' + BB.esc(buzzerPlayerName) + '</span> lebih laju!</p>' +
      '</div></div>';
    }
  }

  // Default: Buzzer only (no question/options shown to players)
  var canBuzz = (status === "buzzer_open" || status === "buzzer_locked") && !buzzedBy && !amEliminated;
  return '<div class="screen-live-player"><div style="text-align:center;width:100%;max-width:400px">' +
    headerBar +
    '<p style="color:var(--text-dim);font-size:14px;margin-bottom:8px">Soalan ' + (qi + 1) + '/' + questions.length + '</p>' +
    (amEliminated ?
      '<div style="font-size:64px;margin-bottom:8px">💀</div><p class="font-bungee" style="font-size:22px;color:var(--danger)">ANDA TERSINGKIR!</p><p style="color:var(--text-dim);font-size:14px;margin-top:8px">Nyawa habis. Anda hanya boleh menonton.</p>'
    :
      (canBuzz ?
        '<p style="color:var(--accent);font-family:Bungee,cursive;font-size:20px;margin-bottom:12px;animation:pulse 0.8s infinite">TEKAN BUZZER!</p>' +
        '<button class="buzzer-button" onclick="BB.app.buzz()">BUZZ!</button>'
      :
        '<p style="color:var(--text-dim);font-size:16px">Menunggu...</p>'
      )
    ) +
  '</div></div>';
};

// ═══════════════════════════════════════
//  RESULTS SCREEN
// ═══════════════════════════════════════
BB.ui.results = function (roomData, isHost) {
  var isSingle = roomData && roomData.singlePlayer;
  var players = roomData && roomData.players ? Object.entries(roomData.players).map(function (e) { return { id: e[0], name: e[1].name, score: e[1].score || 0, lives: e[1].lives != null ? e[1].lives : 0 }; }) : [];
  if (isSingle) {
    players = [{ id: "host", name: roomData.hostName || "Host", score: roomData.hostScore || 0, lives: roomData.hostLives != null ? roomData.hostLives : 0 }];
  }
  var sorted = players.slice().sort(function (a, b) { return b.score - a.score; });

  // Confetti
  var confetti = '';
  for (var i = 0; i < 30; i++) {
    var colors = ["#ff3e6c", "#00e5ff", "#ffe046", "#00e676", "#ff6b6b", "#9c27b0"];
    var left = Math.random() * 100;
    var delay = (Math.random() * 3).toFixed(1);
    var dur = (2 + Math.random() * 3).toFixed(1);
    var size = (6 + Math.random() * 8).toFixed(0);
    confetti += '<div class="confetti-piece" style="left:' + left + '%;top:-20px;width:' + size + 'px;height:' + size + 'px;background:' + colors[i % 6] + ';border-radius:' + (size > 10 ? '50%' : '2px') + ';animation-duration:' + dur + 's;animation-delay:' + delay + 's"></div>';
  }

  var ranks = '';
  sorted.forEach(function (p, i) {
    var livesDisp = '';
    for (var li = 0; li < 3; li++) livesDisp += '<span style="font-size:12px">' + (li < (p.lives || 0) ? '❤️' : '🖤') + '</span>';
    ranks += '<div class="rank-card" style="background:' + (i === 0 ? 'linear-gradient(135deg,rgba(255,152,0,0.08),rgba(255,152,0,0.02))' : '#ffffff') + ';border:2px solid ' + (i < 3 ? BB.PODIUM_COLORS[i] : 'var(--border)') + ';animation-delay:' + (i * 0.15) + 's;box-shadow:0 2px 8px rgba(0,0,0,0.06)">' +
      '<span class="rank-medal" style="font-size:' + (i < 3 ? '40px' : '24px') + '">' + (i < 3 ? BB.MEDALS[i] : '#' + (i + 1)) + '</span>' +
      '<div style="flex:1;text-align:left"><p style="font-weight:800;font-size:' + (i === 0 ? 22 : 18) + 'px;color:' + (i === 0 ? 'var(--accent3)' : 'var(--text)') + '">' + BB.esc(p.name) + '</p>' +
        (i === 0 && !isSingle ? '<p style="font-size:12px;color:var(--accent3);font-weight:600">PEMENANG!</p>' : '') +
        '<div style="margin-top:2px">' + livesDisp + '</div></div>' +
      '<div style="text-align:right"><p class="rank-score" style="font-size:' + (i === 0 ? 28 : 22) + 'px;color:' + (i === 0 ? 'var(--accent3)' : 'var(--accent2)') + '">' + p.score + '</p><p style="font-size:11px;color:var(--text-dim)">markah</p></div></div>';
  });

  return '<div class="screen-results">' + BB.ui.fsBtn() + confetti +
    '<div style="position:relative;z-index:1;text-align:center;width:100%;max-width:500px">' +
      '<div class="results-crown">👑</div>' +
      '<h1 class="results-title">KEPUTUSAN</h1>' +
      '<div class="flex flex-col gap-16 mb-32" style="margin-bottom:40px">' + ranks + '</div>' +
      (isHost ?
        '<button class="bb-btn" onclick="BB.app.backToDashboard()" style="background:linear-gradient(135deg,var(--accent2),#00b0ff);color:#fff;font-size:16px;padding:16px 40px;box-shadow:0 4px 16px rgba(0,153,221,0.25)">🏠 Kembali ke Dashboard</button>' :
        '<p style="color:var(--text-dim);font-size:15px;font-weight:600">🎮 Terima kasih bermain!</p>') +
    '</div></div>';
};

// ─── Upgrade Modal ───
BB.ui.upgradeModal = function () {
  var isRenewal = !BB.app.state.isPremium && BB.app.state.premiumExpiry > 0;
  var trialExhausted = (BB.app.state.trialUsed || 0) >= BB.TRIAL_LIMIT;
  var title = isRenewal ? 'Renew Premium' : 'Upgrade ke Premium';
  var subtitle = isRenewal ? 'Langganan anda telah tamat. Renew untuk terus guna Jana AI.' : (trialExhausted ? 'Percubaan percuma anda telah habis (0/' + BB.TRIAL_LIMIT + ' soalan). Upgrade untuk terus guna Jana AI!' : 'Jana soalan AI memerlukan langganan Premium');
  return '<div class="modal-overlay" onclick="BB.app.closeModal()">' +
    '<div class="modal-box" onclick="event.stopPropagation()" style="max-width:440px">' +
      '<div style="font-size:56px;margin-bottom:12px">' + (isRenewal ? '🔄' : '👑') + '</div>' +
      '<h3 style="font-size:22px;font-weight:800;margin-bottom:4px;background:linear-gradient(135deg,#ff9800,#ff5722);-webkit-background-clip:text;-webkit-text-fill-color:transparent">' + title + '</h3>' +
      '<p style="color:var(--text-dim);font-size:14px;margin-bottom:24px">' + subtitle + '</p>' +
      '<div style="background:linear-gradient(135deg,rgba(255,152,0,0.06),rgba(255,87,34,0.06));border:1px solid rgba(255,152,0,0.2);border-radius:16px;padding:20px;margin-bottom:24px;text-align:left">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><span style="font-size:24px">🤖</span><span style="font-weight:700;font-size:16px">Jana AI — Soalan Automatik</span></div>' +
        '<ul style="list-style:none;padding:0;margin:0;font-size:14px;color:var(--text)">' +
          '<li style="padding:6px 0;display:flex;align-items:center;gap:8px"><span style="color:var(--success)">✓</span> Jana soalan kuiz dengan AI</li>' +
          '<li style="padding:6px 0;display:flex;align-items:center;gap:8px"><span style="color:var(--success)">✓</span> Sehingga 60 soalan sehari</li>' +
          '<li style="padding:6px 0;display:flex;align-items:center;gap:8px"><span style="color:var(--success)">✓</span> Semua subjek & tahap</li>' +
          '<li style="padding:6px 0;display:flex;align-items:center;gap:8px"><span style="color:var(--success)">✓</span> Bahasa Melayu & English</li>' +
        '</ul>' +
      '</div>' +
      '<div style="background:#f5f7fa;border-radius:14px;padding:16px;margin-bottom:24px;text-align:center">' +
        '<p style="font-size:13px;color:var(--text-dim);margin-bottom:4px">Langganan bulanan (30 hari)</p>' +
        '<p style="font-size:36px;font-weight:800;color:var(--accent3);font-family:Bungee,cursive">' + BB.PREMIUM_PRICE + '<span style="font-size:14px;font-weight:400;color:var(--text-dim)">/bulan</span></p>' +
        '<p style="font-size:12px;color:var(--text-dim)">Bayaran melalui FPX (Online Banking)</p>' +
      '</div>' +
      '<div style="display:flex;gap:12px;width:100%">' +
        '<button class="bb-btn" onclick="BB.app.closeModal()" style="flex:1;background:#f0f2f5;color:var(--text);border:1px solid var(--border);padding:14px 0;font-size:15px">Batal</button>' +
        '<button class="bb-btn" id="upgradeBtn" onclick="BB.app.upgradePremium()" style="flex:1;background:linear-gradient(135deg,#ff9800,#ff5722);color:#fff;padding:14px 0;font-size:15px;box-shadow:0 4px 16px rgba(255,152,0,0.3)">' + (isRenewal ? '🔄 Renew ' : '👑 Bayar ') + BB.PREMIUM_PRICE + '</button>' +
      '</div></div></div>';
};

// ─── AI Generate Modal ───
BB.ui.aiModal = function (aiUsage, isPremium, trialUsed) {
  var today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
  var usageInfo = '';
  if (isPremium) {
    var todayCount = (aiUsage && aiUsage.date === today) ? (aiUsage.count || 0) : 0;
    var remaining = Math.max(0, BB.PREMIUM_DAILY_LIMIT - todayCount);
    usageInfo = '<div style="background:rgba(0,153,221,0.06);border:1px solid rgba(0,153,221,0.15);border-radius:10px;padding:10px 14px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between">' +
      '<span style="font-size:13px;color:var(--text-dim)">Had hari ini:</span>' +
      '<span style="font-weight:700;font-size:14px;color:' + (remaining > 10 ? 'var(--accent2)' : remaining > 0 ? 'var(--accent3)' : 'var(--danger)') + '">' + remaining + '/' + BB.PREMIUM_DAILY_LIMIT + ' soalan tinggal</span></div>';
  } else {
    var trialRemaining = Math.max(0, BB.TRIAL_LIMIT - (trialUsed || 0));
    usageInfo = '<div style="background:rgba(255,152,0,0.06);border:1px solid rgba(255,152,0,0.2);border-radius:10px;padding:10px 14px;margin-bottom:20px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
        '<span style="font-size:13px;color:var(--text-dim)">🎁 Percubaan Percuma:</span>' +
        '<span style="font-weight:700;font-size:14px;color:' + (trialRemaining > 10 ? 'var(--accent3)' : trialRemaining > 0 ? 'var(--accent)' : 'var(--danger)') + '">' + trialRemaining + '/' + BB.TRIAL_LIMIT + ' soalan tinggal</span></div>' +
      '<div style="background:#e0e4ea;border-radius:6px;height:6px;overflow:hidden"><div style="background:linear-gradient(90deg,#ff9800,#ff5722);height:100%;width:' + Math.round(((trialUsed || 0) / BB.TRIAL_LIMIT) * 100) + '%;border-radius:6px;transition:width 0.3s"></div></div>' +
      (trialRemaining <= 10 ? '<p style="font-size:11px;color:var(--accent);margin-top:6px;text-align:center">⚡ Upgrade ke Premium untuk 60 soalan/hari tanpa had!</p>' : '') +
    '</div>';
  }
  var labelStyle = 'color:var(--text-dim);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px';
  var selectStyle = 'font-size:15px;padding:10px 14px';
  return '<div class="modal-overlay" onclick="BB.app.closeModal()">' +
    '<div class="modal-box" onclick="event.stopPropagation()" style="max-width:480px">' +
      '<div style="font-size:48px;margin-bottom:12px">🤖</div>' +
      '<h3 style="font-size:20px;font-weight:700;margin-bottom:4px;background:linear-gradient(135deg,#9c27b0,#e040fb);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Jana Soalan AI</h3>' +
      '<p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">Powered by Gemini</p>' +
      usageInfo +
      '<div style="text-align:left;width:100%">' +
        // Subject dropdown
        '<div style="margin-bottom:16px"><label style="' + labelStyle + '">Subjek</label>' +
          '<select class="bb-input" id="aiSubject" style="' + selectStyle + '">' +
            '<option value="">-- Pilih Subjek --</option>' +
            '<option value="Matematik">Matematik</option>' +
            '<option value="Sains">Sains</option>' +
            '<option value="Bahasa Melayu">Bahasa Melayu</option>' +
            '<option value="Bahasa Inggeris">Bahasa Inggeris</option>' +
            '<option value="Sejarah">Sejarah</option>' +
            '<option value="Pendidikan Islam">Pendidikan Islam</option>' +
            '<option value="Pendidikan Moral">Pendidikan Moral</option>' +
            '<option value="Geografi">Geografi</option>' +
            '<option value="Reka Bentuk & Teknologi">Reka Bentuk & Teknologi</option>' +
            '<option value="Pendidikan Kesihatan">Pendidikan Kesihatan</option>' +
            '<option value="Lain-lain">Lain-lain (tulis di bawah)</option>' +
          '</select></div>' +
        // Year & Level row
        '<div style="display:flex;gap:12px;margin-bottom:16px">' +
          '<div style="flex:1"><label style="' + labelStyle + '">Tahun / Tingkatan</label>' +
            '<select class="bb-input" id="aiYear" style="' + selectStyle + '">' +
              '<option value="Tahun 1">Tahun 1</option>' +
              '<option value="Tahun 2">Tahun 2</option>' +
              '<option value="Tahun 3">Tahun 3</option>' +
              '<option value="Tahun 4" selected>Tahun 4</option>' +
              '<option value="Tahun 5">Tahun 5</option>' +
              '<option value="Tahun 6">Tahun 6</option>' +
              '<option value="Tingkatan 1">Tingkatan 1</option>' +
              '<option value="Tingkatan 2">Tingkatan 2</option>' +
              '<option value="Tingkatan 3">Tingkatan 3</option>' +
              '<option value="Tingkatan 4">Tingkatan 4</option>' +
              '<option value="Tingkatan 5">Tingkatan 5</option>' +
            '</select></div>' +
          '<div style="flex:1"><label style="' + labelStyle + '">Tahap Kesukaran</label>' +
            '<select class="bb-input" id="aiLevel" style="' + selectStyle + '">' +
              '<option value="Mudah">Mudah</option>' +
              '<option value="Sederhana" selected>Sederhana</option>' +
              '<option value="Susah">Susah</option>' +
            '</select></div>' +
        '</div>' +
        // Topic / additional prompt
        '<label style="' + labelStyle + '">Topik Tambahan / Prompt (pilihan)</label>' +
        '<input class="bb-input" id="aiTopic" placeholder="cth: Pecahan, Tambah & Tolak" style="margin-bottom:16px;font-size:15px">' +
        // Number & Language row
        '<div style="display:flex;gap:12px;margin-bottom:20px">' +
          '<div style="flex:1"><label style="' + labelStyle + '">Bilangan Soalan</label>' +
            '<select class="bb-input" id="aiNum" style="' + selectStyle + '"><option value="3">3</option><option value="5" selected>5</option><option value="10">10</option><option value="15">15</option><option value="20">20</option></select></div>' +
          '<div style="flex:1"><label style="' + labelStyle + '">Bahasa</label>' +
            '<select class="bb-input" id="aiLang" style="' + selectStyle + '"><option value="Malay" selected>Bahasa Melayu</option><option value="English">English</option></select></div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:12px;width:100%">' +
        '<button class="bb-btn" onclick="BB.app.closeModal()" style="flex:1;background:#f0f2f5;color:var(--text);border:1px solid var(--border);padding:14px 0;font-size:15px">Batal</button>' +
        '<button class="bb-btn" id="aiGenBtn" onclick="BB.app.generateAI()" style="flex:1;background:linear-gradient(135deg,#9c27b0,#e040fb);color:#fff;padding:14px 0;font-size:15px">🤖 Jana Soalan</button>' +
      '</div></div></div>';
};

// ─── Delete Modal ───
BB.ui.deleteModal = function (title) {
  return '<div class="modal-overlay" onclick="BB.app.closeModal()">' +
    '<div class="modal-box" onclick="event.stopPropagation()">' +
      '<div style="font-size:48px;margin-bottom:16px">⚠️</div>' +
      '<h3 style="font-size:20px;font-weight:700;margin-bottom:8px">Padam Quiz?</h3>' +
      '<p style="color:var(--text-dim);font-size:14px;margin-bottom:28px">"' + BB.esc(title) + '" akan dipadam.</p>' +
      '<div style="display:flex;gap:12px">' +
        '<button class="bb-btn" onclick="BB.app.closeModal()" style="flex:1;background:#f0f2f5;color:var(--text);border:1px solid var(--border);padding:12px 0;font-size:15px">Batal</button>' +
        '<button class="bb-btn" onclick="BB.app.doDelete()" style="flex:1;background:var(--danger);color:#fff;padding:12px 0;font-size:15px">Ya, Padam</button>' +
      '</div></div></div>';
};
