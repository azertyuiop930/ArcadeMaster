// Fichier: auth.js
// ... (Fonctions loadUsers, saveUsers, getCurrentUser, isAdmin, etc. restent inchangées)

const AUTH_CONTROLS = document.getElementById('auth-controls');
const STORAGE_KEY = 'arcadeMasterUsers';
const DEFAULT_PDP_URL = 'https://i.imgur.com/39hN7hG.png'; 
const ADMIN_USERS = ['Zelda5962']; 

// ... (Autres fonctions de base de auth.js - login, logout, getUserData, updatePDP, changePassword, saveGameData)

// --- Fonctions de base de données (Inchangé) ---

function loadUsers() {
    const usersJson = localStorage.getItem(STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : {}; 
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

function isAdmin(username) {
    return ADMIN_USERS.includes(username);
}

function getUserData(username) {
    const users = loadUsers();
    return users[username] || null; 
}
// ... (Toutes les autres fonctions jusqu'à saveGameData, incluses, sont conservées)

// --- Fonction de Classement (MODIFIÉE) ---

function getFullLeaderboard(game = 'space_invaders') {
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
    // Trie tous les scores, sans limite
    scores.sort((a, b) => b.score - a.score);
    return scores;
}

function getLeaderboard(game = 'space_invaders', limit = 10) {
    // Utilise la fonction complète et la limite ensuite pour le Top X
    return getFullLeaderboard(game).slice(0, limit);
}

// NOUVELLE FONCTION : Trouve le rang d'un utilisateur spécifique
function getPersonalRank(username, game = 'space_invaders') {
    const fullLeaderboard = getFullLeaderboard(game);
    
    // Si l'utilisateur n'a pas de score, son rang est null
    if (!username) return null;

    // Trouver l'index (position) du joueur dans la liste triée
    const index = fullLeaderboard.findIndex(entry => entry.username === username);

    if (index === -1) {
        return null; // Pas de score enregistré
    }
    
    // Le rang est l'index + 1
    const rank = index + 1;
    const score = fullLeaderboard[index].score;

    return { rank: rank, score: score };
}


// --- Rendu de l'interface utilisateur (UI) (Inchangé) ---

function renderAuthControls() {
    const currentUser = getCurrentUser();
    
    if (!AUTH_CONTROLS) return; 
    
    AUTH_CONTROLS.innerHTML = ''; 

    if (currentUser) {
        const userData = getUserData(currentUser);
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
        AUTH_CONTROLS.innerHTML = `
            <button id="login-button" onclick="window.location.href='authentification.html'">
                S'inscrire / Se Connecter
            </button>
        `;
    }
    
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
window.getPersonalRank = getPersonalRank; // NOUVEAU
window.changePassword = changePassword;
window.login = login;
window.isAdmin = isAdmin;
window.getUserData = getUserData;
window.updatePDP = updatePDP;
