/**
 * UI Components and Modal Management
 */

// Modal Management
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Close modal when clicking outside
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
};

// Leaderboard Functions
let currentLeaderboardTab = 'all';

async function showLeaderboard() {
  showModal('leaderboardModal');
  await loadLeaderboard(currentLeaderboardTab);
}

async function showLeaderboardTab(timeframe) {
  currentLeaderboardTab = timeframe;

  // Update active tab
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  await loadLeaderboard(timeframe);
}

async function loadLeaderboard(timeframe = 'all') {
  const contentDiv = document.getElementById('leaderboardContent');
  contentDiv.innerHTML = '<p class="loading">Loading leaderboard...</p>';

  try {
    const response = await fetch(`/api/v1/leaderboard?timeframe=${timeframe}&limit=100`);

    if (!response.ok) {
      throw new Error('Failed to load leaderboard');
    }

    const data = await response.json();

    if (data.success && data.data.length > 0) {
      contentDiv.innerHTML = `
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
              <th>Time</th>
              <th>Difficulty</th>
              <th>Moves</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${data.data.map((entry, index) => `
              <tr class="${index < 3 ? 'top-rank rank-' + (index + 1) : ''}">
                <td class="rank-cell">
                  ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </td>
                <td class="player-cell">${escapeHtml(entry.playerName)}</td>
                <td class="score-cell">${entry.score}</td>
                <td class="time-cell">${formatTime(entry.completionTime)}</td>
                <td class="difficulty-cell">
                  <span class="difficulty-badge ${entry.difficulty}">${entry.difficulty.toUpperCase()}</span>
                </td>
                <td>${entry.moves}</td>
                <td class="date-cell">${formatDate(entry.timestamp)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      contentDiv.innerHTML = '<p class="no-data">No entries yet. Be the first to score!</p>';
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    contentDiv.innerHTML = '<p class="error">Failed to load leaderboard. Please try again later.</p>';
  }
}

// Achievements Functions
async function showAchievements() {
  showModal('achievementsModal');
  await loadAchievements();
}

async function loadAchievements() {
  const contentDiv = document.getElementById('achievementsContent');
  contentDiv.innerHTML = '<p class="loading">Loading achievements...</p>';

  try {
    const playerId = getPlayerId();
    const [allResponse, userResponse] = await Promise.all([
      fetch('/api/v1/achievements'),
      fetch(`/api/v1/achievements/user/${playerId}`)
    ]);

    if (!allResponse.ok || !userResponse.ok) {
      throw new Error('Failed to load achievements');
    }

    const allData = await allResponse.json();
    const userData = await userResponse.json();

    if (allData.success) {
      const achievements = userData.data?.achievements || allData.data;
      const totalPoints = userData.data?.totalPoints || 0;

      contentDiv.innerHTML = `
        <div class="achievements-header">
          <h3>Total Achievement Points: ${totalPoints}</h3>
          <p>Unlocked: ${achievements.filter(a => a.unlocked).length} / ${achievements.length}</p>
        </div>
        <div class="achievements-grid">
          ${achievements.map(achievement => `
            <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
              <div class="achievement-icon">${achievement.icon}</div>
              <div class="achievement-info">
                <h4>${achievement.name}</h4>
                <p>${achievement.description}</p>
                <span class="achievement-points">${achievement.points} pts</span>
                ${achievement.unlocked ?
                  `<span class="achievement-date">Unlocked: ${formatDate(achievement.unlockedAt)}</span>` :
                  '<span class="achievement-locked">🔒 Locked</span>'
                }
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading achievements:', error);
    contentDiv.innerHTML = '<p class="error">Failed to load achievements. Please try again later.</p>';
  }
}

// Help Modal
function showHelp() {
  showModal('helpModal');
}

// Utility Functions
function formatTime(milliseconds) {
  if (!milliseconds) return '--:--';
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDate(timestamp) {
  if (!timestamp) return '--';
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60);
    return `${minutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 168) {
    return `${Math.floor(diffInHours / 24)}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getPlayerId() {
  let playerId = localStorage.getItem('playerId');
  if (!playerId) {
    playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('playerId', playerId);
  }
  return playerId;
}

// Player Name Prompt
function setupPlayerName() {
  let playerName = localStorage.getItem('playerName');
  if (!playerName) {
    playerName = prompt('Enter your player name for the leaderboard:', 'Anonymous');
    if (playerName && playerName.trim()) {
      localStorage.setItem('playerName', playerName.trim().substring(0, 20));
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  setupPlayerName();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
      });
      document.body.style.overflow = 'auto';
    }
  });
});

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registered:', registration.scope);
      })
      .catch(err => {
        console.log('ServiceWorker registration failed:', err);
      });
  });
}

// Analytics Event Tracking
function trackEvent(category, action, label, value) {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      'event_category': category,
      'event_label': label,
      'value': value
    });
  }
}

// Track game events
if (window.game) {
  // Track game start
  trackEvent('Game', 'start', window.game.difficulty);

  // Track game completion (add this to the game's endGame method)
  window.addEventListener('gameComplete', (e) => {
    trackEvent('Game', 'complete', e.detail.difficulty, e.detail.score);
  });

  // Track hint usage
  window.addEventListener('hintUsed', () => {
    trackEvent('Game', 'hint_used', window.game.difficulty);
  });
}
