// --- space_invaders_game.js (Version corrigée et complète pour le mouvement) ---

// ******************************
// 1. INITIALISATION DES ÉLÉMENTS DU DOM
// ******************************
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null; 

// Vérifie que le canvas et le contexte sont disponibles
if (!canvas || !ctx) {
    console.error("Erreur critique: Le Canvas ou son contexte 2D n'est pas disponible. Le jeu ne peut pas démarrer.");
}

// Éléments du DOM pour l'interface
const startScreen = document.getElementById('gameStartScreen');
const launchButton = document.getElementById('launchButton');
const scoreDisplay = document.getElementById('scoreDisplay');
const bestScoreDisplay = document.getElementById('bestScoreDisplay');
const livesDisplay = document.getElementById('livesDisplay');

let gameRunning = false;
let score = 0;
let lives = 3;
const keys = {}; // Tableau pour suivre l'état des touches (ZQSD/WASD)
let lastBulletTime = 0;
const FIRE_RATE = 200; // Délai minimum entre les tirs en ms (pour éviter le spam)

// ******************************
// 2. CONSTANTES ET OBJETS DU JEU
// ******************************

let player = {}; 
let aliens = [];
let bullets = [];
let alienBullets = [];

const ALIEN_ROWS = 4;
const ALIEN_COLS = 10;
const ALIEN_SIZE = 20;

// ******************************
// 3. LOGIQUE DE JEU
// ******************************

function resetGameState() {
    if (!canvas) return;

    player = { 
        x: canvas.width / 2, 
        y: canvas.height - 30, 
        size: 20, 
        speed: 5,
        color: 'var(--color-neon-green)' 
    };
    aliens = [];
    bullets = [];
    alienBullets = [];
}

// Création de la vague initiale d'aliens
function createAliens() {
    aliens = [];
    const padding = 20;
    const offsetTop = 50;
    
    for (let r = 0; r < ALIEN_ROWS; r++) {
        for (let c = 0; c < ALIEN_COLS; c++) {
            aliens.push({
                x: c * (ALIEN_SIZE + padding) + padding + 50,
                y: r * (ALIEN_SIZE + padding) + offsetTop,
                size: ALIEN_SIZE,
                color: 'var(--color-neon-red)',
                health: 1
            });
        }
    }
}

// Mise à jour de la position du joueur en fonction des touches pressées
function updatePlayerMovement() {
    if (!gameRunning || !canvas) return; 

    // WASD et ZQSD (Vérifie les deux configurations)
    if (keys['a'] || keys['q']) { // Gauche
        player.x -= player.speed;
    }
    if (keys['d']) { // Droite
        player.x += player.speed;
    }
    
    // Empêcher le joueur de sortir des limites du Canvas
    if (player.x < player.size / 2) player.x = player.size / 2;
    if (player.x > canvas.width - player.size / 2) player.x = canvas.width - player.size / 2;
}

// Tir du joueur
function fireBullet() {
    const now = Date.now();
    if (now - lastBulletTime < FIRE_RATE) return; // Limite la cadence de tir
    
    // Ajoute une balle juste au-dessus du joueur
    bullets.push({
        x: player.x,
        y: player.y - player.size / 2,
        speed: 8,
        size: 4,
        color: 'var(--color-neon-blue)'
    });
    
    lastBulletTime = now;
    // Jouer un son ici (futur)
}

// Mise à jour de la position des tirs
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= bullet.speed;
        
        // Supprimer la balle si elle sort de l'écran
        if (bullet.y < 0) {
            bullets.splice(i, 1);
        }
    }
}

// La boucle principale de mise à jour de la logique du jeu
function update() {
    updatePlayerMovement();
    updateBullets();
    // Logique future: Mouvement aliens, collisions, tirs aliens
}

// ******************************
// 4. FONCTIONS DE DESSIN
// ******************************

function draw() {
    if (!ctx) return;
    
    // 1. Effacer l'écran à chaque frame
    ctx.fillStyle = '#000000'; // Noir
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Dessiner le joueur (triangle)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.size / 2); 
    ctx.lineTo(player.x - player.size / 2, player.y + player.size / 2); 
    ctx.lineTo(player.x + player.size / 2, player.y + player.size / 2); 
    ctx.closePath();
    ctx.fill();
    
    // 3. Dessiner les aliens (simples carrés)
    aliens.forEach(alien => {
        ctx.fillStyle = alien.color;
        ctx.fillRect(alien.x - alien.size / 2, alien.y - alien.size / 2, alien.size, alien.size);
    });
    
    // 4. Dessiner les tirs du joueur
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x - bullet.size / 2, bullet.y - bullet.size / 2, bullet.size, bullet.size * 2); // Balle rectangulaire
    });

    // 5. Mettre à jour l'affichage des informations (DOM)
    if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}`;
    if (livesDisplay) livesDisplay.textContent = `Vies: ${lives}`;
    // Mise à jour future du Best Score si auth.js est chargé
}

// ******************************
// 5. BOUCLE PRINCIPALE ET DÉMARRAGE
// ******************************

function gameLoop() {
    if (!gameRunning) return;
    
    update();
    draw();
    
    // Demander au navigateur de rappeler gameLoop à la prochaine frame
    requestAnimationFrame(gameLoop);
}

// Fonction appelée par le bouton "LANCER LE JEU"
function initGame() {
    if (!ctx) {
        alert("Erreur: Le moteur du jeu (Canvas) n'est pas prêt. Vérifiez la console pour les détails.");
        return;
    }
    
    // Cacher l'écran de démarrage et afficher le Canvas
    if (startScreen) startScreen.style.display = 'none';
    if (canvas) canvas.style.display = 'block';
    
    // Réinitialiser l'état du jeu et les variables
    resetGameState();
    score = 0;
    lives = 3;
    gameRunning = true;
    
    // Créer la première vague d'aliens
    createAliens();
    
    // Lancer la boucle de jeu
    gameLoop();
}

// Assure que le bouton lance initGame()
if (launchButton) {
    launchButton.onclick = initGame;
}


// ******************************
// 6. GESTION DES ENTRÉES (Clavier et Souris)
// ******************************

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    keys[e.key.toLowerCase()] = true; 
});

document.addEventListener('keyup', (e) => {
    if (!gameRunning) return;
    keys[e.key.toLowerCase()] = false;
    
    // Tir (Touche ESPACE)
    if (e.key === ' ' || e.key === 'Spacebar') {
        fireBullet();
    }
});
