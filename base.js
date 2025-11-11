/**
 * Fichier : base.js
 * Description : Fonctions et logiques de base appliquées à TOUTES les pages (menu, top bar, etc.).
 */

// --- GESTION DU MENU LATÉRAL ---

function openNav() {
    document.getElementById("sidebar").style.width = "250px";
    document.getElementById("mainContent").style.marginLeft = "250px";
    document.getElementById("top-bar").style.marginLeft = "250px";
}

function closeNav() {
    document.getElementById("sidebar").style.width = "0";
    document.getElementById("mainContent").style.marginLeft = "0";
    document.getElementById("top-bar").style.marginLeft = "0";
}

// Attacher l'événement au bouton de menu (fa-bars)
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', openNav);
    }
    
    // Initialise la Top Bar au chargement de chaque page
    updateTopBar();
});


// --- GESTION DE LA BARRE SUPÉRIEURE (TOP BAR) ---

/** * Met à jour l'affichage des pièces et du bouton Compte/Connexion
 * en fonction de l'état de l'utilisateur.
 */
window.updateTopBar = function() {
    // S'assurer que les fonctions d'auth sont chargées
    if (typeof getCurrentUser !== 'function') return; 
    
    const currentUser = getCurrentUser();
    
    const topBar = document.getElementById('top-bar');
    if (!topBar) return;

    // Rechercher les éléments à mettre à jour (ou les créer si non présents)
    let currencyDisplay = topBar.querySelector('.currency-display');
    let accountLink = topBar.querySelector('#account-link');
    let rightContainer = topBar.querySelector('#right-container');
    
    // Si le conteneur de droite n'existe pas, le créer (important pour l'ajout du nouveau bouton)
    if (!rightContainer) {
        // Chercher le div existant à droite (si le HTML est bien structuré)
        rightContainer = topBar.lastElementChild; 
        if (!rightContainer || rightContainer.id !== 'right-container') {
             // Si non, on suppose qu'il faut un div générique contenant l'espace des pièces et du compte
             rightContainer = document.createElement('div');
             rightContainer.id = 'right-container';
             rightContainer.style.cssText = 'display: flex; align-items: center; gap: 15px;';
             topBar.appendChild(rightContainer);
        }
    } else {
        // Vider le conteneur pour le reconstruire
        rightContainer.innerHTML = '';
    }

    if (currentUser) {
        // --- UTILISATEUR CONNECTÉ ---
        
        // 1. Affichage des Pièces
        if (!currencyDisplay) {
            currencyDisplay = document.createElement('a');
            currencyDisplay.href = 'boutique.html';
            currencyDisplay.className = 'currency-display';
            currencyDisplay.title = 'Boutique';
            currencyDisplay.innerHTML = `<span class="coin-count">${currentUser.coins}</span> <button id="trollButton" type="button">+</button>`;
        } else {
            currencyDisplay.querySelector('.coin-count').textContent = currentUser.coins;
        }
        rightContainer.appendChild(currencyDisplay);


        // 2. Bouton Mon Compte (Connecté)
        if (!accountLink) {
            accountLink = document.createElement('a');
            accountLink.id = 'account-link';
            accountLink.href = 'compte.html';
            accountLink.style.cssText = 'color: var(--color-text-light);';
            accountLink.title = 'Mon Compte';
            accountLink.innerHTML = '👤';
        }
        rightContainer.appendChild(accountLink);
        
        // 3. Bouton Admin (si admin)
        if (currentUser.role === 'admin') {
             let adminLink = topBar.querySelector('#admin-link');
             if (!adminLink) {
                 adminLink = document.createElement('a');
                 adminLink.id = 'admin-link';
                 adminLink.href = 'admin.html';
                 adminLink.style.cssText = 'color: var(--color-neon-red); font-size: 1.2em;';
                 adminLink.title = 'Panel Admin';
                 adminLink.innerHTML = '👑';
             }
             // Ajouter le lien Admin devant le lien Compte
             rightContainer.insertBefore(adminLink, accountLink);
        }

    } else {
        // --- UTILISATEUR DÉCONNECTÉ ---

        // 1. Bouton Connexion
        if (!accountLink) {
            accountLink = document.createElement('a');
            accountLink.id = 'account-link';
            accountLink.href = 'compte.html';
            accountLink.style.cssText = 'color: var(--color-neon-orange); font-weight: bold;';
            accountLink.title = 'Connexion/Inscription';
            accountLink.innerHTML = '🔑 Se connecter';
        } else {
             accountLink.href = 'compte.html';
             accountLink.style.cssText = 'color: var(--color-neon-orange); font-weight: bold;';
             accountLink.innerHTML = '🔑 Se connecter';
        }
        rightContainer.appendChild(accountLink);
    }
    
    // Rattachage du Troll Button
    const trollButton = document.getElementById('trollButton');
    if (trollButton) {
        trollButton.onclick = function() {
            if (currentUser) {
                updateCoins(100); 
                alert("100 pièces ajoutées ! (Pour les tests)");
            } else {
                alert("Connectez-vous pour gagner des pièces !");
            }
        };
    }
    
};
