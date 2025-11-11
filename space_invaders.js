/**
 * Fichier : space_invaders.js
 * Description : Logique du jeu Space Invaders (version Emoji).
 * Interagit avec auth.js pour les scores.
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- CONSTANTES DE JEU ---
const GAME_NAME = 'space_invaders';
const GRID_SIZE = 40;
const PLAYER_SIZE = GRID_SIZE;
const ALIEN_SIZE = GRID_SIZE;
const BULLET_SIZE = 5;

// --- ÉTAT DU JEU ---
let score = 0;
let lives = 3;
let gameLoopInterval;
let gameOver = false;
let wave = 1;

// --- OBJETS DU JEU ---
let player;
let aliens = [];
let bullets = []; // Tirs du joueur
let alienBullets = []; // Tirs des aliens
let keys = {};

// --- VITESSE ---
const ALIEN_MOVE_INTERVAL = 1000; // Mouvement initial des aliens (ms)
let alienMoveSpeed = 10; // Pixels par mouvement
let alienMoveTimer;

// --- EMOJIS (Textures) ---
const EMOJI = {
    PLAYER: '🚀', // Fusée
    ALIEN: '👾', // Alien
    BULLET: '⚡', // Foudre
    ALIEN_BULLET: '🔴' // Cercle rouge
};

// =========================================================
// 1. CLASSES ET CONSTRUCTEURS
// =========================================================

class Entity {
    constructor(x, y, size, emoji, dx = 0, dy = 0) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.emoji = emoji;
        this.dx = dx;
        this.dy = dy;
    }

    draw() {
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(this.emoji, this.x + this.size / 2, this.y + this.size * 0.85);
    }
}

// =========================================================
// 2. FONCTIONS DE JEU
// =========================================================

/** Initialise ou réinitialise le jeu */
function initGame() {
    score = 0;
    lives = 3;
    wave = 1;
    gameOver = false;
    bullets = [];
    alienBullets = [];
    
    // Vitesse de base des aliens
    alienMoveTimer = ALIEN_MOVE_INTERVAL;
    alienMoveSpeed = 10; 
    
    // Initialisation du joueur
    player = new Entity(
        canvas.width / 2 - PLAYER_SIZE / 2,
        canvas.height - PLAYER_SIZE - 20,
        PLAYER_SIZE,
        EMOJI.PLAYER
    );

    createAliens();
    updateScoreBoard();
    
    // Démarrage de la boucle de jeu
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS
}

/** Crée une nouvelle vague d'aliens */
function createAliens() {
    aliens = [];
    const rows = 4 + Math.min(wave, 2); // 4 ou 5 rangées
    const cols = 8;
    const paddingX = (canvas.width - cols * ALIEN_SIZE * 1.5) / 2;
    const paddingY = 50;
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            aliens.push(new Entity(
                paddingX + c * (ALIEN_SIZE * 1.5),
                paddingY + r * (ALIEN_SIZE * 1.5),
                ALIEN_SIZE,
                EMOJI.ALIEN,
                alienMoveSpeed, // Vitesse de déplacement horizontale
                0
            ));
        }
    }
}

// --- Mouvements ---

let alienDirection = 1; // 1 = droite, -1 = gauche
let lastAlienMoveTime = 0;

function moveAliens(deltaTime) {
    lastAlienMoveTime += deltaTime;

    if (lastAlienMoveTime >= alienMoveTimer) {
        let shouldDrop = false;

        // Vérifie si un alien touche le bord
        for (const alien of aliens) {
            if (alien.x + ALIEN_SIZE + alien.dx * (alienMoveTimer / 1000) > canvas.width || alien.x + alien.dx * (alienMoveTimer / 1000) < 0) {
                alienDirection *= -1;
                shouldDrop = true;
                break;
            }
        }

        // Déplace et fait descendre si nécessaire
        for (const alien of aliens) {
            if (shouldDrop) {
                alien.y += 20; // Descend
            }
            // Déplace latéralement
            alien.x += alienDirection * alienMoveSpeed;
            
            // Vérifie la défaite
            if (alien.y + ALIEN_SIZE > player.y) {
                endGame(false);
                return;
            }
        }
        
        // Accélération de la vitesse et de la fréquence de tir
        alienMoveTimer = Math.max(200, ALIEN_MOVE_INTERVAL - aliens.length * 50);

        lastAlienMoveTime = 0;
    }
}

function movePlayer() {
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.x = Math.max(0, player.x - 5);
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.x = Math.min(canvas.width - PLAYER_SIZE, player.x + 5);
    }
}

function moveBullets() {
    // Balles du joueur
    bullets = bullets.filter(bullet => {
        bullet.y -= 7;
        return bullet.y > 0;
    });

    // Balles des aliens
    alienBullets = alienBullets.filter(bullet => {
        bullet.y += 3;
        return bullet.y < canvas.height;
    });
}

// --- Tirs ---
let lastShotTime = 0;
const shotDelay = 300; // délai minimum entre les tirs (ms)

function fireBullet() {
    const currentTime = Date.now();
    if (currentTime - lastShotTime > shotDelay) {
        bullets.push(new Entity(
            player.x + PLAYER_SIZE / 2 - BULLET_SIZE / 2,
            player.y,
            20,
            EMOJI.BULLET
        ));
        lastShotTime = currentTime;
    }
}

function alienFire() {
    if (aliens.length > 0 && Math.random() < 0.02) { // 2% de chance par boucle de jeu
        const shooter = aliens[Math.floor(Math.random() * aliens.length)];
        alienBullets.push(new Entity(
            shooter.x + ALIEN_SIZE / 2 - BULLET_SIZE / 2,
            shooter.y + ALIEN_SIZE,
            20,
            EMOJI.ALIEN_BULLET
        ));
    }
}

// --- Collision ---

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.size &&
           obj1.x + obj1.size > obj2.x &&
           obj1.y < obj2.y + obj2.size &&
           obj1.y + obj1.size > obj2.y;
}

function checkCollisions() {
    // 1. Tirs du joueur vs Aliens
    bullets.forEach((bullet, bIndex) => {
        aliens.forEach((alien, aIndex) => {
            if (checkCollision(bullet, alien)) {
                // Collision : retire le tir et l'alien
                bullets.splice(bIndex, 1);
                aliens.splice(aIndex, 1);
                score += 10;
                updateScoreBoard();
            }
        });
    });

    // 2. Tirs des Aliens vs Joueur
    alienBullets.forEach((bullet, bIndex) => {
        if (checkCollision(bullet, player)) {
            alienBullets.splice(bIndex, 1);
            lives--;
            updateScoreBoard();
            
            if (lives <= 0) {
                endGame(false);
            }
        }
    });

    // Vérifie si la vague est terminée
    if (aliens.length === 0) {
        nextWave();
    }
}

// --- Vagues et Fin de Jeu ---

function nextWave() {
    wave++;
    bullets = [];
    alienBullets = [];
    alert(`Vague ${wave} ! Préparez-vous.`);
    createAliens();
    // Accélération des aliens
    alienMoveSpeed += 5; 
}

function endGame(win) {
    if (gameOver) return;
    gameOver = true;
    clearInterval(gameLoopInterval);
    
    // Sauvegarde du high score (Fonction de auth.js)
    // IMPORTANT : S'assurer que le fichier auth.js est chargé AVANT space_invaders.js
    if (typeof saveHighScore === 'function') {
        saveHighScore(GAME_NAME, score);
    }
    
    const message = win ? 
        `VICTOIRE ! Score final : ${score}` :
        `GAME OVER ! Votre score : ${score}.`;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#E0E0E0';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center'; // Assure le centrage du texte de fin
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    
    // Mise à jour finale du leaderboard après la sauvegarde
    updateLeaderboard();
}

// =========================================================
// 3. AFFICHAGE ET BOUCLE DE JEU
// =========================================================

function draw() {
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    player.draw();
    aliens.forEach(alien => alien.draw());
    bullets.forEach(bullet => bullet.draw());
    alienBullets.forEach(bullet => bullet.draw());
}

let lastTime = 0;

function gameLoop(currentTime = 0) {
    if (gameOver) return;
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // 1. Mise à jour des positions
    movePlayer();
    moveAliens(deltaTime);
    moveBullets();
    
    // 2. Tirs des aliens
    alienFire();
    
    // 3. Détection des collisions
    checkCollisions();
    
    // 4. Affichage
    draw();
    
    // Utilise requestAnimationFrame pour une boucle plus fluide, mais on conserve l'intervalle pour la gestion de la vitesse
    // requestAnimationFrame(gameLoop); // Optionnel si on préfère requestAnimationFrame
}

// =========================================================
// 4. GESTION DES SCORES ET UI
// =========================================================

function updateScoreBoard() {
    document.getElementById('currentScore').textContent = score;
    document.getElementById('livesCount').textContent = lives;
    
    // Récupère le high score personnel depuis auth.js
    if (typeof getPersonalHighScore === 'function') {
        const personal = getPersonalHighScore(GAME_NAME);
        document.getElementById('personalHighScore').textContent = personal;
    }
    
    updateLeaderboard();
}

function updateLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return;
    
    leaderboardList.innerHTML = '';
    
    // Récupère les top scores depuis auth.js
    if (typeof getLeaderboard === 'function') {
        const leaderboard = getLeaderboard(GAME_NAME);
        
        if (leaderboard.length === 0) {
            leaderboardList.innerHTML = '<li>Aucun score enregistré. Soyez le premier!</li>';
            return;
        }
        
        leaderboard.forEach((item, index) => {
            const li = document.createElement('li');
            let roleIcon = '';
            if (item.role === 'admin') {
                roleIcon = '<i class="fa-solid fa-shield-halved" style="color: #FFD700; margin-right: 5px;"></i>';
            }
            li.innerHTML = `${index + 1}. ${roleIcon}${item.username} : **${item.score}**`;
            leaderboardList.appendChild(li);
        });
    } else {
        leaderboardList.innerHTML = '<li>Connectez-vous pour voir les scores.</li>';
    }
}

// =========================================================
// 5. GESTION DES ENTRÉES
// =========================================================

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') {
        fireBullet();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});


// =========================================================
// 6. DÉMARRAGE
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    // Lancement du jeu
    initGame();
});
