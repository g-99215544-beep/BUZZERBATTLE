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
      '<div class="avatar" style="background:var(--bg);border:1px solid var(--border)">?</div>' +
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

// ═══════════════════════════════════════
//  LANDING PAGE
// ═══════════════════════════════════════
BB.ui.landing = function () {
  return '<div class="screen-landing">' +
    '<div class="landing-orb pink"></div><div class="landing-orb cyan"></div>' +
    '<div class="landing-logo">' + BB.SVG.zap + '</div>' +
    '<h1 class="landing-title">BUZZER<br>BATTLE</h1>' +
    '<p class="landing-sub">Siapa Paling Laju?</p>' +
    '<button class="bb-btn" onclick="BB.app.login()" style="background:linear-gradient(135deg,var(--accent),#ff6b6b);color:#fff;font-size:17px;padding:16px 48px;margin-bottom:20px;width:100%;max-width:340px;box-shadow:var(--glow-pink)">🎤  HOST (Login Google)</button>' +
    '<div class="landing-divider"><span>ATAU</span></div>' +
    '<div style="width:100%;max-width:340px;margin-top:12px">' +
      '<input class="bb-input code-input" id="joinCode" placeholder="Masukkan Kod Room" maxlength="6" oninput="BB.app.formatCode(this)">' +
      '<button class="bb-btn" id="joinBtn" onclick="BB.app.joinRoom()" disabled style="background:var(--card);color:var(--text-dim);font-size:16px;padding:14px 0;width:100%">🎮  JOIN GAME</button>' +
    '</div>' +
    '<p style="color:var(--text-dim);font-size:12px;margin-top:48px;opacity:0.5">BuzzerBattle © 2026</p></div>';
};

// ═══════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════
BB.ui.dashboard = function (user, quizSets) {
  var name = BB.esc(user.displayName || user.email);
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
          '<button class="bb-btn" onclick="BB.app.editQuiz(\'' + qs.id + '\')" style="background:var(--bg);color:var(--accent2);border:1px solid var(--accent2);padding:8px 14px;font-size:13px">' + BB.SVG.edit + ' Edit</button>' +
          '<button class="bb-btn" onclick="BB.app.confirmDeleteQuiz(\'' + qs.id + '\')" style="background:var(--bg);color:var(--danger);border:1px solid var(--danger);padding:8px 14px;font-size:13px">' + BB.SVG.trash + ' Padam</button>' +
          '<button class="bb-btn" onclick="BB.app.startBattle(\'' + qs.id + '\')" style="background:linear-gradient(135deg,var(--accent),#ff6b6b);color:#fff;padding:8px 18px;font-size:13px;box-shadow:var(--glow-pink)">' + BB.SVG.play + ' Mula</button>' +
        '</div></div>';
    });
    cards += '</div>';
  }

  return '<div class="screen-dashboard">' + BB.ui.fsBtn() +
    '<div class="dashboard-inner">' +
      '<div class="dashboard-header"><div>' +
        '<h1 class="dashboard-title">BUZZER BATTLE</h1>' +
        '<p style="color:var(--text-dim);font-size:14px;margin-top:4px">Selamat datang, <span style="color:var(--accent2);font-weight:600">' + name + '</span></p>' +
      '</div>' +
      '<button class="bb-btn" onclick="BB.app.logout()" style="background:transparent;color:var(--text-dim);border:1px solid var(--border);padding:8px 16px;font-size:13px">' + BB.SVG.logout + ' Log Keluar</button></div>' +
      '<button class="bb-btn" onclick="BB.app.newQuiz()" style="background:linear-gradient(135deg,var(--accent2),#00b0ff);color:#000;font-size:16px;padding:16px 32px;margin-bottom:32px;box-shadow:var(--glow-cyan)">' + BB.SVG.plus + ' Buat Quiz Baru</button>' +
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
      '<textarea class="bb-input" placeholder="Tulis soalan..." oninput="BB.app.updateQ(' + qi + ',\'question\',this.value)" rows="2" style="margin-bottom:16px;font-weight:500;font-size:15px">' + BB.esc(q.question) + '</textarea>' +
      '<div class="options-grid">' + opts + '</div></div>';
  });

  return '<div class="screen-editor">' + BB.ui.fsBtn() +
    '<div class="editor-inner">' +
      '<div style="display:flex;align-items:center;gap:16px;margin-bottom:28px">' +
        '<button class="bb-btn" onclick="BB.app.go(\'dashboard\')" style="background:var(--card);color:var(--text);border:1px solid var(--border);width:44px;height:44px;padding:0;border-radius:12px">' + BB.SVG.back + '</button>' +
        '<h2 class="font-bungee" style="font-size:22px;background:linear-gradient(135deg,var(--accent2),var(--accent3));-webkit-background-clip:text;-webkit-text-fill-color:transparent">' + (isEdit ? 'Edit Quiz' : 'Quiz Baru') + '</h2></div>' +
      '<div style="margin-bottom:28px"><label style="color:var(--text-dim);font-size:13px;font-weight:600;display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Tajuk Quiz</label>' +
        '<input class="bb-input" id="quizTitle" placeholder="cth: Matematik Tahun 4" value="' + BB.esc(title) + '" oninput="BB.app.state.editorTitle=this.value" style="font-size:18px;font-weight:600"></div>' +
      qs +
      '<button class="bb-btn" onclick="BB.app.addQ()" style="background:transparent;color:var(--accent2);border:2px dashed var(--accent2);font-size:15px;padding:18px 0;width:100%;border-radius:16px;margin-bottom:20px">' + BB.SVG.plus + ' Tambah Soalan</button>' +
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
  var canStart = players.length >= 1;

  return '<div class="screen-waiting">' + BB.ui.fsBtn() +
    '<h2 class="font-bungee" style="font-size:clamp(18px,4vw,24px);color:var(--accent3);margin-bottom:4px">⚡ WAITING ROOM</h2>' +
    '<p style="color:var(--text-dim);font-size:14px;margin-bottom:32px">Quiz: <span style="color:var(--text);font-weight:600">' + BB.esc(quizTitle) + '</span></p>' +
    '<div class="room-code-box"><p style="color:var(--text-dim);font-size:13px;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;font-weight:600">Kod Room</p>' +
      '<div class="room-code-display">' + roomCode + '</div>' +
      '<button class="bb-btn" onclick="BB.app.copyCode()" id="copyBtn" style="margin-top:14px;background:transparent;color:var(--accent2);border:1px solid var(--accent2);padding:6px 18px;font-size:12px">' + BB.SVG.copy + ' Salin</button></div>' +
    '<div style="width:100%;max-width:500px;margin-bottom:32px">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">' + BB.SVG.users + '<span style="font-weight:700;font-size:16px">Pemain (' + players.length + '/3)</span></div>' +
      '<div class="flex flex-col gap-12">' + slots + '</div></div>' +
    '<div style="display:flex;gap:14px;width:100%;max-width:500px">' +
      '<button class="bb-btn" onclick="BB.app.cancelRoom()" style="flex:1;background:var(--bg2);color:var(--text-dim);border:1px solid var(--border);padding:16px 0;font-size:15px">✕ Batal</button>' +
      '<button class="bb-btn" onclick="BB.app.startGame()" ' + (canStart ? '' : 'disabled') + ' style="flex:2;padding:16px 0;font-size:18px;letter-spacing:2px;' +
        (canStart ? 'background:linear-gradient(135deg,var(--accent),#ff6b6b);color:#fff;box-shadow:var(--glow-pink);animation:glow 2s ease-in-out infinite' : 'background:var(--card);color:var(--text-dim)') + '">🚀 START</button></div>' +
    (canStart ? '' : '<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:20px"><span class="waiting-dot"></span><span class="waiting-dot"></span><span class="waiting-dot"></span><span style="color:var(--text-dim);font-size:13px;margin-left:4px">Menunggu pemain...</span></div>') +
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
      '<button class="bb-btn" id="joinNameBtn" onclick="BB.app.submitName()" disabled style="font-size:17px;padding:16px 0;width:100%;margin-bottom:14px;background:var(--card);color:var(--text-dim)">⚡ MASUK ROOM</button>' +
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
    list += '<div style="background:' + (isMe ? 'rgba(0,229,255,0.07)' : 'var(--card)') + ';border:1px solid ' + (isMe ? 'var(--accent2)' : 'var(--border)') + ';border-radius:12px;padding:12px 18px;display:flex;align-items:center;gap:12px;animation:popIn 0.4s ease">' +
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
  var players = roomData.players ? Object.entries(roomData.players).map(function (e) { return { id: e[0], name: e[1].name, score: e[1].score || 0 }; }) : [];
  var sorted = players.slice().sort(function (a, b) { return b.score - a.score; });
  var buzzerName = buzzedBy ? (players.find(function (p) { return p.id === buzzedBy; }) || {}).name || "" : "";
  var isLast = qi >= questions.length - 1;

  if (!q) return '<div class="screen-live-host">Tiada soalan.</div>';

  // Scoreboard
  var sb = '';
  sorted.forEach(function (p, i) {
    sb += '<div class="scoreboard-chip" style="border:1px solid ' + (BB.SLOT_COLORS[i] || 'var(--border)') + '"><span style="font-weight:700">' + BB.esc(p.name) + '</span> <span style="color:var(--accent3);font-weight:800">' + p.score + '</span></div>';
  });

  // Options
  var opts = '';
  q.options.forEach(function (opt, oi) {
    var isCorrect = lastAnswer && oi === q.correctIndex;
    var isWrong = lastAnswer && lastAnswer.selectedIndex === oi && !lastAnswer.correct;
    opts += '<div class="option-display' + (isCorrect ? ' correct' : '') + (isWrong ? ' wrong' : '') + '" style="background:' + (isCorrect ? 'rgba(0,230,118,0.13)' : isWrong ? 'rgba(255,62,108,0.13)' : BB.OPT_COLORS[oi] + '11') + ';border-color:' + (isCorrect ? 'var(--success)' : isWrong ? 'var(--danger)' : BB.OPT_COLORS[oi]) + '">' +
      '<span class="option-label" style="color:' + BB.OPT_COLORS[oi] + '">' + BB.OPT_LABELS[oi] + '</span>' +
      '<span class="option-text">' + BB.esc(opt) + '</span>' +
      (isCorrect ? '<span style="margin-left:auto;font-size:20px">✓</span>' : '') +
      (isWrong ? '<span style="margin-left:auto;font-size:20px">✗</span>' : '') +
    '</div>';
  });

  // Center action
  var action = '';
  if (status === "buzzer_locked" && !lastAnswer) {
    action = '<button class="bb-btn" onclick="BB.app.unlockBuzzer()" style="background:linear-gradient(135deg,var(--accent2),#00b0ff);color:#000;font-size:18px;padding:18px 48px;box-shadow:var(--glow-cyan)">' + BB.SVG.unlock + ' BUKA BUZZER</button>';
  } else if (status === "buzzer_open" && !buzzedBy) {
    action = '<div style="text-align:center;animation:pulse 1s infinite"><div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:8px">' + BB.SVG.unlock + '<span class="font-bungee" style="font-size:22px;color:var(--accent2)">BUZZER TERBUKA!</span></div><p style="color:var(--text-dim);font-size:14px">Menunggu pemain...</p></div>';
  } else if (buzzedBy && status === "buzzed") {
    action = '<div class="buzzed-card"><p class="buzzed-name">' + BB.esc(buzzerName) + '</p><p style="color:var(--text-dim);font-size:14px;margin-top:4px">sedang memilih jawapan...</p></div>';
  } else if (lastAnswer) {
    var emoji = lastAnswer.correct ? "🎉" : "❌";
    var resultText = BB.esc(lastAnswer.playerName) + ': ' + (lastAnswer.correct ? 'BETUL! +' + lastAnswer.points : 'SALAH! −' + Math.floor(lastAnswer.points / 2));
    action = '<div style="text-align:center;animation:popIn 0.4s ease"><div style="font-size:48px;margin-bottom:8px">' + emoji + '</div>' +
      '<p style="font-size:22px;font-weight:800;color:' + (lastAnswer.correct ? 'var(--success)' : 'var(--danger)') + '">' + resultText + '</p>' +
      '<div style="display:flex;gap:12px;margin-top:20px;justify-content:center">' +
        (!isLast ? '<button class="bb-btn" onclick="BB.app.nextQuestion()" style="background:linear-gradient(135deg,var(--accent2),#00b0ff);color:#000;font-size:16px;padding:14px 32px">Soalan Seterusnya →</button>' : '') +
        '<button class="bb-btn" onclick="BB.app.endGame()" style="' + (isLast ? 'background:linear-gradient(135deg,var(--accent),#ff6b6b);color:#fff;box-shadow:var(--glow-pink)' : 'background:var(--card);color:var(--text-dim);border:1px solid var(--border)') + ';font-size:16px;padding:14px 32px">' + (isLast ? '🏆 LIHAT KEPUTUSAN' : '⏹ TAMAT AWAL') + '</button>' +
      '</div></div>';
  }

  return '<div class="screen-live-host">' + BB.ui.fsBtn() +
    '<div class="live-topbar"><div style="display:flex;align-items:center;gap:12px"><span class="live-tag">⚡ LIVE</span><span style="color:var(--text-dim);font-size:13px">Soalan ' + (qi + 1) + '/' + questions.length + '</span></div>' +
      '<div class="scoreboard-mini">' + sb + '</div></div>' +
    '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;max-width:900px;margin:0 auto;width:100%">' +
      '<div class="question-display"><p style="color:var(--text-dim);font-size:13px;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">Soalan ' + (qi + 1) + '</p>' +
        '<h2 class="question-text">' + BB.esc(q.question) + '</h2>' +
        '<div class="options-grid" style="gap:14px">' + opts + '</div></div>' +
      '<div style="display:flex;flex-direction:column;align-items:center;gap:16px;width:100%;max-width:500px">' + action + '</div>' +
    '</div></div>';
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
  var myScore = players[playerId] ? (players[playerId].score || 0) : 0;
  var iWon = buzzedBy === playerId;

  if (!q) return '<div class="screen-live-player">Menunggu...</div>';

  // Buzzer locked
  if (status === "buzzer_locked" && !lastAnswer) {
    return '<div class="screen-live-player">' +
      '<p style="color:var(--text-dim);font-size:14px;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">Soalan ' + (qi + 1) + '/' + questions.length + '</p>' +
      '<div style="color:var(--text-dim);margin-bottom:24px">' + BB.SVG.lock + '</div>' +
      '<p class="font-bungee" style="font-size:24px;color:var(--text-dim);margin-bottom:8px">BUZZER DIKUNCI</p>' +
      '<p style="color:var(--text-dim);font-size:14px">Lihat soalan di paparan TV</p>' +
      '<div style="margin-top:32px;background:var(--card);border-radius:14px;padding:12px 24px;border:1px solid var(--border)"><span style="color:var(--text-dim);font-size:13px">Markah: </span><span class="font-bungee" style="font-size:22px;color:var(--accent3)">' + myScore + '</span></div></div>';
  }

  // Buzzer open
  if (status === "buzzer_open" && !buzzedBy) {
    return '<div class="screen-live-player">' +
      '<p style="color:var(--accent2);font-family:Bungee,cursive;font-size:18px;margin-bottom:32px;animation:pulse 0.8s infinite">TEKAN SEKARANG!</p>' +
      '<button class="buzzer-button" onclick="BB.app.buzz()">BUZZ!</button>' +
      '<p style="color:var(--text-dim);font-size:13px;margin-top:24px">' + BB.esc(playerName) + ' • Markah: ' + myScore + '</p></div>';
  }

  // Someone else buzzed
  if (buzzedBy && !iWon && status === "buzzed") {
    var winnerName = "";
    Object.entries(players).forEach(function (e) { if (e[0] === buzzedBy) winnerName = e[1].name; });
    return '<div class="screen-live-player">' +
      '<div style="font-size:64px;margin-bottom:16px">😱</div>' +
      '<p class="font-bungee" style="font-size:22px;color:var(--accent);margin-bottom:8px">TERLAMBAT!</p>' +
      '<p style="color:var(--text-dim);font-size:16px"><span style="color:var(--accent2);font-weight:700">' + BB.esc(winnerName) + '</span> lebih laju!</p>' +
      '<p style="color:var(--text-dim);font-size:13px;margin-top:24px">Menunggu jawapan...</p></div>';
  }

  // I won buzz — show options
  if (iWon && status === "buzzed") {
    var opts = '';
    q.options.forEach(function (opt, oi) {
      opts += '<button class="answer-option-btn" onclick="BB.app.answer(' + oi + ')" style="background:' + BB.OPT_COLORS[oi] + '0d;border-color:' + BB.OPT_COLORS[oi] + '">' +
        '<span class="font-bungee" style="font-size:20px;color:' + BB.OPT_COLORS[oi] + ';width:36px;flex-shrink:0;text-align:center">' + BB.OPT_LABELS[oi] + '</span>' + BB.esc(opt) + '</button>';
    });
    return '<div class="screen-live-player"><div style="animation:popIn 0.4s ease;text-align:center;width:100%;max-width:500px">' +
      '<div style="font-size:48px;margin-bottom:8px">🔥</div>' +
      '<p class="font-bungee" style="font-size:22px;color:var(--success);margin-bottom:24px">ANDA MENANG BUZZ!</p>' +
      '<p style="color:var(--text-dim);font-size:14px;margin-bottom:20px">Pilih jawapan anda:</p>' +
      '<div class="flex flex-col gap-12">' + opts + '</div></div></div>';
  }

  // Answer revealed
  if (lastAnswer) {
    var myAnswer = lastAnswer.playerId === playerId;
    return '<div class="screen-live-player"><div style="animation:popIn 0.4s ease;text-align:center">' +
      '<div style="font-size:64px;margin-bottom:16px">' + (myAnswer ? (lastAnswer.correct ? '🎉' : '😢') : '📊') + '</div>' +
      (myAnswer ?
        '<p class="font-bungee" style="font-size:28px;color:' + (lastAnswer.correct ? 'var(--success)' : 'var(--danger)') + '">' + (lastAnswer.correct ? 'BETUL!' : 'SALAH!') + '</p>' +
        '<p style="font-size:20px;font-weight:700;color:' + (lastAnswer.correct ? 'var(--success)' : 'var(--danger)') + ';margin-top:8px">' + (lastAnswer.correct ? '+' + lastAnswer.points : '−' + Math.floor(lastAnswer.points / 2)) + '</p>'
        :
        '<p style="font-size:18px;font-weight:700">' + BB.esc(lastAnswer.playerName) + ' ' + (lastAnswer.correct ? 'menjawab betul!' : 'menjawab salah!') + '</p>'
      ) +
      '<div style="margin-top:24px;background:var(--card);border-radius:14px;padding:12px 24px;border:1px solid var(--border);display:inline-block"><span style="color:var(--text-dim);font-size:13px">Markah: </span><span class="font-bungee" style="font-size:22px;color:var(--accent3)">' + myScore + '</span></div>' +
      '<p style="color:var(--text-dim);font-size:13px;margin-top:16px">Menunggu soalan seterusnya...</p></div></div>';
  }

  return '<div class="screen-live-player">Memuatkan...</div>';
};

// ═══════════════════════════════════════
//  RESULTS SCREEN
// ═══════════════════════════════════════
BB.ui.results = function (roomData, isHost) {
  var players = roomData && roomData.players ? Object.entries(roomData.players).map(function (e) { return { id: e[0], name: e[1].name, score: e[1].score || 0 }; }) : [];
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
    ranks += '<div class="rank-card" style="background:' + (i === 0 ? 'linear-gradient(135deg,rgba(255,224,70,0.13),rgba(255,224,70,0.03))' : 'var(--card)') + ';border:2px solid ' + (i < 3 ? BB.PODIUM_COLORS[i] : 'var(--border)') + ';animation-delay:' + (i * 0.15) + 's;' + (i === 0 ? 'box-shadow:var(--glow-pink)' : '') + '">' +
      '<span class="rank-medal" style="font-size:' + (i < 3 ? '40px' : '24px') + '">' + (i < 3 ? BB.MEDALS[i] : '#' + (i + 1)) + '</span>' +
      '<div style="flex:1;text-align:left"><p style="font-weight:800;font-size:' + (i === 0 ? 22 : 18) + 'px;color:' + (i === 0 ? 'var(--accent3)' : 'var(--text)') + '">' + BB.esc(p.name) + '</p>' +
        (i === 0 ? '<p style="font-size:12px;color:var(--accent3);font-weight:600">PEMENANG!</p>' : '') + '</div>' +
      '<div style="text-align:right"><p class="rank-score" style="font-size:' + (i === 0 ? 28 : 22) + 'px;color:' + (i === 0 ? 'var(--accent3)' : 'var(--accent2)') + '">' + p.score + '</p><p style="font-size:11px;color:var(--text-dim)">markah</p></div></div>';
  });

  return '<div class="screen-results">' + BB.ui.fsBtn() + confetti +
    '<div style="position:relative;z-index:1;text-align:center;width:100%;max-width:500px">' +
      '<div class="results-crown">👑</div>' +
      '<h1 class="results-title">KEPUTUSAN</h1>' +
      '<div class="flex flex-col gap-16 mb-32" style="margin-bottom:40px">' + ranks + '</div>' +
      (isHost ?
        '<button class="bb-btn" onclick="BB.app.backToDashboard()" style="background:linear-gradient(135deg,var(--accent2),#00b0ff);color:#000;font-size:16px;padding:16px 40px;box-shadow:var(--glow-cyan)">🏠 Kembali ke Dashboard</button>' :
        '<p style="color:var(--text-dim);font-size:15px;font-weight:600">🎮 Terima kasih bermain!</p>') +
    '</div></div>';
};

// ─── Delete Modal ───
BB.ui.deleteModal = function (title) {
  return '<div class="modal-overlay" onclick="BB.app.closeModal()">' +
    '<div class="modal-box" onclick="event.stopPropagation()">' +
      '<div style="font-size:48px;margin-bottom:16px">⚠️</div>' +
      '<h3 style="font-size:20px;font-weight:700;margin-bottom:8px">Padam Quiz?</h3>' +
      '<p style="color:var(--text-dim);font-size:14px;margin-bottom:28px">"' + BB.esc(title) + '" akan dipadam.</p>' +
      '<div style="display:flex;gap:12px">' +
        '<button class="bb-btn" onclick="BB.app.closeModal()" style="flex:1;background:var(--bg);color:var(--text);border:1px solid var(--border);padding:12px 0;font-size:15px">Batal</button>' +
        '<button class="bb-btn" onclick="BB.app.doDelete()" style="flex:1;background:var(--danger);color:#fff;padding:12px 0;font-size:15px">Ya, Padam</button>' +
      '</div></div></div>';
};
