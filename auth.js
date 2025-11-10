// Fichier: auth.js
// Gère l'authentification, la sauvegarde locale, le classement, et l'UI.

const AUTH_CONTROLS = document.getElementById('auth-controls');
const STORAGE_KEY = 'arcadeMasterUsers';

// --- Fonctions de base de données (Inchangées) ---

function loadUsers() {
    const usersJson = localStorage.getItem(STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : {};
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// --- Fonctions d'authentification ---

function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

function login(username) {
    localStorage.setItem('currentUser', username);
    renderAuthControls();
}

function logout() {
    localStorage.removeItem('currentUser');
    renderAuthControls();
    if (window.location.pathname.endsWith('authentification.html')) {
        window.location.reload(); // Recharger pour montrer l'écran de connexion
    }
}

// --- Gestion du mot de passe ---

function changePassword(username, newPassword) {
    const users = loadUsers();
    if (users[username]) {
        users[username].password = newPassword;
        saveUsers(users);
        return true;
    }
    return false;
}

// --- Sauvegarde des Scores/Progression (Inchangée) ---

function saveGameData(username, game, data) {
    const users = loadUsers();
    if (!users[username]) {
        users[username] = { password: '', games: {} };
    }
    
    if (!users[username].games[game]) {
        users[username].games[game] = {};
    }

    if (game === 'space_invaders' && data.score !== undefined) {
        const currentBest = users[username].games[game].highScore || 0;
        if (data.score > currentBest) {
            users[username].games[game].highScore = data.score;
        }
    } else {
        users[username].games[game] = { ...users[username].games[game], ...data };
    }
    
    saveUsers(users);
}

// --- Fonction de Classement (Inchangée) ---

function getLeaderboard(game = 'space_invaders', limit = 10) {
    const users = loadUsers();
    let scores = [];

    for (const username in users) {
        const user = users[username];
        if (user.games[game] && user.games[game].highScore !== undefined) {
            scores.push({
                username: username,
                score: user.games[game].highScore
            });
        }
    }

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, limit);
}

// --- Rendu de l'interface utilisateur (UI) ---

function renderAuthControls() {
    const currentUser = getCurrentUser();
    
    if (!AUTH_CONTROLS) return; 
    
    AUTH_CONTROLS.innerHTML = ''; 

    if (currentUser) {
        // Utilisateur connecté : Montrer le nom et le bouton Compte
        AUTH_CONTROLS.innerHTML = `
            <span id="user-info-display">${currentUser}</span> 
            <a href="authentification.html" id="account-button">⚙️ Compte</a>
            ${currentUser === 'admin' ? '<a href="admin.html" class="nav-link" style="color:yellow;">ADMIN</a>' : ''}
        `;
    } else {
        // Utilisateur déconnecté : Montrer le bouton S'inscrire/Se Connecter
        AUTH_CONTROLS.innerHTML = `
            <button id="login-button" onclick="window.location.href='authentification.html'">
                S'inscrire / Se Connecter
            </button>
        `;
    }
}

// --- Initialisation ---

document.addEventListener('DOMContentLoaded', renderAuthControls);

// Rendre les fonctions importantes accessibles globalement
window.saveGameData = saveGameData;
window.getCurrentUser = getCurrentUser; 
window.logout = logout;
window.loadUsers = loadUsers; 
window.getLeaderboard = getLeaderboard; 
window.changePassword = changePassword;
window.login = login;
