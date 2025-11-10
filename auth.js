// Fichier: auth.js
// Gère l'authentification, la sauvegarde locale, le classement, les Rôles et l'UI.

const AUTH_CONTROLS = document.getElementById('auth-controls');
const STORAGE_KEY = 'arcadeMasterUsers';

// --- Constantes de Rôles et Defaults ---
// REMPLACER cette URL par une image de profil par défaut de votre choix.
const DEFAULT_PDP_URL = 'https://i.imgur.com/39hN7hG.png'; 
const ADMIN_USERS = ['Zelda5962']; // Utilisateurs ayant le rôle ADMIN

// --- Fonctions de base de données ---

function loadUsers() {
    const usersJson = localStorage.getItem(STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : {};
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// --- Fonctions d'authentification & Rôles ---

function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

function isAdmin(username) {
    // Vérifie si l'utilisateur est dans la liste ADMIN_USERS
    return ADMIN_USERS.includes(username);
}

function login(username) {
    localStorage.setItem('currentUser', username);
    renderAuthControls();
}

function logout() {
    localStorage.removeItem('currentUser');
    renderAuthControls();
    if (window.location.pathname.endsWith('authentification.html')) {
        window.location.reload(); 
    }
}

// Fonction utilitaire pour obtenir les données complètes d'un utilisateur
function getUserData(username) {
    const users = loadUsers();
    return users[username];
}

// FONCTION PDP: Mise à jour de l'URL de la Photo de Profil
function updatePDP(username, newUrl) {
    const users = loadUsers();
    if (users[username]) {
        users[username].pdp = newUrl;
        saveUsers(users);
        return true;
    }
    return false;
}

// --- Gestion du mot de passe (Inchangée) ---

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
    // S'assurer que l'objet users[username] existe (pour les nouvelles inscriptions)
    if (!users[username]) {
        users[username] = { password: '', games: {}, pdp: DEFAULT_PDP_URL };
    }
    
    // Assurez-vous que l'objet games existe
    if (!users[username].games) {
        users[username].games = {};
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
        if (user.games && user.games[game] && user.games[game].highScore !== undefined) {
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
        // Utilisateur connecté : Montrer le nom, l'image de profil et le bouton Compte
        const userData = getUserData(currentUser);
        // Utilise l'URL stockée ou l'URL par défaut si elle n'existe pas
        const pdpUrl = userData ? userData.pdp || DEFAULT_PDP_URL : DEFAULT_PDP_URL;
        
        const adminLink = isAdmin(currentUser) 
            ? '<a href="admin.html" class="nav-link" style="color:yellow; text-decoration:none;">ADMIN</a>' 
            : '';

        AUTH_CONTROLS.innerHTML = `
            <img src="${pdpUrl}" alt="PDP" id="nav-pdp">
            <span id="user-info-display">${currentUser}</span> 
            <a href="authentification.html" id="account-button">⚙️ Compte</a>
            ${adminLink}
        `;
    } else {
        // Utilisateur déconnecté : Montrer le bouton S'inscrire/Se Connecter
        AUTH_CONTROLS.innerHTML = `
            <button id="login-button" onclick="window.location.href='authentification.html'">
                S'inscrire / Se Connecter
            </button>
        `;
    }
    
    // Gestion du lien Admin dans la Sidebar
    const sidebarElement = document.getElementById('sidebar');
    if (sidebarElement) {
        let adminLinkSidebar = sidebarElement.querySelector('.admin-link');
        
        if (isAdmin(currentUser) && !adminLinkSidebar) {
            const adminAnchor = document.createElement('a');
            adminAnchor.href = "admin.html";
            adminAnchor.textContent = "🛡️ Admin";
            adminAnchor.classList.add('admin-link');
            sidebarElement.appendChild(adminAnchor); 
            
        } else if (!isAdmin(currentUser) && adminLinkSidebar) {
            adminLinkSidebar.remove();
        }
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
window.isAdmin = isAdmin;
window.getUserData = getUserData;
window.updatePDP = updatePDP;
