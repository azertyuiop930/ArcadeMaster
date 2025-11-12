// --- space_invaders_game.js ---

// ******************************
// 1. INITIALISATION DU CANVAS ET VARIABLES GLOBALES
// ******************************
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// Éléments du DOM pour l'interface
const startScreen = document.getElementById('gameStartScreen');
const launchButton = document.getElementById('launchButton');
const scoreDisplay = document.getElementById('scoreDisplay');
const bestScoreDisplay = document.getElementById('bestScoreDisplay');
const livesDisplay = document.getElementById('livesDisplay');

let gameRunning = false;
let score = 0;
let lives = 3;
const keys = {}; // Tableau pour suivre l'état des touches

// ******************************
// 2. OBJETS DU JEU
// ******************************

let player = { 
    x: canvas.width / 2, 
    y: canvas.height - 30, 
    size: 20, 
    speed: 5,
    color: 'var(--color-neon-green)' 
};
let aliens = [];
let bullets = [];
let alienBullets = [];

const ALIEN_ROWS = 4;
const ALIEN_COLS = 10;
const ALIEN_SIZE = 20;

// ******************************
// 3. LOGIQUE DE JEU
// ******************************

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
    // WASD et ZQSD
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


// La boucle principale de mise à jour de la logique du jeu
function update() {
    updatePlayerMovement();
    // Le reste de la logique (mouvement aliens, tirs, collisions) viendra ici
}

// ******************************
// 4. FONCTIONS DE DESSIN
// ******************************

function draw() {
    if (!ctx) return;
    
    // 1. Effacer l'écran à chaque frame
    ctx.fillStyle = '#000000'; // Noir
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Dessiner le joueur (triangle pour ressembler à un vaisseau)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.size / 2); // Point supérieur
    ctx.lineTo(player.x - player.size / 2, player.y + player.size / 2); // Point bas-gauche
    ctx.lineTo(player.x + player.size / 2, player.y + player.size / 2); // Point bas-droite
    ctx.closePath();
    ctx.fill();
    
    // 3. Dessiner les aliens (simples carrés)
    aliens.forEach(alien => {
        ctx.fillStyle = alien.color;
        ctx.fillRect(alien.x - alien.size / 2, alien.y - alien.size / 2, alien.size, alien.size);
    });

    // 4. Mettre à jour l'affichage des informations
    // Ces mises à jour sont pour l'interface DOM (HTML), pas pour le Canvas
    scoreDisplay.textContent = `Score: ${score}`;
    livesDisplay.textContent = `Vies: ${lives}`;
    // bestScoreDisplay.textContent = `Meilleur: ${getCurrentUser().scores.space_invaders || 0}`; 
    // ^ Cette ligne nécessitera une mise à jour d'auth.js pour fonctionner
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

// Démarrer la partie
function initGame() {
    if (!ctx) {
        console.error("Erreur: Le Canvas n'a pas pu être initialisé. Vérifiez 'gameCanvas' dans le HTML.");
        return;
    }
    
    // Cacher l'écran de démarrage et afficher le Canvas
    startScreen.style.display = 'none';
    canvas.style.display = 'block';
    
    // Réinitialiser les variables
    score = 0;
    lives = 3;
    gameRunning = true;
    
    // Créer la première vague d'aliens
    createAliens();
    
    // Lancer la boucle de jeu
    gameLoop();
}

// Écouteur pour démarrer le jeu (lié au bouton HTML)
if (launchButton) {
    launchButton.addEventListener('click', initGame);
}


// ******************************
// 6. GESTION DES ENTRÉES (Clavier)
// ******************************

document.addEventListener('keydown', (e) => {
    // Convertit la touche en minuscule et l'enregistre comme pressée
    keys[e.key.toLowerCase()] = true; 
});

document.addEventListener('keyup', (e) => {
    // Enregistre la touche comme relâchée
    keys[e.key.toLowerCase()] = false;
});

// Gestion du tir (clic de la souris)
document.addEventListener('click', (e) => {
    if (!gameRunning) return;
    
    // Le code du tir sera implémenté ici plus tard
    // console.log("TIR!");
});
