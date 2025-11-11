// --- LOGIQUE BASE.JS (MENU ET BARRE SUPÉRIEURE) ---

function openNav() {
    document.getElementById("sidebar").style.width = "250px";
    document.getElementById("mainContent").style.marginLeft = "250px";
}

function closeNav() {
    document.getElementById("sidebar").style.width = "0";
    document.getElementById("mainContent").style.marginLeft= "0";
}

// NOUVEAU: Fonction de mise à jour de la barre supérieure (CRUCIALE)
window.updateTopBar = function() {
    // Vérifie si la fonction getCurrentUser (dans auth.js) existe et si un utilisateur est connecté
    if (typeof getCurrentUser === 'function') {
        const user = getCurrentUser();
        const topBar = document.getElementById('top-bar');
        
        if (!topBar) return;

        // 1. Mise à jour de l'affichage des Pièces
        const coinCountElement = topBar.querySelector('.coin-count');
        if (coinCountElement) {
            coinCountElement.textContent = user ? user.coins : '0';
        }

        // 2. Mise à jour du Lien de Compte (Avatar/Pseudo vs. Personnage générique)
        let accountLink = topBar.querySelector('a[href="compte.html"]');

        if (accountLink) {
            accountLink.innerHTML = ''; // Nettoyer l'icône/contenu actuel

            if (user) {
                // Connecté : Afficher l'image de profil et le pseudo
                let profileImg = document.createElement('img');
                profileImg.className = 'top-bar-profile-pic';
                profileImg.src = user.profilePictureUrl || 'https://cdn-icons-png.flaticon.com/512/1144/1144760.png';
                profileImg.alt = 'Avatar';
                
                // Styles intégrés pour être sûr
                profileImg.style.width = '30px';
                profileImg.style.height = '30px';
                profileImg.style.borderRadius = '50%';
                profileImg.style.objectFit = 'cover';
                profileImg.style.marginRight = '5px';
                
                let usernameSpan = document.createElement('span');
                usernameSpan.className = 'top-bar-username';
                usernameSpan.textContent = user.username;
                usernameSpan.style.color = 'var(--color-neon-orange)';
                
                accountLink.appendChild(profileImg);
                accountLink.appendChild(usernameSpan);

            } else {
                // Déconnecté : Afficher le personnage générique '👤'
                accountLink.textContent = '👤';
            }
        }
    }
};

// Gestionnaire d'événement pour le bouton de menu
document.addEventListener('DOMContentLoaded', (event) => {
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', openNav);
    }
    // Exécuter la mise à jour au chargement initial
    updateTopBar();
});

// --- GESTION GLOBALE DU CODE KONAMI ---

const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
    // Éviter de déclencher si l'utilisateur tape dans un champ de texte
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    if (e.key === KONAMI_CODE[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === KONAMI_CODE.length) {
            alert("CODE KONAMI ACTIVÉ ! 💰 +50,000 Pièces !");
            
            // Logique de gain de pièces
            const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
            
            if (user && user.id !== 0) {
                 // Vrai utilisateur connecté
                 user.coins = (user.coins || 0) + 50000;
                 if (typeof updateGlobalUser === 'function') {
                    updateGlobalUser(user);
                 }
            } else {
                 // Utilisateur déconnecté/fantôme
                 localStorage.setItem('tempCheatCoins', (parseInt(localStorage.getItem('tempCheatCoins') || '0') + 50000));
            }

            // Mettre à jour l'affichage des pièces dans la barre supérieure
            if (typeof updateTopBar === 'function') {
                updateTopBar(); 
            }

            konamiIndex = 0; 
        }
    } else {
        konamiIndex = 0; 
    }
});
