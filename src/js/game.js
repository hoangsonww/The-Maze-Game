document.getElementById('regenerateMaze').addEventListener('click', () => {
    localStorage.getItem('lifetimeScore') ? localStorage.setItem('lifetimeScore', parseInt(localStorage.getItem('lifetimeScore')) - 1) : localStorage.setItem('lifetimeScore', 0);
    window.location.reload();
});

document.getElementById('lifetimeScore').innerText = localStorage.getItem('lifetimeScore') ? `Lifetime Score: ${localStorage.getItem('lifetimeScore')}` : 'Lifetime Score: 0';

const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const rows = 15;
const cols = 20;
const cellSize = canvas.width / cols;
const maze = [];

for (let y = 0; y < rows; y++) {
    maze[y] = [];
    for (let x = 0; x < cols; x++) {
        maze[y][x] = 1;
    }
}

const player = {
    x: 0,
    y: 0,
    size: cellSize / 2,
    color: 'red'
};

let exit = {
    x: cols - 1,
    y: rows - 1,
    size: cellSize,
    color: 'green'
};

function carvePassagesFrom(x, y) {
    const directions = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
    ];

    directions.sort(() => Math.random() - 0.5);

    for (const [dx, dy] of directions) {
        const nx = x + dx * 2;
        const ny = y + dy * 2;

        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && maze[ny][nx] === 1) {
            maze[y + dy][x + dx] = 0;
            maze[ny][nx] = 0;
            carvePassagesFrom(nx, ny);
        }
    }
}

maze[0][0] = 0;
carvePassagesFrom(0, 0);
maze[rows - 1][cols - 1] = 0;

function drawMaze() {
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            ctx.fillStyle = maze[y][x] === 1 ? 'black' : 'white';
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x * cellSize + (cellSize - player.size) / 2, player.y * cellSize + (cellSize - player.size) / 2, player.size, player.size);
}

function drawExit() {
    ctx.fillStyle = exit.color;
    ctx.fillRect(exit.x * cellSize, exit.y * cellSize, exit.size, exit.size);
}

function checkCollision(x, y) {
    return maze[y][x] === 1;
}

// --- Timer: starts on the first move ---
let startTime = null;
let timerStarted = false;
let timerRaf = null;
let gameWon = false;
const timerEl = document.getElementById('timer');

function formatTime(ms) {
    return (ms / 1000).toFixed(1) + 's';
}

function startTimer() {
    if (timerStarted) return;
    timerStarted = true;
    startTime = performance.now();
    function tick() {
        timerEl.innerText = 'Time: ' + formatTime(performance.now() - startTime);
        timerRaf = requestAnimationFrame(tick);
    }
    tick();
}

// --- Sliding movement: one press glides until a wall (or the exit) ---
let slideInterval = null;
const SLIDE_MS = 35; // smaller = faster slide

function stopSliding() {
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }
}

function step(dx, dy) {
    const newX = player.x + dx;
    const newY = player.y + dy;
    if (newX >= 0 && newX < cols && newY >= 0 && newY < rows && !checkCollision(newX, newY)) {
        player.x = newX;
        player.y = newY;
        return true;
    }
    return false;
}

function slide(dx, dy) {
    if (gameWon) return;
    startTimer();
    stopSliding();
    // Move at least one cell immediately, then keep gliding.
    if (!step(dx, dy)) return;
    if (checkWin()) return;
    slideInterval = setInterval(() => {
        if (!step(dx, dy) || checkWin()) {
            stopSliding();
        }
    }, SLIDE_MS);
}

function checkWin() {
    if (player.x === exit.x && player.y === exit.y) {
        gameWon = true;
        stopSliding();
        cancelAnimationFrame(timerRaf);
        const elapsed = startTime ? performance.now() - startTime : 0;

        localStorage.getItem('lifetimeScore') ? localStorage.setItem('lifetimeScore', parseInt(localStorage.getItem('lifetimeScore')) + 1) : localStorage.setItem('lifetimeScore', 1);

        document.getElementById('winMessage').innerText =
            "You escaped the maze! Lifetime score: " + localStorage.getItem('lifetimeScore');
        document.getElementById('winTime').innerText = 'Your time: ' + formatTime(elapsed);
        document.getElementById('winModal').classList.add('show');
        return true;
    }
    return false;
}

document.getElementById('playAgain').addEventListener('click', () => window.location.reload());

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMaze();
    drawPlayer();
    drawExit();
    requestAnimationFrame(draw);
}

draw();

window.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
            slide(0, -1);
            e.preventDefault();
            break;
        case 'ArrowDown':
            slide(0, 1);
            e.preventDefault();
            break;
        case 'ArrowLeft':
            slide(-1, 0);
            e.preventDefault();
            break;
        case 'ArrowRight':
            slide(1, 0);
            e.preventDefault();
            break;
    }
});

document.getElementById('moveUp').addEventListener('click', () => slide(0, -1));
document.getElementById('moveDown').addEventListener('click', () => slide(0, 1));
document.getElementById('moveLeft').addEventListener('click', () => slide(-1, 0));
document.getElementById('moveRight').addEventListener('click', () => slide(1, 0));
