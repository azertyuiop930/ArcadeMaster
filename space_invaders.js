// --- LOGIQUE DU JEU SPACE INVADERS (space_invaders.js) ---

// --- VARIABLES GLOBALES ET ÉLÉMENTS DU DOM ---
const gameBoard = document.getElementById('gameBoard');
const scoreDisplay = document.getElementById('scoreDisplay');
const bestScoreDisplay = document.getElementById('bestScoreDisplay'); // AJOUT
const livesDisplay = document.getElementById('livesDisplay');
const instructionsScreen = document.getElementById('instructionsScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');
const startButton = document.getElementById('startButton'); 

// Paramètres du jeu
const BOARD_WIDTH = 800; 
const BOARD_HEIGHT = 600; 
let isGameRunning = false;
let isGameOver = false;
let gameInterval;
let score = 0;
let bestScore = 0; // NOUVEAU
let lives = 3;
let level = 1;

// Vaisseau du joueur
let player = {
    x: BOARD_WIDTH / 2 - 15, 
    y: BOARD_HEIGHT / 2 - 15, 
    width: 30,
    height: 30,
    rotation: 0 
};

// Cool downs (Corrections des cadences)
let mainGunCooldown = 0;
const MAIN_GUN_RATE = 8; // 400ms entre les tirs principaux
let shieldActive = false;
let shieldTimeout;
let shotgunCooldown = 0; 
const SHOTGUN_RATE = 15; // 750ms entre les tirs de shotgun (ralenti)

// Entités (listes)
let enemies = [];
let playerBullets = [];
let enemyBullets = [];
let powerups = [];

// Input
let mousePosition = { x: 0, y: 0 };
let keysPressed = {};

// Skins (Valeurs par défaut)
let activeShipSkin = '🚀';
let activeEnemySkin = '👾';


// --- FONCTIONS D'AFFICHAGE ET INITIALISATION ---

function setupBoard() {
    gameBoard.style.width = `${BOARD_WIDTH}px`;
    gameBoard.style.height = `${BOARD_HEIGHT}px`;
}

function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    
    enemies = [];
    playerBullets = [];
    enemyBullets = [];
    powerups = [];
    
    shieldActive = false;
    clearTimeout(shieldTimeout);
    shotgunCooldown = 0;
    mainGunCooldown = 0; 

    player.x = BOARD_WIDTH / 2 - 15;
    player.y = BOARD_HEIGHT / 2 - 15; 
    player.rotation = 0;
    
    loadActiveSkins(); 
    updateDisplay();
    gameBoard.innerHTML = '';
    
    setTimeout(spawnEnemyFromEdge, 1000); 
}

function updateDisplay() {
    scoreDisplay.textContent = `Score: ${score}`;
    livesDisplay.textContent = `Vies: ${lives}`;
    // Affichage du meilleur score
    if (bestScoreDisplay) {
        bestScoreDisplay.textContent = `Meilleur: ${bestScore}`;
    }
}


// --- GESTION DES ENTITÉS : ENVAHISSEURS ---

// CORRECTION: Vitesse des monstres (réduction du facteur d'accélération)
function moveEnemies() {
    const baseSpeed = 1;
    // Taux d'augmentation réduit de 0.05 à 0.02
    const currentSpeed = baseSpeed + Math.floor(score / 10) * 0.02; 

    enemies.forEach(enemy => {
        const dx = player.x + player.width / 2 - (enemy.x + enemy.width / 2);
        const dy = player.y + player.height / 2 - (enemy.y + enemy.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        enemy.x += (dx / distance) * currentSpeed;
        enemy.y += (dy / distance) * currentSpeed;
    });
}

// ... (fonctions spawnEnemyFromEdge, enemyShoot) ...


// --- GESTION DU TIR DU JOUEUR (Corrections) ---

function playerShoot(e) {
    if (isGameOver || !isGameRunning) return;
    if (e && e.button !== 0) return; 

    e.preventDefault(); 
    
    // 1. Logique du Shotgun
    if (shotgunCooldown > 0) {
        // Applique le cooldown LENT du shotgun (750ms)
        if (mainGunCooldown > 0) return; 
        mainGunCooldown = SHOTGUN_RATE; 

        // Tirez les 5 balles avec dispersion
        const baseAngle = Math.atan2(mousePosition.y - (player.y + player.height / 2), mousePosition.x - (player.x + player.width / 2));
        
        for (let i = -2; i <= 2; i++) {
            const angle = baseAngle + (i * 0.05); 
            const speedX = Math.cos(angle) * 10;
            const speedY = Math.sin(angle) * 10;

            playerBullets.push({
                x: player.x + player.width / 2 - 2,
                y: player.y + player.height / 2 - 2,
                width: 4,
                height: 8,
                speedX: speedX,
                speedY: speedY
            });
        }
        return; 
    }
    
    // 2. Logique du Tir Principal
    if (mainGunCooldown > 0) return; 
    mainGunCooldown = MAIN_GUN_RATE; // Applique le cooldown rapide du tir principal (400ms)
    
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    const angle = Math.atan2(mousePosition.y - centerY, mousePosition.x - centerX);
    
    const speedX = Math.cos(angle) * 10;
    const speedY = Math.sin(angle) * 10;
    
    playerBullets.push({
        x: centerX - 2,
        y: centerY - 2,
        width: 4,
        height: 8,
        speedX: speedX,
        speedY: speedY
    });
}

// ... (Le reste des fonctions de mouvement et de rendu sont inchangées) ...


// --- BOUCLE DE JEU ET ÉTATS ---

function gameLoop() {
    if (isGameOver) return;

    // Décrémenter les cooldowns
    if (mainGunCooldown > 0) mainGunCooldown--; 
    if (shotgunCooldown > 0) shotgunCooldown--;

    // ... (Mouvements, Collisions, Rendu) ...
}


// CORRECTION: Fonction de fin de partie et gestion du meilleur score
function endGame() {
    if (isGameOver) return;
    isGameOver = true;
    isGameRunning = false;
    clearInterval(gameInterval);
    
    // GESTION DU MEILLEUR SCORE
    if (score > bestScore) {
        bestScore = score;
        // Sauvegarde du meilleur score localement
        localStorage.setItem('invadersBestScore', bestScore); 
        
        // Mettre à jour le score dans le compte connecté si possible
        if (typeof updateGlobalUserScore === 'function') {
            updateGlobalUserScore('space_invaders', score);
        }
    }
    
    // Affichage des informations sur l'écran Game Over
    if (document.getElementById('finalScore')) {
        document.getElementById('finalScore').textContent = `Score final : ${score}`;
    }
    if (gameOverScreen) {
        gameOverScreen.style.display = 'flex'; 
    }
    
    updateDisplay(); // Mise à jour de l'affichage (Meilleur Score)
}


// --- ÉVÉNEMENTS & INITIALISATION ---

document.addEventListener('DOMContentLoaded', () => {
    // CHARGEMENT DU MEILLEUR SCORE
    bestScore = parseInt(localStorage.getItem('invadersBestScore') || '0');
    
    setupBoard();
    loadActiveSkins(); 
    updateDisplay(); 
});

// ... (Le reste des Event Listeners reste inchangé) ...
