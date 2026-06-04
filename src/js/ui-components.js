/**
 * The Maze Game
 *
 * @author Son Nguyen <hoangson091104@gmail.com>
 * @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
 * @license MIT
 * @see https://github.com/hoangsonww/The-Maze-Game
 */

/**
 * UI Components and Modal Management
 */

// Backend base URL. Defaults to the deployed API; override with
// `window.MAZE_API_BASE = ''` for same-origin / local dev.
function apiBase() {
  if (typeof window !== 'undefined' && window.MAZE_API_BASE !== undefined) {
    return window.MAZE_API_BASE;
  }
  return 'https://maze-game-api.vercel.app';
}

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
window.onclick = function (event) {
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
  document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
  event.target.classList.add('active');

  await loadLeaderboard(timeframe);
}

async function loadLeaderboard(timeframe = 'all') {
  const contentDiv = document.getElementById('leaderboardContent');
  contentDiv.innerHTML = '<p class="loading">Loading leaderboard...</p>';

  try {
    const response = await fetch(
      `${apiBase()}/api/v1/leaderboard?timeframe=${timeframe}&limit=100`
    );

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
            ${data.data
              .map(
                (entry, index) => `
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
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    } else {
      contentDiv.innerHTML = '<p class="no-data">No entries yet. Be the first to score!</p>';
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    contentDiv.innerHTML =
      '<p class="error">Failed to load leaderboard. Please try again later.</p>';
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
      fetch(`${apiBase()}/api/v1/achievements`),
      fetch(`${apiBase()}/api/v1/achievements/user/${playerId}`),
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
          <p>Unlocked: ${achievements.filter((a) => a.unlocked).length} / ${achievements.length}</p>
        </div>
        <div class="achievements-grid">
          ${achievements
            .map(
              (achievement) => `
            <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
              <div class="achievement-icon">${achievement.icon}</div>
              <div class="achievement-info">
                <h4>${achievement.name}</h4>
                <p>${achievement.description}</p>
                <span class="achievement-points">${achievement.points} pts</span>
                ${
                  achievement.unlocked
                    ? `<span class="achievement-date">Unlocked: ${formatDate(achievement.unlockedAt)}</span>`
                    : '<span class="achievement-locked">🔒 Locked</span>'
                }
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading achievements:', error);
    contentDiv.innerHTML =
      '<p class="error">Failed to load achievements. Please try again later.</p>';
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

// Player Name — persisted, editable in Settings (used for leaderboard entries).
function setupPlayerName() {
  if (!localStorage.getItem('playerName')) {
    localStorage.setItem('playerName', 'Player');
  }
  const input = document.getElementById('playerName');
  if (input) {
    input.value = localStorage.getItem('playerName');
    input.addEventListener('input', () => {
      const name = input.value.trim().substring(0, 20) || 'Player';
      localStorage.setItem('playerName', name);
    });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  setupPlayerName();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach((modal) => {
        modal.style.display = 'none';
      });
      document.body.style.overflow = 'auto';
    }
  });
});

// Service Worker Registration for PWA.
// Registered with a relative URL so it works at the domain root (Render) and
// under a sub-path (GitHub Pages) alike.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = new URL('service-worker.js', document.baseURI).toString();
    navigator.serviceWorker
      .register(swUrl, { scope: './' })
      .then((registration) => {
        console.log('ServiceWorker registered:', registration.scope);

        // When a new worker is found, activate it immediately so updates land
        // on the next load without the user getting stuck on a stale version.
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage('SKIP_WAITING');
            }
          });
        });
      })
      .catch((err) => {
        console.log('ServiceWorker registration failed:', err);
      });

    // Reload once when a new service worker takes control (after SKIP_WAITING).
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}

// ----- Installable PWA: capture the prompt and surface an Install button -----
(function setupInstallPrompt() {
  let deferredPrompt = null;

  const makeButton = () => {
    let btn = document.getElementById('installAppBtn');
    if (btn) return btn;
    btn = document.createElement('button');
    btn.id = 'installAppBtn';
    btn.type = 'button';
    btn.className = 'install-btn';
    btn.hidden = true;
    btn.setAttribute('aria-label', 'Install The Maze Game');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"/></svg><span>Install</span>';
    const slot = document.querySelector('.header-meta') || document.body;
    slot.insertBefore(btn, slot.firstChild);
    btn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (typeof trackEvent === 'function') trackEvent('pwa', 'install_prompt', outcome);
      deferredPrompt = null;
      btn.hidden = true;
    });
    return btn;
  };

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // suppress the mini-infobar; we drive our own button
    deferredPrompt = e;
    const btn = makeButton();
    btn.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const btn = document.getElementById('installAppBtn');
    if (btn) btn.hidden = true;
    if (typeof trackEvent === 'function') trackEvent('pwa', 'installed', 'appinstalled');
  });
})();

// Analytics Event Tracking
function trackEvent(category, action, label, value) {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Track game events (game.js dispatches these on window)
window.addEventListener('gameComplete', (e) => {
  trackEvent('Game', 'complete', e.detail.difficulty, e.detail.score);
});

window.addEventListener('hintUsed', (e) => {
  trackEvent('Game', 'hint_used', e.detail.difficulty);
});
