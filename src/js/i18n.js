/**
 * Internationalization (i18n) Support
 */

const translations = {
  en: {
    // Navigation
    home: 'Home',
    leaderboard: 'Leaderboard',
    achievements: 'Achievements',
    profile: 'Profile',
    settings: 'Settings',
    help: 'Help',
    logout: 'Logout',

    // Game
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',
    score: 'Score',
    time: 'Time',
    moves: 'Moves',
    hints: 'Hints',
    pause: 'Pause',
    resume: 'Resume',
    newGame: 'New Game',
    useHint: 'Use Hint',
    giveUp: 'Give Up',

    // Messages
    congratulations: 'Congratulations!',
    youWon: 'You escaped the maze!',
    gameOver: 'Game Over',
    tryAgain: 'Try Again',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',

    // Achievements
    firstVictory: 'First Victory',
    speedDemon: 'Speed Demon',
    perfectionist: 'Perfectionist',
    efficientNavigator: 'Efficient Navigator',
    marathonRunner: 'Marathon Runner',
    expertConqueror: 'Expert Conqueror',
    streakMaster: 'Streak Master',
    nightOwl: 'Night Owl',

    // Stats
    gamesPlayed: 'Games Played',
    gamesWon: 'Games Won',
    totalScore: 'Total Score',
    bestTime: 'Best Time',
    winRate: 'Win Rate',

    // Forms
    username: 'Username',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    login: 'Login',
    register: 'Register',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',

    // Errors
    requiredField: 'This field is required',
    invalidEmail: 'Invalid email address',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordMismatch: 'Passwords do not match',
    loginFailed: 'Login failed',
    registrationFailed: 'Registration failed',

    // Accessibility
    moveUp: 'Move up',
    moveDown: 'Move down',
    moveLeft: 'Move left',
    moveRight: 'Move right',
    closeModal: 'Close modal',
  },

  es: {
    // Navigation
    home: 'Inicio',
    leaderboard: 'Tabla de clasificación',
    achievements: 'Logros',
    profile: 'Perfil',
    settings: 'Configuración',
    help: 'Ayuda',
    logout: 'Cerrar sesión',

    // Game
    difficulty: 'Dificultad',
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil',
    expert: 'Experto',
    score: 'Puntuación',
    time: 'Tiempo',
    moves: 'Movimientos',
    hints: 'Pistas',
    pause: 'Pausar',
    resume: 'Reanudar',
    newGame: 'Nuevo juego',
    useHint: 'Usar pista',
    giveUp: 'Rendirse',

    // Messages
    congratulations: '¡Felicitaciones!',
    youWon: '¡Escapaste del laberinto!',
    gameOver: 'Juego terminado',
    tryAgain: 'Intentar de nuevo',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',

    // Achievements
    firstVictory: 'Primera Victoria',
    speedDemon: 'Demonio de Velocidad',
    perfectionist: 'Perfeccionista',
    efficientNavigator: 'Navegador Eficiente',
    marathonRunner: 'Corredor de Maratón',
    expertConqueror: 'Conquistador Experto',
    streakMaster: 'Maestro de Rachas',
    nightOwl: 'Búho Nocturno',

    // Stats
    gamesPlayed: 'Juegos Jugados',
    gamesWon: 'Juegos Ganados',
    totalScore: 'Puntuación Total',
    bestTime: 'Mejor Tiempo',
    winRate: 'Tasa de Victoria',

    // Forms
    username: 'Nombre de usuario',
    email: 'Correo electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
    login: 'Iniciar sesión',
    register: 'Registrarse',
    forgotPassword: '¿Olvidaste tu contraseña?',
    resetPassword: 'Restablecer contraseña',
  },

  fr: {
    // Navigation
    home: 'Accueil',
    leaderboard: 'Classement',
    achievements: 'Succès',
    profile: 'Profil',
    settings: 'Paramètres',
    help: 'Aide',
    logout: 'Déconnexion',

    // Game
    difficulty: 'Difficulté',
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    expert: 'Expert',
    score: 'Score',
    time: 'Temps',
    moves: 'Mouvements',
    hints: 'Indices',
    pause: 'Pause',
    resume: 'Reprendre',
    newGame: 'Nouveau jeu',
    useHint: 'Utiliser un indice',
    giveUp: 'Abandonner',

    // Messages
    congratulations: 'Félicitations!',
    youWon: 'Vous avez échappé au labyrinthe!',
    gameOver: 'Jeu terminé',
    tryAgain: 'Réessayer',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
  },

  de: {
    // Navigation
    home: 'Startseite',
    leaderboard: 'Bestenliste',
    achievements: 'Erfolge',
    profile: 'Profil',
    settings: 'Einstellungen',
    help: 'Hilfe',
    logout: 'Abmelden',

    // Game
    difficulty: 'Schwierigkeit',
    easy: 'Einfach',
    medium: 'Mittel',
    hard: 'Schwer',
    expert: 'Experte',
    score: 'Punktzahl',
    time: 'Zeit',
    moves: 'Bewegungen',
    hints: 'Hinweise',
    pause: 'Pause',
    resume: 'Fortsetzen',
    newGame: 'Neues Spiel',
    useHint: 'Hinweis verwenden',
    giveUp: 'Aufgeben',

    // Messages
    congratulations: 'Glückwunsch!',
    youWon: 'Du bist aus dem Labyrinth entkommen!',
    gameOver: 'Spiel beendet',
    tryAgain: 'Nochmal versuchen',
    loading: 'Lädt...',
    error: 'Fehler',
    success: 'Erfolg',
  },
};

class I18n {
  constructor() {
    this.currentLang = this.detectLanguage();
    this.translations = translations;
  }

  detectLanguage() {
    // Check localStorage
    const saved = localStorage.getItem('language');
    if (saved && translations[saved]) {
      return saved;
    }

    // Detect browser language
    const browserLang = navigator.language.split('-')[0];
    if (translations[browserLang]) {
      return browserLang;
    }

    // Default to English
    return 'en';
  }

  setLanguage(lang) {
    if (!translations[lang]) {
      console.warn(`Language ${lang} not supported, falling back to English`);
      lang = 'en';
    }

    this.currentLang = lang;
    localStorage.setItem('language', lang);
    this.updatePage();

    // Dispatch event for components to listen
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  }

  t(key, replacements = {}) {
    const translation = this.translations[this.currentLang][key] || this.translations.en[key] || key;

    // Replace placeholders like {name}
    return translation.replace(/\{(\w+)\}/g, (match, placeholder) => {
      return replacements[placeholder] || match;
    });
  }

  updatePage() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = this.t(key);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.t(key);
    });

    // Update aria-labels
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
      const key = element.getAttribute('data-i18n-aria');
      element.setAttribute('aria-label', this.t(key));
    });
  }

  getSupportedLanguages() {
    return Object.keys(translations);
  }

  getCurrentLanguage() {
    return this.currentLang;
  }
}

// Create global instance
const i18n = new I18n();

// Auto-update page on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => i18n.updatePage());
} else {
  i18n.updatePage();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = i18n;
}
