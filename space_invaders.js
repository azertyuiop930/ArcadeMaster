// --- VARIABLES GLOBALES DU JEU ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreValue');
const livesElement = document.getElementById('livesValue');
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

let gameLoopInterval;
let score = 0;
let lives = 3;
let gameOver = false;
let gameStarted = false;

// --- DÉFINITION DES ÉMOJIS ---
const EMOJIS = {
    player: '🚀', 
    invader1: '👽', 
    invader2: '👾', 
    bullet: '⚡',  
    shield: '🧱', 
    mystery: '🛸'  
};

// --- PARAMÈTRES D'AFFICHAGE DES ÉMOJIS ---
const EMOJI_FONT_SIZE = 30;
const PLAYER_SIZE = 30;
const INVADER_SIZE = 30;
const SHIELD_WIDTH = 50;
const SHIELD_HEIGHT = 20;


// --- FONCTION UTILITAIRE DE COLLISION (AABB) ---
function checkCollision(objA, objB) {
    return objA.x < objB.x + objB.width &&
           objA.x + objA.width > objB.x &&
           objA.y < objB.y + objB.height &&
           objA.y + objA.height > objB.y;
}


// --- CLASSE ENTITÉ ---

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
        super(GAME_WIDTH / 2 - (PLAYER_SIZE / 2), GAME_HEIGHT - 50, PLAYER_SIZE, PLAYER_SIZE, 'player');
        this.speed = 5;
        this.bullets = [];
        this.canShoot = true;
    }

    update(keys) {
        if (keys['ArrowLeft'] || keys['a']) {
            this.x = Math.max(0, this.x - this.speed);
        }
        if (keys['ArrowRight'] || keys['d']) {
            this.x = Math.min(GAME_WIDTH - this.width, this.x + this.speed);
        }
        if ((keys[' '] || keys['Space']) && this.canShoot) {
            this.shoot();
            this.canShoot = false;
            setTimeout(() => this.canShoot = true, 500); 
        }
    }
    
    shoot() {
        if (this.bullets.length === 0) { 
            const bulletX = this.x + this.width / 2;
            const bulletY = this.y;
            this.bullets.push(new Bullet(bulletX, bulletY, 'player'));
        }
    }
}

class Invader extends Entity {
    constructor(x, y, row) {
        const imageKey = (row % 2 === 0) ? 'invader2' : 'invader1';
        super(x, y, INVADER_SIZE, INVADER_SIZE, imageKey);
        this.points = 10 + (4 - row) * 5; 
        this.xDirection = 1;
    }

    move() {
        this.x += 1 * this.xDirection;
    }
}

class Bullet extends Entity {
    constructor(x, y, type) {
        super(x - 3, y, 6, 12, 'bullet'); 
        this.speed = (type === 'player') ? -7 : 5; 
        this.type = type;
    }

    draw(ctx) {
        // On dessine le tir comme un trait pour plus de précision
        ctx.fillStyle = this.type === 'player' ? 'yellow' : 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.y += this.speed;
    }
}

class Shield extends Entity {
    constructor(x, y) {
        super(x, y, SHIELD_WIDTH, SHIELD_HEIGHT, 'shield');
        this.health = 3; 
    }
    
    draw(ctx) {
        if (this.health === 3) {
            this.emoji = EMOJIS['shield'];
        } else if (this.health === 2) {
             this.emoji = '🚧'; 
        } else if (this.health === 1) {
             this.emoji = '🔥'; 
        }
        super.draw(ctx);
    }
}

// --- GESTION DU JEU ---

let player;
let invaders = [];
let shields = [];
let keys = {};
let invaderBullets = [];
let invaderMoveCounter = 0; 
const INVADER_MOVE_SPEED = 60; 

function createInvaders() {
    invaders = [];
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 10; col++) {
            const x = 50 + col * 60;
            const y = 50 + row * 40;
            invaders.push(new Invader(x, y, row));
        }
    }
}

function createShields() {
    shields = [];
    const numShields = 4;
    const spacing = GAME_WIDTH / (numShields + 1);
    const shieldY = GAME_HEIGHT - 100;
    
    for (let i = 0; i < numShields; i++) {
        const x = (i + 1) * spacing - (SHIELD_WIDTH / 2);
        shields.push(new Shield(x, shieldY));
    }
}

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

function handleCollisions() {
    // 1. Collisions Tirs Joueur (Player Bullets)
    player.bullets = player.bullets.filter(bullet => {
        
        // Collision avec les ENNEMIS
        invaders.forEach((invader, iIndex) => {
            if (checkCollision(bullet, invader)) {
                invader.dead = true;
                bullet.dead = true;
                updateScore(invader.points);
            }
        });
        
        // Collision avec les SHIELDS
        shields.forEach((shield) => {
            if (checkCollision(bullet, shield)) {
                shield.health--;
                bullet.dead = true;
            }
        });
        
        // Nettoyage : Garder si non touché et encore à l'écran
        return !bullet.dead && bullet.y > 0;
    });

    // 2. Collisions Tirs Ennemis (Invader Bullets)
    invaderBullets = invaderBullets.filter(bullet => {

        // Collision avec le JOUEUR
        if (checkCollision(bullet, player)) {
            bullet.dead = true;
            updateLives(-1); 
        }
        
        // Collision avec les SHIELDS
        shields.forEach((shield) => {
            if (checkCollision(bullet, shield)) {
                shield.health--;
                bullet.dead = true;
            }
        });

        // Nettoyage : Garder si non touché et encore à l'écran
        return !bullet.dead && bullet.y < GAME_HEIGHT;
    });
    
    // 3. Nettoyage des entités (Ennemis et Shields)
    invaders = invaders.filter(i => !i.dead);
    shields = shields.filter(s => s.health > 0);
}

function invaderShoot() {
    if (Math.random() < 0.01 && invaders.length > 0) {
        const shooter = invaders[Math.floor(Math.random() * invaders.length)];
        const bulletX = shooter.x + shooter.width / 2;
        const bulletY = shooter.y + shooter.height;
        invaderBullets.push(new Bullet(bulletX, bulletY, 'invader'));
    }
}

function updateGame() {
    if (gameOver || !gameStarted) return;

    // 1. Déplacer le joueur et ses tirs
    player.update(keys);
    player.bullets.forEach(b => b.update());
    invaderBullets.forEach(b => b.update()); 

    // 2. Déplacer les ennemis 
    invaderMoveCounter++;
    if (invaderMoveCounter >= INVADER_MOVE_SPEED) {
        let edgeReached = false;
        invaders.forEach(invader => {
            invader.move();
            if (invader.x + invader.width >= GAME_WIDTH || invader.x <= 0) {
                edgeReached = true;
            }
        });

        if (edgeReached) {
            invaders.forEach(invader => {
                invader.xDirection *= -1; 
                invader.y += 15;          
            });
        }
        invaderMoveCounter = 0; 
    }

    // 3. Tirs ennemis
    invaderShoot();

    // 4. Gestion des Collisions
    handleCollisions();
    
    // 5. Conditions de victoire / défaite
    if (invaders.length === 0) {
        gameOver = true;
    }
    if (invaders.some(i => i.y + i.height >= GAME_HEIGHT - 70)) {
        gameOver = true;
    }
}

function drawGame() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (!gameStarted) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Appuyez sur ESPACE pour commencer', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        return;
    }

    // Dessiner les entités
    player.draw(ctx);
    player.bullets.forEach(b => b.draw(ctx));
    invaders.forEach(i => i.draw(ctx));
    shields.forEach(s => s.draw(ctx)); 
    invaderBullets.forEach(b => b.draw(ctx)); 

    if (gameOver) {
         ctx.fillStyle = 'red';
         ctx.font = '50px Arial';
         ctx.textAlign = 'center';
         
         const message = lives <= 0 ? 'GAME OVER - Les envahisseurs vous ont eu !' : 'VICTOIRE ! Niveau Terminé !';
         ctx.fillText(message, GAME_WIDTH / 2, GAME_HEIGHT / 2);
         ctx.font = '20px Arial';
         ctx.fillText(`Score final: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    }
}

function gameLoop() {
    updateGame();
    drawGame();
}

// --- GESTION DES ÉVÉNEMENTS ---

document.addEventListener('keydown', (e) => {
    keys[e.key] = true; 
    keys[e.code] = true; 

    if (e.code === 'Space' && !gameOver) {
        if (!gameStarted) {
            startGame();
        } 
        e.preventDefault(); 
    }
    if (gameOver && e.code === 'Enter') {
        startGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    keys[e.code] = false;
});

// --- INITIALISATION DU JEU ---

function startGame() {
    if (gameLoopInterval) clearInterval(gameLoopInterval); 
    
    score = 0;
    lives = 3;
    gameOver = false;
    gameStarted = true;
    keys = {};

    player = new Player();
    createInvaders();
    createShields(); 
    
    scoreElement.textContent = score;
    livesElement.textContent = lives;

    gameLoopInterval = setInterval(gameLoop, 1000 / 60); 
}

drawGame();
