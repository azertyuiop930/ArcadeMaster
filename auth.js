const STORAGE_KEY = 'arcadeMasterUsers';

// --- Fonctions de gestion des utilisateurs ---

function loadUsers() {
    const json = localStorage.getItem(STORAGE_KEY);
    let users = json ? JSON.parse(json) : {};

    // INITIALISATION FORCÉE DE L'ADMIN
    if (!users["Zelda5962"]) {
        users["Zelda5962"] = {
            password: "password", 
            role: "admin", 
            pdp: "https://i.imgur.com/39hN7hG.png", 
            games: {} 
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }
    return users;
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function getUserData(username) {
    const users = loadUsers();
    return users[username] || null;
}

function getCurrentUser() {
    return sessionStorage.getItem('currentUser');
}

function login(username, password) {
    const users = loadUsers();
    const user = users[username];

    if (user && user.password === password) {
        sessionStorage.setItem('currentUser', username);
        if (typeof renderAuthControls === 'function') {
             renderAuthControls();
        }
        return true;
    }
    return false;
}

function logout() {
    sessionStorage.removeItem('currentUser');
    if (typeof renderAuthControls === 'function') {
        renderAuthControls();
    }
    window.location.href = 'index.html'; 
}


// --- Fonction de rendu de l'interface (Navbar & Sidebar) ---

function renderAuthControls() {
    const currentUser = getCurrentUser();
    const authControls = document.getElementById('auth-controls');
    const sidebar = document.getElementById('sidebar');
    
    if (!authControls || !sidebar) {
        return;
    }

    let authHTML = '';
    
    const oldAdminLink = sidebar.querySelector('a[href="admin.html"]');
    if (oldAdminLink) sidebar.removeChild(oldAdminLink);

    if (currentUser) {
        const userData = getUserData(currentUser);

        if (userData) {
            const pdpUrl = userData.pdp ? userData.pdp : 'https://i.imgur.com/39hN7hG.png';
            
            authHTML = `
                <span style="color: #00ff00; font-weight: bold; margin-right: 10px;">${currentUser}</span>
                <img src="${pdpUrl}" alt="PDP" style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid #00ff00; vertical-align: middle; margin-right: 5px;">
                <a href="authentification.html" title="Mon Compte" style="color: white; margin-left: 10px;">Compte</a>
                <a href="#" onclick="logout(); return false;" title="Déconnexion" style="color: #e74c3c; margin-left: 15px;">Déconnexion</a>
            `;

            // AJOUT CRITIQUE DU LIEN ADMIN
            if (userData.role === 'admin') { 
                 const adminLinkHTML = '<a href="admin.html" style="color: #f39c12;">🛡️ Admin Panel</a>';
                 sidebar.insertAdjacentHTML('beforeend', adminLinkHTML);
            }
        } else {
             logout();
             return;
        }

    } else {
        authHTML = `<a href="authentification.html" style="color: white;">Connexion / Inscription</a>`;
    }

    authControls.innerHTML = authHTML;
}

// Globalisation et Exécution Sûre
window.loadUsers = loadUsers;
window.getUserData = getUserData;
window.getCurrentUser = getCurrentUser;
window.login = login;
window.logout = logout;
window.renderAuthControls = renderAuthControls;
window.onload = renderAuthControls;
