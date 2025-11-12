// --- GESTION DES COMPTES (auth.js) ---

// NOTE: Ce fichier suppose que vous avez d'autres fonctions comme register, login, saveUsers, etc.

// --- 1. GESTION DE LA CONNEXION/DÉCONNEXION ---

// Déconnexion complète
function logout() {
    // Supprime la clé de l'utilisateur connecté
    localStorage.removeItem('currentUser'); 
    
    // CORRECTION: Supprime la clé temporaire/cheat pour éviter le blocage du "Joueur Déconnecté"
    localStorage.removeItem('tempCheatCoins'); 
    
    // Met à jour l'affichage de la barre supérieure (qui affichera "Joueur Déconnecté" avec 0 coin)
    if (typeof updateTopBar === 'function') {
        updateTopBar();
    }
    
    // Redirection vers la page de compte
    window.location.href = 'compte.html'; 
}

// --- 2. GESTION DES SCORES ET DES SKINS ---

// Fonction pour mettre à jour le meilleur score pour un jeu donné (si l'utilisateur est connecté)
function updateGlobalUserScore(gameKey, newScore) {
    const user = getCurrentUser();

    if (user && user.id !== 0) {
        if (!user.scores) user.scores = {};
        
        // S'assurer que le nouveau score est meilleur
        if (!user.scores[gameKey] || newScore > user.scores[gameKey]) {
            user.scores[gameKey] = newScore;
            updateGlobalUser(user); // Sauvegarde
            console.log(`Nouveau meilleur score pour ${gameKey} sauvegardé !`);
            return true;
        }
    }
    return false;
}


// --- 3. GESTION DES UTILISATEURS (Exemple de structure) ---

// Simule la sauvegarde de tous les utilisateurs (à implémenter complètement)
function saveAllUsers(users) {
    // Si vous stockez tous les comptes dans une clé 'users'
    // localStorage.setItem('users', JSON.stringify(users));
}

// Simule la récupération de tous les utilisateurs (à implémenter complètement)
function getAllUsers() {
    // const usersData = localStorage.getItem('users');
    // return usersData ? JSON.parse(usersData) : [];
    return []; // Retourne vide pour l'exemple
}
