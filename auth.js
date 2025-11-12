// Dépendance : ce script nécessite la fonction updateGlobalUser() et getCurrentUser() de base.js

// --- 1. FONCTIONS UTILITAIRES DE LOCALSTORAGE ---

function getUsers() {
    const usersData = localStorage.getItem('users');
    return usersData ? JSON.parse(usersData) : [];
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}


// --- 2. GESTION DE L'ADMIN ET DES DONNÉES INITIALES ---

function loadInitialData() {
    let users = getUsers();

    // 1. Définir le compte Admin si non existant
    const adminUsername = 'Zelda5962';
    const adminPassword = '?Moi123!';
    let adminExists = users.some(user => user.username === adminUsername);

    if (!adminExists) {
        console.log(`Création du compte Administrateur : ${adminUsername}`);
        const adminUser = {
            id: 1, 
            username: adminUsername,
            password: adminPassword, 
            coins: 0, 
            scores: { space_invaders: 0 }, 
            skins: { 
                active: { vessel: 'vessel_base' }, // Skin de base équipé
                owned: { vessel_base: true, vessel_gold: true } // Skins possédés
            },
            isAdmin: true 
        };
        users.push(adminUser); 
        saveUsers(users);
    }
    
    // 2. Gère le prochain ID utilisateur
    if (users.length > 0) {
        const maxId = users.reduce((max, user) => (user.id > max ? user.id : max), 0);
        localStorage.setItem('nextUserId', maxId + 1);
    } else {
        localStorage.setItem('nextUserId', 2);
    }
}


// --- 3. FONCTIONS D'AUTHENTIFICATION & GESTION DU COMPTE ---

function loginUser(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        updateGlobalUser(user); 
        return true;
    } 
    return false;
}

function registerUser(username, password) {
    const users = getUsers();
    if (users.some(u => u.username === username)) {
        return false; 
    }

    const nextId = parseInt(localStorage.getItem('nextUserId') || '2');
    const newUser = {
        id: nextId,
        username: username,
        password: password,
        coins: 1000, // Bonus de départ
        scores: { space_invaders: 0 },
        skins: { 
            active: { vessel: 'vessel_base' },
            owned: { vessel_base: true }
        },
        isAdmin: false
    };

    users.push(newUser);
    saveUsers(users);
    localStorage.setItem('nextUserId', nextId + 1);

    updateGlobalUser(newUser); 
    return true;
}

function logoutUser() {
    updateGlobalUser({ 
        id: 0, 
        username: 'Joueur Déconnecté', 
        coins: 0, 
        skins: { active: {}, owned: {} },
        isAdmin: false
    });
}

function updatePassword(username, newPassword) {
    let users = getUsers();
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        saveUsers(users);
        updateGlobalUser(users[userIndex]); 
        return true;
    }
    return false;
}

// --- 4. FONCTIONS DE LA BOUTIQUE ---

/**
 * Déduit un montant de pièces du compte de l'utilisateur courant.
 * @param {number} amount - Montant à déduire.
 * @returns {boolean} Vrai si la déduction est réussie, Faux sinon (fonds insuffisants).
 */
function deductCoins(amount) {
    let user = getCurrentUser();
    if (user.id === 0) return false; 

    if (user.coins >= amount) {
        user.coins -= amount;
        
        // Mise à jour de la liste complète des utilisateurs
        let users = getUsers();
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            users[userIndex].coins = user.coins;
            saveUsers(users);
        }
        
        updateGlobalUser(user);
        return true;
    }
    return false; 
}

/**
 * Ajoute un skin à la liste des skins possédés de l'utilisateur.
 */
function addOwnedSkin(itemId) {
    let user = getCurrentUser();
    if (user.id === 0) return;

    let users = getUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
        if (!users[userIndex].skins.owned) {
            users[userIndex].skins.owned = {};
        }
        users[userIndex].skins.owned[itemId] = true; 
        saveUsers(users);
        updateGlobalUser(users[userIndex]);
    }
}

/**
 * Équipe un skin spécifique.
 */
function equipSkin(itemId, itemType) {
    let user = getCurrentUser();
    if (user.id === 0) return;

    let users = getUsers();
    const userIndex = users.findIndex(u => u.id === user.id);

    if (userIndex !== -1) {
        if (!users[userIndex].skins.active) {
            users[userIndex].skins.active = {};
        }
        
        const slot = itemType; 
        users[userIndex].skins.active[slot] = itemId; 
        
        saveUsers(users);
        updateGlobalUser(users[userIndex]);
    }
}


// --- 5. FONCTIONS ADMIN ---

function modifyUserCoins(targetUsername, newCoinsAmount, adminUser) {
    if (!adminUser || !adminUser.isAdmin) return false;

    let users = getUsers();
    const targetUserIndex = users.findIndex(u => u.username === targetUsername);

    if (targetUserIndex !== -1) {
        users[targetUserIndex].coins = newCoinsAmount;
        saveUsers(users);
        
        if (targetUsername === adminUser.username) {
            updateGlobalUser(users[targetUserIndex]);
            if (typeof updateTopBar === 'function') { updateTopBar(); }
        }
        return true;
    } 
    return false;
}

function deleteUser(targetUsername, adminUser) {
    if (!adminUser || !adminUser.isAdmin) {
        return { success: false, message: "Accès refusé." };
    }
    
    if (targetUsername === adminUser.username) {
        return { success: false, message: "L'administrateur ne peut pas supprimer son propre compte." };
    }

    let users = getUsers();
    const initialLength = users.length;
    
    const updatedUsers = users.filter(u => u.username !== targetUsername);
    
    if (updatedUsers.length < initialLength) {
        saveUsers(updatedUsers);
        loadInitialData(); 
        return { success: true, message: `Compte ${targetUsername} supprimé avec succès.` };
    } else {
        return { success: false, message: `Utilisateur cible "${targetUsername}" non trouvé.` };
    }
}


// --- 6. EXÉCUTION INITIALE ET GESTION DES FORMULAIRES ---

document.addEventListener('DOMContentLoaded', () => {
    loadInitialData(); 
    
    // Les gestionnaires de formulaires (loginForm, registerForm, passwordForm, logoutButton) 
    // sont supposés exister dans ce fichier pour compte.html
    // (J'ai retiré le code des gestionnaires pour ne pas alourdir, mais ils doivent être présents pour compte.html)
});


// --- 7. EXPOSITION DES FONCTIONS POUR admin.html ET boutique.html ---

window.getUsersData = getUsers; 
window.reinitializeData = loadInitialData;
window.modifyUserCoins = modifyUserCoins;
window.deleteUser = deleteUser;

window.deductCoins = deductCoins;
window.addOwnedSkin = addOwnedSkin;
window.equipSkin = equipSkin;
