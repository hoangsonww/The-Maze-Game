/**
 * The Maze Game
 *
 * @author Son Nguyen <hoangson091104@gmail.com>
 * @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
 * @license MIT
 * @see https://github.com/hoangsonww/The-Maze-Game
 */

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
  const EYE =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';

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
    try {
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
    } catch (_) {
      // Network error: fall back to the cached profile.
      return null;
    }
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
    syncIdentityUI();
  }

  // The Settings "Leaderboard name" field reflects the anonymous name (editable)
  // or the account username (read-only — edit it in the profile).
  function syncIdentityUI() {
    const input = document.getElementById('playerName');
    if (!input) return;
    if (isLoggedIn()) {
      const u = cachedUser();
      input.value = u ? u.username : '';
      input.disabled = true;
      input.title = 'Manage your username in your profile';
    } else {
      input.disabled = false;
      input.title = '';
      input.value = localStorage.getItem('playerName') || '';
    }
  }

  // ---- Guest name (anonymous players) -------------------------------------

  // A distinct fallback name so empty/guest entries don't all collide as "Player".
  function randomGuestName() {
    return 'Guest' + Math.floor(1000 + Math.random() * 9000);
  }

  function maybeAskName() {
    if (isLoggedIn() || localStorage.getItem('nameChosen')) return;
    const cur = localStorage.getItem('playerName');
    const input = document.getElementById('guestName');
    if (input && cur && cur !== 'Player') input.value = cur;
    if (typeof showModal === 'function') showModal('nameModal');
  }

  function commitGuestName(name) {
    localStorage.setItem('playerName', name);
    localStorage.setItem('nameChosen', '1');
    syncIdentityUI();
    if (typeof closeModal === 'function') closeModal('nameModal');
    if (window.game && typeof window.game.flashMessage === 'function') {
      window.game.flashMessage('Playing as ' + name);
    }
  }

  function saveGuestName(event) {
    if (event) event.preventDefault();
    // No name entered → assign a generated guest name (never blank).
    const name =
      (document.getElementById('guestName').value || '').trim().substring(0, 20) ||
      randomGuestName();
    commitGuestName(name);
    return false;
  }

  function skipGuestName() {
    commitGuestName(randomGuestName());
  }

  // ---- Auth modal ---------------------------------------------------------

  let mode = 'login'; // login | register | reset1 | reset2
  const resetCreds = { username: '', email: '' };

  function openAuth(which) {
    if (typeof showModal === 'function') showModal('authModal');
    tab(which || 'login');
  }

  function show(id, visible) {
    const el = document.getElementById(id);
    if (el) el.hidden = !visible;
  }

  function tab(which) {
    mode = ['login', 'register', 'reset1', 'reset2'].includes(which) ? which : 'login';
    document.querySelectorAll('.auth-tab').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === mode);
    });
    show('authTabs', mode === 'login' || mode === 'register');

    show('fieldUsername', mode === 'register' || mode === 'reset1');
    show('fieldEmail', mode === 'register' || mode === 'reset1');
    show('fieldLogin', mode === 'login');
    show('fieldPassword', mode === 'login' || mode === 'register' || mode === 'reset2');
    show('fieldPasswordConfirm', mode === 'register' || mode === 'reset2');
    show('authForgot', mode === 'login');
    show('authBack', mode === 'reset1' || mode === 'reset2');

    const titles = {
      login: 'Welcome back',
      register: 'Create account',
      reset1: 'Reset password',
      reset2: 'Set a new password',
    };
    const submits = {
      login: 'Log in',
      register: 'Create account',
      reset1: 'Verify account',
      reset2: 'Set new password',
    };
    document.getElementById('authTitle').textContent = titles[mode];
    document.getElementById('authSubmit').textContent = submits[mode];

    ['authPassword', 'authPasswordConfirm'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    resetPasswordToggles();
    hideError();
    return false;
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

  function finishSignedIn(msg) {
    document.getElementById('authForm').reset();
    resetPasswordToggles();
    renderHeader();
    if (typeof closeModal === 'function') closeModal('authModal');
    if (window.game && typeof window.game.flashMessage === 'function') {
      window.game.flashMessage(msg || 'Signed in as ' + cachedUser().username);
    }
  }

  async function submit(event) {
    event.preventDefault();
    hideError();
    const btn = document.getElementById('authSubmit');
    btn.disabled = true;
    const val = (id) => (document.getElementById(id).value || '').trim();
    const pw = () => document.getElementById('authPassword').value;
    const pwc = () => document.getElementById('authPasswordConfirm').value;
    try {
      if (mode === 'login') {
        await login({ login: val('authLogin'), password: pw() });
        finishSignedIn();
      } else if (mode === 'register') {
        if (pw().length < 6) throw new Error('Password must be at least 6 characters');
        if (pw() !== pwc()) throw new Error('Passwords do not match');
        await register({ username: val('authUsername'), email: val('authEmail'), password: pw() });
        finishSignedIn();
      } else if (mode === 'reset1') {
        await post('/api/v1/auth/reset/verify', {
          username: val('authUsername'),
          email: val('authEmail'),
        });
        resetCreds.username = val('authUsername');
        resetCreds.email = val('authEmail');
        tab('reset2');
      } else if (mode === 'reset2') {
        if (pw().length < 6) throw new Error('Password must be at least 6 characters');
        if (pw() !== pwc()) throw new Error('Passwords do not match');
        const data = await post('/api/v1/auth/reset', {
          username: resetCreds.username,
          email: resetCreds.email,
          password: pw(),
        });
        setSession(data);
        finishSignedIn('Password updated — signed in');
      }
    } catch (err) {
      showError(err.message);
    } finally {
      btn.disabled = false;
    }
    return false;
  }

  // ---- Password show/hide toggles -----------------------------------------

  function initPasswordToggles() {
    document.querySelectorAll('.pw-toggle').forEach((btn) => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const reveal = input.type === 'password';
        input.type = reveal ? 'text' : 'password';
        btn.classList.toggle('revealed', reveal);
        btn.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
      });
    });
  }

  function resetPasswordToggles() {
    document.querySelectorAll('.pw-toggle').forEach((btn) => {
      btn.classList.remove('revealed');
      btn.setAttribute('aria-label', 'Show password');
      const input = document.getElementById(btn.dataset.target);
      if (input) input.type = 'password';
    });
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
    initPasswordToggles();
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
      <div class="diff-table-wrap">
        <table class="diff-table">
          <thead><tr><th>Level</th><th>Played</th><th>Won</th><th>Best</th><th>Best time</th><th>Win rate</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <h4 class="profile-sub">Recent games</h4>
      ${recent ? `<ul class="recent-list">${recent}</ul>` : '<p class="no-data">No games yet — go solve a maze!</p>'}

      <h4 class="profile-sub">Account</h4>
      <div class="edit-grid">
        <div class="field">
          <label for="editUsername">Username</label>
          <input type="text" id="editUsername" class="setting-control" maxlength="20" value="${escapeText(p.username)}" />
        </div>
        <div class="field">
          <label for="editEmail">Email</label>
          <input type="email" id="editEmail" class="setting-control" value="${escapeText(p.email || '')}" />
        </div>
      </div>
      <button class="auth-submit slim" onclick="mazeAuth.saveProfile()">Save changes</button>

      <h4 class="profile-sub">Change password</h4>
      <div class="edit-grid">
        <div class="field">
          <label for="editPassword">New password</label>
          <div class="password-field">
            <input type="password" id="editPassword" class="setting-control" placeholder="••••••••" />
            <button type="button" class="pw-toggle" data-target="editPassword" aria-label="Show password">${EYE}</button>
          </div>
        </div>
        <div class="field">
          <label for="editPasswordConfirm">Confirm</label>
          <div class="password-field">
            <input type="password" id="editPasswordConfirm" class="setting-control" placeholder="••••••••" />
            <button type="button" class="pw-toggle" data-target="editPasswordConfirm" aria-label="Show password">${EYE}</button>
          </div>
        </div>
      </div>
      <button class="auth-submit slim" onclick="mazeAuth.changePassword()">Update password</button>
      <p id="profileMsg" class="profile-msg" hidden></p>

      <div class="profile-footer">
        <button class="logout-btn" onclick="mazeAuth.logout()">Sign out</button>
      </div>
    `;
  }

  function profileMsg(msg, isError) {
    const el = document.getElementById('profileMsg');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    el.classList.toggle('error', !!isError);
  }

  async function saveProfile() {
    const username = (document.getElementById('editUsername').value || '').trim();
    const email = (document.getElementById('editEmail').value || '').trim();
    try {
      const res = await fetch(base() + '/api/v1/users/me', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ username, email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');
      localStorage.setItem(USER_KEY, JSON.stringify(json.data));
      localStorage.setItem('playerName', json.data.username);
      localStorage.setItem('playerId', json.data.id);
      renderHeader();
      document.getElementById('profileContent').innerHTML = renderProfile(json.data);
      initPasswordToggles();
      profileMsg('Profile updated', false);
    } catch (err) {
      profileMsg(err.message, true);
    }
  }

  async function changePassword() {
    const pw = document.getElementById('editPassword').value;
    const pwc = document.getElementById('editPasswordConfirm').value;
    if (pw.length < 6) return profileMsg('Password must be at least 6 characters', true);
    if (pw !== pwc) return profileMsg('Passwords do not match', true);
    try {
      const res = await fetch(base() + '/api/v1/users/me/password', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ password: pw }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      document.getElementById('editPassword').value = '';
      document.getElementById('editPasswordConfirm').value = '';
      resetPasswordToggles();
      profileMsg('Password updated', false);
    } catch (err) {
      profileMsg(err.message, true);
    }
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
    saveProfile,
    changePassword,
    saveGuestName,
    skipGuestName,
  };

  document.addEventListener('DOMContentLoaded', () => {
    const fy = document.getElementById('footerYear');
    if (fy) fy.textContent = new Date().getFullYear();
    renderHeader();
    initPasswordToggles();
    // Validate any stored token in the background.
    if (isLoggedIn()) {
      refreshProfile();
    } else {
      // First-time anonymous players choose a leaderboard name.
      maybeAskName();
    }
  });
})();
