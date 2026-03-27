// ==============================================================================
// 🛠️ CONFIGURAÇÃO DE IMAGENS (ASSETS) 🛠️
// ==============================================================================
// COLOQUE AQUI AS URLs OU CAMINHOS LOCAIS DAS SUAS IMAGENS.
// Exemplo: 'img/meu_mapa.png' ou 'https://meusite.com/mapa.png'
// Se o valor ficar vazio (''), o jogo desenhará formas geométricas básicas.
// ==============================================================================
const CONFIG_ASSETS = {
    // 1. Background do mapa (Imagem do chão/cenário)
    MAP_BG_URL: '',
    
    // 2. Sprite do Jogador (Imagem do personagem no mapa)
    PLAYER_SPRITE_URL: '',
    
    // 3. Sprite do Item Óculos (Pequena imagem de óculos para ser coletada)
    GLASSES_SPRITE_URL: '',
    
    // 4. Sprite do Item Pano (Pequena imagem de pano para ser coletada)
    CLOTH_SPRITE_URL: '',
    
    // 5. Foto de Perfil do Personagem (Mostrada grandona no Inventário)
    PLAYER_PORTRAIT_URL: ''
};
// ==============================================================================

// Elementos da Interface UI
const ui = {
    menu: document.getElementById('menu-overlay'),
    btnStart: document.getElementById('btn-start'),
    debugHud: document.getElementById('debug-hud'),
    inventoryModal: document.getElementById('inventory-modal'),
    debug: {
        x: document.getElementById('debug-x'),
        y: document.getElementById('debug-y'),
        glasses: document.getElementById('debug-glasses'),
        cloth: document.getElementById('debug-cloth')
    },
    inv: {
        portrait: document.getElementById('inv-portrait'),
        glasses: document.getElementById('inv-item-glasses'),
        cloth: document.getElementById('inv-item-cloth')
    }
};

// Setup do Canvas
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
// Garante o modo pixel art durante renderização em certas telas/escalas
ctx.imageSmoothingEnabled = false;

// Estado Global do Jogo
const state = {
    current: 'MENU', // 'MENU', 'PLAYING', 'INVENTORY'
    keys: {}
};

// Imagens Carregadas
const sprites = {
    map: new Image(),
    player: new Image(),
    glasses: new Image(),
    cloth: new Image()
};

// Função para iniciar carregamento das imagens
function loadSprites() {
    if (CONFIG_ASSETS.MAP_BG_URL) sprites.map.src = CONFIG_ASSETS.MAP_BG_URL;
    if (CONFIG_ASSETS.PLAYER_SPRITE_URL) sprites.player.src = CONFIG_ASSETS.PLAYER_SPRITE_URL;
    if (CONFIG_ASSETS.GLASSES_SPRITE_URL) sprites.glasses.src = CONFIG_ASSETS.GLASSES_SPRITE_URL;
    if (CONFIG_ASSETS.CLOTH_SPRITE_URL) sprites.cloth.src = CONFIG_ASSETS.CLOTH_SPRITE_URL;
    
    // Configura também o portrait no DOM
    if (CONFIG_ASSETS.PLAYER_PORTRAIT_URL) {
        ui.inv.portrait.src = CONFIG_ASSETS.PLAYER_PORTRAIT_URL;
    } else {
        // Fallback visual no DOM
        ui.inv.portrait.style.display = 'none';
        ui.inv.portrait.parentElement.style.backgroundColor = '#555';
    }
}

// ==============================================================================
// ENTIDADES DO JOGO
// ==============================================================================
const player = {
    x: 400,
    y: 300,
    width: 32,
    height: 32,
    speed: 3
};

const items = {
    glasses: { x: 200, y: 150, width: 24, height: 24, collected: false, color: 'blue' },
    cloth: { x: 600, y: 450, width: 24, height: 24, collected: false, color: 'white' }
};

// ==============================================================================
// CONTROLES DE INPUT (TECLADO)
// ==============================================================================
window.addEventListener('keydown', (e) => {
    state.keys[e.key] = true;
    
    // Ativa/Desativa o inventário ao pressionar 'E' / 'e'
    if ((e.key === 'e' || e.key === 'E') && state.current !== 'MENU') {
        toggleInventory();
    }
});

window.addEventListener('keyup', (e) => {
    state.keys[e.key] = false;
});

// ==============================================================================
// LÓGICA DO MENU
// ==============================================================================
ui.btnStart.addEventListener('click', () => {
    // Esconder o menu overlay
    ui.menu.classList.add('hidden');
    // Mostrar Debug HUD
    ui.debugHud.classList.remove('hidden');
    // Mudar estado para rodar o jogo
    state.current = 'PLAYING';
    
    // Inicia a execução do Game Loop
    requestAnimationFrame(gameLoop);
});

// ==============================================================================
// LÓGICA DO INVENTÁRIO
// ==============================================================================
function toggleInventory() {
    if (state.current === 'PLAYING') {
        state.current = 'INVENTORY';
        ui.inventoryModal.classList.remove('hidden');
    } else if (state.current === 'INVENTORY') {
        state.current = 'PLAYING';
        ui.inventoryModal.classList.add('hidden');
        // Resume game loop
        requestAnimationFrame(gameLoop);
    }
}

// Atualiza Visual do Debug UI e Inventário UI
function updateUI() {
    // HUD
    ui.debug.x.innerText = Math.floor(player.x);
    ui.debug.y.innerText = Math.floor(player.y);
    ui.debug.glasses.innerText = items.glasses.collected ? 'Sim' : 'Não';
    ui.debug.cloth.innerText = items.cloth.collected ? 'Sim' : 'Não';

    // Modal Inventário
    if (items.glasses.collected) {
        ui.inv.glasses.classList.add('collected');
        ui.inv.glasses.classList.remove('not-collected');
    }
    if (items.cloth.collected) {
        ui.inv.cloth.classList.add('collected');
        ui.inv.cloth.classList.remove('not-collected');
    }
}

// ==============================================================================
// LÓGICA DE DETECÇÃO DE COLISÃO (AABB - Axis-Aligned Bounding Box)
// ==============================================================================
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// ==============================================================================
// UPDATE & LÓGICA DE MOVIMENTO
// ==============================================================================
function update() {
    // Movimento do Player
    let dx = 0;
    let dy = 0;

    if (state.keys['ArrowUp'] || state.keys['w'] || state.keys['W']) dy -= player.speed;
    if (state.keys['ArrowDown'] || state.keys['s'] || state.keys['S']) dy += player.speed;
    if (state.keys['ArrowLeft'] || state.keys['a'] || state.keys['A']) dx -= player.speed;
    if (state.keys['ArrowRight'] || state.keys['d'] || state.keys['D']) dx += player.speed;

    // Normaliza velocidade se andando na diagonal (+/-)
    if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx = (dx / length) * player.speed;
        dy = (dy / length) * player.speed;
    }

    player.x += dx;
    player.y += dy;

    // Colisões com as bordas da tela
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;

    // Colisões com Coletáveis
    // Óculos
    if (!items.glasses.collected && checkCollision(player, items.glasses)) {
        items.glasses.collected = true;
    }
    
    // Pano
    if (!items.cloth.collected && checkCollision(player, items.cloth)) {
        items.cloth.collected = true;
    }

    // Atualiza Informações Visuais (HUD + Inv)
    updateUI();
}

// ==============================================================================
// RENDERIZAÇÃO / DESENHO
// ==============================================================================
function drawSpriteOrRect(img, objX, objY, objW, objH, colorFallback) {
    // Desenha a imagem se estiver carregada (src não vazio e completa)
    if (img.src && img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, objX, objY, objW, objH);
    } else {
        // Placeholder geométrico
        ctx.fillStyle = colorFallback;
        ctx.fillRect(objX, objY, objW, objH);
    }
}

function draw() {
    // Limpa a tela
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desenha Background (Cenário)
    if (sprites.map.src && sprites.map.complete && sprites.map.naturalWidth !== 0) {
        ctx.drawImage(sprites.map, 0, 0, canvas.width, canvas.height);
    } else {
        // Chão xadrez ou cor sólida (placeholder isométrico simple)
        ctx.fillStyle = '#4e733b'; // Verde escuro para chão
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Desenha Coletáveis (Caso não tenham sido pegos ainda)
    if (!items.glasses.collected) {
        drawSpriteOrRect(sprites.glasses, items.glasses.x, items.glasses.y, items.glasses.width, items.glasses.height, items.glasses.color);
    }
    
    if (!items.cloth.collected) {
        drawSpriteOrRect(sprites.cloth, items.cloth.x, items.cloth.y, items.cloth.width, items.cloth.height, items.cloth.color);
    }

    // 3. Desenha Jogador
    drawSpriteOrRect(sprites.player, player.x, player.y, player.width, player.height, 'red');
}

// ==============================================================================
// LOOP PRINCIPAL
// ==============================================================================
function gameLoop() {
    // Só atualiza e desenha se estiver focado no jogo (não no inventário)
    if (state.current === 'PLAYING') {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Inicializa a carga dos assets
loadSprites();
