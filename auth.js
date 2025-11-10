// =========================================================
// 1. GESTION DES UTILISATEURS ET AUTHENTIFICATION
// Les sons de clic de menu (button-pressed.mp3) ont été retirés.
// =========================================================

// Sauvegarde l'objet utilisateurs dans le localStorage
function saveUsers(users) {
    localStorage.setItem('gameUsers', JSON.stringify(users));
}

// Charge l'objet utilisateurs depuis le localStorage
function loadUsers() {
    const usersJson = localStorage.getItem('gameUsers');
    return usersJson ? JSON.parse(usersJson) : {};
}

// Récupère l'utilisateur actuellement connecté
function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

// Déconnexion de l'utilisateur
function logout() {
    localStorage.removeItem('currentUser');
    alert("Déconnexion réussie.");
    window.location.href = 'authentification.html'; 
}

// Fonction de Connexion
function login(username, password) {
    const users = loadUsers();
    if (users[username] && users[username].password === password) {
        localStorage.setItem('currentUser', username);
        alert(`Bienvenue, ${username}!`);
        window.location.href = 'index.html'; 
        return true;
    } else {
        alert("Nom d'utilisateur ou mot de passe incorrect.");
        return false;
    }
}

// Fonction d'Inscription
function register(username, password) {
    const users = loadUsers();
    if (users[username]) {
        alert("Ce nom d'utilisateur est déjà pris.");
        return false;
    }

    users[username] = {
        password: password,
        role: "Joueur Standard",
        games: {
            space_invaders: {
                highScore: 0
            }
        }
    };
    saveUsers(users);
    localStorage.setItem('currentUser', username);
    alert(`Compte créé et connecté. Bienvenue, ${username}!`);
    window.location.href = 'index.html';
    return true;
}

// Exportation des fonctions pour qu'elles soient utilisables dans d'autres scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { saveUsers, loadUsers, getCurrentUser };
}


// =========================================================
// 2. LOGIQUE D'INITIALISATION ET ÉVÉNEMENTS DOM
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // --- GESTION DES FORMULAIRES ET DÉCONNEXION ---
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutButton = document.getElementById('logoutButton');

    // Gère l'envoi du formulaire de connexion
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = e.target.username.value;
            const password = e.target.password.value;
            login(username, password);
        });
    }

    // Gère l'envoi du formulaire d'inscription
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = e.target.username.value;
            const password = e.target.password.value;
            register(username, password);
        });
    }
    
    // Gère le bouton de déconnexion
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
    
    // Remarque : La logique pour afficher/masquer un menu déroulant 
    // (si vous en aviez un) doit être ajoutée ici si elle était dans vos anciens menus.
});
