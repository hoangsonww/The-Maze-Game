/**
 * The Maze Game
 *
 * @author Son Nguyen <hoangson091104@gmail.com>
 * @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
 * @license MIT
 * @see https://github.com/hoangsonww/The-Maze-Game
 */

/**
 * The Maze Game — consolidated engine.
 *
 * One canonical build (no "enhanced" fork). Features: difficulty levels,
 * timer, scoring, A* hints, pause, themes, sound, smooth animated movement,
 * touch/swipe controls, confetti win modal, local stats, and graceful
 * (optional) backend integration for sessions / leaderboard / achievements.
 */

// Backend base URL. Defaults to the deployed API; override before this script
// loads (e.g. `window.MAZE_API_BASE = ''` for same-origin / local dev).
const DEFAULT_API_BASE = 'https://maze-game-api.vercel.app';
function apiBase() {
  if (typeof window !== 'undefined' && window.MAZE_API_BASE !== undefined) {
    return window.MAZE_API_BASE;
  }
  return DEFAULT_API_BASE;
}

// JSON headers + a bearer token when the player is signed in.
function apiHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined' && window.mazeAuth && window.mazeAuth.token()) {
    h.Authorization = 'Bearer ' + window.mazeAuth.token();
  }
  return h;
}

class MazeGame {
  constructor() {
    this.canvas = document.getElementById('mazeCanvas');
    if (!this.canvas) return; // nothing to do without a canvas (e.g. tests)
    this.ctx = this.canvas.getContext('2d');

    // Persisted preferences
    this.settings = this.loadSettings();
    this.difficulty = this.settings.difficulty || 'medium';
    this.soundEnabled = this.settings.soundEnabled !== false;
    this.theme = this.settings.theme || 'default';

    // Difficulty configurations (logical dimensions are normalised to odd
    // numbers in buildMaze so the bottom-right exit is always reachable).
    // hintSteps = how many cells ahead a hint reveals (a nudge, not the answer).
    // maxHints  = how many hints are allowed for the whole run.
    this.difficultyConfig = {
      easy: { rows: 11, cols: 15, hintCost: 5, mult: 1, hintSteps: 3, maxHints: 3 },
      medium: { rows: 15, cols: 21, hintCost: 10, mult: 1.5, hintSteps: 4, maxHints: 5 },
      hard: { rows: 21, cols: 31, hintCost: 15, mult: 2, hintSteps: 5, maxHints: 7 },
      expert: { rows: 25, cols: 35, hintCost: 20, mult: 3, hintSteps: 6, maxHints: 9 },
    };

    // Canvas color palettes per theme
    this.themes = {
      default: {
        wall: '#0e1318',
        floor: '#eef3e9',
        grid: 'rgba(11,14,17,0.06)',
        player: '#ff6a4d',
        exit: '#c6f24e',
        trail: 'rgba(69,224,255,0.18)',
        glow: false,
      },
      dark: {
        wall: '#06080a',
        floor: '#1b2128',
        grid: 'rgba(198,242,78,0.06)',
        player: '#ff6a4d',
        exit: '#c6f24e',
        trail: 'rgba(69,224,255,0.10)',
        glow: false,
      },
      neon: {
        wall: '#05010f',
        floor: '#11003a',
        grid: 'rgba(0,255,255,0.12)',
        player: '#ff2d9b',
        exit: '#00ffd5',
        trail: 'rgba(0,255,213,0.14)',
        glow: true,
      },
      forest: {
        wall: '#0a160f',
        floor: '#15271b',
        grid: 'rgba(124,242,106,0.08)',
        player: '#ffc24a',
        exit: '#7cf26a',
        trail: 'rgba(124,242,106,0.14)',
        glow: false,
      },
      sunset: {
        wall: '#2a1224',
        floor: '#3a1a2e',
        grid: 'rgba(255,170,90,0.10)',
        player: '#ffd36e',
        exit: '#ff7eb3',
        trail: 'rgba(255,170,90,0.16)',
        glow: true,
      },
      ocean: {
        wall: '#06182b',
        floor: '#0d2740',
        grid: 'rgba(68,224,255,0.10)',
        player: '#ffd166',
        exit: '#44e0ff',
        trail: 'rgba(68,224,255,0.16)',
        glow: false,
      },
      dracula: {
        wall: '#1a1b26',
        floor: '#282a36',
        grid: 'rgba(189,147,249,0.12)',
        player: '#ff79c6',
        exit: '#50fa7b',
        trail: 'rgba(189,147,249,0.16)',
        glow: true,
      },
      mono: {
        wall: '#0c0c0c',
        floor: '#1c1c1c',
        grid: 'rgba(255,255,255,0.07)',
        player: '#ffffff',
        exit: '#ffb000',
        trail: 'rgba(255,176,0,0.14)',
        glow: false,
      },
      candy: {
        wall: '#3a2350',
        floor: '#fdeef7',
        grid: 'rgba(58,35,80,0.06)',
        player: '#ff5d8f',
        exit: '#19c39a',
        trail: 'rgba(124,200,255,0.16)',
        glow: false,
      },
      volcano: {
        wall: '#190806',
        floor: '#2a0d08',
        grid: 'rgba(255,120,60,0.10)',
        player: '#ffd24a',
        exit: '#ff5a36',
        trail: 'rgba(255,120,60,0.18)',
        glow: true,
      },
    };

    // Sound effects (tiny embedded blips; failures are ignored)
    this.sounds = {
      move: this.makeBeep(440, 0.05),
      win: this.makeBeep(880, 0.25),
      hint: this.makeBeep(660, 0.12),
      blocked: this.makeBeep(160, 0.05),
    };

    this.stats = this.loadStats();
    this.confetti = [];
    this.rafId = null;

    this.applyDifficulty();
    this.init();
  }

  // ---- setup ---------------------------------------------------------------

  applyDifficulty() {
    const cfg = this.difficultyConfig[this.difficulty] || this.difficultyConfig.medium;
    // `| 1` forces an odd count so the exit corner is on the carved lattice.
    this.rows = cfg.rows | 1;
    this.cols = cfg.cols | 1;
    this.hintCost = cfg.hintCost;
    this.scoreMult = cfg.mult;
    this.hintSteps = cfg.hintSteps;
    this.maxHints = cfg.maxHints;

    const cell = Math.floor(Math.min(800 / this.cols, 600 / this.rows));
    this.cellSize = cell;
    this.canvas.width = cell * this.cols;
    this.canvas.height = cell * this.rows;
  }

  init() {
    this.syncSettingControls();
    this.buildMaze();
    this.resetState();
    this.setupEvents();
    this.updateHUD();
    this.checkAchievements();
    this.loop();
  }

  resetState() {
    this.player = { x: 0, y: 0, rx: 0, ry: 0 };
    this.exit = { x: this.cols - 1, y: this.rows - 1 };
    this.trail = new Set(['0,0']);
    this.moves = 0;
    this.hintsUsed = 0;
    this.hintPath = [];
    this.showingHint = false;
    this.paused = false;
    this.won = false;
    this.confetti = [];
    // Frozen until the player presses Play (the clock does not run yet).
    this.started = false;
    this.gameStartTime = null;
    this.pausedAt = 0;
    this.gameSessionId = null;
    this.setText('timer', '00:00');
    this.setText('currentScore', '0');
    this.closeHintModal();
    this.showStartOverlay();
    this.updateHintUI();
  }

  // Player pressed Play: reshuffle the maze (so any peeking is moot), start the
  // clock, and hide the start overlay.
  begin() {
    if (this.started) return;
    this.buildMaze();
    this.player = { x: 0, y: 0, rx: 0, ry: 0 };
    this.exit = { x: this.cols - 1, y: this.rows - 1 };
    this.trail = new Set(['0,0']);
    this.moves = 0;
    this.hintsUsed = 0;
    this.hintPath = [];
    this.showingHint = false;
    this.paused = false;
    this.won = false;
    this.started = true;
    this.gameStartTime = Date.now();
    this.hideStartOverlay();
    this.updateHUD();
    this.syncActionButtons();
    this.startGameSession();
  }

  showStartOverlay() {
    document.getElementById('startOverlay')?.classList.remove('hidden');
  }

  hideStartOverlay() {
    document.getElementById('startOverlay')?.classList.add('hidden');
  }

  buildMaze() {
    this.maze = [];
    for (let y = 0; y < this.rows; y++) {
      this.maze[y] = new Array(this.cols).fill(1);
    }
    this.maze[0][0] = 0;
    this.carve(0, 0);
    // Corner is on the even lattice (odd dims) → guaranteed reachable.
    this.maze[this.rows - 1][this.cols - 1] = 0;
  }

  carve(x, y) {
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    for (const [dx, dy] of dirs) {
      const nx = x + dx * 2;
      const ny = y + dy * 2;
      if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows && this.maze[ny][nx] === 1) {
        this.maze[y + dy][x + dx] = 0;
        this.maze[ny][nx] = 0;
        this.carve(nx, ny);
      }
    }
  }

  setupEvents() {
    if (this.eventsBound) return; // bind once across resets
    this.eventsBound = true;

    window.addEventListener('keydown', (e) => this.handleKey(e));

    const click = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
    click('moveUp', () => this.move(0, -1));
    click('moveDown', () => this.move(0, 1));
    click('moveLeft', () => this.move(-1, 0));
    click('moveRight', () => this.move(1, 0));
    click('startBtn', () => this.begin());
    click('pauseGame', () => this.togglePause());
    click('useHint', () => this.showHint());
    click('regenerateMaze', () => this.regenerate());
    click('hintConfirm', () => this.applyHint());
    click('hintCancel', () => this.closeHintModal());
    click('playAgain', () => {
      this.hideWinModal();
      this.reset();
    });

    document
      .getElementById('difficultySelect')
      ?.addEventListener('change', (e) => this.changeDifficulty(e.target.value));
    document
      .getElementById('soundToggle')
      ?.addEventListener('change', (e) => this.toggleSound(e.target.checked));
    document
      .getElementById('themeSelect')
      ?.addEventListener('change', (e) => this.changeTheme(e.target.value));

    // Touch / swipe controls
    let sx = 0,
      sy = 0;
    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        const t = e.changedTouches[0];
        sx = t.clientX;
        sy = t.clientY;
      },
      { passive: true }
    );
    this.canvas.addEventListener(
      'touchend',
      (e) => {
        const t = e.changedTouches[0];
        const dx = t.clientX - sx,
          dy = t.clientY - sy;
        if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
        if (Math.abs(dx) > Math.abs(dy)) this.move(Math.sign(dx), 0);
        else this.move(0, Math.sign(dy));
      },
      { passive: true }
    );
  }

  syncSettingControls() {
    const diff = document.getElementById('difficultySelect');
    if (diff) diff.value = this.difficulty;
    const theme = document.getElementById('themeSelect');
    if (theme) theme.value = this.theme;
    const sound = document.getElementById('soundToggle');
    if (sound) sound.checked = this.soundEnabled;
    document.body.className = this.theme + '-theme';
  }

  // ---- input / movement ----------------------------------------------------

  handleKey(e) {
    // Ignore game shortcuts while the user is typing in a form control
    // (or any modal is open), so WASD/P/H/R reach the input instead.
    const t = e.target;
    if (
      t &&
      (t.tagName === 'INPUT' ||
        t.tagName === 'TEXTAREA' ||
        t.tagName === 'SELECT' ||
        t.isContentEditable)
    ) {
      return;
    }
    if (document.querySelector('.modal[style*="block"], .modal-overlay.show')) return;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.move(0, -1);
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.move(0, 1);
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.move(-1, 0);
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.move(1, 0);
        e.preventDefault();
        break;
      case 'p':
      case 'P':
        this.togglePause();
        e.preventDefault();
        break;
      case 'h':
      case 'H':
        this.showHint();
        e.preventDefault();
        break;
      case 'r':
      case 'R':
        this.regenerate();
        e.preventDefault();
        break;
    }
  }

  move(dx, dy) {
    if (!this.started || this.paused || this.won) return;
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
    if (nx < 0 || nx >= this.cols || ny < 0 || ny >= this.rows || this.maze[ny][nx] === 1) {
      this.playSound('blocked');
      return;
    }
    this.player.x = nx;
    this.player.y = ny;
    this.trail.add(nx + ',' + ny);
    this.moves++;
    this.playSound('move');
    this.setText('moves', this.moves);
    // Check the win first: on the winning step we complete the session instead
    // of tracking a move (tracking a completed session returns 400).
    this.checkWin();
    if (this.gameSessionId && !this.won) this.trackMove();
  }

  togglePause() {
    if (this.won || !this.started) return;
    this.paused = !this.paused;
    if (this.paused) this.pausedAt = Date.now();
    else this.gameStartTime += Date.now() - this.pausedAt;
    this.setPauseButton(this.paused);
    this.syncActionButtons();
  }

  // Swap the pause button's icon (via .paused class) + label without emojis.
  setPauseButton(paused) {
    const btn = document.getElementById('pauseGame');
    if (!btn) return;
    btn.classList.toggle('paused', paused);
    const label = btn.querySelector('.btn-label');
    if (label) label.textContent = paused ? 'Resume' : 'Pause';
  }

  // ---- hints (A*) ----------------------------------------------------------

  // Clicking Hint (or pressing H) asks for confirmation first — a hint costs
  // points and you only get a few per run.
  showHint() {
    if (!this.started || this.paused || this.won || this.showingHint) return;
    const remaining = this.maxHints - this.hintsUsed;
    if (remaining <= 0) {
      this.flashMessage('No hints left for this run.');
      return;
    }
    if (this.currentScore() < this.hintCost) {
      this.flashMessage(`Need ${this.hintCost} points for a hint.`);
      return;
    }
    this.openHintModal(remaining);
  }

  openHintModal(remaining) {
    const text = document.getElementById('hintModalText');
    if (text) {
      const noun = remaining === 1 ? 'hint' : 'hints';
      text.innerHTML =
        `This lights up the next <b>${this.hintSteps}</b> steps toward the exit — not the whole path. ` +
        `It costs <b>${this.hintCost} pts</b>, and you have <b>${remaining}</b> ${noun} left this run.`;
    }
    document.getElementById('hintModal')?.classList.add('show');
  }

  closeHintModal() {
    document.getElementById('hintModal')?.classList.remove('show');
  }

  // Confirmed: spend one hint and reveal only the next few steps.
  applyHint() {
    this.closeHintModal();
    if (!this.started || this.paused || this.won || this.showingHint) return;
    if (this.hintsUsed >= this.maxHints) {
      this.flashMessage('No hints left for this run.');
      return;
    }
    if (this.currentScore() < this.hintCost) {
      this.flashMessage(`Need ${this.hintCost} points for a hint.`);
      return;
    }
    this.hintsUsed++;
    this.playSound('hint');
    const full = this.findPath(this.player.x, this.player.y, this.exit.x, this.exit.y);
    // A nudge, not the answer: current cell + the next `hintSteps` cells.
    this.hintPath = full.slice(0, this.hintSteps + 1);
    this.showingHint = true;
    this.scrollToMazeIfNeeded();
    window.dispatchEvent(new CustomEvent('hintUsed', { detail: { difficulty: this.difficulty } }));
    setTimeout(() => {
      this.showingHint = false;
      this.hintPath = [];
      this.syncActionButtons();
    }, 3000);
    this.updateHintUI();
  }

  // After confirming a hint, bring the maze into view if the player scrolled away.
  scrollToMazeIfNeeded() {
    const target = this.canvas?.closest('.game-canvas-container') || this.canvas;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
    if (visible / Math.max(rect.height, 1) < 0.45) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  setBtnLocked(id, locked) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle('is-locked', locked);
    if (locked) {
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
    } else {
      btn.disabled = false;
      btn.removeAttribute('disabled');
      btn.removeAttribute('aria-disabled');
    }
  }

  // Pause · Hint · New Maze — locked until Play; hint also locks when spent/paused.
  syncActionButtons() {
    const container = document.querySelector('.action-controls');
    const preRun = !this.started;
    container?.classList.toggle('is-pre-run', preRun);

    const runLive = this.started && !this.won;
    this.setBtnLocked('pauseGame', !runLive);
    this.setBtnLocked('regenerateMaze', !runLive);

    const hintLocked =
      !runLive ||
      this.paused ||
      this.showingHint ||
      (this.maxHints != null && this.hintsUsed >= this.maxHints);
    this.setBtnLocked('useHint', hintLocked);
  }

  updateHintUI() {
    if (this.maxHints != null) {
      this.setText('hints', `${this.hintsUsed} / ${this.maxHints}`);
    }
    this.syncActionButtons();
  }

  findPath(sx, sy, ex, ey) {
    const open = [{ x: sx, y: sy, g: 0, f: this.heuristic(sx, sy, ex, ey), parent: null }];
    const seen = new Map();
    const key = (x, y) => x + ',' + y;
    while (open.length) {
      open.sort((a, b) => a.f - b.f);
      const cur = open.shift();
      if (cur.x === ex && cur.y === ey) {
        const path = [];
        for (let t = cur; t; t = t.parent) path.unshift({ x: t.x, y: t.y });
        return path;
      }
      seen.set(key(cur.x, cur.y), cur.g);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const x = cur.x + dx,
          y = cur.y + dy;
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) continue;
        if (this.maze[y][x] === 1) continue;
        const g = cur.g + 1;
        if (seen.has(key(x, y)) && seen.get(key(x, y)) <= g) continue;
        open.push({ x, y, g, f: g + this.heuristic(x, y, ex, ey), parent: cur });
      }
    }
    return [];
  }

  heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  // ---- win / scoring -------------------------------------------------------

  checkWin() {
    if (this.player.x === this.exit.x && this.player.y === this.exit.y) this.endGame();
  }

  async endGame() {
    this.won = true;
    this.playSound('win');
    const elapsed = Date.now() - this.gameStartTime;
    const score = this.calcScore(elapsed);

    this.stats.gamesPlayed++;
    this.stats.gamesWon++;
    this.stats.totalScore += score;
    if (!this.stats.bestTime || elapsed < this.stats.bestTime) this.stats.bestTime = elapsed;
    if (!this.stats.bestScore || score > this.stats.bestScore) this.stats.bestScore = score;
    this.saveStats();
    this.updateHUD();
    this.checkAchievements();

    window.dispatchEvent(
      new CustomEvent('gameComplete', { detail: { difficulty: this.difficulty, score } })
    );
    this.submitToLeaderboard(score, elapsed);
    if (this.gameSessionId) this.completeGameSession();

    // Record against the signed-in account's stats / progress.
    if (window.mazeAuth && window.mazeAuth.isLoggedIn()) {
      window.mazeAuth.recordGame({
        difficulty: this.difficulty,
        score,
        timeMs: elapsed,
        moves: this.moves,
        won: true,
      });
    }

    this.showWinModal(score, elapsed);
  }

  calcScore(elapsed) {
    const base = 100;
    const timePenalty = (elapsed / 1000) * 0.1;
    const movePenalty = this.moves * 0.5;
    const hintPenalty = this.hintsUsed * this.hintCost;
    return Math.max(
      0,
      Math.round((base - timePenalty - movePenalty - hintPenalty) * this.scoreMult)
    );
  }

  currentScore() {
    if (!this.started || !this.gameStartTime) return 0;
    return this.calcScore(Date.now() - this.gameStartTime);
  }

  // ---- lifecycle -----------------------------------------------------------

  reset() {
    this.buildMaze();
    this.resetState();
    this.updateHUD();
    this.setPauseButton(false);
  }

  regenerate() {
    if (!this.started) return;
    if (this.won) {
      this.reset();
      return;
    }
    this.reset();
  }

  changeDifficulty(value) {
    if (!this.difficultyConfig[value]) return;
    this.difficulty = value;
    this.settings.difficulty = value;
    this.saveSettings();
    this.applyDifficulty();
    this.reset();
  }

  changeTheme(value) {
    if (!this.themes[value]) return;
    this.theme = value;
    this.settings.theme = value;
    this.saveSettings();
    document.body.className = value + '-theme';
  }

  toggleSound(enabled) {
    this.soundEnabled = enabled;
    this.settings.soundEnabled = enabled;
    this.saveSettings();
  }

  // ---- render loop ---------------------------------------------------------

  loop() {
    cancelAnimationFrame(this.rafId);
    const frame = () => {
      this.render();
      this.rafId = requestAnimationFrame(frame);
    };
    frame();
  }

  render() {
    const c = this.cellSize;
    // Ease the rendered player position toward its logical cell.
    this.player.rx += (this.player.x - this.player.rx) * 0.3;
    this.player.ry += (this.player.y - this.player.ry) * 0.3;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawMaze();
    this.drawTrail();
    this.drawHintPath();
    this.drawExit();
    this.drawPlayer();
    if (this.paused) this.drawOverlay('PAUSED');

    if (this.started && !this.paused && !this.won) {
      const elapsed = Date.now() - this.gameStartTime;
      const s = Math.floor(elapsed / 1000);
      this.setText(
        'timer',
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
      );
      this.setText('currentScore', this.currentScore());
    }
  }

  palette() {
    return this.themes[this.theme] || this.themes.default;
  }

  drawMaze() {
    const c = this.cellSize,
      p = this.palette();
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.ctx.fillStyle = this.maze[y][x] === 1 ? p.wall : p.floor;
        this.ctx.fillRect(x * c, y * c, c, c);
      }
    }
    this.ctx.strokeStyle = p.grid;
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.cols; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * c, 0);
      this.ctx.lineTo(x * c, this.rows * c);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.rows; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * c);
      this.ctx.lineTo(this.cols * c, y * c);
      this.ctx.stroke();
    }
  }

  drawTrail() {
    const c = this.cellSize,
      p = this.palette();
    this.ctx.fillStyle = p.trail;
    for (const key of this.trail) {
      const [x, y] = key.split(',').map(Number);
      this.ctx.fillRect(x * c + c * 0.3, y * c + c * 0.3, c * 0.4, c * 0.4);
    }
  }

  drawHintPath() {
    if (!this.showingHint || !this.hintPath.length) return;
    const c = this.cellSize;
    this.ctx.strokeStyle = '#ffd400';
    this.ctx.lineWidth = Math.max(2, c * 0.18);
    this.ctx.lineCap = 'round';
    this.ctx.setLineDash([c * 0.3, c * 0.3]);
    this.ctx.beginPath();
    this.hintPath.forEach((cell, i) => {
      const x = cell.x * c + c / 2,
        y = cell.y * c + c / 2;
      i === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
    });
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawExit() {
    const c = this.cellSize,
      p = this.palette();
    const cx = this.exit.x * c + c / 2,
      cy = this.exit.y * c + c / 2;
    const g = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, c / 1.4);
    g.addColorStop(0, p.exit);
    g.addColorStop(1, 'transparent');
    this.ctx.fillStyle = g;
    this.ctx.fillRect(this.exit.x * c, this.exit.y * c, c, c);
    this.ctx.fillStyle = p.exit;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, c * 0.28, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawPlayer() {
    const c = this.cellSize,
      p = this.palette();
    if (p.glow) {
      this.ctx.shadowBlur = 16;
      this.ctx.shadowColor = p.player;
    }
    this.ctx.fillStyle = p.player;
    this.ctx.beginPath();
    this.ctx.arc(this.player.rx * c + c / 2, this.player.ry * c + c / 2, c * 0.3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  drawOverlay(text) {
    this.ctx.fillStyle = 'rgba(0,0,0,0.65)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = `bold ${Math.floor(this.canvas.height / 10)}px Poppins, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.textAlign = 'start';
    this.ctx.textBaseline = 'alphabetic';
  }

  // Full-screen celebration confetti, drawn on a dedicated overlay canvas
  // (#winConfetti) that sits above the modal dim but below the card.
  startFx() {
    this.fx = this.fx || document.getElementById('winConfetti');
    if (!this.fx) return;
    this.fxCtx = this.fx.getContext('2d');
    this.fx.width = this.fx.clientWidth || window.innerWidth;
    this.fx.height = this.fx.clientHeight || window.innerHeight;

    const colors = ['#c6f24e', '#ff6a4d', '#45e0ff', '#ffd400', '#ffffff'];
    this.confetti = [];
    for (let i = 0; i < 180; i++) {
      this.confetti.push({
        x: Math.random() * this.fx.width,
        y: -Math.random() * this.fx.height,
        vx: (Math.random() - 0.5) * 4,
        vy: 2.5 + Math.random() * 4.5,
        w: 5 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
      });
    }

    this._fxRunning = true;
    const tick = () => {
      if (!this._fxRunning || !this.fxCtx) return;
      const ctx = this.fxCtx;
      ctx.clearRect(0, 0, this.fx.width, this.fx.height);
      for (const p of this.confetti) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.spin;
        if (p.y > this.fx.height + 20) {
          p.y = -20;
          p.x = Math.random() * this.fx.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.w / 2, p.w, p.w * 0.6);
        ctx.restore();
      }
      requestAnimationFrame(tick);
    };
    tick();
  }

  stopFx() {
    this._fxRunning = false;
    if (this.fxCtx && this.fx) this.fxCtx.clearRect(0, 0, this.fx.width, this.fx.height);
  }

  // ---- modals / HUD --------------------------------------------------------

  showWinModal(score, elapsed) {
    const s = Math.floor(elapsed / 1000);
    const time = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    this.setText('winScore', score);
    this.setText('winTime', time);
    this.setText('winMoves', this.moves);
    this.setText('winHints', this.hintsUsed);
    this.setText('winDifficulty', this.difficulty.toUpperCase());
    const modal = document.getElementById('winModal');
    if (modal) {
      modal.classList.add('show');
      this.startFx();
    } else {
      this.flashMessage(`You escaped! Score ${score} · ${time}`);
    }
  }

  hideWinModal() {
    this.stopFx();
    document.getElementById('winModal')?.classList.remove('show');
  }

  flashMessage(text) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(this._toast);
    this._toast = setTimeout(() => el.classList.remove('show'), 2000);
  }

  updateHUD() {
    this.setText('difficulty', this.difficulty.toUpperCase());
    this.setText('moves', this.moves);
    this.setText('currentScore', this.currentScore());
    this.setText('lifetimeScore', this.stats.totalScore);
    this.setText('gamesWon', this.stats.gamesWon);
    this.setText('bestTime', this.formatTime(this.stats.bestTime));
    this.updateHintUI();
  }

  formatTime(ms) {
    if (!ms) return '--:--';
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  // ---- audio ---------------------------------------------------------------

  makeBeep(freq, duration) {
    return { freq, duration };
  }

  playSound(type) {
    if (!this.soundEnabled || !this.sounds[type]) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.audioCtx = this.audioCtx || new Ctx();
      const { freq, duration } = this.sounds[type];
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.frequency.value = freq;
      osc.type = type === 'win' ? 'triangle' : 'square';
      gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
      osc.connect(gain).connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (_) {
      /* audio is best-effort */
    }
  }

  // ---- persistence ---------------------------------------------------------

  loadStats() {
    try {
      return JSON.parse(localStorage.getItem('mazeGameStats')) || {};
    } catch (_) {
      return {};
    }
  }

  saveStats() {
    const s = this.stats;
    s.gamesPlayed = s.gamesPlayed || 0;
    s.gamesWon = s.gamesWon || 0;
    s.totalScore = s.totalScore || 0;
    localStorage.setItem('mazeGameStats', JSON.stringify(s));
  }

  loadSettings() {
    try {
      return (
        JSON.parse(localStorage.getItem('mazeGameSettings')) || {
          difficulty: 'medium',
          soundEnabled: true,
          theme: 'default',
        }
      );
    } catch (_) {
      return { difficulty: 'medium', soundEnabled: true, theme: 'default' };
    }
  }

  saveSettings() {
    localStorage.setItem('mazeGameSettings', JSON.stringify(this.settings));
  }

  getPlayerId() {
    let id = localStorage.getItem('playerId');
    if (!id) {
      id = 'player_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
      localStorage.setItem('playerId', id);
    }
    return id;
  }

  // ---- optional backend (degrades silently when offline / static) ----------

  async startGameSession() {
    try {
      const res = await fetch(apiBase() + '/api/v1/games/start', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          playerId: this.getPlayerId(),
          difficulty: this.difficulty,
          mode: 'single',
        }),
      });
      if (res.ok) this.gameSessionId = (await res.json()).data?.id || null;
    } catch (_) {
      /* offline: play locally */
    }
  }

  async trackMove() {
    try {
      await fetch(`${apiBase()}/api/v1/games/${this.gameSessionId}/move`, {
        method: 'PUT',
        headers: apiHeaders(),
      });
    } catch (_) {
      /* ignore */
    }
  }

  async completeGameSession() {
    try {
      await fetch(`${apiBase()}/api/v1/games/${this.gameSessionId}/complete`, {
        method: 'PUT',
        headers: apiHeaders(),
      });
    } catch (_) {
      /* ignore */
    }
  }

  async submitToLeaderboard(score, completionTime) {
    try {
      await fetch(apiBase() + '/api/v1/leaderboard', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          playerName: localStorage.getItem('playerName') || 'Anonymous',
          score,
          completionTime,
          difficulty: this.difficulty,
          moves: this.moves,
        }),
      });
    } catch (_) {
      /* ignore */
    }
  }

  checkAchievements() {
    const got = [];
    if (this.stats.gamesWon >= 1) got.push('first_win');
    if (this.stats.gamesWon >= 100) got.push('marathon');
    if (this.difficulty === 'expert' && this.stats.gamesWon > 0) got.push('expert_conqueror');
    if (this.won && this.hintsUsed === 0) got.push('perfectionist');
    got.forEach((id) => this.unlockAchievement(id));
  }

  async unlockAchievement(achievementId) {
    // Skip ids already unlocked on this device to avoid repeat 400s.
    const key = 'mazeUnlocked_' + this.getPlayerId();
    let done;
    try {
      done = JSON.parse(localStorage.getItem(key)) || [];
    } catch (_) {
      done = [];
    }
    if (done.includes(achievementId)) return;
    try {
      const res = await fetch(apiBase() + '/api/v1/achievements/unlock', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ userId: this.getPlayerId(), achievementId }),
      });
      // 201 = newly unlocked, 400 = already unlocked server-side: cache either way.
      if (res.ok || res.status === 400) {
        done.push(achievementId);
        localStorage.setItem(key, JSON.stringify(done));
      }
    } catch (_) {
      /* ignore */
    }
  }
}

// Boot once the DOM is ready.
function bootMazeGame() {
  window.game = new MazeGame();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootMazeGame);
} else {
  bootMazeGame();
}

// Exported for unit tests (no-op in the browser).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MazeGame;
}
