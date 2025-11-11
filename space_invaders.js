// --- LOGIQUE DU JEU SPACE INVADERS (space_invaders.js) ---

// --- VARIABLES GLOBALES ET ÉLÉMENTS DU DOM ---
const gameBoard = document.getElementById('gameBoard');
const scoreDisplay = document.getElementById('scoreDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const instructionsScreen = document.getElementById('instructionsScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');
const startButton = document.getElementById('startButton'); // NOUVEAU: Bouton de lancement

// Paramètres du jeu
const BOARD_WIDTH = 600;
const BOARD_HEIGHT = 400;
let isGameRunning = false;
let isGameOver = false;
let gameInterval;
let score = 0;
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

// Vitesse de base du jeu
let scoreSpeedFactor = 1;
let gameLoopSpeed = 50; // Intervalle en ms (20 FPS)

// Entités (listes)
let enemies = [];
let playerBullets = [];
let enemyBullets = [];
let powerups = [];

// État des Bonus
let shieldActive = false;
let shieldTimeout;
let shotgunCooldown = 0;

// Input
let mousePosition = { x: 0, y: 0 };
let keysPressed = {};

// Skins (Valeurs par défaut)
let activeShipSkin = '🚀';
let activeEnemySkin = '👾';


// --- 0. FONCTIONS DE GESTION DES SKINS ---

function loadActiveSkins() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    
    if (user && user.skins) {
        activeShipSkin = user.skins.active.ship || '🚀';
        activeEnemySkin = user.skins.active.invader || '👾';
    } else {
         activeShipSkin = '🚀'; 
         activeEnemySkin = '👾';
    }
}


// --- 1. FONCTIONS D'INITIALISATION ET D'AFFICHAGE ---

function setupBoard() {
    gameBoard.style.width = `${BOARD_WIDTH}px`;
    gameBoard.style.height = `${BOARD_HEIGHT}px`;
}

function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    scoreSpeedFactor = 1;
    
    enemies = [];
    playerBullets = [];
    enemyBullets = [];
    powerups = [];
    
    // Réinitialisation des bonus
    shieldActive = false;
    clearTimeout(shieldTimeout);
    shotgunCooldown = 0;

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
}


// --- 2. GESTION DES ENTITÉS : ENVAHISSEURS ---

function spawnEnemyFromEdge() {
    if (!isGameRunning) return;
    
    let edge = Math.floor(Math.random() * 4); 
    let x, y;

    switch (edge) {
        case 0: // Top
            x = Math.random() * (BOARD_WIDTH - 20);
            y = -20;
            break;
        case 1: // Right
            x = BOARD_WIDTH;
            y = Math.random() * (BOARD_HEIGHT - 20);
            break;
        case 2: // Bottom
            x = Math.random() * (BOARD_WIDTH - 20);
            y = BOARD_HEIGHT;
            break;
        case 3: // Left
            x = -20;
            y = Math.random() * (BOARD_HEIGHT - 20);
            break;
    }
    
    enemies.push({
        x: x,
        y: y,
        width: 20,
        height: 20,
        hp: 1
    });

    const spawnRate = Math.max(500, 2000 - score * 5); 
    setTimeout(spawnEnemyFromEdge, spawnRate);
}

function moveEnemies() {
    const baseSpeed = 1;
    const currentSpeed = baseSpeed + Math.floor(score / 10) * 0.05; 

    enemies.forEach(enemy => {
        const dx = player.x + player.width / 2 - (enemy.x + enemy.width / 2);
        const dy = player.y + player.height / 2 - (enemy.y + enemy.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        enemy.x += (dx / distance) * currentSpeed;
        enemy.y += (dy / distance) * currentSpeed;
    });
}

function enemyShoot() {
    // Les ennemis ici ne tirent pas (menace par contact)
}


// --- 3. GESTION DES BONUS (Powerups) ---

function spawnPowerup(x, y) {
    if (Math.random() > 0.95) { 
        const types = ['shield', 'shotgun', 'bomb'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        powerups.push({
            x: x,
            y: y,
            width: 15,
            height: 15,
            type: type,
            speedY: 1
        });
    }
}

function activatePowerup(type) {
    switch (type) {
        case 'shield':
            clearTimeout(shieldTimeout);
            shieldActive = true;
            shieldTimeout = setTimeout(() => {
                shieldActive = false;
            }, 10000); 
            break;
        case 'shotgun':
            shotgunCooldown = 50; 
            break;
        case 'bomb':
            handleBomb();
            break;
    }
}

function handleBomb() {
    score += enemies.length * 10; 
    enemies = [];
    updateDisplay();
}


// --- 4. GESTION DES COLLISIONS et GAIN DE PIÈCES ---

function grantCoins(points) {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    
    if (!user) {
        console.log("Pièces non attribuées : utilisateur déconnecté.");
        return;
    }

    user.coins = (user.coins || 0) + points;
    
    if (typeof updateGlobalUser === 'function') {
        updateGlobalUser(user);
    }
    
    if (typeof updateTopBar === 'function') {
        updateTopBar(); 
    }
}

function checkCollisions() {
    
    // Joueur vs Tirs ennemis (Conservé pour le cas où enemyShoot serait réactivé)
    enemyBullets = enemyBullets.filter(bullet => {
        // ... (Logique de collision avec les tirs ennemis)
        return bullet.y < BOARD_HEIGHT && bullet.y > 0 && bullet.x < BOARD_WIDTH && bullet.x > 0;
    });
    
    // Joueur vs Powerups
    powerups = powerups.filter(powerup => {
        if (
            powerup.x < player.x + player.width && powerup.x + powerup.width > player.x &&
            powerup.y < player.y + player.height && powerup.y + powerup.height > player.y
        ) {
            activatePowerup(powerup.type);
            return false; 
        }
        return powerup.y < BOARD_HEIGHT;
    });

    // Tirs joueur vs Ennemis
    playerBullets = playerBullets.filter(bullet => {
        let hit = false;
        enemies = enemies.filter(enemy => {
            if (
                bullet.x < enemy.x + enemy.width && bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + player.height && bullet.y + bullet.height > enemy.y
            ) {
                enemy.hp--;
                hit = true;
                if (enemy.hp <= 0) {
                    let oldScore = score; 
                    score += 10; 

                    // Gain de pièces tous les 100 points
                    if (Math.floor(score / 100) > Math.floor(oldScore / 100)) {
                         grantCoins(10); 
                    }

                    spawnPowerup(enemy.x, enemy.y); 
                    return false; 
                }
                return true; 
            }
            return true;
        });
        return !hit && bullet.y < BOARD_HEIGHT && bullet.y > 0 && bullet.x < BOARD_WIDTH && bullet.x > 0;
    });
    
    // Ennemis vs Joueur (Collision mortelle)
    enemies = enemies.filter(enemy => {
        if (
            enemy.x < player.x + player.width && enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height && enemy.y + player.height > player.y
        ) {
            if (shieldActive) {
                return false; 
            }
            endGame();
            return false;
        }
        return true;
    });
}


// --- 5. MOUVEMENTS ET TIR DU JOUEUR ---

function movePlayer() {
    const moveSpeed = 4;
    
    if (keysPressed['a'] || keysPressed['q']) player.x -= moveSpeed;
    if (keysPressed['d']) player.x += moveSpeed;
    if (keysPressed['w'] || keysPressed['z']) player.y -= moveSpeed;
    if (keysPressed['s']) player.y += moveSpeed;

    player.x = Math.max(0, Math.min(BOARD_WIDTH - player.width, player.x));
    player.y = Math.max(0, Math.min(BOARD_HEIGHT - player.height, player.y));

    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    const angleRad = Math.atan2(mousePosition.y - centerY, mousePosition.x - centerX);
    player.rotation = angleRad * (180 / Math.PI) + 90; 
}

function playerShoot(e) {
    if (isGameOver || !isGameRunning) return;
    if (e && e.button !== 0) return; 

    // Prévenir la sélection de texte/emojis lors du spam click
    e.preventDefault(); 
    
    if (shotgunCooldown > 0) {
        shotgunCooldown--;
        const baseAngle = Math.atan2(mousePosition.y - (player.y + player.height / 2), mousePosition.x - (player.x + player.width / 2));
        
        for (let i = -2; i <= 2; i++) {
            const angle = baseAngle + (i * 0.1); 
            const speedX = Math.cos(angle) * 8;
            const speedY = Math.sin(angle) * 8;

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


// --- 6. RENDU GRAPHIQUE (Dessin) ---

function drawEntities() {
    gameBoard.innerHTML = '';

    // Dessin du Joueur (Avec skin)
    const playerElement = document.createElement('div');
    playerElement.style.left = `${player.x}px`;
    playerElement.style.top = `${player.y}px`;
    playerElement.classList.add('player');
    playerElement.style.transform = `rotate(${player.rotation}deg)`;
    playerElement.innerHTML = `<div style="font-size: 1.5em; position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">${activeShipSkin}</div>`;
    
    if (shieldActive) {
         playerElement.classList.add('shielded');
    } else {
         playerElement.classList.remove('shielded');
    }
    gameBoard.appendChild(playerElement);

    // Dessin des Ennemis (Avec skin)
    enemies.forEach(enemy => {
        const enemyElement = document.createElement('div');
        enemyElement.style.left = `${enemy.x}px`;
        enemyElement.style.top = `${enemy.y}px`;
        enemyElement.classList.add('enemy');
        enemyElement.innerHTML = `<span style="font-size: 1.2em;">${activeEnemySkin}</span>`;
        gameBoard.appendChild(enemyElement);
    });

    // Dessin des Tirs et Bonus
    // ... (Logique de dessin des tirs et powerups)
}


// --- 7. BOUCLE DE JEU ET ÉTATS ---

function gameLoop() {
    if (isGameOver) return;

    // 1. Mouvements
    movePlayer();
    moveEnemies();
    
    playerBullets.forEach(b => {
        b.x += b.speedX;
        b.y += b.speedY;
    });
    
    enemyBullets.forEach(b => {
        b.y += b.speedY;
    });
    
    powerups.forEach(p => {
        p.y += p.speedY;
    });

    // 2. Tirs ennemis
    enemyShoot();
    
    // 3. Collisions
    checkCollisions();

    // 4. Rendu
    drawEntities();
    updateDisplay();
}

function startGame() {
    if (isGameRunning) return;
    
    isGameRunning = true;
    isGameOver = false; 
    instructionsScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';

    resetGame();
    gameInterval = setInterval(gameLoop, gameLoopSpeed);
}

function endGame() {
    if (isGameOver) return;
    isGameOver = true;
    isGameRunning = false;
    clearInterval(gameInterval);
    
    if (typeof updateGlobalUserScore === 'function') {
        updateGlobalUserScore('space_invaders', score);
    }
    
    document.getElementById('finalScore').textContent = `Score final : ${score}`;
    gameOverScreen.style.display = 'flex';
}


// --- 8. GESTION DES CHEATS ---

const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
let konamiIndex = 0;

function handleCheat(e) {
    if (e.key === KONAMI_CODE[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === KONAMI_CODE.length) {
            alert("CODE KONAMI ACTIVÉ ! 💰 +50,000 Pièces !");
            
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

            if (typeof updateTopBar === 'function') {
                updateTopBar(); 
            }

            konamiIndex = 0; 
        }
    } else {
        konamiIndex = 0; 
    }
}


// --- 9. ÉVÉNEMENTS & INITIALISATION ---

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    // 1. Gestion du Cheat Code (Flèches)
    handleCheat(e); 
    
    // 2. Désactivation de la barre d'espace pour le lancement (seul le bouton fonctionne)
    if ((key === ' ' || key === 'spacebar') && isGameRunning) {
        e.preventDefault(); 
    }
    
    // 3. Gestion des mouvements 
    if (isGameOver || !isGameRunning) return;
    
    if (key === 'a' || key === 'q' || key === 'd' || key === 'w' || key === 'z' || key === 's') {
        keysPressed[key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    delete keysPressed[key];
});

// Gestion de la Souris (Visée et Tir, prévention de sélection)
gameBoard.addEventListener('mousemove', (e) => {
    const rect = gameBoard.getBoundingClientRect();
    mousePosition.x = e.clientX - rect.left;
    mousePosition.y = e.clientY - rect.top;
});

gameBoard.addEventListener('mousedown', playerShoot); // Utilise mousedown ou click
gameBoard.addEventListener('contextmenu', (e) => e.preventDefault()); // Empêche le menu contextuel au clic droit
gameBoard.addEventListener('selectstart', (e) => e.preventDefault()); // Empêche la sélection

// Bouton Recommencer
restartButton.addEventListener('click', startGame);

// Bouton Démarrer (Nouveau)
if (startButton) {
    startButton.addEventListener('click', startGame);
}


// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    setupBoard();
    loadActiveSkins(); 
    instructionsScreen.style.display = 'flex';
    gameOverScreen.style.display = 'none';
});
