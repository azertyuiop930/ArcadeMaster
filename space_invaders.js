// --- VARIABLES GLOBALES DU JEU ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreValue');
const livesElement = document.getElementById('livesValue');
const personalHighScoreElement = document.getElementById('personalHighScore');
const leaderboardList = document.getElementById('leaderboardList');

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

let gameLoopInterval;
let score = 0;
let lives = 3;
let gameOver = false;
let gameStarted = false;
let mousePos = { x: 0, y: 0 }; // Nouvelle variable pour la position de la souris

// --- DÉFINITION DES ÉMOJIS ---
const EMOJIS = {
    player: '🚀', 
    invader: '👾', // Un seul type d'ennemi simple
    bullet: '⚡',  
};

// --- PARAMÈTRES D'AFFICHAGE ET JEU ---
const EMOJI_FONT_SIZE = 30;
const PLAYER_SIZE = 30;
const INVADER_SIZE = 30;
const INVADER_SPAWN_RATE = 120; // Nouvel ennemi toutes les 120 frames (2 secondes)


// --- FONCTION UTILITAIRE DE COLLISION (AABB) ---
function checkCollision(objA, objB) {
    return objA.x < objB.x + objB.width &&
           objA.x + objA.width > objB.x &&
           objA.y < objB.y + objB.height &&
           objA.y + objA.height > objB.y;
}

// --- LOGIQUE DE SAUVEGARDE ET CLASSEMENT (Utilise auth.js si disponible) ---
// (Rendu identique à la version précédente, car la logique de score n'a pas changé)

function getHighScores() {
    const users = typeof loadUsers === 'function' ? loadUsers() : {};
    let highScores = [];

    for (const username in users) {
        const userData = users[username];
        const highScore = userData.games && userData.games.space_invaders ? userData.games.space_invaders.highScore : 0;
        if (highScore > 0) {
            highScores.push({ username, score: highScore });
        }
    }
    
    if (highScores.length === 0 && typeof loadUsers !== 'function') {
        highScores = [
            { username: 'Arcade_King', score: 5000 },
            { username: 'Zelda5962', score: 2500 }, 
            { username: 'RetroPlayer', score: 1800 },
        ];
    }

    highScores.sort((a, b) => b.score - a.score);
    return highScores;
}

function updatePersonalHighScore(newScore) {
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    
    if (!currentUser || typeof loadUsers !== 'function') return false;

    const users = loadUsers();
    const userData = users[currentUser];
    
    if (!userData.games) userData.games = {};
    if (!userData.games.space_invaders) userData.games.space_invaders = { highScore: 0 };
    
    if (newScore > userData.games.space_invaders.highScore) {
        userData.games.space_invaders.highScore = newScore;
        saveUsers(users); 
        return true;
    }
    return false;
}

function renderScoreBoard() {
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const highScores = getHighScores();
    
    let html = '';
    let foundPersonalScore = false;

    highScores.slice(0, 10).forEach((item, index) => {
        const isCurrentUser = item.username === currentUser;
        const style = isCurrentUser ? 'style="color: #00ff00; font-weight: bold;"' : '';
        html += `<li ${style}><span>${index + 1}. ${item.username}</span> <span>${item.score}</span></li>`;
        if (isCurrentUser) foundPersonalScore = true;
    });

    leaderboardList.innerHTML = html;

    const personalScore = highScores.find(item => item.username === currentUser);
    const personalHighScoreValue = personalScore ? personalScore.score : 0;
    
    personalHighScoreElement.textContent = personalHighScoreValue;
    
    if (currentUser && !foundPersonalScore && personalScore) {
        const userRank = highScores.findIndex(item => item.username === currentUser) + 1;
        if (userRank > 10) {
             leaderboardList.innerHTML += `<li style="margin-top: 10px; color: #f39c12; font-weight: bold;"><span>...</span> <span>...</span></li>`;
             leaderboardList.innerHTML += `<li style="color: #00ff00; font-weight: bold;"><span>${userRank}. ${currentUser}</span> <span>${personalHighScoreValue}</span></li>`;
        }
    }
}


// --- CLASSES DES ENTITÉS ---

class Entity {
    constructor(x, y, width, height, emojiKey) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.emoji = EMOJIS[emojiKey];
        this.dead = false;
    }
    
    draw(ctx) {
        // Le dessin pour les entités simples (aliens) reste le même
        ctx.font = `${EMOJI_FONT_SIZE}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x + this.width / 2, this.y + this.height / 2);
    }
}

class Player extends Entity {
    constructor() {
        super(GAME_WIDTH / 2 - (PLAYER_SIZE / 2), GAME_HEIGHT / 2 - (PLAYER_SIZE / 2), PLAYER_SIZE, PLAYER_SIZE, 'player');
        this.speed = 4;
        this.bullets = [];
        this.canShoot = true;
        this.angle = 0; // Nouvel attribut pour l'angle de rotation
    }

    update(keys) {
        let dx = 0;
        let dy = 0;
        
        // Mouvement ZQSD
        if (keys['z']) dy = -this.speed;
        if (keys['s']) dy = this.speed;
        if (keys['q']) dx = -this.speed;
        if (keys['d']) dx = this.speed;

        // Mise à jour de la position (avec bornes)
        this.x = Math.max(0, Math.min(GAME_WIDTH - this.width, this.x + dx));
        this.y = Math.max(0, Math.min(GAME_HEIGHT - this.height, this.y + dy));
        
        // Calcul de l'angle vers la souris
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        this.angle = Math.atan2(mousePos.y - centerY, mousePos.x - centerX);
    }
    
    shoot() {
        if (this.canShoot) {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            // Création de la balle avec l'angle du joueur (rotation de 90 degrés car l'emoji pointe vers le haut)
            this.bullets.push(new Bullet(centerX, centerY, this.angle));
            this.canShoot = false;
            setTimeout(() => this.canShoot = true, 200); // Temps de rechargement rapide
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // 1. Déplacer l'origine au centre de l'objet
        ctx.translate(centerX, centerY);
        
        // 2. Rotation : 90 degrés supplémentaires car l'émoji 🚀 est vertical
        ctx.rotate(this.angle + Math.PI / 2);
        
        // 3. Dessiner l'émoji
        ctx.font = `${EMOJI_FONT_SIZE}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // On dessine à (-width/2, -height/2) si l'origine était en haut à gauche
        // Ici, on dessine en (0, 0) car l'origine est au centre
        ctx.fillText(this.emoji, 0, 0); 
        
        ctx.restore();
        
        // Dessin des tirs
        this.bullets.forEach(b => b.draw(ctx));
    }
}

class Invader extends Entity {
    constructor(x, y) {
        super(x, y, INVADER_SIZE, INVADER_SIZE, 'invader');
        this.speed = 1.5;
        this.points = 10;
    }

    // Le monstre fonce sur le joueur
    update(player) {
        const targetX = player.x + player.width / 2;
        const targetY = player.y + player.height / 2;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        const angle = Math.atan2(targetY - centerY, targetX - centerX);
        
        // Mouvement vers le joueur
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
    }
}

class Bullet extends Entity {
    constructor(x, y, angle) {
        // La taille est plus petite pour la collision
        super(x - 3, y - 3, 6, 6, 'bullet'); 
        this.angle = angle;
        this.speed = 10;
        this.lifeTime = 120; // Durée de vie en frames (2 secondes)
    }

    update() {
        // Mouvement dans la direction de l'angle
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.lifeTime--;
        if (this.lifeTime <= 0) this.dead = true;
    }

    draw(ctx) {
        // Dessin simple pour la balle
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}


// --- GESTION DU JEU ---

let player;
let invaders = [];
let keys = {};
let invaderSpawnCounter = 0;


function updateScore(points) {
    score += points;
    scoreElement.textContent = score;
}

function updateLives(amount) {
    lives += amount;
    livesElement.textContent = lives;
    if (lives <= 0) {
        gameOver = true;
    }
}

function spawnInvader() {
    // Fait apparaître les ennemis sur un des bords de l'écran
    let x, y;
    const padding = 10;
    const side = Math.floor(Math.random() * 4); // 0: haut, 1: droite, 2: bas, 3: gauche

    if (side === 0) { // Haut
        x = Math.random() * GAME_WIDTH;
        y = -padding;
    } else if (side === 1) { // Droite
        x = GAME_WIDTH + padding;
        y = Math.random() * GAME_HEIGHT;
    } else if (side === 2) { // Bas
        x = Math.random() * GAME_WIDTH;
        y = GAME_HEIGHT + padding;
    } else { // Gauche
        x = -padding;
        y = Math.random() * GAME_HEIGHT;
    }

    invaders.push(new Invader(x, y));
}

function handleCollisions() {
    // 1. Collisions Tirs Joueur vs Envahisseurs
    player.bullets = player.bullets.filter(bullet => {
        
        invaders.forEach((invader) => {
            if (checkCollision(bullet, invader)) {
                invader.dead = true;
                bullet.dead = true;
                updateScore(invader.points);
            }
        });
        
        // Nettoyage : Garder si non touché ET encore en vie
        return !bullet.dead;
    });

    // 2. Collisions Envahisseurs vs Joueur
    invaders = invaders.filter(invader => {
        if (checkCollision(invader, player)) {
            // Le monstre touche le joueur, les deux sont retirés pour l'instant
            invader.dead = true; 
            updateLives(-1);
        }
        
        // Nettoyage : Garder si non touché ET encore en vie
        return !invader.dead;
    });

    // 3. Nettoyage des tirs qui ont atteint leur durée de vie
    player.bullets = player.bullets.filter(b => !b.dead);
}


function updateGame() {
    if (gameOver || !gameStarted) return;

    // 1. Mise à jour du joueur (mouvement et angle)
    player.update(keys);
    
    // 2. Gestion des ennemis (spawn et mouvement)
    invaderSpawnCounter++;
    if (invaderSpawnCounter >= INVADER_SPAWN_RATE) {
        spawnInvader();
        invaderSpawnCounter = 0;
    }
    
    invaders.forEach(i => i.update(player));
    
    // 3. Mise à jour des tirs
    player.bullets.forEach(b => b.update());

    // 4. Gestion des Collisions
    handleCollisions();
}

function drawGame() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (!gameStarted) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ZQSD pour bouger, Souris pour viser et cliquer pour tirer', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
        ctx.fillText('Appuyez sur ESPACE pour commencer', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
        return;
    }

    // Dessiner les entités
    invaders.forEach(i => i.draw(ctx));
    player.draw(ctx);
    

    if (gameOver) {
         // Sauvegarde du score si c'est un record
         if (score > 0) {
             updatePersonalHighScore(score);
             renderScoreBoard(); 
         }
         
         ctx.fillStyle = 'red';
         ctx.font = '35px Arial'; // --- CORRECTION TAILLE DE TEXTE
         ctx.textAlign = 'center';
         
         const message = lives <= 0 ? 'GAME OVER - Les envahisseurs vous ont eu !' : 'VICTOIRE TECHNIQUE !';
         ctx.fillText(message, GAME_WIDTH / 2, GAME_HEIGHT / 2);
         
         ctx.font = '20px Arial';
         ctx.fillText(`Score final: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
         ctx.fillText(`Appuyez sur Entrée pour rejouer`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
    }
}

function gameLoop() {
    updateGame();
    drawGame();
}

// --- GESTION DES ÉVÉNEMENTS ---

document.addEventListener('mousemove', (e) => {
    // Calcul de la position de la souris par rapport au Canvas
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
});

document.addEventListener('mousedown', (e) => {
    if (gameStarted && !gameOver && e.button === 0) { // Clic gauche (0)
        player.shoot();
    }
});

document.addEventListener('keydown', (e) => {
    // Touches ZQSD pour le mouvement
    if (e.key === 'z' || e.key === 'Z') keys['z'] = true;
    if (e.key === 's' || e.key === 'S') keys['s'] = true;
    if (e.key === 'q' || e.key === 'Q') keys['q'] = true;
    if (e.key === 'd' || e.key === 'D') keys['d'] = true;
    
    // Espace pour démarrer
    if (e.code === 'Space' && !gameOver && !gameStarted) {
        startGame();
        e.preventDefault(); 
    }
    if (gameOver && e.code === 'Enter') {
        startGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'z' || e.key === 'Z') keys['z'] = false;
    if (e.key === 's' || e.key === 'S') keys['s'] = false;
    if (e.key === 'q' || e.key === 'Q') keys['q'] = false;
    if (e.key === 'd' || e.key === 'D') keys['d'] = false;
});


// --- INITIALISATION DU JEU ---

function startGame() {
    if (gameLoopInterval) clearInterval(gameLoopInterval); 
    
    score = 0;
    lives = 3;
    gameOver = false;
    gameStarted = true;
    keys = {};
    invaders = []; // Les anciens envahisseurs sont supprimés
    
    player = new Player();
    
    scoreElement.textContent = score;
    livesElement.textContent = lives;

    gameLoopInterval = setInterval(gameLoop, 1000 / 60); 
}

document.addEventListener('DOMContentLoaded', () => {
    renderScoreBoard(); 
    drawGame(); 
});
