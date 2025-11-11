/**
 * Fichier : space_invaders.js
 * Description : Logique du jeu Space Invaders (version 2.0).
 * Interagit avec auth.js pour l'enregistrement des scores et des pièces.
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- CONSTANTES DE JEU ---
const GAME_NAME = 'space_invaders';
const GRID_SIZE = 40; // Taille principale pour le joueur et les aliens
const PLAYER_SIZE = GRID_SIZE;
const ALIEN_SIZE = GRID_SIZE;
const BULLET_SIZE = 20; 
const POINTS_PER_KILL = 10;
const COINS_PER_KILL = 1; // 1 Pièce par ennemi tué

// --- LOGIQUE DE GAIN DE PIÈCES SUPPLÉMENTAIRES ---
const COINS_BONUS_SCORE = 100; // Seuil de score
const COINS_BONUS_AMOUNT = 10; // Pièces gagnées par bonus
let lastCoinBonusScore = 0; // Le score où le dernier bonus a été distribué

// --- ÉTAT DU JEU ---
let score = 0;
let lives = 3;
let coinsGained = 0;
let gameLoopInterval;
let gameOver = false;
let wave = 1;
let lastTime = 0;

// --- OBJETS DU JEU ---
let player;
let aliens = [];
let bullets = []; 
let keys = {};
let mousePos = { x: 0, y: 0 }; 

// --- VITESSE ET TIMING ---
const ALIEN_MOVE_INTERVAL = 1000; // Mouvement initial des aliens (ms)
let alienMoveSpeed = 10; // Pixels par mouvement
let alienMoveTimer;
let playerMoveSpeed = 5;

// --- BONUS ET COOLDOWNS ---
let isShieldActive = false;
let isShotgunActive = false;
const SHOTGUN_DURATION = 20000; // 20 secondes
const SHIELD_DURATION = 10000;  // 10 secondes
const BASE_SHOT_DELAY = 150; // Délai de tir normal (ms)
const SHOTGUN_SHOT_DELAY = 400; // Délai de tir du shotgun (ms)
let lastShotTime = 0;

// --- EMOJIS (Textures) ---
let EMOJI = {
    PLAYER: '🚀',
    ALIEN: '👾',
    BULLET: '⚡',
    SHIELD: '🛡️',
    SHOTGUN: '💥'
};

let powerUps = []; 

// =========================================================
// 1. CLASSES ET CONSTRUCTEURS
// =========================================================

class Entity {
    constructor(x, y, size, emoji) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.emoji = emoji;
        this.isAlive = true;
    }

    draw() {
        // CORRECTION D'AFFICHAGE: Utilise la taille pour définir la taille de la police
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        // Dessine l'émoji centré par rapport à la taille
        // Le 0.85 est un ajustement vertical pour centrer l'émoji sur la ligne de base du texte
        ctx.fillText(this.emoji, this.x + this.size / 2, this.y + this.size * 0.85);
    }
}

class Player extends Entity {
    constructor(x, y, size, emoji) {
        super(x, y, size, emoji);
    }
    
    draw() {
        // Dessine le bouclier si actif
        if (isShieldActive) {
            ctx.beginPath();
            // Le cercle de bouclier est légèrement plus grand que le joueur
            ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)'; // Cyan transparent
            ctx.fill();
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Dessine le joueur (skin dynamique)
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(EMOJI.PLAYER, this.x + this.size / 2, this.y + this.size * 0.85);
    }
}


// =========================================================
// 2. INITIALISATION ET VAGUES
// =========================================================

/** Synchronise le skin actif depuis auth.js */
function syncPlayerSkin() {
    if (typeof getCurrentUser === 'function') {
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.skins && currentUser.skins.active) {
            EMOJI.PLAYER = currentUser.skins.active.ship || '🚀';
        } else {
            EMOJI.PLAYER = '🚀'; // Défaut
        }
    }
}

/** Initialise ou réinitialise le jeu */
window.initGame = function() {
    if (!canvas || !ctx) {
        console.error("Canvas ou contexte non trouvé. Le jeu ne peut pas démarrer.");
        return;
    }
    
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    
    syncPlayerSkin();
    
    score = 0;
    lives = 3;
    coinsGained = 0;
    wave = 1;
    gameOver = false;
    bullets = [];
    aliens = [];
    isShieldActive = false;
    isShotgunActive = false;
    lastCoinBonusScore = 0;
    
    alienMoveTimer = ALIEN_MOVE_INTERVAL;
    alienMoveSpeed = 10;
    
    // Initialise le joueur
    player = new Player(
        canvas.width / 2 - PLAYER_SIZE / 2,
        canvas.height - PLAYER_SIZE - 20,
        PLAYER_SIZE,
        EMOJI.PLAYER
    );

    createAliens();
    updateScoreBoard();
    
    // Démarrage de la boucle de jeu
    lastTime = performance.now();
    gameLoopInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS
}

/** Crée une nouvelle vague d'aliens */
function createAliens() {
    aliens = [];
    const rows = 4 + Math.min(wave - 1, 3); 
    const cols = 8;
    // Calcule l'espace pour centrer les colonnes avec un espacement de 1.5 * ALIEN_SIZE
    const alienWidth = ALIEN_SIZE * 1.5;
    const totalWidth = cols * alienWidth - (alienWidth - ALIEN_SIZE);
    const paddingX = (canvas.width - totalWidth) / 2;
    const paddingY = 50;
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            aliens.push(new Entity(
                paddingX + c * alienWidth,
                paddingY + r * (ALIEN_SIZE * 1.5),
                ALIEN_SIZE,
                EMOJI.ALIEN
            ));
        }
    }
}

function nextWave() {
    wave++;
    bullets = [];
    alienMoveSpeed = Math.min(25, alienMoveSpeed + 3);
    alienMoveTimer = Math.max(200, ALIEN_MOVE_INTERVAL - wave * 100); 

    alert(`Vague ${wave} ! Nouvelle vague d'envahisseurs en approche.`);
    createAliens();
}

// =========================================================
// 3. MOUVEMENT ET CONTRÔLES
// =========================================================

/** Met à jour la position du joueur (ZQSD) */
function movePlayer() {
    const speed = playerMoveSpeed;

    if (keys['KeyQ'] || keys['ArrowLeft']) {
        player.x = Math.max(0, player.x - speed);
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        player.x = Math.min(canvas.width - PLAYER_SIZE, player.x + speed);
    }
    if (keys['KeyZ'] || keys['ArrowUp']) { 
        // Limite la zone de déplacement verticale à la partie basse de l'écran (environ 150px du bas)
        player.y = Math.max(canvas.height - 150, player.y - speed);
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
        player.y = Math.min(canvas.height - PLAYER_SIZE, player.y + speed);
    }
}

let alienDirection = 1; 
let lastAlienMoveTime = 0;

/** Déplace les aliens */
function moveAliens(deltaTime) {
    lastAlienMoveTime += deltaTime;

    if (lastAlienMoveTime >= alienMoveTimer) {
        let shouldDrop = false;

        // Vérifie si le bord est atteint pour changer de direction et descendre
        for (const alien of aliens) {
            if (alien.x + ALIEN_SIZE + alienDirection * alienMoveSpeed > canvas.width || alien.x + alienDirection * alienMoveSpeed < 0) {
                alienDirection *= -1;
                shouldDrop = true;
                break;
            }
        }

        for (const alien of aliens) {
            if (shouldDrop) {
                alien.y += 20; 
            }
            alien.x += alienDirection * alienMoveSpeed;
            
            // Si un alien atteint la ligne du joueur
            if (alien.y + ALIEN_SIZE > player.y) {
                endGame(false);
                return;
            }
        }
        lastAlienMoveTime = 0;
    }
}

/** Met à jour la position des tirs */
function moveBullets() {
    bullets.forEach(bullet => {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
    });

    bullets = bullets.filter(bullet => 
        bullet.x > -BULLET_SIZE && bullet.x < canvas.width + BULLET_SIZE && 
        bullet.y > -BULLET_SIZE && bullet.y < canvas.height + BULLET_SIZE
    );
}

// =========================================================
// 4. TIRS ET VISÉE À LA SOURIS
// =========================================================

/** Calcule l'angle et la direction du tir (Visée à la souris) */
function fireBullet() {
    if (gameOver) return;

    const currentTime = performance.now();
    const shotDelay = isShotgunActive ? SHOTGUN_SHOT_DELAY : BASE_SHOT_DELAY;

    if (currentTime - lastShotTime < shotDelay) {
        return;
    }
    lastShotTime = currentTime;
    
    const bulletSpeed = 10;
    const playerCenterX = player.x + player.size / 2;
    const playerCenterY = player.y + player.size / 2;
    
    // Angle entre le joueur et le curseur de la souris
    const angle = Math.atan2(mousePos.y - playerCenterY, mousePos.x - playerCenterX);
    
    const directions = [angle];
    
    // Mode Shotgun : ajoute 4 directions supplémentaires
    if (isShotgunActive) {
        for (let i = 1; i <= 2; i++) {
            directions.push(angle + Math.PI / 16 * i);
            directions.push(angle - Math.PI / 16 * i);
        }
    }

    directions.forEach(dir => {
        const dx = Math.cos(dir) * bulletSpeed;
        const dy = Math.sin(dir) * bulletSpeed;
        
        const newBullet = new Entity(
            playerCenterX - BULLET_SIZE / 2,
            playerCenterY - BULLET_SIZE / 2,
            BULLET_SIZE,
            EMOJI.BULLET
        );
        newBullet.dx = dx;
        newBullet.dy = dy;
        
        bullets.push(newBullet);
    });
}

// =========================================================
// 5. BONUS ET TEMPORISATEURS
// =========================================================

let shieldEndTime = 0;
let shotgunEndTime = 0;

/** Active les bonus et gère leur durée */
function activateBonus(type) {
    const currentTime = performance.now();
    
    if (type === 'shield') {
        isShieldActive = true;
        shieldEndTime = currentTime + SHIELD_DURATION;
    } else if (type === 'shotgun') {
        isShotgunActive = true;
        shotgunEndTime = currentTime + SHOTGUN_DURATION;
    }
}

/** Gère les temporisateurs des bonus */
function updateBonusTimers(currentTime) {
    if (isShieldActive && currentTime > shieldEndTime) {
        isShieldActive = false;
    }
    if (isShotgunActive && currentTime > shotgunEndTime) {
        isShotgunActive = false;
    }
    
    // 1 chance sur 1000 par frame d'apparition d'un bonus
    if (Math.random() < 0.001 && aliens.length > 5 && powerUps.length < 3) { 
        if (Math.random() < 0.3) {
            spawnPowerUp('shotgun');
        } else if (Math.random() < 0.6) {
            spawnPowerUp('shield');
        } else {
            spawnPowerUp('bomb'); 
        }
    }
}


function spawnPowerUp(type) {
    const size = 30;
    const x = Math.random() * (canvas.width - size);
    const y = 0;
    let emoji = '';
    
    if (type === 'shield') emoji = EMOJI.SHIELD;
    else if (type === 'shotgun') emoji = EMOJI.SHOTGUN;
    else if (type === 'bomb') emoji = '💣'; 

    const powerUp = new Entity(x, y, size, emoji);
    powerUp.type = type;
    powerUps.push(powerUp);
}

function movePowerUps() {
    powerUps.forEach(p => {
        p.y += 2; 
    });
    
    powerUps = powerUps.filter(p => p.y < canvas.height);
}

// =========================================================
// 6. COLLISIONS ET LOGIQUE DE JEU
// =========================================================

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.size &&
           obj1.x + obj1.size > obj2.x &&
           obj1.y < obj2.y + obj2.size &&
           obj1.y + obj1.size > obj2.y;
}

function checkCollisions() {
    // 1. Tirs du joueur vs Aliens
    bullets = bullets.filter((bullet) => {
        let hit = false;
        aliens = aliens.filter((alien) => {
            if (checkCollision(bullet, alien) && !hit) {
                score += POINTS_PER_KILL; 
                coinsGained += COINS_PER_KILL; 
                hit = true; 
                return false; 
            }
            return true; 
        });
        return !hit; 
    });
    
    // NOUVELLE LOGIQUE : Gain de 10 pièces tous les 100 points
    const currentScoreLevel = Math.floor(score / COINS_BONUS_SCORE);
    const lastScoreLevel = Math.floor(lastCoinBonusScore / COINS_BONUS_SCORE);

    if (currentScoreLevel > lastScoreLevel) {
        const bonusCount = currentScoreLevel - lastScoreLevel;
        coinsGained += bonusCount * COINS_BONUS_AMOUNT;
        // Met à jour le marqueur du dernier bonus pour le score exact
        lastCoinBonusScore = currentScoreLevel * COINS_BONUS_SCORE; 
    }
    
    // 2. Collisions Aliens vs Joueur (et Bouclier)
    aliens = aliens.filter((alien) => {
        if (checkCollision(player, alien)) {
            if (isShieldActive) {
                isShieldActive = false; // Le bouclier est consommé
                return false; // L'alien est détruit
            } else {
                lives--;
                return false; // L'alien est détruit
            }
        }
        return true; 
    });
    
    // 3. Collisions Joueur vs PowerUps
    powerUps = powerUps.filter((p) => {
        if (checkCollision(player, p)) {
            if (p.type === 'bomb') {
                score += aliens.length * POINTS_PER_KILL; 
                coinsGained += aliens.length * COINS_PER_KILL;
                
                // Vérifie le bonus de 100 points après la bombe
                const scoreAfterBomb = score;
                const currentScoreLevelAfterBomb = Math.floor(scoreAfterBomb / COINS_BONUS_SCORE);
                const lastScoreLevelAfterBomb = Math.floor(lastCoinBonusScore / COINS_BONUS_SCORE);
                if (currentScoreLevelAfterBomb > lastScoreLevelAfterBomb) {
                    const bonusCount = currentScoreLevelAfterBomb - lastScoreLevelAfterBomb;
                    coinsGained += bonusCount * COINS_BONUS_AMOUNT;
                    lastCoinBonusScore = currentScoreLevelAfterBomb * COINS_BONUS_SCORE;
                }
                
                aliens = []; // Destruction de tous les aliens
            } else {
                activateBonus(p.type);
            }
            return false; 
        }
        return true;
    });

    if (lives <= 0) {
        endGame(false);
    } else if (aliens.length === 0) {
        nextWave();
    }
    
    updateScoreBoard();
}

// =========================================================
// 7. AFFICHAGE ET BOUCLE DE JEU
// =========================================================

function draw() {
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    aliens.forEach(alien => alien.draw());
    powerUps.forEach(p => p.draw());
    bullets.forEach(bullet => bullet.draw());
    
    if (player) { 
        player.draw();
    }
    
    // Affichage des durées de bonus
    const currentTime = performance.now();
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'right';
    
    if (isShieldActive) {
        const remaining = Math.ceil((shieldEndTime - currentTime) / 1000);
        ctx.fillText(`🛡️ Bouclier: ${remaining}s`, canvas.width - 10, canvas.height - 10);
    }
    if (isShotgunActive) {
        const remaining = Math.ceil((shotgunEndTime - currentTime) / 1000);
        ctx.fillText(`💥 Shotgun: ${remaining}s`, canvas.width - 10, canvas.height - 30);
    }
}

function gameLoop(currentTime) {
    if (gameOver) return;
    
    // deltaTime pour un mouvement fluide
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    updateBonusTimers(currentTime);
    movePlayer();
    moveAliens(deltaTime);
    moveBullets();
    movePowerUps();
    checkCollisions();
    draw();
}

// =========================================================
// 8. SCORES ET INTERFACE UTILISATEUR
// =========================================================

function updateScoreBoard() {
    if(document.getElementById('currentScore')) {
        document.getElementById('currentScore').textContent = score;
        document.getElementById('livesCount').textContent = lives;
        document.getElementById('coinsGained').textContent = coinsGained;
    }
    
    if (typeof getCurrentUser === 'function') {
        const currentUser = getCurrentUser();
        const personal = (currentUser && currentUser.highScores[GAME_NAME]) || 0;
        if(document.getElementById('personalHighScore')) {
            document.getElementById('personalHighScore').textContent = personal;
        }
    }
    
    updateLeaderboard();
}

function updateLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList || typeof loadUsers !== 'function') return;
    
    leaderboardList.innerHTML = '';
    
    const users = loadUsers();
    let leaderboard = users.map(user => ({
        username: user.username,
        score: user.highScores[GAME_NAME] || 0,
        role: user.role
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); 

    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<li>Aucun score enregistré.</li>';
        return;
    }
    
    leaderboard.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${index + 1}. ${item.role === 'admin' ? '👑' : ''} ${item.username}: <b>${item.score}</b>`;
        leaderboardList.appendChild(li);
    });
}

/** Fonction appelée à la fin de la partie */
function endGame(win) {
    if (gameOver) return;
    gameOver = true;
    clearInterval(gameLoopInterval);
    
    if (typeof getCurrentUser === 'function' && typeof updateGlobalUser === 'function' && typeof updateCoins === 'function') {
        let currentUser = getCurrentUser();
        
        if (currentUser) {
            if (!currentUser.highScores[GAME_NAME] || score > currentUser.highScores[GAME_NAME]) {
                currentUser.highScores[GAME_NAME] = score;
                alert(`NOUVEAU RECORD PERSONNEL : ${score} !`);
            }
            
            updateCoins(coinsGained);
            updateGlobalUser(currentUser); 
        } else {
             alert(`Partie terminée. Score : ${score}. Connectez-vous pour enregistrer votre score et garder vos ${coinsGained} pièces !`);
        }
    }
    
    const message = win ? 
        `VICTOIRE ! Score final : ${score}` :
        `GAME OVER ! Votre score : ${score}. Pièces gagnées : ${coinsGained}💰`;
    
    // Affichage du message de fin de partie sur le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#E0E0E0';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center'; 
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    
    updateLeaderboard();
}

// =========================================================
// 9. GESTION DES ENTRÉES
// =========================================================

// Souris pour la visée
if (canvas) {
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mousePos.x = e.clientX - rect.left;
        mousePos.y = e.clientY - rect.top;
    });

    // Clic pour le tir
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0 && !gameOver && player) { 
            fireBullet();
        }
    });
}


// Clic pour le tir sur la barre espace (en plus de la souris)
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    if (e.code === 'Space' && !gameOver && player) {
        e.preventDefault(); // Empêche le défilement
        fireBullet();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Message de démarrage (Affiché seulement au chargement initial)
function displayInitialMessage() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    ctx.fillStyle = 'var(--color-neon-green)';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("Appuyez sur 'Nouvelle Partie' pour commencer !", canvas.width / 2, canvas.height / 2);
    updateLeaderboard();
}


document.addEventListener('DOMContentLoaded', () => {
    // Vérifie que le canvas est chargé
    if (canvas && ctx) { 
        // Force la taille (si elle n'est pas définie dans l'HTML)
        canvas.width = 800; 
        canvas.height = 600;
        syncPlayerSkin();
        displayInitialMessage(); 
    }
});
