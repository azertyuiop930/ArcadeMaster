// --- FONCTIONS DE BASE DE L'AUTHENTIFICATION ---

// Initialisation des utilisateurs mock si aucune donnée n'existe
const mockUsers = {
    'admin': { 
        password: 'password', 
        pdp: 'https://i.imgur.com/39hN7hG.png', 
        role: 'admin', 
        games: { 
            space_invaders: { highScore: 8000 } 
        } 
    },
    'joueur': { 
        password: 'pass', 
        pdp: '', 
        role: 'user', 
        games: { 
            space_invaders: { highScore: 2500 } 
        } 
    }
};

function loadUsers() {
    const usersData = localStorage.getItem('arcadeMasterUsers');
    if (!usersData) {
        // Initialiser avec les données mock si localStorage est vide
        localStorage.setItem('arcadeMasterUsers', JSON.stringify(mockUsers));
        return mockUsers;
    }
    return JSON.parse(usersData);
}

function saveUsers(users) {
    localStorage.setItem('arcadeMasterUsers', JSON.stringify(users));
}

function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

function login(username, password) {
    const users = loadUsers();
    if (users[username] && users[username].password === password) {
        localStorage.setItem('currentUser', username);
        return true;
    }
    return false;
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html'; // Redirige vers l'accueil
}

function registerUser(username, password, pdpUrl) {
    const users = loadUsers();
    if (users[username]) {
        return false; // Utilisateur déjà existant
    }
    
    const finalPdp = pdpUrl && pdpUrl.startsWith('http') ? pdpUrl : 'https://i.imgur.com/39hN7hG.png';

    users[username] = {
        password: password,
        pdp: finalPdp,
        role: 'user',
        games: { space_invaders: { highScore: 0 } } // Initialisation du score
    };
    saveUsers(users);
    return true;
}

function getUserData(username) {
    const users = loadUsers();
    return users[username] || null;
}

// --- FONCTION DE MISE À JOUR DU PROFIL (Utilisée dans authentification.html) ---
function updateUserData(username, newPassword, newPdp) {
    const users = loadUsers();
    const userData = users[username];
    let changed = false;

    if (!userData) return false;

    if (newPassword) {
        userData.password = newPassword;
        changed = true;
    }
    
    // Mettre à jour l'image de profil si l'URL est fournie ou vidée
    if (newPdp !== undefined) {
        const finalPdp = newPdp.trim().startsWith('http') ? newPdp.trim() : 'https://i.imgur.com/39hN7hG.png';
        if (userData.pdp !== finalPdp) {
             userData.pdp = finalPdp;
             changed = true;
        }
    }

    if (changed) {
        saveUsers(users);
        if (newPassword) {
            // Déconnexion forcée après changement de mot de passe
            localStorage.removeItem('currentUser'); 
        }
        return true;
    }
    return false;
}

// --- RENDU DE LA NAVBAR (Affichage de Connexion/Compte) ---

function renderAuthControls() {
    const authControls = document.getElementById('auth-controls');
    const sidebar = document.getElementById('sidebar');
    const user = getCurrentUser();
    
    if (authControls) {
        if (user) {
            const userData = getUserData(user);
            const pdpUrl = userData && userData.pdp ? userData.pdp : 'https://i.imgur.com/39hN7hG.png';

            authControls.innerHTML = `
                <a href="authentification.html" class="user-link">
                    <img src="${pdpUrl}" alt="PDP" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">
                    <span>${user}</span>
                </a>
                <button onclick="logout()">Déconnexion</button>
            `;
            
            // Ajout du lien Admin dans la sidebar si l'utilisateur est admin
            if (sidebar && userData && userData.role === 'admin' && !document.getElementById('admin-link')) {
                 const adminLink = document.createElement('a');
                 adminLink.href = 'admin.html'; // Assurez-vous d'avoir une page admin.html
                 adminLink.textContent = '⚙️ Admin';
                 adminLink.id = 'admin-link';
                 sidebar.appendChild(adminLink);
            }

        } else {
            authControls.innerHTML = `
                <a href="authentification.html">Connexion / Inscription</a>
            `;
            // Suppression du lien Admin si l'utilisateur n'est pas connecté ou est déconnecté
            const adminLink = document.getElementById('admin-link');
            if (adminLink) {
                 sidebar.removeChild(adminLink);
            }
        }
    }
}
