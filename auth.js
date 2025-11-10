const STORAGE_KEY = 'arcadeMasterUsers';

// --- Fonctions de gestion des utilisateurs ---

function loadUsers() {
    const json = localStorage.getItem(STORAGE_KEY);
    let users = json ? JSON.parse(json) : {};

    let usersUpdated = false;

    // INITIALISATION OU CORRECTION FORCÉE DU RÔLE ADMIN
    // Si Zelda5962 n'existe pas, on le crée. S'il existe, on s'assure qu'il est 'admin'.
    if (!users["Zelda5962"] || users["Zelda5962"].role !== "admin") {
        users["Zelda5962"] = {
            // Utiliser les données existantes si elles sont là, sinon les défauts
            password: users["Zelda5962"] ? users["Zelda5962"].password : "password", 
            role: "admin", // <-- Rôle critique FORCÉ
            pdp: users["Zelda5962"] ? users["Zelda5962"].pdp : "https://i.imgur.com/39hN7hG.png", 
            games: users["Zelda5962"] ? users["Zelda5962"].games : {}
        };
        usersUpdated = true;
    }

    if (usersUpdated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        console.log("Compte Admin 'Zelda5962' créé/mis à jour en rôle Admin et sauvegardé.");
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

function registerUser(username, password, pdpURL = 'https://i.imgur.com/39hN7hG.png') {
    const users = loadUsers();
    if (users[username]) {
        return false; 
    }

    users[username] = {
        password: password,
        role: "user",
        pdp: pdpURL,
        games: {}
    };
    saveUsers(users);
    return true;
}

function deleteUser(username) {
    const currentUser = getCurrentUser();
    
    if (username === currentUser) { 
        alert("Vous ne pouvez pas supprimer votre propre compte depuis le panneau Admin."); 
        return; 
    }
    
    const users = loadUsers();
    if (users[username] && users[username].role === 'admin') { 
        alert("Impossible de supprimer un autre administrateur."); 
        return; 
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${username}" ? Cette action est irréversible.`)) {
        delete users[username];
        saveUsers(users);
        if (typeof renderAdminPanel === 'function') { 
            renderAdminPanel(); 
        } else { 
            window.location.reload(); 
        }
    }
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
    
    // Supprime l'ancien lien Admin
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
window.saveUsers = saveUsers;
window.getUserData = getUserData;
window.getCurrentUser = getCurrentUser;
window.registerUser = registerUser;
window.login = login;
window.logout = logout;
window.deleteUser = deleteUser;
window.renderAuthControls = renderAuthControls;
window.onload = renderAuthControls;
