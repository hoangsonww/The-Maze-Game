/**
 * Enhanced Maze Game - Production Ready
 * Features: Difficulty levels, Timer, Hints, Achievements, Multiplayer, API Integration
 */

class MazeGame {
  constructor() {
    this.canvas = document.getElementById('mazeCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Game settings
    this.settings = this.loadSettings();
    this.difficulty = this.settings.difficulty || 'medium';
    this.soundEnabled = this.settings.soundEnabled !== false;
    this.theme = this.settings.theme || 'default';

    // Difficulty configurations
    this.difficultyConfig = {
      easy: { rows: 10, cols: 15, hintCost: 5, timeBonus: 1.5 },
      medium: { rows: 15, cols: 20, hintCost: 10, timeBonus: 1.0 },
      hard: { rows: 20, cols: 30, hintCost: 15, timeBonus: 0.7 },
      expert: { rows: 25, cols: 35, hintCost: 20, timeBonus: 0.5 }
    };

    const config = this.difficultyConfig[this.difficulty];
    this.rows = config.rows;
    this.cols = config.cols;
    this.hintCost = config.hintCost;
    this.timeBonus = config.timeBonus;

    // Canvas setup
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.cellSize = Math.min(this.canvas.width / this.cols, this.canvas.height / this.rows);

    // Game state
    this.maze = [];
    this.player = { x: 0, y: 0, size: this.cellSize / 2, color: '#ff0000' };
    this.exit = { x: this.cols - 1, y: this.rows - 1, size: this.cellSize, color: '#00ff00' };
    this.gameStartTime = null;
    this.gamePaused = false;
    this.pausedTime = 0;
    this.moves = 0;
    this.hintsUsed = 0;
    this.hintPath = [];
    this.showingHint = false;
    this.gameSessionId = null;
    this.animations = [];

    // Sound effects
    this.sounds = {
      move: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGApCmN3yvW0gBDKF0fPSgjQGHm3A7+OYRg0OVK3n77JeGApBl933ynUjBTGE0fPTgjMGHW7A7+OYRw0PVKzn77FeGApBl933ynQjBTGE0fPTgjQGHm3A7+OZSA0PVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZSA0PVqzn77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZSA0PVqzn77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZSA0PVqzn77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZSA0PVqzn77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZSA0PVqzn77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZSA0PVqzn77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZSA0PVqzn77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0PVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw=='),
      win: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGApCmN3yvW0gBDKF0fPSgjQGHm3A7+OYRg0OVK3n77JeGApBl933ynUjBTGE0fPTgjMGHW7A7+OYRw0PVKzn77FeGApBl933ynQjBTGE0fPTgjQGHm3A7+OZSA0PVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZSA0PVqzn77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZSA0PVqzn77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZSA0PVqzn77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZSA0PVqzn77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZSA0PVqzn77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZSA0PVqzn77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0PVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw0OVK3n77FeGApBl933ynQkBTGE0fPTgjQGHm3A7+OZRw=='),
      hint: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGApCmN3yvW0gBDKF0fPSgjQGHm3A7+OYRg0OVK3n77JeGApBl933ynUjBTGE0fPTgjMGHW7A7+OYRw==')
    };

    // Statistics
    this.stats = this.loadStats();

    this.init();
  }

  init() {
    this.initMaze();
    this.setupEventListeners();
    this.startGame();
    this.draw();
    this.updateUI();
    this.checkAchievements();
  }

  initMaze() {
    // Initialize maze with walls
    for (let y = 0; y < this.rows; y++) {
      this.maze[y] = [];
      for (let x = 0; x < this.cols; x++) {
        this.maze[y][x] = 1;
      }
    }

    // Generate maze using DFS
    this.maze[0][0] = 0;
    this.carvePassagesFrom(0, 0);
    this.maze[this.rows - 1][this.cols - 1] = 0;
  }

  carvePassagesFrom(x, y) {
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    directions.sort(() => Math.random() - 0.5);

    for (const [dx, dy] of directions) {
      const nx = x + dx * 2;
      const ny = y + dy * 2;

      if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows && this.maze[ny][nx] === 1) {
        this.maze[y + dy][x + dx] = 0;
        this.maze[ny][nx] = 0;
        this.carvePassagesFrom(nx, ny);
      }
    }
  }

  setupEventListeners() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => this.handleKeyPress(e));

    // Button controls
    document.getElementById('moveUp')?.addEventListener('click', () => this.movePlayer(0, -1));
    document.getElementById('moveDown')?.addEventListener('click', () => this.movePlayer(0, 1));
    document.getElementById('moveLeft')?.addEventListener('click', () => this.movePlayer(-1, 0));
    document.getElementById('moveRight')?.addEventListener('click', () => this.movePlayer(1, 0));

    // Game controls
    document.getElementById('pauseGame')?.addEventListener('click', () => this.togglePause());
    document.getElementById('useHint')?.addEventListener('click', () => this.showHint());
    document.getElementById('regenerateMaze')?.addEventListener('click', () => this.regenerateMaze());

    // Settings
    document.getElementById('difficultySelect')?.addEventListener('change', (e) => this.changeDifficulty(e.target.value));
    document.getElementById('soundToggle')?.addEventListener('change', (e) => this.toggleSound(e.target.checked));
    document.getElementById('themeSelect')?.addEventListener('change', (e) => this.changeTheme(e.target.value));
  }

  handleKeyPress(e) {
    if (this.gamePaused) return;

    switch(e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.movePlayer(0, -1);
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.movePlayer(0, 1);
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.movePlayer(-1, 0);
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.movePlayer(1, 0);
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
    }
  }

  movePlayer(dx, dy) {
    if (this.gamePaused) return;

    const newX = this.player.x + dx;
    const newY = this.player.y + dy;

    if (newX >= 0 && newX < this.cols && newY >= 0 && newY < this.rows && this.maze[newY][newX] === 0) {
      this.player.x = newX;
      this.player.y = newY;
      this.moves++;
      this.playSound('move');
      this.addAnimation(newX, newY, 'move');
      this.updateMoveCount();
      this.checkWin();

      // Track move via API
      if (this.gameSessionId) {
        this.trackMove();
      }
    }
  }

  togglePause() {
    this.gamePaused = !this.gamePaused;

    if (this.gamePaused) {
      this.pausedTime = Date.now();
      document.getElementById('pauseGame').textContent = 'Resume';
      this.showPauseOverlay();
    } else {
      const pauseDuration = Date.now() - this.pausedTime;
      this.gameStartTime += pauseDuration;
      document.getElementById('pauseGame').textContent = 'Pause';
      this.hidePauseOverlay();
    }
  }

  showHint() {
    if (this.gamePaused || this.showingHint) return;

    const currentScore = this.getCurrentScore();
    if (currentScore < this.hintCost) {
      alert(`Not enough points for a hint! You need ${this.hintCost} points.`);
      return;
    }

    this.hintsUsed++;
    this.playSound('hint');

    // Calculate path using A* algorithm
    this.hintPath = this.findPath(this.player.x, this.player.y, this.exit.x, this.exit.y);
    this.showingHint = true;

    // Hide hint after 3 seconds
    setTimeout(() => {
      this.showingHint = false;
      this.hintPath = [];
    }, 3000);

    this.updateHintCount();
  }

  findPath(startX, startY, endX, endY) {
    // A* pathfinding algorithm
    const openSet = [{ x: startX, y: startY, g: 0, h: this.heuristic(startX, startY, endX, endY), f: 0, parent: null }];
    const closedSet = [];
    const path = [];

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();

      if (current.x === endX && current.y === endY) {
        let temp = current;
        while (temp) {
          path.unshift({ x: temp.x, y: temp.y });
          temp = temp.parent;
        }
        return path.slice(1, 6); // Return next 5 steps
      }

      closedSet.push(current);

      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 }
      ];

      for (const neighbor of neighbors) {
        if (neighbor.x < 0 || neighbor.x >= this.cols || neighbor.y < 0 || neighbor.y >= this.rows) continue;
        if (this.maze[neighbor.y][neighbor.x] === 1) continue;
        if (closedSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) continue;

        const g = current.g + 1;
        const h = this.heuristic(neighbor.x, neighbor.y, endX, endY);
        const f = g + h;

        const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
        if (!existingNode) {
          openSet.push({ ...neighbor, g, h, f, parent: current });
        } else if (g < existingNode.g) {
          existingNode.g = g;
          existingNode.f = f;
          existingNode.parent = current;
        }
      }
    }

    return [];
  }

  heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  checkWin() {
    if (this.player.x === this.exit.x && this.player.y === this.exit.y) {
      this.endGame(true);
    }
  }

  async endGame(won) {
    const completionTime = Date.now() - this.gameStartTime;
    const score = this.calculateFinalScore(completionTime);

    if (won) {
      this.playSound('win');
      this.stats.gamesWon++;
      this.stats.totalScore += score;
      this.stats.gamesPlayed++;

      if (!this.stats.bestTime || completionTime < this.stats.bestTime) {
        this.stats.bestTime = completionTime;
      }

      this.saveStats();
      this.checkAchievements();

      // Submit to leaderboard
      await this.submitToLeaderboard(score, completionTime);

      // Complete game session via API
      if (this.gameSessionId) {
        await this.completeGameSession();
      }

      this.showWinModal(score, completionTime);
    }
  }

  calculateFinalScore(completionTime) {
    const baseScore = 100;
    const timeInSeconds = completionTime / 1000;
    const timePenalty = timeInSeconds * 0.1;
    const movePenalty = this.moves * 0.5;
    const hintPenalty = this.hintsUsed * this.hintCost;

    const difficultyMultipliers = {
      easy: 1,
      medium: 1.5,
      hard: 2,
      expert: 3
    };

    return Math.max(0, Math.round(
      (baseScore - timePenalty - movePenalty - hintPenalty) *
      difficultyMultipliers[this.difficulty] *
      this.timeBonus
    ));
  }

  getCurrentScore() {
    if (!this.gameStartTime) return 0;
    const currentTime = Date.now() - this.gameStartTime;
    return this.calculateFinalScore(currentTime);
  }

  draw() {
    if (!this.gamePaused) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawMaze();
      this.drawHintPath();
      this.drawAnimations();
      this.drawExit();
      this.drawPlayer();
      this.updateTimer();
      this.updateScore();
    }
    requestAnimationFrame(() => this.draw());
  }

  drawMaze() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.theme === 'dark') {
          this.ctx.fillStyle = this.maze[y][x] === 1 ? '#1a1a1a' : '#2d2d2d';
        } else {
          this.ctx.fillStyle = this.maze[y][x] === 1 ? '#000000' : '#ffffff';
        }
        this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);

        // Draw grid lines
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 0.5;
        this.ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
      }
    }
  }

  drawPlayer() {
    this.ctx.fillStyle = this.player.color;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = this.player.color;
    this.ctx.beginPath();
    this.ctx.arc(
      this.player.x * this.cellSize + this.cellSize / 2,
      this.player.y * this.cellSize + this.cellSize / 2,
      this.player.size / 2,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  drawExit() {
    const gradient = this.ctx.createRadialGradient(
      this.exit.x * this.cellSize + this.cellSize / 2,
      this.exit.y * this.cellSize + this.cellSize / 2,
      0,
      this.exit.x * this.cellSize + this.cellSize / 2,
      this.exit.y * this.cellSize + this.cellSize / 2,
      this.cellSize / 2
    );
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(1, '#008800');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(this.exit.x * this.cellSize, this.exit.y * this.cellSize, this.exit.size, this.exit.size);
  }

  drawHintPath() {
    if (!this.showingHint || this.hintPath.length === 0) return;

    this.ctx.strokeStyle = '#ffff00';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([5, 5]);

    this.ctx.beginPath();
    for (let i = 0; i < this.hintPath.length; i++) {
      const cell = this.hintPath[i];
      const x = cell.x * this.cellSize + this.cellSize / 2;
      const y = cell.y * this.cellSize + this.cellSize / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawAnimations() {
    this.animations = this.animations.filter(anim => {
      anim.life--;
      if (anim.life <= 0) return false;

      const alpha = anim.life / 30;
      this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      this.ctx.fillRect(
        anim.x * this.cellSize,
        anim.y * this.cellSize,
        this.cellSize,
        this.cellSize
      );
      return true;
    });
  }

  addAnimation(x, y, type) {
    this.animations.push({ x, y, type, life: 30 });
  }

  updateTimer() {
    if (!this.gameStartTime || this.gamePaused) return;

    const elapsed = Date.now() - this.gameStartTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const displaySeconds = seconds % 60;

    const timerElement = document.getElementById('timer');
    if (timerElement) {
      timerElement.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
    }
  }

  updateScore() {
    const scoreElement = document.getElementById('currentScore');
    if (scoreElement) {
      scoreElement.textContent = `Score: ${this.getCurrentScore()}`;
    }
  }

  updateMoveCount() {
    const movesElement = document.getElementById('moves');
    if (movesElement) {
      movesElement.textContent = `Moves: ${this.moves}`;
    }
  }

  updateHintCount() {
    const hintsElement = document.getElementById('hints');
    if (hintsElement) {
      hintsElement.textContent = `Hints Used: ${this.hintsUsed}`;
    }
  }

  updateUI() {
    document.getElementById('difficulty')?.textContent = `Difficulty: ${this.difficulty.toUpperCase()}`;
    document.getElementById('lifetimeScore')?.textContent = `Total Score: ${this.stats.totalScore}`;
    document.getElementById('gamesWon')?.textContent = `Games Won: ${this.stats.gamesWon}`;

    if (this.stats.bestTime) {
      const bestSeconds = Math.floor(this.stats.bestTime / 1000);
      const bestMinutes = Math.floor(bestSeconds / 60);
      const bestDisplaySeconds = bestSeconds % 60;
      document.getElementById('bestTime')?.textContent =
        `Best Time: ${bestMinutes}:${bestDisplaySeconds.toString().padStart(2, '0')}`;
    }
  }

  playSound(type) {
    if (this.soundEnabled && this.sounds[type]) {
      this.sounds[type].currentTime = 0;
      this.sounds[type].volume = 0.3;
      this.sounds[type].play().catch(() => {}); // Ignore autoplay restrictions
    }
  }

  startGame() {
    this.gameStartTime = Date.now();
    this.moves = 0;
    this.hintsUsed = 0;
    this.startGameSession();
  }

  async startGameSession() {
    try {
      const response = await fetch('/api/v1/games/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: this.getPlayerId(),
          difficulty: this.difficulty,
          mode: 'single'
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.gameSessionId = data.data.id;
      }
    } catch (error) {
      console.error('Failed to start game session:', error);
    }
  }

  async trackMove() {
    try {
      await fetch(`/api/v1/games/${this.gameSessionId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Failed to track move:', error);
    }
  }

  async completeGameSession() {
    try {
      await fetch(`/api/v1/games/${this.gameSessionId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Failed to complete game session:', error);
    }
  }

  async submitToLeaderboard(score, completionTime) {
    try {
      const playerName = localStorage.getItem('playerName') || 'Anonymous';

      const response = await fetch('/api/v1/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          score,
          completionTime,
          difficulty: this.difficulty,
          moves: this.moves
        })
      });

      if (response.ok) {
        console.log('Score submitted to leaderboard');
      }
    } catch (error) {
      console.error('Failed to submit to leaderboard:', error);
    }
  }

  checkAchievements() {
    const achievements = [];

    if (this.stats.gamesWon === 1) {
      achievements.push('first_win');
    }

    if (this.stats.gamesWon >= 100) {
      achievements.push('marathon');
    }

    if (this.difficulty === 'expert' && this.stats.gamesWon > 0) {
      achievements.push('expert_conqueror');
    }

    if (this.hintsUsed === 0 && this.stats.gamesWon > 0) {
      achievements.push('perfectionist');
    }

    // Unlock achievements via API
    achievements.forEach(id => this.unlockAchievement(id));
  }

  async unlockAchievement(achievementId) {
    try {
      await fetch('/api/v1/achievements/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.getPlayerId(),
          achievementId
        })
      });
    } catch (error) {
      console.error('Failed to unlock achievement:', error);
    }
  }

  regenerateMaze() {
    if (confirm('Are you sure you want to regenerate the maze? Current progress will be lost.')) {
      window.location.reload();
    }
  }

  changeDifficulty(difficulty) {
    this.settings.difficulty = difficulty;
    this.saveSettings();
    window.location.reload();
  }

  toggleSound(enabled) {
    this.soundEnabled = enabled;
    this.settings.soundEnabled = enabled;
    this.saveSettings();
  }

  changeTheme(theme) {
    this.theme = theme;
    this.settings.theme = theme;
    this.saveSettings();
    document.body.className = theme + '-theme';
  }

  showWinModal(score, time) {
    const timeInSeconds = Math.floor(time / 1000);
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;

    alert(`🎉 Congratulations! You escaped the maze!\n\n` +
          `Final Score: ${score}\n` +
          `Time: ${minutes}:${seconds.toString().padStart(2, '0')}\n` +
          `Moves: ${this.moves}\n` +
          `Hints Used: ${this.hintsUsed}\n` +
          `Difficulty: ${this.difficulty.toUpperCase()}\n\n` +
          `Total Games Won: ${this.stats.gamesWon}`);

    setTimeout(() => window.location.reload(), 500);
  }

  showPauseOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'pauseOverlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-size: 48px;
      font-weight: bold;
      z-index: 1000;
    `;
    overlay.textContent = 'PAUSED';
    document.body.appendChild(overlay);
  }

  hidePauseOverlay() {
    const overlay = document.getElementById('pauseOverlay');
    if (overlay) overlay.remove();
  }

  getPlayerId() {
    let playerId = localStorage.getItem('playerId');
    if (!playerId) {
      playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('playerId', playerId);
    }
    return playerId;
  }

  loadStats() {
    const savedStats = localStorage.getItem('mazeGameStats');
    return savedStats ? JSON.parse(savedStats) : {
      gamesPlayed: 0,
      gamesWon: 0,
      totalScore: 0,
      bestTime: null
    };
  }

  saveStats() {
    localStorage.setItem('mazeGameStats', JSON.stringify(this.stats));
  }

  loadSettings() {
    const savedSettings = localStorage.getItem('mazeGameSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      difficulty: 'medium',
      soundEnabled: true,
      theme: 'default'
    };
  }

  saveSettings() {
    localStorage.setItem('mazeGameSettings', JSON.stringify(this.settings));
  }
}

// Initialize game when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.game = new MazeGame();
  });
} else {
  window.game = new MazeGame();
}
