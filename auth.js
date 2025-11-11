// --- GESTION DE L'AUTHENTIFICATION ET DES DONNÉES UTILISATEUR ---

const LOCAL_STORAGE_KEY = 'arcadeMasterUsers';
const LOCAL_STORAGE_CURRENT_USER = 'arcadeMasterCurrentUser';

// Utilisateurs de base pour le test
const DEFAULT_USERS = [
    {
        id: 1,
        username: 'admin',
        password: 'password', // Ceci est juste pour le test, ne pas faire en prod !
        role: 'admin',
        coins: 15000,
        highScores: {
            space_invaders: 12000,
            snake_infini: 0,
            clicker_arcade: 0
        },
        skins: {
            owned: [0, 1, 4], // 0: base invader, 1: éclair, 4: base snake
            active: {
                ship: '🛸', // Vaisseau Éclair
                snake_head: '🐍'
            }
        },
        // NOUVEAU : URL par défaut pour la photo de profil
        profilePictureUrl: 'https://cdn-icons-png.flaticon.com/512/1144/1144760.png'
    },
    {
        id: 2,
        username: 'joueur',
        password: 'pass',
        role: 'user',
        coins: 250,
        highScores: {
            space_invaders: 450,
            snake_infini: 0,
            clicker_arcade: 0
        },
        skins: {
            owned: [0, 4],
            active: {
                ship: '🚀',
                snake_head: '🐍'
            }
        },
        profilePictureUrl: 'https://cdn-icons-png.flaticon.com/512/1144/1144760.png'
    }
];

// Initialisation des utilisateurs
function initUsers() {
    if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    }
}

// Charger tous les utilisateurs
function loadUsers() {
    initUsers();
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
}

// Sauvegarder tous les utilisateurs
function saveUsers(users) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
}

// Enregistrement (MISES À JOUR : Alerte et Champ photo)
function registerUser(username, password) {
    let users = loadUsers();

    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        alert("Nom d'utilisateur déjà pris.");
        return false;
    }

    const newUser = {
        id: users.length + 1,
        username: username,
        password: password, 
        role: 'user',
        coins: 0,
        highScores: {
            space_invaders: 0,
            snake_infini: 0,
            clicker_arcade: 0
        },
        skins: {
            owned: [0, 4], 
            active: {
                ship: '🚀',
                snake_head: '🐍'
            }
        },
        profilePictureUrl: 'https://cdn-icons-png.flaticon.com/512/1144/1144760.png'
    };

    users.push(newUser);
    saveUsers(users);
    loginUser(username, password); // Connexion automatique
    alert("Compte créé avec succès ! Vous êtes maintenant connecté(e)."); // POPUP
    return true;
}

// Connexion (MISES À JOUR : Alerte)
function loginUser(username, password) {
    const users = loadUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        localStorage.setItem(LOCAL_STORAGE_CURRENT_USER, JSON.stringify(user));
        alert("Connexion réussie ! Bienvenue " + user.username); // POPUP
        return true;
    } else {
        alert("Nom d'utilisateur ou mot de passe incorrect."); // POPUP
        return false;
    }
}

// Déconnexion
function logout() {
    localStorage.removeItem(LOCAL_STORAGE_CURRENT_USER);
    alert("Déconnexion réussie.");
}

// Obtenir l'utilisateur actuellement connecté
function getCurrentUser() {
    const userJson = localStorage.getItem(LOCAL_STORAGE_CURRENT_USER);
    return userJson ? JSON.parse(userJson) : null;
}

// Mettre à jour l'utilisateur dans la liste globale (appelé après score, achat, etc.)
function updateGlobalUser(updatedUser) {
    let users = loadUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    
    if (index !== -1) {
        users[index] = updatedUser;
        saveUsers(users);
        
        localStorage.setItem(LOCAL_STORAGE_CURRENT_USER, JSON.stringify(updatedUser));
        return true;
    }
    return false;
}

// Mise à jour du meilleur score
function updateHighScore(gameId, newScore) {
    const user = getCurrentUser();
    if (!user) return false;

    if (!user.highScores) {
        user.highScores = { space_invaders: 0, snake_infini: 0, clicker_arcade: 0 };
    }

    if (newScore > (user.highScores[gameId] || 0)) {
        user.highScores[gameId] = newScore;
        updateGlobalUser(user);
        return true; 
    }
    return false;
}

// Mise à jour des pièces
function updateCoins(amount) {
    const user = getCurrentUser();
    if (!user) return false;

    user.coins += amount;
    updateGlobalUser(user);
    return user.coins;
}

// NOUVEAU : Fonction pour mettre à jour le profil
function updateProfile(newPassword, newProfilePictureUrl) {
    const user = getCurrentUser();
    if (!user) return false;

    if (newPassword) {
        user.password = newPassword;
    }
    if (newProfilePictureUrl) {
        user.profilePictureUrl = newProfilePictureUrl;
    }
    
    updateGlobalUser(user);
    alert("Votre profil a été mis à jour avec succès.");
    return true;
}


// Assurez-vous que les utilisateurs de base sont initialisés au chargement
document.addEventListener('DOMContentLoaded', initUsers);
