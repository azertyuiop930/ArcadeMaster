/**
 * Fichier : base.js
 * Description : Scripts de base pour le site : gestion du Menu Hamburger,
 * affichage des pièces, et fonction troll.
 */

const RICKROLL_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

// État du jeu (Doit être synchronisé avec auth.js plus tard)
let playerCoins = 100; // Pièces initiales

// =========================================================
// 1. GESTION DU MENU HAMBURGER
// =========================================================

function openNav() {
    document.getElementById("sidebar").style.width = "250px";
    // Décale le contenu principal
    document.getElementById("mainContent").style.marginLeft = "250px"; 
}

function closeNav() {
    document.getElementById("sidebar").style.width = "0";
    document.getElementById("mainContent").style.marginLeft = "0"; 
}

// =========================================================
// 2. GESTION DE LA MONNAIE (Pièces)
// =========================================================

/** Affiche le nombre de pièces du joueur (Utilisé par toutes les pages) */
function updateCoinDisplay() {
    // Met à jour l'affichage des pièces dans la barre supérieure et le menu
    const coinElements = document.querySelectorAll('.coin-count');
    coinElements.forEach(el => {
        el.textContent = playerCoins;
    });
}

/** Fonction pour le bouton troll du Rickroll */
function initiateTroll() {
    // ANCIEN CODE : alert("Achats de pièces indisponibles. Vous avez été Rickrollé !");
    
    // Ouvre la vidéo dans une nouvelle fenêtre
    window.open(RICKROLL_URL, '_blank'); 
}


// =========================================================
// 3. INITIALISATION
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    // Attache les événements du menu hamburger
    const menuToggle = document.getElementById('menuToggle');
    const closeButton = document.getElementById('closeNav');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', openNav);
    }
    if (closeButton) {
        closeButton.addEventListener('click', closeNav);
    }
    
    // Attache l'événement du bouton troll (Top Bar)
    const trollButton = document.getElementById('trollButton');
    if (trollButton) {
        trollButton.addEventListener('click', initiateTroll);
    }
    
    // Attache l'événement du bouton troll (Bottom Button, ex: Boutique)
    const trollBottomBtn = document.getElementById('trollButtonBottom');
    if (trollBottomBtn) {
        trollBottomBtn.addEventListener('click', initiateTroll);
    }
    
    // Initialise l'affichage des pièces au chargement
    updateCoinDisplay();
});
