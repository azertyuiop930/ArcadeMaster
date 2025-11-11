/**
 * Fichier : auth.js
 * Description : Fonctions de gestion de l'authentification (Connexion, Inscription, Déconnexion)
 * et de gestion du profil utilisateur (scores, pièces) via localStorage (simulant une BDD).
 */

const USER_STORAGE_KEY = 'arcadeMasterUsers';
const CURRENT_USER_KEY = 'arcadeMasterCurrentUser';

// --- FONCTIONS DE BASE DU STOCKAGE ---

/** Charge la liste des utilisateurs depuis le localStorage */
function loadUsers() {
    const usersJson = localStorage.getItem(USER_STORAGE_KEY);
    const users = usersJson ? JSON.parse(usersJson) : [];
    
    // Ajout de l'utilisateur Admin par défaut s'il n'existe pas
    if (!users.some(u => u.username === 'Zelda5962')) {
        users.push({
            username: 'Zelda5962',
            password: 'mdp', 
            role: 'admin',
            coins: 9999,
            highScores: {
                space_invaders: 1500,
            },
            skins: {
                active: { ship: '🚀' },
            }
        });
    }
    
    return users;
}

/** Sauvegarde la liste des utilisateurs dans le localStorage */
function saveUsers(users) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
}

/** Récupère l'utilisateur actuellement connecté */
function getCurrentUser() {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    if (userJson) {
        const tempUser = JSON.parse(userJson);
        const globalUsers = loadUsers();
        // Recherche la version complète et la plus récente de l'utilisateur
        const fullUser = globalUsers.find(u => u.username === tempUser.username);
        return fullUser || null;
    }
    return null;
}

/** Définit l'utilisateur actuellement connecté (et met à jour la Top Bar) */
function setCurrentUser(user) {
    if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
            username: user.username,
            role: user.role,
        }));
    } else {
        localStorage.removeItem(CURRENT_USER_KEY);
    }
    // Met à jour la Top Bar (fonction dans base.js)
    if (typeof updateTopBar === 'function') {
        updateTopBar();
    }
}

/** Met à jour les données d'un utilisateur dans la base globale */
function updateGlobalUser(userToUpdate) {
    if (!userToUpdate) return;
    
    let users = loadUsers();
    const index = users.findIndex(u => u.username === userToUpdate.username);
    
    if (index !== -1) {
        users[index] = userToUpdate;
    } else {
        users.push(userToUpdate);
    }
    
    saveUsers(users);
    
    // Si c'est l'utilisateur actuel, met à jour la session et la Top Bar
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.username === userToUpdate.username) {
        setCurrentUser(userToUpdate);
    }
}

// --- FONCTIONS D'AUTHENTIFICATION AVEC POPUPS ---

/** Tente de connecter un utilisateur */
function login(username, password) {
    const users = loadUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
        // Popup 1 : Nom d'utilisateur introuvable
        alert('❌ Erreur de Connexion : Nom d\'utilisateur introuvable.');
        return false;
    }

    if (user.password !== password) {
        // Popup 2 : Mauvais mot de passe
        alert('❌ Erreur de Connexion : Mot de passe incorrect.');
        return false;
    }

    setCurrentUser(user);
    alert(`✅ Connexion réussie ! Bienvenue, ${user.username}.`);
    
    // Redirige ou rafraîchit la page de compte
    if (window.location.pathname.endsWith('compte.html')) {
        // Utilise la fonction de compte.html pour switcher la vue
        if (typeof renderProfileView === 'function') {
            renderProfileView(); 
        } else {
            window.location.reload(); 
        }
    } else {
        window.location.href = 'index.html';
    }
    
    return true;
}

/** Tente d'inscrire un nouvel utilisateur */
function register(username, password) {
    const users = loadUsers();
    
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        // Popup 3 : Compte existe déjà
        alert('⚠️ Erreur d\'Inscription : Ce nom d\'utilisateur existe déjà. Veuillez vous connecter.');
        return false;
    }

    if (username.length < 3 || password.length < 4) {
        // Popup 4 : Règle de validation
        alert('⚠️ Erreur d\'Inscription : Le nom doit avoir 3+ caractères, le mot de passe 4+.');
        return false;
    }

    const newUser = {
        username: username,
        password: password,
        role: 'user',
        coins: 100, // Pièces de départ
        highScores: {},
        skins: {
            active: { ship: '🚀' }, // Skin par défaut
        }
    };

    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);

    alert(`🎉 Inscription réussie ! Bienvenue, ${newUser.username}. Vous gagnez 100 pièces de départ.`);
    
    // Redirige ou rafraîchit
    if (window.location.pathname.endsWith('compte.html')) {
        if (typeof renderProfileView === 'function') {
            renderProfileView(); 
        } else {
            window.location.reload(); 
        }
    } else {
        window.location.href = 'index.html';
    }
    
    return true;
}

/** Déconnecte l'utilisateur actuel */
function logout() {
    setCurrentUser(null);
    alert('👋 Déconnexion réussie. À bientôt !');
    // Redirige vers la page d'accueil ou de compte
    if (window.location.pathname.endsWith('compte.html')) {
        window.location.reload(); 
    } else {
        window.location.href = 'index.html';
    }
}

// --- FONCTIONS UTILITAIRES DE JEU ---

/** Ajoute ou retire des pièces à l'utilisateur actuel */
function updateCoins(amount) {
    const currentUser = getCurrentUser();
    if (currentUser) {
        currentUser.coins += amount;
        if (currentUser.coins < 0) {
            currentUser.coins = 0; // Sécurité minimale
        }
        updateGlobalUser(currentUser);
        
        // Mettre à jour l'affichage de la top bar immédiatement
        if (typeof updateTopBar === 'function') {
            updateTopBar();
        }
    }
}
