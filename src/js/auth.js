/**
 * Accounts, profile, and per-user stats UI.
 *
 * Exposes window.mazeAuth used by the header, the auth modal, the profile
 * modal, and game.js (to record finished games against the signed-in user).
 * Uses the global apiBase() defined in game.js / ui-components.js.
 */

(function () {
  const TOKEN_KEY = 'mazeToken';
  const USER_KEY = 'mazeUser';

  function base() {
    return typeof apiBase === 'function' ? apiBase() : '';
  }

  function token() {
    return localStorage.getItem(TOKEN_KEY) || null;
  }

  function cachedUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null;
    } catch (_) {
      return null;
    }
  }

  function isLoggedIn() {
    return Boolean(token());
  }

  function authHeaders(extra) {
    const h = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
    if (token()) h.Authorization = 'Bearer ' + token();
    return h;
  }

  function setSession(data) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    // Tie leaderboard + achievements to the account.
    localStorage.setItem('playerName', data.user.username);
    localStorage.setItem('playerId', data.user.id);
    renderHeader();
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.setItem('playerName', 'Player');
    localStorage.removeItem('playerId'); // a fresh anon id is minted on demand
  }

  // ---- API ----------------------------------------------------------------

  async function post(path, body) {
    const res = await fetch(base() + path, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json.data;
  }

  async function register(form) {
    const data = await post('/api/v1/auth/register', form);
    setSession(data);
    return data;
  }

  async function login(form) {
    const data = await post('/api/v1/auth/login', form);
    setSession(data);
    return data;
  }

  function logout() {
    clearSession();
    renderHeader();
    if (typeof closeModal === 'function') closeModal('profileModal');
    if (window.game && typeof window.game.flashMessage === 'function') {
      window.game.flashMessage('Signed out');
    }
  }

  async function refreshProfile() {
    if (!isLoggedIn()) return null;
    const res = await fetch(base() + '/api/v1/auth/me', { headers: authHeaders() });
    if (res.status === 401) {
      clearSession();
      renderHeader();
      return null;
    }
    const json = await res.json().catch(() => ({}));
    if (json.success && json.data) {
      localStorage.setItem(USER_KEY, JSON.stringify(json.data));
      renderHeader();
      return json.data;
    }
    return null;
  }

  // Record a finished game against the user's stats (called by game.js).
  async function recordGame(result) {
    if (!isLoggedIn()) return null;
    try {
      const res = await fetch(base() + '/api/v1/users/me/games', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(result),
      });
      if (!res.ok) return null;
      const json = await res.json();
      const user = cachedUser();
      if (user && json.data) {
        user.stats = json.data;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        renderHeader();
      }
      return json.data;
    } catch (_) {
      return null;
    }
  }

  // ---- Header -------------------------------------------------------------

  function renderHeader() {
    const el = document.getElementById('authArea');
    if (!el) return;
    const user = cachedUser();
    if (isLoggedIn() && user) {
      const lvl = (user.stats && user.stats.level) || 1;
      el.innerHTML =
        `<button class="user-chip" onclick="mazeAuth.openProfile()" title="View profile">` +
        `<span class="user-avatar">${escapeText(user.username[0] || '?').toUpperCase()}</span>` +
        `<span class="user-meta"><span class="user-name">${escapeText(user.username)}</span>` +
        `<span class="user-lvl">LVL ${lvl}</span></span></button>`;
    } else {
      el.innerHTML = `<button class="signin-btn" onclick="mazeAuth.openAuth('login')">Sign in</button>`;
    }
  }

  // ---- Auth modal ---------------------------------------------------------

  let mode = 'login';

  function openAuth(which) {
    if (typeof showModal === 'function') showModal('authModal');
    tab(which || 'login');
  }

  function tab(which) {
    mode = which === 'register' ? 'register' : 'login';
    document.querySelectorAll('.auth-tab').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === mode);
    });
    const reg = mode === 'register';
    document.getElementById('fieldUsername').hidden = !reg;
    document.getElementById('fieldEmail').hidden = !reg;
    document.getElementById('fieldLogin').hidden = reg;
    document.getElementById('authTitle').textContent = reg ? 'Create account' : 'Welcome back';
    document.getElementById('authSubmit').textContent = reg ? 'Create account' : 'Log in';
    hideError();
  }

  function showError(msg) {
    const e = document.getElementById('authError');
    if (e) {
      e.textContent = msg;
      e.hidden = false;
    }
  }
  function hideError() {
    const e = document.getElementById('authError');
    if (e) e.hidden = true;
  }

  async function submit(event) {
    event.preventDefault();
    hideError();
    const btn = document.getElementById('authSubmit');
    btn.disabled = true;
    try {
      if (mode === 'register') {
        await register({
          username: document.getElementById('authUsername').value.trim(),
          email: document.getElementById('authEmail').value.trim(),
          password: document.getElementById('authPassword').value,
        });
      } else {
        await login({
          login: document.getElementById('authLogin').value.trim(),
          password: document.getElementById('authPassword').value,
        });
      }
      document.getElementById('authForm').reset();
      renderHeader();
      if (typeof closeModal === 'function') closeModal('authModal');
      if (window.game && typeof window.game.flashMessage === 'function') {
        window.game.flashMessage('Signed in as ' + cachedUser().username);
      }
    } catch (err) {
      showError(err.message);
    } finally {
      btn.disabled = false;
    }
    return false;
  }

  // ---- Profile modal ------------------------------------------------------

  async function openProfile() {
    if (typeof showModal === 'function') showModal('profileModal');
    const content = document.getElementById('profileContent');
    content.innerHTML = '<p class="loading">Loading...</p>';
    const profile = (await refreshProfile()) || cachedUser();
    if (!profile) {
      content.innerHTML = '<p class="error">Could not load profile.</p>';
      return;
    }
    content.innerHTML = renderProfile(profile);
  }

  function bar(pct, cls) {
    return `<span class="bar"><span class="bar-fill ${cls || ''}" style="width:${Math.max(0, Math.min(100, pct))}%"></span></span>`;
  }

  function fmtTime(ms) {
    if (!ms && ms !== 0) return '--';
    if (ms == null) return '--';
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function renderProfile(p) {
    const s = p.stats || {};
    const diff = s.byDifficulty || {};
    const order = ['easy', 'medium', 'hard', 'expert'];
    const rows = order
      .map((d) => {
        const x = diff[d] || { played: 0, won: 0, bestTime: null, bestScore: 0 };
        const wr = x.played ? Math.round((x.won / x.played) * 100) : 0;
        return (
          `<tr><td class="cap">${d}</td><td>${x.played}</td><td>${x.won}</td>` +
          `<td class="num">${x.bestScore || 0}</td><td class="num">${fmtTime(x.bestTime)}</td>` +
          `<td class="bar-cell">${bar(wr)}<span class="wr">${wr}%</span></td></tr>`
        );
      })
      .join('');

    const recent = (p.recentGames || [])
      .slice(0, 8)
      .map(
        (g) =>
          `<li class="${g.won ? 'win' : 'loss'}"><span class="cap">${escapeText(g.difficulty)}</span>` +
          `<span>${g.won ? 'Win' : 'Loss'}</span><span class="num">${g.score} pts</span>` +
          `<span class="num">${fmtTime(g.timeMs)}</span></li>`
      )
      .join('');

    return `
      <div class="profile-head">
        <span class="profile-avatar">${escapeText((p.username[0] || '?').toUpperCase())}</span>
        <div class="profile-id">
          <h3>${escapeText(p.username)}</h3>
          <div class="level-row">
            <span class="level-badge">LVL ${s.level || 1}</span>
            <div class="level-bar">${bar(s.levelProgress || 0, 'lime')}</div>
            <span class="level-next">${s.totalScore || 0} / ${s.nextLevelScore || 0}</span>
          </div>
        </div>
        <button class="logout-btn" onclick="mazeAuth.logout()">Sign out</button>
      </div>

      <div class="profile-grid">
        ${stat('Games', s.gamesPlayed || 0)}
        ${stat('Wins', s.gamesWon || 0)}
        ${stat('Win rate', (s.winRate || 0) + '%')}
        ${stat('Best score', s.bestScore || 0)}
        ${stat('Streak', s.currentStreak || 0)}
        ${stat('Best streak', s.bestStreak || 0)}
        ${stat('Total score', s.totalScore || 0)}
        ${stat('Time played', fmtTime(s.totalTimeMs || 0))}
      </div>

      <h4 class="profile-sub">By difficulty</h4>
      <table class="diff-table">
        <thead><tr><th>Level</th><th>Played</th><th>Won</th><th>Best</th><th>Best time</th><th>Win rate</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>

      <h4 class="profile-sub">Recent games</h4>
      ${recent ? `<ul class="recent-list">${recent}</ul>` : '<p class="no-data">No games yet — go solve a maze!</p>'}
    `;
  }

  function stat(label, value) {
    return `<div class="pstat"><span class="pstat-val">${value}</span><span class="pstat-lbl">${label}</span></div>`;
  }

  function escapeText(t) {
    const d = document.createElement('div');
    d.textContent = t == null ? '' : t;
    return d.innerHTML;
  }

  // ---- public + init ------------------------------------------------------

  window.mazeAuth = {
    token,
    user: cachedUser,
    isLoggedIn,
    authHeaders,
    register,
    login,
    logout,
    recordGame,
    refreshProfile,
    renderHeader,
    openAuth,
    openProfile,
    tab,
    submit,
  };

  document.addEventListener('DOMContentLoaded', () => {
    const fy = document.getElementById('footerYear');
    if (fy) fy.textContent = new Date().getFullYear();
    renderHeader();
    // Validate any stored token in the background.
    if (isLoggedIn()) refreshProfile();
  });
})();
