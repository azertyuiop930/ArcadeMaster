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
let mousePos = { x: 0, y: 0 }; 

// --- VARIABLES POUR LES BONUS ---
let powerUps = [];
let isShieldActive = false;
let shieldTimer = 0;
let isShotgunActive = false; 
let shotgunTimer = 0;

// --- DÉFINITION DES ÉMOJIS ---
const EMOJIS = {
    player: '🚀', 
    invader: '👾',
    bullet: '⚡',  
    // Émojis pour les bonus
    shield_pu: '🛡️',
    bomb_pu: '💣',
    shotgun_pu: '🔫' 
};

// --- PARAMÈTRES D'AFFICHAGE ET JEU ---
const EMOJI_FONT_SIZE = 30;
const PLAYER_SIZE = 30;
const INVADER_SIZE = 30;
const POWERUP_SIZE = 30;
const INVADER_SPAWN_RATE = 120; // Nouvel ennemi toutes les 2 secondes
const POWERUP_SPAWN_CHANCE = 0.002; // ~1 chance sur 500 par frame


// --- FONCTION UTILITAIRE DE COLLISION (AABB) ---
function checkCollision(objA, objB) {
    return objA.x < objB.x + objB.width &&
           objA.x + objA.width > objB.x &&
           objA.y < objB.y + objB.height &&
           objA.y + objB.height > objB.y; // Correction dans le check de hauteur
}

// --- LOGIQUE DE SAUVEGARDE ET CLASSEMENT ---
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
        this.angle = 0;
        this.fireRateDelay = 200; // Délai de base (200ms)
    }

    update(keys) {
        let dx = 0;
        let dy = 0;
        
        // Mouvement ZQSD
        if (keys['z']) dy = -this.speed;
        if (keys['s']) dy = this.speed;
        if (keys['q']) dx = -this.speed;
        if (keys['d']) dx = this.speed;

        this.x = Math.max(0, Math.min(GAME_WIDTH - this.width, this.x + dx));
        this.y = Math.max(0, Math.min(GAME_HEIGHT - this.height, this.y + dy));
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        this.angle = Math.atan2(mousePos.y - centerY, mousePos.x - centerX);
    }
    
    shoot() {
        if (this.canShoot) {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            if (isShotgunActive) {
                // LOGIQUE FUSIL À POMPE (5 tirs en éventail)
                const spreadAngle = Math.PI / 18; // Angle d'écart (10 degrés)
                for (let i = -2; i <= 2; i++) {
                    const angleOffset = i * spreadAngle;
                    this.bullets.push(new Bullet(centerX, centerY, this.angle + angleOffset));
                }
            } else {
                // LOGIQUE TIR NORMAL (1 tir droit)
                this.bullets.push(new Bullet(centerX, centerY, this.angle));
            }
            
            this.canShoot = false;
            
            setTimeout(() => this.canShoot = true, this.fireRateDelay); 
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.translate(centerX, centerY);
        ctx.rotate(this.angle + Math.PI / 2);
        
        ctx.font = `${EMOJI_FONT_SIZE}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0); 
        
        ctx.restore();
        
        // Dessin du bouclier si actif
        if (isShieldActive) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, PLAYER_SIZE * 1.5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
            ctx.lineWidth = 4;
            ctx.stroke();
            // Affiche le temps restant 
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(Math.ceil(shieldTimer / 60) + 's', centerX, centerY + PLAYER_SIZE * 1.5 + 10);
        }
        
        this.bullets.forEach(b => b.draw(ctx));
    }
}

class Invader extends Entity {
    constructor(x, y) {
        super(x, y, INVADER_SIZE, INVADER_SIZE, 'invader');
        this.speed = 1.5;
        this.points = 10;
    }

    update(player) {
        const targetX = player.x + player.width / 2;
        const targetY = player.y + player.height / 2;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        const angle = Math.atan2(targetY - centerY, targetX - centerX);
        
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
    }
}

class PowerUp extends Entity {
    constructor(x, y, type) {
        const emojiKey = `${type}_pu`;
        super(x, y, POWERUP_SIZE, POWERUP_SIZE, emojiKey);
        this.type = type;
        this.dy = 1; // Le bonus descend lentement
    }
    
    update() {
        this.y += this.dy;
        // Si le bonus sort de l'écran, le marquer comme mort
        if (this.y > GAME_HEIGHT) {
            this.dead = true;
        }
    }
}


class Bullet extends Entity {
    constructor(x, y, angle) {
        super(x - 3, y - 3, 6, 6, 'bullet'); 
        this.angle = angle;
        this.speed = 10;
        this.lifeTime = 120; // 2 secondes
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.lifeTime--;
        if (this.lifeTime <= 0) this.dead = true;
    }

    draw(ctx) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}


// --- GESTION DES BONUS ---

function activatePowerUp(type) {
    if (type === 'shield') {
        isShieldActive = true;
        shieldTimer = 10 * 60; // 10 secondes
    } else if (type === 'bomb') {
        // Applique la bombe
        const enemiesKilled = invaders.length;
        updateScore(enemiesKilled * 10); 
        invaders = []; // Tue tous les ennemis
    } else if (type === 'shotgun') {
        // LOGIQUE FUSIL À POMPE
        isShotgunActive = true;
        shotgunTimer = 20 * 60; // 20 secondes
        player.fireRateDelay = 150; // Délai plus lent (150ms)
    }
}

function updatePowerUpTimers() {
    if (isShieldActive) {
        shieldTimer--;
        if (shieldTimer <= 0) {
            isShieldActive = false;
        }
    }
    
    if (isShotgunActive) {
        shotgunTimer--;
        if (shotgunTimer <= 0) {
            isShotgunActive = false;
            player.fireRateDelay = 200; // Rétablit le délai normal
        }
    }
}

function spawnPowerUp() {
    if (Math.random() < POWERUP_SPAWN_CHANCE) {
        const types = ['shield', 'bomb', 'shotgun'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const x = Math.random() * (GAME_WIDTH - POWERUP_SIZE);
        const y = -POWERUP_SIZE;
        
        powerUps.push(new PowerUp(x, y, type));
    }
}


// --- GESTION DU JEU PRINCIPALE ---

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
    let x, y;
    const padding = 10;
    const side = Math.floor(Math.random() * 4); 

    if (side === 0) { x = Math.random() * GAME_WIDTH; y = -padding; } 
    else if (side === 1) { x = GAME_WIDTH + padding; y = Math.random() * GAME_HEIGHT; } 
    else if (side === 2) { x = Math.random() * GAME_WIDTH; y = GAME_HEIGHT + padding; } 
    else { x = -padding; y = Math.random() * GAME_HEIGHT; }

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
        return !bullet.dead;
    });

    // 2. Collisions Envahisseurs vs Joueur
    invaders = invaders.filter(invader => {
        if (checkCollision(invader, player)) {
            if (isShieldActive) {
                 invader.dead = true; // Détruit l'ennemi sans perte de vie
            } else {
                 invader.dead = true; 
                 updateLives(-1); // Perte de vie
            }
        }
        return !invader.dead;
    });
    
    // 3. Collisions Joueur vs PowerUps
    powerUps = powerUps.filter(pu => {
        if (checkCollision(pu, player)) {
            activatePowerUp(pu.type);
            return false; // Supprimer le bonus
        }
        return !pu.dead; // Conserver s'il n'est pas mort (ou n'est pas sorti de l'écran)
    });
    
    // 4. Nettoyage
    player.bullets = player.bullets.filter(b => !b.dead);
}


function updateGame() {
    if (gameOver || !gameStarted) return;

    // 1. Mise à jour des Timers des bonus
    updatePowerUpTimers();

    // 2. Mise à jour du joueur (mouvement et angle)
    player.update(keys);
    
    // 3. Gestion des ennemis (spawn et mouvement)
    invaderSpawnCounter++;
    if (invaderSpawnCounter >= INVADER_SPAWN_RATE) {
        spawnInvader();
        invaderSpawnCounter = 0;
    }
    invaders.forEach(i => i.update(player));
    
    // 4. Spawn et mouvement des PowerUps
    spawnPowerUp();
    powerUps.forEach(pu => pu.update());
    
    // 5. Mise à jour des tirs
    player.bullets.forEach(b => b.update());

    // 6. Gestion des Collisions
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
    powerUps.forEach(pu => pu.draw(ctx)); 
    invaders.forEach(i => i.draw(ctx));
    player.draw(ctx);
    
    if (gameOver) {
         if (score > 0) {
             updatePersonalHighScore(score);
             renderScoreBoard(); 
         }
         
         ctx.fillStyle = 'red';
         ctx.font = '35px Arial'; 
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
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
});

document.addEventListener('mousedown', (e) => {
    if (gameStarted && !gameOver && e.button === 0) { 
        player.shoot();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'z' || e.key === 'Z') keys['z'] = true;
    if (e.key === 's' || e.key === 'S') keys['s'] = true;
    if (e.key === 'q' || e.key === 'Q') keys['q'] = true;
    if (e.key === 'd' || e.key === 'D') keys['d'] = true;
    
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
    invaders = []; 
    powerUps = []; 
    
    // Réinitialisation des états des bonus
    isShieldActive = false;
    shieldTimer = 0;
    isShotgunActive = false;
    shotgunTimer = 0;
    
    player = new Player(); 
    
    scoreElement.textContent = score;
    livesElement.textContent = lives;

    gameLoopInterval = setInterval(gameLoop, 1000 / 60); 
}

document.addEventListener('DOMContentLoaded', () => {
    renderScoreBoard(); 
    drawGame(); 
});
