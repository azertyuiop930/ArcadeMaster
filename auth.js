const STORAGE_KEY = 'arcadeMasterUsers';

/**
 * Charge tous les utilisateurs depuis le localStorage.
 * @returns {Object} Un objet contenant les données des utilisateurs.
 */
function loadUsers() {
    const json = localStorage.getItem(STORAGE_KEY);
    const users = json ? JSON.parse(json) : {};

    // S'assurer que l'utilisateur admin par défaut existe toujours au premier chargement
    if (!users["Zelda5962"]) {
        users["Zelda5962"] = {
            password: "password", // Mot de passe par défaut. À CHANGER POUR LA PRODUCTION!
            role: "admin",
            pdp: "https://i.imgur.com/39hN7hG.png", // Exemple d'URL PDP
            games: {} // Stockage des données de jeu
        };
    }
    return users;
}

/**
 * Sauvegarde les données des utilisateurs dans le localStorage.
 * @param {Object} users L'objet des utilisateurs à sauvegarder.
 */
function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

/**
 * Récupère les données d'un utilisateur spécifique.
 * @param {string} username Le nom d'utilisateur.
 * @returns {Object|null} Les données de l'utilisateur ou null.
 */
function getUserData(username) {
    const users = loadUsers();
    return users[username] || null;
}

/**
 * Récupère le nom d'utilisateur actuellement connecté.
 * @returns {string|null} Le nom d'utilisateur ou null.
 */
function getCurrentUser() {
    return sessionStorage.getItem('currentUser');
}

/**
 * Définit l'utilisateur actuellement connecté.
 * @param {string} username Le nom d'utilisateur à connecter.
 */
function setCurrentUser(username) {
    sessionStorage.setItem('currentUser', username);
}

/**
 * Enregistre un nouvel utilisateur.
 * @param {string} username Nom d'utilisateur.
 * @param {string} password Mot de passe (doit être haché en prod).
 * @param {string} pdpURL URL de l'image de profil.
 * @returns {boolean} True si l'enregistrement a réussi, false sinon.
 */
function registerUser(username, password, pdpURL = 'https://i.imgur.com/39hN7hG.png') {
    const users = loadUsers();
    if (users[username]) {
        return false; // Utilisateur existe déjà
    }

    users[username] = {
        password: password,
        role: "user",
        pdp: pdpURL,
        games: {}
    };
    saveUsers(users);
    return true;
}

/**
 * Connecte un utilisateur.
 * @param {string} username Nom d'utilisateur.
 * @param {string} password Mot de passe.
 * @returns {boolean} True si la connexion a réussi, false sinon.
 */
function login(username, password) {
    const users = loadUsers();
    const user = users[username];

    if (user && user.password === password) {
        setCurrentUser(username);
        return true;
    }
    return false;
}

/**
 * Déconnecte l'utilisateur actuel.
 */
function logout() {
    sessionStorage.removeItem('currentUser');
    if (typeof renderAuthControls === 'function') {
        renderAuthControls();
    }
    // Rediriger vers l'accueil
    window.location.href = 'index.html'; 
}


// ------------------------------------------------------------------
// FONCTIONS DE GESTION DES JEUX ET DU CLASSEMENT
// ------------------------------------------------------------------

/**
 * Sauvegarde les données d'une partie et met à jour le meilleur score si nécessaire.
 */
function saveGameData(username, gameId, data) {
    const users = loadUsers();
    const user = users[username];

    if (!user) return; 

    if (!user.games[gameId]) {
        user.games[gameId] = {
            highScore: 0
        };
    }

    if (data.score > user.games[gameId].highScore) {
        user.games[gameId].highScore = data.score;
    }

    saveUsers(users);
}

/**
 * Récupère le classement complet pour un jeu donné, trié par score.
 */
function getFullLeaderboard(gameId) {
    const users = loadUsers();
    const leaderboard = [];

    for (const username in users) {
        const user = users[username];
        if (user.games[gameId] && user.games[gameId].highScore > 0) {
            leaderboard.push({
                username: username,
                score: user.games[gameId].highScore
            });
        }
    }

    leaderboard.sort((a, b) => b.score - a.score);

    return leaderboard;
}


// ------------------------------------------------------------------
// FONCTIONS D'ADMINISTRATION ET DE SÉCURITÉ
// ------------------------------------------------------------------

/**
 * Supprime un utilisateur.
 */
function deleteUser(username) {
    const currentUser = getCurrentUser();
    
    if (username === currentUser) {
        alert("Vous ne pouvez pas supprimer votre propre compte depuis le panneau d'administration.");
        return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${username}" ? Cette action est irréversible.`)) {
        const users = loadUsers();
        
        if (users[username] && users[username].role === 'admin') {
             alert("Impossible de supprimer un autre compte administrateur.");
             return;
        }

        delete users[username];
        saveUsers(users);
        
        if (typeof renderAdminPanel === 'function') {
            renderAdminPanel();
        } else {
            window.location.reload();
        }
    }
}


// ------------------------------------------------------------------
// FONCTIONS DE RENDU
// ------------------------------------------------------------------

function renderAuthControls() {
    const currentUser = getCurrentUser();
    const authControls = document.getElementById('auth-controls');
    const sidebar = document.getElementById('sidebar');
    
    if (!authControls || !sidebar) return;

    let authHTML = '';
    
    if (currentUser) {
        const userData = getUserData(currentUser);
        const pdpUrl = userData && userData.pdp ? userData.pdp : 'https://i.imgur.com/39hN7hG.png';
        
        authHTML = `
            <span style="color: #00ff00; font-weight: bold; margin-right: 10px;">${currentUser}</span>
            <img src="${pdpUrl}" alt="PDP" style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid #00ff00; vertical-align: middle; margin-right: 5px;">
            <a href="authentification.html" title="Mon Compte" style="color: white; margin-left: 10px;">
                Compte
            </a>
            <a href="#" onclick="logout(); return false;" title="Déconnexion" style="color: #e74c3c; margin-left: 15px;">
                Déconnexion
            </a>
        `;

        // Gestion du lien Admin dans la sidebar
        const oldAdminLink = sidebar.querySelector('a[href="admin.html"]');
        if (oldAdminLink) sidebar.removeChild(oldAdminLink);

        if (userData.role === 'admin') {
             const adminLinkHTML = '<a href="admin.html" style="color: #f39c12;">🛡️ Admin Panel</a>';
             sidebar.insertAdjacentHTML('beforeend', adminLinkHTML);
        }

    } else {
        authHTML = `<a href="authentification.html" style="color: white;">Connexion / Inscription</a>`;
        const oldAdminLink = sidebar.querySelector('a[href="admin.html"]');
        if (oldAdminLink) sidebar.removeChild(oldAdminLink);
    }

    authControls.innerHTML = authHTML;
}

// Globalisation des fonctions
window.loadUsers = loadUsers;
window.saveUsers = saveUsers;
window.getUserData = getUserData;
window.getCurrentUser = getCurrentUser;
window.registerUser = registerUser;
window.login = login;
window.logout = logout;
window.renderAuthControls = renderAuthControls;
window.saveGameData = saveGameData;
window.getFullLeaderboard = getFullLeaderboard;
window.deleteUser = deleteUser;


document.addEventListener('DOMContentLoaded', renderAuthControls);
