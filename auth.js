// Fichier: auth.js
// Gère l'authentification et la sauvegarde locale de la progression (LocalStorage)

const AUTH_SECTION = document.getElementById('auth-section');
const STORAGE_KEY = 'arcadeMasterUsers';

// --- Fonctions de base de données (LocalStorage) ---

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
    renderAuthUI();
}

function logout() {
    localStorage.removeItem('currentUser');
    renderAuthUI();
}

// --- Sauvegarde des Scores/Progression ---

function saveGameData(username, game, data) {
    const users = loadUsers();
    if (!users[username]) {
        users[username] = { games: {} };
    }
    users[username].games[game] = data;
    saveUsers(users);
    console.log(`Progression de ${game} sauvegardée pour ${username}:`, data);
}

// Exemple d'utilisation (à appeler depuis le jeu Clicker par exemple):
// saveGameData(getCurrentUser(), 'clicker', { score: 1234, level: 5 });

// --- Rendu de l'interface utilisateur (UI) ---

function renderAuthUI() {
    const currentUser = getCurrentUser();
    AUTH_SECTION.innerHTML = ''; // Effacer le contenu existant

    if (currentUser) {
        // Utilisateur connecté
        AUTH_SECTION.innerHTML = `
            Connecté en tant que: <span id="user-info">${currentUser}</span> 
            <button onclick="logout()">Déconnexion</button>
        `;
    } else {
        // Utilisateur déconnecté (Formulaires)
        AUTH_SECTION.innerHTML = `
            <div id="register-form">
                <input type="text" id="reg-username" placeholder="Pseudo (Créer Compte)" required>
                <button onclick="handleRegister()">Créer Compte</button>
            </div>
            <div id="login-form">
                <input type="text" id="login-username" placeholder="Pseudo (Connexion)" required>
                <button onclick="handleLogin()">Connexion</button>
            </div>
        `;
    }
}

function handleRegister() {
    const username = document.getElementById('reg-username').value.trim();
    if (!username) return alert("Veuillez entrer un pseudo.");
    
    const users = loadUsers();
    if (users[username]) {
        return alert("Ce pseudo existe déjà. Veuillez vous connecter.");
    }
    
    // Création du compte (avec un objet vide pour les jeux)
    users[username] = { games: {} };
    saveUsers(users);
    
    login(username);
    alert(`Compte "${username}" créé et connecté !`);
}

function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    if (!username) return alert("Veuillez entrer un pseudo.");

    const users = loadUsers();
    if (!users[username]) {
        return alert("Ce pseudo n'existe pas. Veuillez créer un compte.");
    }

    login(username);
    alert(`Bienvenue, ${username} !`);
}


// Lancer le rendu de l'interface au chargement de la page
document.addEventListener('DOMContentLoaded', renderAuthUI);

// Rendre la fonction de sauvegarde accessible globalement
window.saveGameData = saveGameData;
window.getCurrentUser = getCurrentUser; 
window.handleRegister = handleRegister;
window.handleLogin = handleLogin;
window.logout = logout;
