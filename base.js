// --- LOGIQUE GLOBALE (base.js) ---

// --- 1. GESTION UTILISATEUR ET SKINS ---

// Récupère l'utilisateur actuel (connecté ou déconnecté)
function getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        return JSON.parse(userData);
    }
    // Utilisateur par défaut (déconnecté/guest), utilise les tempCoins
    return { 
        id: 0, 
        username: 'Joueur Déconnecté', 
        coins: parseInt(localStorage.getItem('tempCheatCoins') || '0'), 
        skins: { active: {}, owned: {} },
        isAdmin: false // Par défaut, non admin
    };
}

// Met à jour et sauvegarde l'objet utilisateur global
function updateGlobalUser(user) {
    if (user && user.id !== 0) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
    // Met à jour les coins temporaires si l'utilisateur est déconnecté (pour le Konami Code)
    if (user && user.id === 0) {
        localStorage.setItem('tempCheatCoins', user.coins.toString());
    }
}

// --- 2. GESTION DE LA NAVIGATION (Barres Supérieures et Latérales) ---

// Met à jour le contenu de la barre supérieure
function updateTopBar() {
    const user = getCurrentUser();
    const topBar = document.getElementById('top-bar');
    
    if (!topBar) return;

    topBar.innerHTML = `
        <div id="menuToggle" class="menu-toggle" onclick="openNav()">
            <i class="fa-solid fa-bars"></i>
        </div>
        <span style="font-size: 1.5em; font-weight: bold; color: var(--color-neon-blue);">
            ${document.title.split(' - ')[1] || 'ARCADE MASTER'}
        </span>
        <div style="display: flex; align-items: center; gap: 15px;">
            <a href="boutique.html" class="currency-display" title="Boutique">
                <span class="coin-count">${user.coins.toLocaleString('fr-FR')}</span>
                <button id="trollButton" type="button" onclick="window.location.href = 'boutique.html'">💰</button>
            </a>
            <a href="compte.html" style="color: var(--color-text-light);" title="${user.username}">
                <i class="fa-solid fa-user"></i>
            </a>
        </div>
    `;
}

// Ouvre le menu latéral (Sidebar)
function openNav() {
    const user = getCurrentUser();
    // VÉRIFICATION ADMIN
    const isAdmin = user && user.id !== 0 && user.isAdmin === true; 
    
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;

    // Liens de base
    let htmlContent = `
        <a href="index.html" data-emoji="🏠">🏠 Accueil</a>
        <a href="jeux.html" data-emoji="🎮">🎮 Menu Jeux</a>
        <a href="compte.html" data-emoji="👤">👤 Mon Compte</a>
        <a href="boutique.html" data-emoji="🛍️">🛍️ Boutique</a>
        <a href="classement.html" data-emoji="🏆">🏆 Classement</a>
    `;

    // AJOUT CONDITIONNEL DU LIEN ADMIN
    if (isAdmin) {
        htmlContent += `<a href="admin.html" data-emoji="🔑" style="color: var(--color-neon-red); border-top: 1px dashed var(--color-neon-red);">🔑 Administration</a>`;
    }

    htmlContent += `<a href="credits.html" data-emoji="📜">📜 Crédits</a>`;
    
    navLinks.innerHTML = htmlContent;
    
    document.getElementById("sidebar").style.width = "250px";
    document.getElementById("mainContent").style.marginLeft = "250px";
}

// Ferme le menu latéral
function closeNav() {
    document.getElementById("sidebar").style.width = "0";
    document.getElementById("mainContent").style.marginLeft = "0";
}

// --- 3. INITIALISATION ---

// Appel essentiel pour que les barres apparaissent sur toutes les pages
document.addEventListener('DOMContentLoaded', () => {
    updateTopBar(); 
});
