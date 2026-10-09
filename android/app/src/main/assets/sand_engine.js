/**
 * Sandtrix Core Simulation Engine (JavaScript / Mobile Web)
 * - Cellular Automata granular physics (sand, water fluid dynamics, acid corrosion)
 * - Gyroscope-responsive tilt gravity vector (slanted sand heaps, fluid sloshing)
 * - 8-Way BFS edge-to-edge line clears (Sandtrix Mode)
 * - Authentic 10x17 rigid mino grid (Troll Classic Mode)
 * - Mid-air shape-shifting, TNT bomb demolition, calamities & sarcastic troll roaster
 */

const BOARD_WIDTH = 80;
const BOARD_HEIGHT = 140;
const MINO_SIZE = 8;
const DANGER_ROW = 16;

const MATERIAL_EMPTY = 0;
const MATERIAL_WATER = 50;
const MATERIAL_ACID  = 51;
const MATERIAL_BOMB  = 52;

const PALETTE = {
    0: '#161B26', // Cozy Deep Slate
    1: '#F26D78', // Soft Coral Rose
    2: '#F6C453', // Warm Honey Amber
    3: '#4ECCA3', // Pastel Mint Jade
    4: '#5B92E5', // Soft Periwinkle Sky
    50: '#48CAE4', // Soft Lagoon Aqua (Water)
    51: '#C3E88D', // Pastel Lime (Acid)
    52: '#FF6B6B'  // Soft Blush Crimson (Bomb)
};

// Standard Tetromino shapes
const SHAPES = {
    'I': {
        size: 4,
        rotations: [
            [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
            [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
            [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
            [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]
        ]
    },
    'O': {
        size: 2,
        rotations: [
            [[1,1],[1,1]],
            [[1,1],[1,1]],
            [[1,1],[1,1]],
            [[1,1],[1,1]]
        ]
    },
    'T': {
        size: 3,
        rotations: [
            [[0,1,0],[1,1,1],[0,0,0]],
            [[0,1,0],[0,1,1],[0,1,0]],
            [[0,0,0],[1,1,1],[0,1,0]],
            [[0,1,0],[1,1,0],[0,1,0]]
        ]
    },
    'S': {
        size: 3,
        rotations: [
            [[0,1,1],[1,1,0],[0,0,0]],
            [[0,1,0],[0,1,1],[0,0,1]],
            [[0,0,0],[0,1,1],[1,1,0]],
            [[1,0,0],[1,1,0],[0,1,0]]
        ]
    },
    'Z': {
        size: 3,
        rotations: [
            [[1,1,0],[0,1,1],[0,0,0]],
            [[0,0,1],[0,1,1],[0,1,0]],
            [[0,0,0],[1,1,0],[0,1,1]],
            [[0,1,0],[1,1,0],[1,0,0]]
        ]
    },
    'J': {
        size: 3,
        rotations: [
            [[1,0,0],[1,1,1],[0,0,0]],
            [[0,1,1],[0,1,0],[0,1,0]],
            [[0,0,0],[1,1,1],[0,0,1]],
            [[0,1,0],[0,1,0],[1,1,0]]
        ]
    },
    'L': {
        size: 3,
        rotations: [
            [[0,0,1],[1,1,1],[0,0,0]],
            [[0,1,0],[0,1,0],[0,1,1]],
            [[0,0,0],[1,1,1],[1,0,0]],
            [[1,1,0],[0,1,0],[0,1,0]]
        ]
    },
    // Troll shapes
    '.': {
        size: 1,
        rotations: [[[1]], [[1]], [[1]], [[1]]]
    },
    '+': {
        size: 3,
        rotations: [
            [[0,1,0],[1,1,1],[0,1,0]],
            [[0,1,0],[1,1,1],[0,1,0]],
            [[0,1,0],[1,1,1],[0,1,0]],
            [[0,1,0],[1,1,1],[0,1,0]]
        ]
    }
};

const BFS_NEIGHBORS = [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1],          [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1]
];

// Sarcastic troll roasts for Troll Classic Mode
const TROLL_ROASTS = {
    single: [
        "ONLY ONE? GROUNDBREAKING.",
        "BARE MINIMUM ACHIEVED!",
        "IS THAT ALL YOU GOT?",
        "WOW, SLOW DOWN CHAMP.",
        "PITY CLEAR GRANTED."
    ],
    double: [
        "MEDIOCRE AT BEST.",
        "STILL NOT A TETRIS, PAL.",
        "BABY STEPS FOR BABY PLAYERS.",
        "AVERAGE. VERY AVERAGE."
    ],
    triple: [
        "CHOKED ON THE 4TH!",
        "SO CLOSE YET SO FAR!",
        "ALMOST IMPRESSIVE. ALMOST."
    ],
    tetris: [
        "TOTAL ACCIDENT, RIGHT?",
        "CALCULATED LUCK!",
        "WAIT, THAT ACTUALLY WORKED?!",
        "DON'T GET COCKY NOW."
    ],
    hardDrop: [
        "SLAMMED!",
        "FULL SEND!",
        "NO HESITATION!",
        "SMASHED INTO DUST!"
    ],
    morph: [
        "SURPRISE MUTATION!",
        "DIDN'T LIKE THAT PIECE ANYWAY!",
        "GOOD LUCK WITH THIS SHAPE!",
        "CHAOS REIGNS!"
    ],
    bomb: [
        "KABOOM! CLEANUP IN AISLE 4!",
        "DEMOLITION TIME!",
        "BLOWN TO SMITHEREENS!"
    ],
    wind: [
        "WIND BLOWS! HOLD ON!",
        "WHO PUSHED MY PIECE?!"
    ],
    confusion: [
        "CONTROLS INVERTED! GOOD LUCK!",
        "BRAIN REVERSAL ACTIVATED!"
    ],
    shakeRoast: [
        "STOP SHAKING, YOU'RE NOT AN ETCH-A-SKETCH!",
        "IS YOUR PHONE AN AIRPLANE TURBULENCE?",
        "CALM THOSE HANDS DOWN!",
        "EARTHQUAKE DETECTED IN YOUR FINGERS!"
    ],
    gameOver: [
        "SKILL ISSUE DETECTED.",
        "REST IN PIECES.",
        "F IN THE CHAT.",
        "PERHAPS TETRIS ISN'T FOR YOU.",
        "THE CEILING REJECTED YOUR APPLICATION.",
        "RETURN TO SENDER."
    ]
};

function getRandomTrollRoast(category) {
    const arr = TROLL_ROASTS[category] || TROLL_ROASTS.single;
    return arr[Math.floor(Math.random() * arr.length)];
}

class TetrominoPiece {
    constructor(shape, colorIdx) {
        this.shape = shape;
        this.colorIdx = colorIdx;
        this.rotation = 0;
        this.size = SHAPES[shape] ? SHAPES[shape].size : 3;

        // Mino-to-wall grid alignment: center spawn on integer mino column
        const boardMinos = BOARD_WIDTH / MINO_SIZE; // 10
        const spawnCol = Math.floor((boardMinos - this.size) / 2); // 3 for 3-wide
        this.x = spawnCol * MINO_SIZE;
        this.y = 0;

        this.maskWidth = this.size * MINO_SIZE;
        this.maskHeight = this.size * MINO_SIZE;
        this.updateGrainMask();
    }

    isWater() { return this.colorIdx === MATERIAL_WATER; }
    isAcid()  { return this.colorIdx === MATERIAL_ACID; }
    isBomb()  { return this.colorIdx === MATERIAL_BOMB; }

    updateGrainMask() {
        const matrix = SHAPES[this.shape].rotations[this.rotation];
        this.grainMask = new Uint8Array(this.maskWidth * this.maskHeight);

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (matrix[r][c]) {
                    const baseY = r * MINO_SIZE;
                    const baseX = c * MINO_SIZE;
                    for (let gy = 0; gy < MINO_SIZE; gy++) {
                        for (let gx = 0; gx < MINO_SIZE; gx++) {
                            this.grainMask[(baseY + gy) * this.maskWidth + (baseX + gx)] = 1;
                        }
                    }
                }
            }
        }
    }

    getMinX(testRot = -1) {
        const rot = (testRot === -1) ? this.rotation : testRot;
        const matrix = SHAPES[this.shape].rotations[rot];
        let minC = this.size;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (matrix[r][c] && c < minC) {
                    minC = c;
                }
            }
        }
        return -minC * MINO_SIZE;
    }

    getMaxX(testRot = -1) {
        const rot = (testRot === -1) ? this.rotation : testRot;
        const matrix = SHAPES[this.shape].rotations[rot];
        let maxC = -1;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (matrix[r][c] && c > maxC) {
                    maxC = c;
                }
            }
        }
        if (maxC === -1) return BOARD_WIDTH - MINO_SIZE;
        return BOARD_WIDTH - (maxC + 1) * MINO_SIZE;
    }

    collides(grid, offX = 0, offY = 0, testRot = -1) {
        const targetRot = (testRot === -1) ? this.rotation : testRot;
        const matrix = SHAPES[this.shape].rotations[targetRot];
        const testX = this.x + offX;
        const testY = this.y + offY;

        // Strict piece extent boundary check against board limits [0, BOARD_WIDTH)
        const minX = this.getMinX(targetRot);
        const maxX = this.getMaxX(targetRot);
        if (testX < minX || testX > maxX) return true;

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (matrix[r][c]) {
                    const minoX = testX + c * MINO_SIZE;
                    const minoY = testY + r * MINO_SIZE;

                    // Absolute Playfield Boundary Check: No mino can extend beyond [0, BOARD_WIDTH)
                    if (minoX < 0 || minoX + MINO_SIZE > BOARD_WIDTH) return true;
                    if (minoY + MINO_SIZE > BOARD_HEIGHT) return true;

                    // Check sand grid collision for every single grain
                    for (let gy = 0; gy < MINO_SIZE; gy++) {
                        const gyPos = minoY + gy;
                        if (gyPos < 0) continue;
                        for (let gx = 0; gx < MINO_SIZE; gx++) {
                            const gxPos = minoX + gx;
                            if (gxPos < 0 || gxPos >= BOARD_WIDTH) return true;
                            if (grid[gyPos * BOARD_WIDTH + gxPos] !== MATERIAL_EMPTY) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    tryMove(dx, dy, grid) {
        if (this.collides(grid, dx, dy)) {
            return false;
        }
        this.x += dx;
        this.y += dy;
        // Strict boundary clamp
        const minX = this.getMinX();
        const maxX = this.getMaxX();
        if (this.x < minX) this.x = minX;
        if (this.x > maxX) this.x = maxX;
        return true;
    }

    tryRotate(direction, grid) {
        const newRot = (this.rotation + direction + 4) % 4;
        // Standard wall kick offsets (multiples of MINO_SIZE to stay wall-flush)
        const kicks = [
            [0, 0],
            [-MINO_SIZE, 0],
            [MINO_SIZE, 0],
            [-MINO_SIZE * 2, 0],
            [MINO_SIZE * 2, 0],
            [0, -MINO_SIZE]
        ];

        for (const [kx, ky] of kicks) {
            if (!this.collides(grid, kx, ky, newRot)) {
                this.x += kx;
                this.y += ky;
                this.rotation = newRot;
                this.updateGrainMask();
                return true;
            }
        }
        return false;
    }

    morphTo(newShape, grid) {
        if (!SHAPES[newShape]) return false;
        const oldShape = this.shape;
        const oldSize = this.size;
        const oldMaskW = this.maskWidth;
        const oldMaskH = this.maskHeight;

        this.shape = newShape;
        this.size = SHAPES[newShape].size;
        this.rotation = 0;
        this.maskWidth = this.size * MINO_SIZE;
        this.maskHeight = this.size * MINO_SIZE;
        this.updateGrainMask();

        // If morphing collides with wall, try nudging inwards by up to 2 minos
        let nudged = false;
        const nudgeOffsets = [0, -MINO_SIZE, MINO_SIZE, -MINO_SIZE * 2, MINO_SIZE * 2];
        for (const nx of nudgeOffsets) {
            if (!this.collides(grid, nx, 0)) {
                this.x += nx;
                nudged = true;
                break;
            }
        }

        if (!nudged) {
            // Revert if still collision
            this.shape = oldShape;
            this.size = oldSize;
            this.maskWidth = oldMaskW;
            this.maskHeight = oldMaskH;
            this.updateGrainMask();
            return false;
        }
        return true;
    }

    getGhostY(grid, step = 1) {
        let curY = this.y;
        while (!this.collides(grid, 0, curY - this.y + step)) {
            curY += step;
        }
        return curY;
    }

    getOccupiedGrains() {
        const grains = [];
        for (let gy = 0; gy < this.maskHeight; gy++) {
            const worldY = this.y + gy;
            for (let gx = 0; gx < this.maskWidth; gx++) {
                if (this.grainMask[gy * this.maskWidth + gx]) {
                    const worldX = this.x + gx;
                    grains.push({ x: worldX, y: worldY, color: this.colorIdx });
                }
            }
        }
        return grains;
    }
}

class BagRandomizer {
    constructor(enableElements = true, isTroll = false) {
        this.enableElements = enableElements;
        this.isTroll = isTroll;
        this.bag = [];
        this.piecesSpawned = 0;
    }

    refill() {
        const standard = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        // Shuffle standard 7-bag
        for (let i = standard.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [standard[i], standard[j]] = [standard[j], standard[i]];
        }
        this.bag.push(...standard);

        // Rare Troll piece in bag
        if (this.isTroll && Math.random() < 0.4) {
            this.bag.push(Math.random() < 0.5 ? '.' : '+');
        }
    }

    pickColor() {
        // Elements only in Sandtrix mode
        if (this.enableElements && !this.isTroll) {
            const roll = Math.random();
            if (roll < 0.08) return MATERIAL_WATER; // ~8% Water piece
            if (roll < 0.14) return MATERIAL_ACID;  // ~6% Acid piece
            if (roll < 0.17) return MATERIAL_BOMB;  // ~3% TNT Bomb piece
        }
        if (this.isTroll && Math.random() < 0.08) {
            return MATERIAL_BOMB; // Bomb block in Troll mode!
        }
        // Canonical colors 1..4
        return (this.piecesSpawned % 4) + 1;
    }

    next() {
        if (this.bag.length === 0) {
            this.refill();
        }
        const shape = this.bag.shift();
        const color = this.pickColor();
        this.piecesSpawned++;
        return new TetrominoPiece(shape, color);
    }
}

class SandEngine {
    constructor(mode = 'sandtrix', enableElements = true, startLevel = 1) {
        this.mode = mode; // 'sandtrix' or 'troll_classic'
        this.enableElements = enableElements;
        this.grid = new Uint8Array(BOARD_WIDTH * BOARD_HEIGHT);

        // Tilt gravity vector (-1.0 to +1.0)
        this.tiltX = 0.0;
        this.tiltY = 1.0;

        this.score = 0;
        this.highScoreKey = (this.mode === 'troll_classic') ? 'sandtrix_mobile_high_troll' : 'sandtrix_mobile_high_sandtrix';
        
        // Legacy migration
        const legacyHigh = localStorage.getItem('sandtrix_mobile_high');
        if (legacyHigh && !localStorage.getItem('sandtrix_mobile_high_sandtrix')) {
            localStorage.setItem('sandtrix_mobile_high_sandtrix', legacyHigh);
        }

        this.highScore = parseInt(localStorage.getItem(this.highScoreKey) || '0', 10);
        this.startLevel = Math.max(1, Math.min(10, parseInt(startLevel || 1, 10)));
        this.level = this.startLevel;
        this.linesCleared = 0;
        this.rotationsCount = 0;
        this.piecesPlaced = 0;
        this.combo = 0;
        this.gameOver = false;
        this.paused = false;

        this.randomizer = new BagRandomizer(this.enableElements, this.mode === 'troll_classic');
        this.activePiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.nextQueue = [];

        this.gravityTimer = 0;
        this.lockTimer = 0;
        this.isSoftDropping = false;

        // Troll Mode Variables
        this.pieceShiftTriggerY = 0;
        this.pieceHasShifted = false;
        this.calamityTimer = 0;
        this.controlsInverted = false;
        this.controlsInvertTimer = 0;

        // Fill next queue and spawn
        for (let i = 0; i < 3; i++) {
            this.nextQueue.push(this.randomizer.next());
        }
        this.spawnPiece();
    }

    setTilt(rollDeg) {
        // Normalize roll angle (-45 to +45 deg) into [-1.0, 1.0]
        const clamped = Math.max(-45, Math.min(45, rollDeg));
        this.tiltX = clamped / 45.0;
    }

    spawnPiece() {
        if (this.gameOver) return false;
        this.activePiece = this.nextQueue.shift();
        this.nextQueue.push(this.randomizer.next());
        this.canHold = true;
        this.lockTimer = 0;

        // Troll mid-air shift preparation
        if (this.mode === 'troll_classic') {
            this.pieceHasShifted = false;
            this.pieceShiftTriggerY = 30 + Math.floor(Math.random() * 50);
        }

        // Clamp spawn position strictly within legal boundary
        const minX = this.activePiece.getMinX();
        const maxX = this.activePiece.getMaxX();
        this.activePiece.x = Math.max(minX, Math.min(maxX, this.activePiece.x));

        // Spawn collision -> Game Over
        if (this.activePiece.collides(this.grid, 0, 0)) {
            this.gameOver = true;
            this.updateHighScore();
            return false;
        }
        return true;
    }

    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem(this.highScoreKey, this.highScore.toString());
        }
    }

    holdCurrentPiece() {
        if (!this.canHold || !this.activePiece || this.gameOver || this.paused) return false;

        const currentShape = this.activePiece.shape;
        const currentColor = this.activePiece.colorIdx;

        if (!this.holdPiece) {
            this.holdPiece = new TetrominoPiece(currentShape, currentColor);
            this.spawnPiece();
        } else {
            const heldShape = this.holdPiece.shape;
            const heldColor = this.holdPiece.colorIdx;
            this.holdPiece = new TetrominoPiece(currentShape, currentColor);
            this.activePiece = new TetrominoPiece(heldShape, heldColor);
        }
        this.canHold = false;
        this.lockTimer = 0;
        return true;
    }

    movePiece(dx) {
        if (!this.activePiece || this.gameOver || this.paused) return false;
        const actualDx = (this.controlsInverted ? -dx : dx) * MINO_SIZE;
        return this.activePiece.tryMove(actualDx, 0, this.grid);
    }

    rotatePiece(dir) {
        if (!this.activePiece || this.gameOver || this.paused) return false;
        const actualDir = this.controlsInverted ? -dir : dir;
        const rotated = this.activePiece.tryRotate(actualDir, this.grid);
        if (rotated) {
            this.rotationsCount++;
        }
        return rotated;
    }

    hardDrop() {
        if (!this.activePiece || this.gameOver || this.paused) return null;
        const ghostY = this.activePiece.getGhostY(this.grid, MINO_SIZE);
        this.activePiece.y = ghostY;
        const impactCoords = this.activePiece.getOccupiedGrains();
        const event = this.lockActivePiece();
        event.impactCoords = impactCoords;
        event.hardDropped = true;
        return event;
    }

    lockActivePiece() {
        if (!this.activePiece) return {};
        this.piecesPlaced++;
        const event = {
            landed: true,
            isWater: this.activePiece.isWater(),
            isAcid: this.activePiece.isAcid(),
            isBomb: this.activePiece.isBomb(),
            bombCrater: [],
            clearedLines: 0
        };

        if (this.activePiece.isBomb()) {
            // Bomb detonation
            const cx = Math.floor(this.activePiece.x + this.activePiece.maskWidth / 2);
            const cy = Math.floor(this.activePiece.y + this.activePiece.maskHeight / 2);
            event.bombCrater = this.detonateBomb(cx, cy, 14);
            this.score += event.bombCrater.length * 15 * this.level;
            this.updateHighScore();
        } else {
            // Place grains
            const grains = this.activePiece.getOccupiedGrains();
            for (const g of grains) {
                if (g.y >= 0 && g.y < BOARD_HEIGHT && g.x >= 0 && g.x < BOARD_WIDTH) {
                    this.grid[g.y * BOARD_WIDTH + g.x] = g.color;
                }
            }
        }

        this.activePiece = null;
        this.canHold = true;
        this.lockTimer = 0;

        // Check danger ceiling breach
        const dangerLimit = (this.mode === 'troll_classic') ? (4 + MINO_SIZE) : DANGER_ROW;
        for (let r = 0; r < dangerLimit; r++) {
            for (let c = 0; c < BOARD_WIDTH; c++) {
                if (this.grid[r * BOARD_WIDTH + c] !== MATERIAL_EMPTY) {
                    this.gameOver = true;
                    this.updateHighScore();
                    event.gameOver = true;
                    return event;
                }
            }
        }

        this.spawnPiece();
        return event;
    }

    detonateBomb(cx, cy, radius) {
        const crater = [];
        const r2 = radius * radius;
        for (let dy = -radius; dy <= radius; dy++) {
            const py = cy + dy;
            if (py < 0 || py >= BOARD_HEIGHT) continue;
            for (let dx = -radius; dx <= radius; dx++) {
                const px = cx + dx;
                if (px < 0 || px >= BOARD_WIDTH) continue;
                if (dx * dx + dy * dy <= r2) {
                    if (this.grid[py * BOARD_WIDTH + px] !== MATERIAL_EMPTY) {
                        this.grid[py * BOARD_WIDTH + px] = MATERIAL_EMPTY;
                        crater.push({ x: px, y: py });
                    }
                }
            }
        }
        return crater;
    }

    triggerEarthquake() {
        // Shake grains sideways
        for (let y = BOARD_HEIGHT - 2; y >= 20; y--) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const c = this.grid[y * BOARD_WIDTH + x];
                if (c > 0 && Math.random() < 0.25) {
                    const dir = Math.random() < 0.5 ? -1 : 1;
                    const nx = x + dir;
                    if (nx >= 0 && nx < BOARD_WIDTH && this.grid[y * BOARD_WIDTH + nx] === 0) {
                        this.grid[y * BOARD_WIDTH + nx] = c;
                        this.grid[y * BOARD_WIDTH + x] = 0;
                    }
                }
            }
        }
    }

    // ==========================================
    // Cellular Automata Simulation with Tilt
    // ==========================================
    updatePhysics() {
        if (this.mode === 'troll_classic') return false; // Rigid grid in classic mode!

        let moved = false;
        const acidCorroded = [];

        // Bottom-to-top traversal
        for (let y = BOARD_HEIGHT - 2; y >= 0; y--) {
            // Collect filled columns in row
            const xs = [];
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (this.grid[y * BOARD_WIDTH + x] !== MATERIAL_EMPTY) xs.push(x);
            }
            if (xs.length === 0) continue;

            // Randomize scanning order to eliminate directional bias
            for (let i = xs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [xs[i], xs[j]] = [xs[j], xs[i]];
            }

            // Gyroscopic tilt bias:
            // When tiltX < -0.15 (tilted left), bias down-left
            // When tiltX > 0.15 (tilted right), bias down-right
            const preferLeft = (this.tiltX < -0.15);
            const preferRight = (this.tiltX > 0.15);
            const strongTilt = Math.abs(this.tiltX) > 0.45;

            for (const x of xs) {
                const mat = this.grid[y * BOARD_WIDTH + x];
                if (mat === MATERIAL_EMPTY) continue;

                // 1. WATER (FLUID) DYNAMICS
                if (mat === MATERIAL_WATER) {
                    const below = this.grid[(y + 1) * BOARD_WIDTH + x];
                    if (below === MATERIAL_EMPTY) {
                        this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_WATER;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                        moved = true;
                    } else {
                        const dlEmpty = (x > 0 && this.grid[(y + 1) * BOARD_WIDTH + (x - 1)] === MATERIAL_EMPTY);
                        const drEmpty = (x < BOARD_WIDTH - 1 && this.grid[(y + 1) * BOARD_WIDTH + (x + 1)] === MATERIAL_EMPTY);

                        if (dlEmpty && drEmpty) {
                            const nx = preferLeft ? (x - 1) : (preferRight ? (x + 1) : (Math.random() < 0.5 ? x - 1 : x + 1));
                            this.grid[(y + 1) * BOARD_WIDTH + nx] = MATERIAL_WATER;
                            this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                            moved = true;
                        } else if (dlEmpty && !preferRight) {
                            this.grid[(y + 1) * BOARD_WIDTH + (x - 1)] = MATERIAL_WATER;
                            this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                            moved = true;
                        } else if (drEmpty && !preferLeft) {
                            this.grid[(y + 1) * BOARD_WIDTH + (x + 1)] = MATERIAL_WATER;
                            this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                            moved = true;
                        } else {
                            // Lateral flow (sloshing with tilt)
                            const lEmpty = (x > 0 && this.grid[y * BOARD_WIDTH + (x - 1)] === MATERIAL_EMPTY);
                            const rEmpty = (x < BOARD_WIDTH - 1 && this.grid[y * BOARD_WIDTH + (x + 1)] === MATERIAL_EMPTY);

                            if (lEmpty && preferLeft) {
                                this.grid[y * BOARD_WIDTH + (x - 1)] = MATERIAL_WATER;
                                this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                                moved = true;
                            } else if (rEmpty && preferRight) {
                                this.grid[y * BOARD_WIDTH + (x + 1)] = MATERIAL_WATER;
                                this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                                moved = true;
                            } else if (lEmpty && rEmpty) {
                                const nx = Math.random() < 0.5 ? (x - 1) : (x + 1);
                                this.grid[y * BOARD_WIDTH + nx] = MATERIAL_WATER;
                                this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                                moved = true;
                            } else if (lEmpty) {
                                this.grid[y * BOARD_WIDTH + (x - 1)] = MATERIAL_WATER;
                                this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                                moved = true;
                            } else if (rEmpty) {
                                this.grid[y * BOARD_WIDTH + (x + 1)] = MATERIAL_WATER;
                                this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                                moved = true;
                            }
                        }
                    }
                }
                // 2. ACID DYNAMICS
                else if (mat === MATERIAL_ACID) {
                    const below = this.grid[(y + 1) * BOARD_WIDTH + x];
                    if (below === MATERIAL_EMPTY) {
                        this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_ACID;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                        moved = true;
                    } else if (below !== MATERIAL_ACID && below !== MATERIAL_EMPTY) {
                        // Corrode matter below!
                        this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                        acidCorroded.push({ x: x, y: y + 1 });
                        moved = true;
                    } else {
                        const dlEmpty = (x > 0 && this.grid[(y + 1) * BOARD_WIDTH + (x - 1)] === MATERIAL_EMPTY);
                        const drEmpty = (x < BOARD_WIDTH - 1 && this.grid[(y + 1) * BOARD_WIDTH + (x + 1)] === MATERIAL_EMPTY);

                        if (dlEmpty && drEmpty) {
                            const nx = preferLeft ? (x - 1) : (preferRight ? (x + 1) : (Math.random() < 0.5 ? x - 1 : x + 1));
                            this.grid[(y + 1) * BOARD_WIDTH + nx] = MATERIAL_ACID;
                            this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                            moved = true;
                        } else if (dlEmpty) {
                            this.grid[(y + 1) * BOARD_WIDTH + (x - 1)] = MATERIAL_ACID;
                            this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                            moved = true;
                        } else if (drEmpty) {
                            this.grid[(y + 1) * BOARD_WIDTH + (x + 1)] = MATERIAL_ACID;
                            this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                            moved = true;
                        }
                    }
                }
                // 3. SAND DYNAMICS (BUOYANCY SINKING & TILT AVALANCHES)
                else {
                    const below = this.grid[(y + 1) * BOARD_WIDTH + x];
                    if (below === MATERIAL_EMPTY) {
                        this.grid[(y + 1) * BOARD_WIDTH + x] = mat;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                        moved = true;
                    } else if (below === MATERIAL_WATER) {
                        // Sand sinks through water; water rises
                        this.grid[(y + 1) * BOARD_WIDTH + x] = mat;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_WATER;
                        moved = true;
                    } else {
                        const dlVal = (x > 0) ? this.grid[(y + 1) * BOARD_WIDTH + (x - 1)] : 99;
                        const drVal = (x < BOARD_WIDTH - 1) ? this.grid[(y + 1) * BOARD_WIDTH + (x + 1)] : 99;

                        const dlOk = (dlVal === MATERIAL_EMPTY || dlVal === MATERIAL_WATER);
                        const drOk = (drVal === MATERIAL_EMPTY || drVal === MATERIAL_WATER);

                        if (dlOk && drOk) {
                            const nx = preferLeft ? (x - 1) : (preferRight ? (x + 1) : (Math.random() < 0.5 ? x - 1 : x + 1));
                            const targetVal = this.grid[(y + 1) * BOARD_WIDTH + nx];
                            this.grid[(y + 1) * BOARD_WIDTH + nx] = mat;
                            this.grid[y * BOARD_WIDTH + x] = (targetVal === MATERIAL_WATER) ? MATERIAL_WATER : MATERIAL_EMPTY;
                            moved = true;
                        } else if (dlOk && !preferRight) {
                            const targetVal = this.grid[(y + 1) * BOARD_WIDTH + (x - 1)];
                            this.grid[(y + 1) * BOARD_WIDTH + (x - 1)] = mat;
                            this.grid[y * BOARD_WIDTH + x] = (targetVal === MATERIAL_WATER) ? MATERIAL_WATER : MATERIAL_EMPTY;
                            moved = true;
                        } else if (drOk && !preferLeft) {
                            const targetVal = this.grid[(y + 1) * BOARD_WIDTH + (x + 1)];
                            this.grid[(y + 1) * BOARD_WIDTH + (x + 1)] = mat;
                            this.grid[y * BOARD_WIDTH + x] = (targetVal === MATERIAL_WATER) ? MATERIAL_WATER : MATERIAL_EMPTY;
                            moved = true;
                        } else if (strongTilt) {
                            // High phone tilt can slide resting sand sideways!
                            if (preferLeft && x > 0 && this.grid[y * BOARD_WIDTH + (x - 1)] === MATERIAL_EMPTY && Math.random() < 0.2) {
                                this.grid[y * BOARD_WIDTH + (x - 1)] = mat;
                                this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                                moved = true;
                            } else if (preferRight && x < BOARD_WIDTH - 1 && this.grid[y * BOARD_WIDTH + (x + 1)] === MATERIAL_EMPTY && Math.random() < 0.2) {
                                this.grid[y * BOARD_WIDTH + (x + 1)] = mat;
                                this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                                moved = true;
                            }
                        }
                    }
                }
            }
        }

        return { moved, acidCorroded };
    }

    // ==========================================
    // 8-Connected BFS Edge-to-Edge Line Clears
    // ==========================================
    checkLineClears() {
        if (this.mode === 'troll_classic') {
            return this.checkClassicLineClears();
        }

        const clearedCoords = [];
        let bandsCount = 0;
        let lastColor = 0;
        const visited = new Uint8Array(BOARD_WIDTH * BOARD_HEIGHT);

        const colorsToCheck = [1, 2, 3, 4];
        if (this.enableElements) colorsToCheck.push(MATERIAL_WATER);

        for (const color of colorsToCheck) {
            const startRows = [];
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                if (this.grid[y * BOARD_WIDTH + 0] === color) {
                    startRows.push(y);
                }
            }
            if (startRows.length === 0) continue;

            visited.fill(0);

            for (const sy of startRows) {
                if (visited[sy * BOARD_WIDTH + 0]) continue;

                const queue = [[sy, 0]];
                visited[sy * BOARD_WIDTH + 0] = 1;
                const component = [[sy, 0]];
                let reachesRight = false;

                while (queue.length > 0) {
                    const [cy, cx] = queue.shift();
                    if (cx === BOARD_WIDTH - 1) reachesRight = true;

                    for (const [dy, dx] of BFS_NEIGHBORS) {
                        const ny = cy + dy;
                        const nx = cx + dx;
                        if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
                            const idx = ny * BOARD_WIDTH + nx;
                            if (!visited[idx] && this.grid[idx] === color) {
                                visited[idx] = 1;
                                queue.push([ny, nx]);
                                component.push([ny, nx]);
                            }
                        }
                    }
                }

                if (reachesRight) {
                    bandsCount++;
                    lastColor = color;
                    for (const pt of component) {
                        clearedCoords.push(pt);
                    }
                }
            }
        }

        if (clearedCoords.length > 0) {
            // Remove duplicates and clear grid
            const uniqueSet = new Set();
            const finalCoords = [];
            for (const [y, x] of clearedCoords) {
                const key = `${y},${x}`;
                if (!uniqueSet.has(key)) {
                    uniqueSet.add(key);
                    finalCoords.push({ y, x });
                    this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                }
            }

            this.combo++;
            this.linesCleared += bandsCount;
            const comboMult = Math.pow(this.combo, 1.5);
            const gainedScore = Math.floor((finalCoords.length * 5 + bandsCount * 400) * comboMult);
            this.score += gainedScore;
            this.updateHighScore();

            const neededSandBands = (this.level - this.startLevel + 1) * 5;
            if (this.linesCleared >= neededSandBands && this.level < 10) {
                this.level++;
            }

            return {
                cleared: true,
                coords: finalCoords,
                bands: bandsCount,
                color: lastColor,
                combo: this.combo,
                points: gainedScore,
                isWaterWave: (lastColor === MATERIAL_WATER)
            };
        }

        return { cleared: false };
    }

    // Classic 10-column mino row clears
    checkClassicLineClears() {
        const fullRows = [];
        for (let r = 0; r < 17; r++) {
            const yStart = 4 + r * MINO_SIZE;
            let full = true;
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (this.grid[yStart * BOARD_WIDTH + x] === MATERIAL_EMPTY) {
                    full = false;
                    break;
                }
            }
            if (full) fullRows.push(r);
        }

        if (fullRows.length === 0) return { cleared: false };

        const clearedCoords = [];
        for (const r of fullRows) {
            const yStart = 4 + r * MINO_SIZE;
            for (let gy = 0; gy < MINO_SIZE; gy++) {
                for (let x = 0; x < BOARD_WIDTH; x++) {
                    clearedCoords.push({ y: yStart + gy, x });
                }
            }
        }

        // Shift down rows
        const newGrid = new Uint8Array(BOARD_WIDTH * BOARD_HEIGHT);
        for (let r = 16; r >= 0; r--) {
            if (fullRows.includes(r)) continue;
            let drop = 0;
            for (const cr of fullRows) {
                if (cr > r) drop++;
            }
            const srcY = 4 + r * MINO_SIZE;
            const dstY = 4 + (r + drop) * MINO_SIZE;
            for (let gy = 0; gy < MINO_SIZE; gy++) {
                for (let x = 0; x < BOARD_WIDTH; x++) {
                    newGrid[(dstY + gy) * BOARD_WIDTH + x] = this.grid[(srcY + gy) * BOARD_WIDTH + x];
                }
            }
        }
        this.grid = newGrid;

        const count = fullRows.length;
        this.linesCleared += count;
        let basePoints = 100;
        let typeName = 'single';
        if (count === 2) { basePoints = 300; typeName = 'double'; }
        else if (count === 3) { basePoints = 500; typeName = 'triple'; }
        else if (count >= 4) { basePoints = 800; typeName = 'tetris'; }

        const gained = basePoints * this.level;
        this.score += gained;
        this.updateHighScore();

        const neededClassicLines = (this.level - this.startLevel + 1) * 10;
        if (this.linesCleared >= neededClassicLines && this.level < 10) {
            this.level++;
        }

        return {
            cleared: true,
            coords: clearedCoords,
            bands: count,
            color: 1,
            combo: 1,
            points: gained,
            classicLines: count,
            trollType: typeName,
            roast: getRandomTrollRoast(typeName)
        };
    }

    // ==========================================
    // Main Simulation Tick (Called every frame)
    // ==========================================
    tick(dtMs) {
        if (this.gameOver || this.paused) return {};

        const tickResult = {};

        // Invert controls timer countdown
        if (this.controlsInverted) {
            this.controlsInvertTimer -= dtMs;
            if (this.controlsInvertTimer <= 0) {
                this.controlsInverted = false;
            }
        }

        // Calamities in Troll mode
        if (this.mode === 'troll_classic') {
            this.calamityTimer += dtMs;
            if (this.calamityTimer > 18000) { // Every 18s
                this.calamityTimer = 0;
                const calamityRoll = Math.random();
                if (calamityRoll < 0.35 && this.activePiece) {
                    // Wind gust pushes piece 1 column
                    const dir = Math.random() < 0.5 ? -1 : 1;
                    if (this.activePiece.tryMove(dir * MINO_SIZE, 0, this.grid)) {
                        tickResult.windGust = true;
                        tickResult.roast = getRandomTrollRoast('wind');
                    }
                } else if (calamityRoll < 0.70) {
                    // Earthquake tremor
                    this.triggerEarthquake();
                    tickResult.earthquake = true;
                } else {
                    // Invert controls
                    this.controlsInverted = true;
                    this.controlsInvertTimer = 5000;
                    tickResult.confusion = true;
                    tickResult.roast = getRandomTrollRoast('confusion');
                }
            }

            // Mid-air shape morphing
            if (this.activePiece && !this.pieceHasShifted && this.activePiece.y >= this.pieceShiftTriggerY) {
                this.pieceHasShifted = true;
                if (Math.random() < 0.45) {
                    const shapesPool = ['I', 'O', 'T', 'S', 'Z', 'J', 'L', '.', '+'];
                    const newShape = shapesPool[Math.floor(Math.random() * shapesPool.length)];
                    if (newShape !== this.activePiece.shape) {
                        if (this.activePiece.morphTo(newShape, this.grid)) {
                            tickResult.shapeShifted = true;
                            tickResult.newShape = newShape;
                            tickResult.roast = getRandomTrollRoast('morph');
                        }
                    }
                }
            }
        }

        // Gravity intervals
        const gravityIntervals = (this.mode === 'troll_classic')
            ? [500, 440, 380, 320, 260, 210, 160, 120, 90, 70]
            : [45, 40, 35, 30, 25, 20, 16, 13, 10, 8];

        const targetInterval = this.isSoftDropping ? 4 : gravityIntervals[Math.min(9, this.level - 1)];

        this.gravityTimer += dtMs;
        if (this.gravityTimer >= targetInterval) {
            this.gravityTimer = 0;
            if (this.activePiece) {
                const dy = (this.mode === 'troll_classic') ? MINO_SIZE : 1;
                if (!this.activePiece.tryMove(0, dy, this.grid)) {
                    // Block landed
                    this.lockTimer += targetInterval;
                    if (this.lockTimer >= 350 || this.isSoftDropping) {
                        const lockEvent = this.lockActivePiece();
                        Object.assign(tickResult, lockEvent);
                    }
                } else {
                    this.lockTimer = 0;
                }
            }
        }

        // Physics Sub-steps (Sandtrix Mode)
        if (this.mode === 'sandtrix') {
            for (let substep = 0; substep < 2; substep++) {
                const physRes = this.updatePhysics();
                if (physRes && physRes.acidCorroded && physRes.acidCorroded.length > 0) {
                    tickResult.acidCorroded = physRes.acidCorroded;
                }
            }
        }

        // Check line clears
        const clearEvent = this.checkLineClears();
        if (clearEvent.cleared) {
            Object.assign(tickResult, clearEvent);
        } else if (!this.activePiece) {
            // Reset combo when sand settles
            this.combo = 0;
        }

        return tickResult;
    }
}
