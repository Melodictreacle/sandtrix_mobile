/**
 * Sandtrix Core Simulation Engine (JavaScript / Mobile Web)
 * - Complete 4 Game Modes: Sandtrix, Classic Tetris, Mystery Sandtrix, Troll Classic
 * - Full Chemical & Thermodynamic Cellular Automata Suite:
 *   Water, Acid, Ice, Fire, Steam, Toxic Gas, Ash, Diluted Acid, TNT Bombs
 * - Gyroscope-responsive tilt gravity vector (slanted sand heaps, fluid sloshing)
 * - 8-Way BFS edge-to-edge line clears with Tidal Wave and Diluted Acid Cleanse
 * - Mission Line Goals (Endless, 20L, 40L, 100L) with Victory Detection
 * - Comprehensive Performance & Efficiency Statistics Tracking
 */

const BOARD_WIDTH = 80;
const BOARD_HEIGHT = 140;
const MINO_SIZE = 8;
const DANGER_ROW = 16;

const MATERIAL_EMPTY        = 0;
const MATERIAL_WATER        = 50;  // Turquoise Aqua (#00D2D7)
const MATERIAL_ACID         = 51;  // Chartreuse Lime (#CDEB2D)
const MATERIAL_BOMB         = 52;  // TNT Red (#FF4B4B)
const MATERIAL_ICE          = 53;  // Glacial Frost Blue (#99E6FF)
const MATERIAL_FIRE         = 54;  // Blazing Fiery Orange (#FF4500)
const MATERIAL_STEAM        = 55;  // Soft Mist White-Blue (#E1EBF5)
const MATERIAL_TOXIC_GAS    = 56;  // Radioactive Neon Green (#39FF14)
const MATERIAL_ASH          = 57;  // Charcoal Ash Gray (#8A9096)
const MATERIAL_DILUTED_ACID = 58;  // Shimmering Aquamarine (#18E4CC)

const PALETTE = {
    0:  '#12151C', // Deep Slate Background
    1:  '#EB4B4B', // Crimson Ruby
    2:  '#F5B923', // Amber Gold
    3:  '#28B964', // Emerald Jade
    4:  '#327DEB', // Sapphire Blue
    5:  '#9D8DF1', // Soft Lavender Purple
    6:  '#FF9F43', // Pastel Tangerine Orange
    50: '#00D2D7', // Turquoise Aqua (Water)
    51: '#CDEB2D', // Chartreuse Lime (Acid)
    52: '#FF4B4B', // TNT Red (Bomb)
    53: '#99E6FF', // Glacial Frost Blue (Ice)
    54: '#FF4500', // Blazing Fiery Orange (Fire)
    55: '#E1EBF5', // Soft Mist White-Blue (Steam)
    56: '#39FF14', // Radioactive Toxic Green (Toxic Gas)
    57: '#8A9096', // Charcoal Ash Gray (Ash)
    58: '#18E4CC'  // Shimmering Aquamarine (Diluted Acid)
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
    // Rare Troll / Mystery shapes
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
    [-1,  0], // up
    [ 0, -1], // left
    [ 0,  1], // right
    [ 1,  0], // down
    [-1, -1], // up-left
    [-1,  1], // up-right
    [ 1, -1], // down-left
    [ 1,  1]  // down-right
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

// Playful hype quotes for Mystery Sandtrix Mode
const MYSTERY_HYPE = {
    combo: [
        "ACCIDENTAL GENIUS!",
        "CALCULATED!",
        "WAIT, THAT WORKED?!",
        "BIG BRAIN TIME!",
        "AVALANCHE POWER!"
    ],
    morph: [
        "MUTATION UNLEASHED!",
        "ADAPT AND SURVIVE!",
        "SURPRISE SHIFT!"
    ],
    bomb: [
        "CRATER DEMOLITION!",
        "KABOOM! EXCAVATED!"
    ],
    calamity: [
        "SEISMIC TREMOR!",
        "GALE FORCE WIND!",
        "NEURAL REVERSAL!"
    ]
};

function getRandomTrollRoast(category) {
    const arr = TROLL_ROASTS[category] || TROLL_ROASTS.single;
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomMysteryHype(category) {
    const arr = MYSTERY_HYPE[category] || MYSTERY_HYPE.combo;
    return arr[Math.floor(Math.random() * arr.length)];
}

class TetrominoPiece {
    constructor(shape, colorIdx, isTroll = false) {
        this.shape = shape;
        this.colorIdx = colorIdx;
        this.isTroll = isTroll;
        this.rotation = 0;
        this.size = SHAPES[shape] ? SHAPES[shape].size : 3;

        // Mino-to-wall grid alignment: center spawn on integer mino column
        const boardMinos = BOARD_WIDTH / MINO_SIZE; // 10
        const spawnCol = Math.floor((boardMinos - this.size) / 2); // 3 for 3-wide
        this.x = spawnCol * MINO_SIZE;
        this.y = isTroll ? 4 : 0;

        this.maskWidth = this.size * MINO_SIZE;
        this.maskHeight = this.size * MINO_SIZE;
        this.updateGrainMask();
    }

    isWater() { return this.colorIdx === MATERIAL_WATER; }
    isAcid()  { return this.colorIdx === MATERIAL_ACID; }
    isBomb()  { return this.colorIdx === MATERIAL_BOMB; }
    isIce()   { return this.colorIdx === MATERIAL_ICE; }
    isFire()  { return this.colorIdx === MATERIAL_FIRE; }

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

        const minX = this.getMinX(targetRot);
        const maxX = this.getMaxX(targetRot);
        if (testX < minX || testX > maxX) return true;

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (matrix[r][c]) {
                    const minoX = testX + c * MINO_SIZE;
                    const minoY = testY + r * MINO_SIZE;

                    if (minoX < 0 || minoX + MINO_SIZE > BOARD_WIDTH) return true;
                    if (minoY + MINO_SIZE > BOARD_HEIGHT) return true;

                    for (let gy = 0; gy < MINO_SIZE; gy++) {
                        const gyPos = minoY + gy;
                        if (gyPos < 0) continue;
                        for (let gx = 0; gx < MINO_SIZE; gx++) {
                            const gxPos = minoX + gx;
                            if (gxPos < 0 || gxPos >= BOARD_WIDTH) return true;
                            const mat = grid[gyPos * BOARD_WIDTH + gxPos];
                            // Non-empty matter (excluding rising vapors) causes collision
                            if (mat !== MATERIAL_EMPTY && mat !== MATERIAL_STEAM && mat !== MATERIAL_TOXIC_GAS) {
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
        const minX = this.getMinX();
        const maxX = this.getMaxX();
        if (this.x < minX) this.x = minX;
        if (this.x > maxX) this.x = maxX;
        return true;
    }

    tryRotate(direction, grid) {
        const newRot = (this.rotation + direction + 4) % 4;
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

        let nudged = false;
        const nudgeOffsets = [
            [0, 0],
            [-MINO_SIZE, 0], [MINO_SIZE, 0],
            [0, -MINO_SIZE],
            [-MINO_SIZE, -MINO_SIZE], [MINO_SIZE, -MINO_SIZE],
            [-MINO_SIZE * 2, 0], [MINO_SIZE * 2, 0]
        ];
        for (const [nx, ny] of nudgeOffsets) {
            if (!this.collides(grid, nx, ny)) {
                this.x += nx;
                this.y += ny;
                nudged = true;
                break;
            }
        }

        if (!nudged) {
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
    constructor(enableElements = true, mode = 'sandtrix') {
        this.enableElements = enableElements;
        this.mode = mode; // 'sandtrix', 'classic', 'mystery', 'troll_classic'
        this.bag = [];
        this.colorBag = [];
        this.piecesSpawned = 0;
    }

    isClassic() { return this.mode === 'classic' || this.mode === 'troll_classic'; }
    isMystery() { return this.mode === 'mystery' || this.mode === 'troll_classic'; }

    refill() {
        const standard = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        for (let i = standard.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [standard[i], standard[j]] = [standard[j], standard[i]];
        }
        this.bag.push(...standard);

        // In Mystery and Troll modes: 35% chance to include a rare mutant shape
        if (this.isMystery() && Math.random() < 0.35) {
            this.bag.push(Math.random() < 0.5 ? '.' : '+');
        }
    }

    pickColor() {
        // Pure Classic Tetris: strictly 6 colors, zero elements
        if (this.mode === 'classic') {
            return this.pickStandardColor();
        }

        // Mystery Mode (Sandtrix with chaos & elements)
        if (this.mode === 'mystery') {
            const roll = Math.random();
            if (roll < 0.10) return MATERIAL_BOMB;  // 10% TNT Bomb
            if (roll < 0.18) return MATERIAL_WATER; // 8% Water
            if (roll < 0.26) return MATERIAL_ICE;   // 8% Ice
            if (roll < 0.34) return MATERIAL_FIRE;  // 8% Fire
            if (roll < 0.40) return MATERIAL_ACID;  // 6% Acid
            return this.pickStandardColor();
        }

        // Troll Classic Mode (Rigid grid with bombs)
        if (this.mode === 'troll_classic') {
            if (Math.random() < 0.10) {
                return MATERIAL_BOMB; // Bomb block in Troll mode!
            }
            return this.pickStandardColor();
        }

        // Standard Sandtrix Mode with optional elements
        if (this.enableElements) {
            const roll = Math.random();
            if (roll < 0.08) return MATERIAL_WATER; // 8% Water
            if (roll < 0.16) return MATERIAL_ICE;   // 8% Ice
            if (roll < 0.24) return MATERIAL_FIRE;  // 8% Fire
            if (roll < 0.30) return MATERIAL_ACID;  // 6% Acid
            if (roll < 0.34) return MATERIAL_BOMB;  // 4% Bomb
        }

        return this.pickStandardColor();
    }

    pickStandardColor() {
        if (this.colorBag.length === 0) {
            this.colorBag = [1, 2, 3, 4, 5, 6];
            for (let i = this.colorBag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.colorBag[i], this.colorBag[j]] = [this.colorBag[j], this.colorBag[i]];
            }
        }
        return this.colorBag.shift();
    }

    next() {
        if (this.bag.length === 0) {
            this.refill();
        }
        const shape = this.bag.shift();
        const color = this.pickColor();
        this.piecesSpawned++;
        const isTroll = this.mode === 'troll_classic';
        return new TetrominoPiece(shape, color, isTroll);
    }
}

class SandEngine {
    constructor(mode = 'sandtrix', enableElements = true, startLevel = 1, lineGoal = 0) {
        // Supported Modes: 'sandtrix', 'classic', 'mystery', 'troll_classic'
        this.mode = mode;
        this.enableElements = enableElements;
        this.startLevel = Math.max(1, Math.min(10, parseInt(startLevel || 1, 10)));
        this.level = this.startLevel;
        this.lineGoal = parseInt(lineGoal || 0, 10); // 0 = Endless, 20, 40, 100
        this.missionCompleted = false;

        this.grid = new Uint8Array(BOARD_WIDTH * BOARD_HEIGHT);

        // Tilt gravity vector (-1.0 to +1.0)
        this.tiltX = 0.0;
        this.tiltY = 1.0;

        this.score = 0;
        this.highScoreKey = `sandtrix_mobile_high_${this.mode}`;
        
        // Legacy migration
        const legacyHigh = localStorage.getItem('sandtrix_mobile_high');
        if (legacyHigh && !localStorage.getItem('sandtrix_mobile_high_sandtrix')) {
            localStorage.setItem('sandtrix_mobile_high_sandtrix', legacyHigh);
        }

        this.highScore = parseInt(localStorage.getItem(this.highScoreKey) || '0', 10);
        this.linesCleared = 0;
        this.rotationsCount = 0;
        this.piecesPlaced = 0;
        this.keysPressed = 0;
        this.combo = 0;
        this.gameOver = false;
        this.paused = false;
        this.survivalTimeMs = 0;

        // Breakdown stats
        this.stats = {
            singles: 0,
            doubles: 0,
            triples: 0,
            tetrises: 0,
            bands: 0,
            maxCombo: 0
        };

        this.randomizer = new BagRandomizer(this.enableElements, this.mode);
        this.activePiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.nextQueue = [];

        this.gravityTimer = 0;
        this.lockTimer = 0;
        this.isSoftDropping = false;

        // Mystery / Troll variables
        this.pieceShiftTriggerY = 0;
        this.pieceHasShifted = false;
        this.calamityTimer = 0;
        this.controlsInverted = false;
        this.controlsInvertTimer = 0;

        for (let i = 0; i < 6; i++) {
            this.nextQueue.push(this.randomizer.next());
        }
        this.spawnPiece();
    }

    isClassicGrid() {
        return this.mode === 'classic' || this.mode === 'troll_classic';
    }

    isMysteryOrTroll() {
        return this.mode === 'mystery' || this.mode === 'troll_classic';
    }

    setTilt(rollDeg) {
        const clamped = Math.max(-45, Math.min(45, rollDeg));
        this.tiltX = clamped / 45.0;
    }

    spawnPiece() {
        if (this.gameOver || this.missionCompleted) return false;
        this.activePiece = this.nextQueue.shift();
        this.nextQueue.push(this.randomizer.next());
        this.canHold = true;
        this.lockTimer = 0;

        if (this.isClassicGrid()) {
            this.activePiece.y = 4;
        } else {
            this.activePiece.y = 0;
        }

        if (this.isMysteryOrTroll()) {
            this.pieceHasShifted = false;
            this.pieceShiftTriggerY = 30 + Math.floor(Math.random() * 50);
        }

        const minX = this.activePiece.getMinX();
        const maxX = this.activePiece.getMaxX();
        this.activePiece.x = Math.max(minX, Math.min(maxX, this.activePiece.x));

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

    registerInput() {
        this.keysPressed++;
    }

    holdCurrentPiece() {
        this.registerInput();
        if (!this.canHold || !this.activePiece || this.gameOver || this.paused || this.missionCompleted) return false;

        const isTroll = this.mode === 'troll_classic';
        const currentShape = this.activePiece.shape;
        const currentColor = this.activePiece.colorIdx;

        if (!this.holdPiece) {
            this.holdPiece = new TetrominoPiece(currentShape, currentColor, isTroll);
            if (!this.spawnPiece()) {
                this.gameOver = true;
                this.updateHighScore();
                return false;
            }
        } else {
            const heldShape = this.holdPiece.shape;
            const heldColor = this.holdPiece.colorIdx;
            this.holdPiece = new TetrominoPiece(currentShape, currentColor, isTroll);
            this.activePiece = new TetrominoPiece(heldShape, heldColor, isTroll);
            if (this.isClassicGrid()) {
                this.activePiece.y = 4;
            }
            if (this.activePiece.collides(this.grid, 0, 0)) {
                this.gameOver = true;
                this.updateHighScore();
                return false;
            }
        }
        this.canHold = false;
        this.lockTimer = 0;
        return true;
    }

    movePiece(dx) {
        this.registerInput();
        if (!this.activePiece || this.gameOver || this.paused || this.missionCompleted) return false;
        const actualDx = (this.controlsInverted ? -dx : dx) * MINO_SIZE;
        const moved = this.activePiece.tryMove(actualDx, 0, this.grid);
        if (moved) {
            this.checkActivePieceContactReactions();
        }
        return moved;
    }

    rotatePiece(dir) {
        this.registerInput();
        if (!this.activePiece || this.gameOver || this.paused || this.missionCompleted) return false;
        const actualDir = this.controlsInverted ? -dir : dir;
        const rotated = this.activePiece.tryRotate(actualDir, this.grid);
        if (rotated) {
            this.rotationsCount++;
            this.checkActivePieceContactReactions();
        }
        return rotated;
    }

    // Elemental proximity reactions while moving/dropping active pieces
    checkActivePieceContactReactions() {
        if (!this.activePiece || this.isClassicGrid()) return;

        const dOffsets = [[1, 0], [2, 0], [0, 1], [0, -1], [1, 1], [1, -1]];
        const grains = this.activePiece.getOccupiedGrains();

        if (this.activePiece.isIce()) {
            // Ice freezes contacting water into ice, dilutes contacting acid
            for (const g of grains) {
                for (const [dy, dx] of dOffsets) {
                    const ny = g.y + dy;
                    const nx = g.x + dx;
                    if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
                        const idx = ny * BOARD_WIDTH + nx;
                        if (this.grid[idx] === MATERIAL_WATER) {
                            this.grid[idx] = MATERIAL_ICE;
                        } else if (this.grid[idx] === MATERIAL_ACID) {
                            this.grid[idx] = MATERIAL_DILUTED_ACID;
                            this.diluteAcidCluster(ny, nx);
                        }
                    }
                }
            }
        } else if (this.activePiece.isAcid()) {
            // Acid converts contacting water or ice into diluted acid
            for (const g of grains) {
                for (const [dy, dx] of dOffsets) {
                    const ny = g.y + dy;
                    const nx = g.x + dx;
                    if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
                        const idx = ny * BOARD_WIDTH + nx;
                        const c = this.grid[idx];
                        if (c === MATERIAL_WATER || c === MATERIAL_ICE) {
                            this.grid[idx] = MATERIAL_DILUTED_ACID;
                            this.diluteAcidCluster(ny, nx);
                        }
                    }
                }
            }
        } else if (this.activePiece.isFire()) {
            // Fire melts contacting ice into water
            for (const g of grains) {
                for (const [dy, dx] of dOffsets) {
                    const ny = g.y + dy;
                    const nx = g.x + dx;
                    if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
                        const idx = ny * BOARD_WIDTH + nx;
                        if (this.grid[idx] === MATERIAL_ICE) {
                            this.grid[idx] = MATERIAL_WATER;
                        }
                    }
                }
            }
        }
    }

    hardDrop() {
        this.registerInput();
        if (!this.activePiece || this.gameOver || this.paused || this.missionCompleted) return null;
        const step = this.isClassicGrid() ? MINO_SIZE : 1;
        const ghostY = this.activePiece.getGhostY(this.grid, step);
        this.activePiece.y = ghostY;
        const impactCoords = this.activePiece.getOccupiedGrains();

        // 30% chance for an impact earthquake tremor in Mystery mode
        if (this.mode === 'mystery' && Math.random() < 0.30) {
            this.triggerEarthquake();
        }

        const event = this.lockActivePiece();
        event.impactCoords = impactCoords;
        event.hardDropped = true;
        if (this.gameOver) {
            event.gameOver = true;
        }
        return event;
    }

    // Helper: Dilute contiguous acid cluster into diluted acid
    diluteAcidCluster(startY, startX) {
        const queue = [[startY, startX]];
        while (queue.length > 0) {
            const [cy, cx] = queue.shift();
            for (const [dy, dx] of BFS_NEIGHBORS) {
                const ny = cy + dy;
                const nx = cx + dx;
                if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
                    const idx = ny * BOARD_WIDTH + nx;
                    if (this.grid[idx] === MATERIAL_ACID) {
                        this.grid[idx] = MATERIAL_DILUTED_ACID;
                        queue.push([ny, nx]);
                    }
                }
            }
        }
    }

    // Helper: Melt fire cluster to water
    convertFireToWaterCluster(startY, startX) {
        const queue = [[startY, startX]];
        this.grid[startY * BOARD_WIDTH + startX] = MATERIAL_WATER;
        while (queue.length > 0) {
            const [cy, cx] = queue.shift();
            for (const [dy, dx] of BFS_NEIGHBORS) {
                const ny = cy + dy;
                const nx = cx + dx;
                if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
                    const idx = ny * BOARD_WIDTH + nx;
                    if (this.grid[idx] === MATERIAL_FIRE) {
                        this.grid[idx] = MATERIAL_WATER;
                        queue.push([ny, nx]);
                    }
                }
            }
        }
    }

    lockActivePiece() {
        if (!this.activePiece) return {};
        this.piecesPlaced++;
        const event = {
            landed: true,
            isWater: this.activePiece.isWater(),
            isAcid:  this.activePiece.isAcid(),
            isBomb:  this.activePiece.isBomb(),
            isIce:   this.activePiece.isIce(),
            isFire:  this.activePiece.isFire(),
            bombCrater: [],
            clearedLines: 0
        };

        const isIce  = this.activePiece.isIce();
        const isFire = this.activePiece.isFire();
        const isAcid = this.activePiece.isAcid();
        const isBomb = this.activePiece.isBomb();

        const grains = this.activePiece.getOccupiedGrains();

        // 1. TNT Bomb Landing
        if (isBomb) {
            const cx = Math.floor(this.activePiece.x + this.activePiece.maskWidth / 2);
            const cy = Math.floor(this.activePiece.y + this.activePiece.maskHeight / 2);
            event.bombCrater = this.detonateBomb(cx, cy, 14);
            const pts = event.bombCrater.length * 15 * this.level;
            this.score += pts;
            this.updateHighScore();
            event.bombDetonated = true;
            event.bombX = cx;
            event.bombY = cy;
            event.points = pts;
        }
        // 2. Fire Landing Reactions (Thermodynamics)
        else if (isFire) {
            let hitWater = false;
            let hitIce   = false;
            let hitAcid  = false;
            let hitSand  = false;
            const contactAcid = [];
            const contactSand = [];

            const dCoords = [[1,0], [2,0], [0,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1]];
            for (const g of grains) {
                for (const [dy, dx] of dCoords) {
                    const ny = g.y + dy;
                    const nx = g.x + dx;
                    if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
                        const val = this.grid[ny * BOARD_WIDTH + nx];
                        if (val === MATERIAL_WATER || val === MATERIAL_DILUTED_ACID) {
                            hitWater = true;
                        } else if (val === MATERIAL_ICE) {
                            hitIce = true;
                        } else if (val === MATERIAL_ACID) {
                            hitAcid = true;
                            contactAcid.push([ny, nx]);
                        } else if ((val >= 1 && val <= 6) || val === MATERIAL_ASH) {
                            hitSand = true;
                            if (val >= 1 && val <= 6) contactSand.push([ny, nx]);
                        }
                    }
                }
            }

            // A. Fire on Ice -> Melts 100% of all ice to water & converts fire to water!
            if (hitIce) {
                for (let i = 0; i < BOARD_WIDTH * BOARD_HEIGHT; i++) {
                    if (this.grid[i] === MATERIAL_ICE) {
                        this.grid[i] = MATERIAL_WATER;
                    }
                }
                for (const g of grains) {
                    if (g.y >= 0 && g.y < BOARD_HEIGHT && g.x >= 0 && g.x < BOARD_WIDTH) {
                        this.grid[g.y * BOARD_WIDTH + g.x] = MATERIAL_WATER;
                    }
                }
                event.iceMelted = true;
            }
            // B. Fire on Water -> Totally extinguished!
            else if (hitWater) {
                event.fireExtinguished = true;
            }
            // C. Fire on Acid -> Chemical explosion generating rising toxic gas!
            else if (hitAcid) {
                for (const [ay, ax] of contactAcid) {
                    this.grid[ay * BOARD_WIDTH + ax] = MATERIAL_TOXIC_GAS;
                }
                for (const g of grains) {
                    if (g.y >= 0 && g.y < BOARD_HEIGHT && g.x >= 0 && g.x < BOARD_WIDTH) {
                        this.grid[g.y * BOARD_WIDTH + g.x] = MATERIAL_TOXIC_GAS;
                    }
                }
                event.toxicGasSpawned = true;
            }
            // D. Fire on Sand -> Scorches ~1/3 of sand into Ash, fire burns out cleanly
            else if (hitSand) {
                if (contactSand.length > 0) {
                    const ashCount = Math.max(1, Math.round(contactSand.length / 3));
                    for (let i = 0; i < ashCount && i < contactSand.length; i++) {
                        const [sy, sx] = contactSand[i];
                        this.grid[sy * BOARD_WIDTH + sx] = MATERIAL_ASH;
                    }
                }
                event.sandBurned = true;
            }
            // E. Normal Fire placement
            else {
                for (const g of grains) {
                    if (g.y >= 0 && g.y < BOARD_HEIGHT && g.x >= 0 && g.x < BOARD_WIDTH) {
                        this.grid[g.y * BOARD_WIDTH + g.x] = MATERIAL_FIRE;
                    }
                }
            }
        }
        // 3. Ice Landing Reactions
        else if (isIce) {
            let hitAcid = false;
            const contactAcid = [];
            const dCoords = [[1,0], [2,0], [0,1], [0,-1], [1,1], [1,-1]];
            for (const g of grains) {
                for (const [dy, dx] of dCoords) {
                    const ny = g.y + dy;
                    const nx = g.x + dx;
                    if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
                        const val = this.grid[ny * BOARD_WIDTH + nx];
                        if (val === MATERIAL_WATER) {
                            this.grid[ny * BOARD_WIDTH + nx] = MATERIAL_ICE;
                        } else if (val === MATERIAL_ACID) {
                            hitAcid = true;
                            contactAcid.push([ny, nx]);
                        }
                    }
                }
            }

            if (hitAcid) {
                for (const [ay, ax] of contactAcid) {
                    this.grid[ay * BOARD_WIDTH + ax] = MATERIAL_DILUTED_ACID;
                    this.diluteAcidCluster(ay, ax);
                }
                for (const g of grains) {
                    if (g.y >= 0 && g.y < BOARD_HEIGHT && g.x >= 0 && g.x < BOARD_WIDTH) {
                        this.grid[g.y * BOARD_WIDTH + g.x] = MATERIAL_DILUTED_ACID;
                    }
                }
                event.acidDiluted = true;
            } else {
                for (const g of grains) {
                    if (g.y >= 0 && g.y < BOARD_HEIGHT && g.x >= 0 && g.x < BOARD_WIDTH) {
                        this.grid[g.y * BOARD_WIDTH + g.x] = MATERIAL_ICE;
                    }
                }
            }
        }
        // 4. Acid Landing Reactions
        else if (isAcid) {
            let hitLiquid = false;
            const dCoords = [[1,0], [2,0], [0,1], [0,-1], [1,1], [1,-1]];
            for (const g of grains) {
                for (const [dy, dx] of dCoords) {
                    const ny = g.y + dy;
                    const nx = g.x + dx;
                    if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
                        const val = this.grid[ny * BOARD_WIDTH + nx];
                        if (val === MATERIAL_WATER || val === MATERIAL_ICE || val === MATERIAL_DILUTED_ACID) {
                            hitLiquid = true;
                            this.grid[ny * BOARD_WIDTH + nx] = MATERIAL_DILUTED_ACID;
                        }
                    }
                }
            }

            if (hitLiquid) {
                for (const g of grains) {
                    if (g.y >= 0 && g.y < BOARD_HEIGHT && g.x >= 0 && g.x < BOARD_WIDTH) {
                        this.grid[g.y * BOARD_WIDTH + g.x] = MATERIAL_DILUTED_ACID;
                        this.diluteAcidCluster(g.y, g.x);
                    }
                }
                event.acidDiluted = true;
            } else {
                for (const g of grains) {
                    if (g.y >= 0 && g.y < BOARD_HEIGHT && g.x >= 0 && g.x < BOARD_WIDTH) {
                        this.grid[g.y * BOARD_WIDTH + g.x] = MATERIAL_ACID;
                    }
                }
            }
        }
        // 5. Standard Grains
        else {
            for (const g of grains) {
                if (g.y >= 0 && g.y < BOARD_HEIGHT && g.x >= 0 && g.x < BOARD_WIDTH) {
                    this.grid[g.y * BOARD_WIDTH + g.x] = g.color;
                }
            }
        }

        this.activePiece = null;
        this.canHold = true;
        this.lockTimer = 0;
        this.isSoftDropping = false;

        // Immediate sand cascade burst: ensures newly-deposited grains drop
        // all the way to the bottom of the grid or onto resting mounds immediately
        if (!this.isClassicGrid()) {
            for (let s = 0; s < 10; s++) {
                this.updatePhysics();
            }
        }

        // Check danger ceiling breach
        if (this.checkDangerCeiling()) {
            this.gameOver = true;
            this.updateHighScore();
            event.gameOver = true;
            return event;
        }

        if (!this.spawnPiece()) {
            this.gameOver = true;
            this.updateHighScore();
            event.gameOver = true;
            return event;
        }

        return event;
    }

    checkDangerCeiling() {
        const dangerLimit = this.isClassicGrid() ? (4 + MINO_SIZE) : DANGER_ROW;
        for (let r = 0; r < dangerLimit; r++) {
            for (let c = 0; c < BOARD_WIDTH; c++) {
                const val = this.grid[r * BOARD_WIDTH + c];
                // Rising vapors (Steam, Toxic Gas) do not trigger danger game over
                if (val !== MATERIAL_EMPTY && val !== MATERIAL_STEAM && val !== MATERIAL_TOXIC_GAS) {
                    return true;
                }
            }
        }
        return false;
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
        if (this.isClassicGrid()) return;
        // Only disturb resting sand mounds in lower portion of the board,
        // avoiding scattering airborne grains in the upper active drop area
        const startY = Math.max(BOARD_HEIGHT - 35, 95);
        for (let y = BOARD_HEIGHT - 2; y >= startY; y--) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const c = this.grid[y * BOARD_WIDTH + x];
                if (c > 0 && Math.random() < 0.20) {
                    const dir = Math.random() < 0.5 ? -1 : 1;
                    const nx = x + dir;
                    // Only move if destination has a resting surface below it to prevent mid-air airborne particles
                    if (nx >= 0 && nx < BOARD_WIDTH && this.grid[y * BOARD_WIDTH + nx] === 0) {
                        const hasFloorOrSupport = (y === BOARD_HEIGHT - 1) || (this.grid[(y + 1) * BOARD_WIDTH + nx] !== MATERIAL_EMPTY);
                        if (hasFloorOrSupport) {
                            this.grid[y * BOARD_WIDTH + nx] = c;
                            this.grid[y * BOARD_WIDTH + x] = 0;
                        }
                    }
                }
            }
        }
        // Rapidly settle any perturbed grains
        for (let s = 0; s < 4; s++) {
            this.updatePhysics();
        }
    }

    // ==========================================
    // Cellular Automata Simulation with Tilt
    // ==========================================
    updatePhysics() {
        if (this.isClassicGrid()) return false;

        let moved = false;
        const acidCorroded = [];

        // ------------------------------------------
        // PASS 1: RISING BUOYANT GASES (Top-Down)
        // ------------------------------------------
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const gmat = this.grid[y * BOARD_WIDTH + x];
                if (gmat === MATERIAL_STEAM || gmat === MATERIAL_TOXIC_GAS) {
                    // Spontaneous atmospheric dissipation (2-3s half-life)
                    const dissRate = (gmat === MATERIAL_STEAM) ? 0.012 : 0.015;
                    if (Math.random() < dissRate || y === 0) {
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                        moved = true;
                        continue;
                    }

                    // Inverted upward gravity
                    if (this.grid[(y - 1) * BOARD_WIDTH + x] === MATERIAL_EMPTY) {
                        this.grid[(y - 1) * BOARD_WIDTH + x] = gmat;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                        moved = true;
                    } else {
                        const ulEmpty = (x > 0 && this.grid[(y - 1) * BOARD_WIDTH + (x - 1)] === MATERIAL_EMPTY);
                        const urEmpty = (x < BOARD_WIDTH - 1 && this.grid[(y - 1) * BOARD_WIDTH + (x + 1)] === MATERIAL_EMPTY);
                        if (ulEmpty && urEmpty) {
                            const nx = Math.random() < 0.5 ? (x - 1) : (x + 1);
                            this.grid[(y - 1) * BOARD_WIDTH + nx] = gmat;
                            this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                            moved = true;
                        } else if (ulEmpty) {
                            this.grid[(y - 1) * BOARD_WIDTH + (x - 1)] = gmat;
                            this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                            moved = true;
                        } else if (urEmpty) {
                            this.grid[(y - 1) * BOARD_WIDTH + (x + 1)] = gmat;
                            this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                            moved = true;
                        }
                    }
                }
            }
        }

        // ------------------------------------------
        // PASS 2: FALLING / SETTLING MATTER (Bottom-Up)
        // ------------------------------------------
        for (let y = BOARD_HEIGHT - 2; y >= 0; y--) {
            const xs = [];
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const mat = this.grid[y * BOARD_WIDTH + x];
                if (mat !== MATERIAL_EMPTY && mat !== MATERIAL_STEAM && mat !== MATERIAL_TOXIC_GAS) {
                    xs.push(x);
                }
            }
            if (xs.length === 0) continue;

            // Randomize scanning order to eliminate directional bias
            for (let i = xs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [xs[i], xs[j]] = [xs[j], xs[i]];
            }

            const preferLeft = (this.tiltX < -0.15);
            const preferRight = (this.tiltX > 0.15);
            const strongTilt = Math.abs(this.tiltX) > 0.45;

            for (const x of xs) {
                const mat = this.grid[y * BOARD_WIDTH + x];
                if (mat === MATERIAL_EMPTY || mat === MATERIAL_STEAM || mat === MATERIAL_TOXIC_GAS) continue;

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
                            // Lateral flow & sloshing
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
                // 2. CONCENTRATED ACID DYNAMICS
                else if (mat === MATERIAL_ACID) {
                    const below = this.grid[(y + 1) * BOARD_WIDTH + x];
                    if (below === MATERIAL_EMPTY) {
                        this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_ACID;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                        moved = true;
                    } else if (below === MATERIAL_ICE || below === MATERIAL_WATER) {
                        this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_DILUTED_ACID;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_DILUTED_ACID;
                        this.diluteAcidCluster(y, x);
                        moved = true;
                    } else if (below === MATERIAL_DILUTED_ACID) {
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_DILUTED_ACID;
                        this.diluteAcidCluster(y, x);
                        moved = true;
                    } else if (below !== MATERIAL_ACID && below !== MATERIAL_FIRE && below !== MATERIAL_TOXIC_GAS) {
                        // Corrode matter directly below
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
                // 3. DILUTED ACID (FLUID CORROSION) DYNAMICS
                else if (mat === MATERIAL_DILUTED_ACID) {
                    const below = this.grid[(y + 1) * BOARD_WIDTH + x];
                    if (below === MATERIAL_EMPTY) {
                        this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_DILUTED_ACID;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                        moved = true;
                    } else if (below === MATERIAL_ICE) {
                        this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_DILUTED_ACID;
                        moved = true;
                    } else if ((below >= 1 && below <= 6) || below === MATERIAL_ASH) {
                        // Mild 0.5% progressive corrosion against resting sand
                        if (Math.random() < 0.005) {
                            this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_DILUTED_ACID;
                            this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                            acidCorroded.push({ x: x, y: y + 1 });
                            moved = true;
                        } else {
                            // Pool and level flat like water
                            const dlEmpty = (x > 0 && this.grid[(y + 1) * BOARD_WIDTH + (x - 1)] === MATERIAL_EMPTY);
                            const drEmpty = (x < BOARD_WIDTH - 1 && this.grid[(y + 1) * BOARD_WIDTH + (x + 1)] === MATERIAL_EMPTY);
                            if (dlEmpty || drEmpty) {
                                const nx = dlEmpty ? (x - 1) : (x + 1);
                                this.grid[(y + 1) * BOARD_WIDTH + nx] = MATERIAL_DILUTED_ACID;
                                this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                                moved = true;
                            } else {
                                const lEmpty = (x > 0 && this.grid[y * BOARD_WIDTH + (x - 1)] === MATERIAL_EMPTY);
                                const rEmpty = (x < BOARD_WIDTH - 1 && this.grid[y * BOARD_WIDTH + (x + 1)] === MATERIAL_EMPTY);
                                if (lEmpty || rEmpty) {
                                    const nx = (lEmpty && (!rEmpty || Math.random() < 0.5)) ? (x - 1) : (x + 1);
                                    this.grid[y * BOARD_WIDTH + nx] = MATERIAL_DILUTED_ACID;
                                    this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                                    moved = true;
                                }
                            }
                        }
                    } else {
                        // Fluid rolling
                        const dlEmpty = (x > 0 && this.grid[(y + 1) * BOARD_WIDTH + (x - 1)] === MATERIAL_EMPTY);
                        const drEmpty = (x < BOARD_WIDTH - 1 && this.grid[(y + 1) * BOARD_WIDTH + (x + 1)] === MATERIAL_EMPTY);
                        if (dlEmpty || drEmpty) {
                            const nx = dlEmpty ? (x - 1) : (x + 1);
                            this.grid[(y + 1) * BOARD_WIDTH + nx] = MATERIAL_DILUTED_ACID;
                            this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                            moved = true;
                        }
                    }
                }
                // 4. ICE DYNAMICS (SOLID FROZEN WATER)
                else if (mat === MATERIAL_ICE) {
                    const below = this.grid[(y + 1) * BOARD_WIDTH + x];
                    if (below === MATERIAL_EMPTY) {
                        this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_ICE;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                        moved = true;
                    } else if (below === MATERIAL_WATER) {
                        this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_ICE;
                        moved = true;
                    } else if (below === MATERIAL_FIRE) {
                        this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_WATER;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_WATER;
                        this.convertFireToWaterCluster(y + 1, x);
                        moved = true;
                    } else if (below === MATERIAL_ACID || below === MATERIAL_DILUTED_ACID) {
                        this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_DILUTED_ACID;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_DILUTED_ACID;
                        if (below === MATERIAL_ACID) this.diluteAcidCluster(y + 1, x);
                        moved = true;
                    } else {
                        const dlOk = (x > 0 && (this.grid[(y + 1) * BOARD_WIDTH + (x - 1)] === MATERIAL_EMPTY || this.grid[(y + 1) * BOARD_WIDTH + (x - 1)] === MATERIAL_WATER));
                        const drOk = (x < BOARD_WIDTH - 1 && (this.grid[(y + 1) * BOARD_WIDTH + (x + 1)] === MATERIAL_EMPTY || this.grid[(y + 1) * BOARD_WIDTH + (x + 1)] === MATERIAL_WATER));
                        if ((dlOk || drOk) && Math.random() < 0.12) {
                            const nx = (dlOk && (!drOk || Math.random() < 0.5)) ? (x - 1) : (x + 1);
                            const target = this.grid[(y + 1) * BOARD_WIDTH + nx];
                            if (target === MATERIAL_WATER) {
                                this.grid[(y + 1) * BOARD_WIDTH + nx] = MATERIAL_ICE;
                            } else {
                                this.grid[(y + 1) * BOARD_WIDTH + nx] = MATERIAL_ICE;
                                this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                            }
                            moved = true;
                        }
                    }
                }
                // 5. FIRE DYNAMICS
                else if (mat === MATERIAL_FIRE) {
                    const below = this.grid[(y + 1) * BOARD_WIDTH + x];
                    if (below === MATERIAL_WATER || below === MATERIAL_DILUTED_ACID) {
                        // Extinguished
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                        moved = true;
                    } else if (below === MATERIAL_ICE) {
                        // Melts ice to water
                        this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_WATER;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_WATER;
                        this.convertFireToWaterCluster(y, x);
                        moved = true;
                    } else if (below === MATERIAL_ACID) {
                        // Toxic gas
                        this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_TOXIC_GAS;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_TOXIC_GAS;
                        moved = true;
                    } else if ((below >= 1 && below <= 6) || below === MATERIAL_ASH) {
                        // Scorches sand into ash
                        if (below >= 1 && below <= 6 && Math.random() < 0.33) {
                            this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_ASH;
                        }
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                        moved = true;
                    } else if (below === MATERIAL_EMPTY) {
                        this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_FIRE;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                        moved = true;
                    } else {
                        const dlEmpty = (x > 0 && this.grid[(y + 1) * BOARD_WIDTH + (x - 1)] === MATERIAL_EMPTY);
                        const drEmpty = (x < BOARD_WIDTH - 1 && this.grid[(y + 1) * BOARD_WIDTH + (x + 1)] === MATERIAL_EMPTY);
                        if (dlEmpty || drEmpty) {
                            const nx = (dlEmpty && (!drEmpty || Math.random() < 0.5)) ? (x - 1) : (x + 1);
                            this.grid[(y + 1) * BOARD_WIDTH + nx] = MATERIAL_FIRE;
                            this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                            moved = true;
                        }
                    }
                }
                // 6. ASH DYNAMICS (BURNT SAND POWDER)
                else if (mat === MATERIAL_ASH) {
                    const below = this.grid[(y + 1) * BOARD_WIDTH + x];
                    if (below === MATERIAL_EMPTY) {
                        this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_ASH;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                        moved = true;
                    } else if (below === MATERIAL_WATER || below === MATERIAL_DILUTED_ACID) {
                        this.grid[(y + 1) * BOARD_WIDTH + x] = MATERIAL_ASH;
                        this.grid[y * BOARD_WIDTH + x] = below;
                        moved = true;
                    } else {
                        const dlFree = (x > 0 && (this.grid[(y + 1) * BOARD_WIDTH + (x - 1)] === MATERIAL_EMPTY || this.grid[(y + 1) * BOARD_WIDTH + (x - 1)] === MATERIAL_WATER));
                        const drFree = (x < BOARD_WIDTH - 1 && (this.grid[(y + 1) * BOARD_WIDTH + (x + 1)] === MATERIAL_EMPTY || this.grid[(y + 1) * BOARD_WIDTH + (x + 1)] === MATERIAL_WATER));
                        if ((dlFree || drFree) && Math.random() < 0.10) {
                            const nx = (dlFree && (!drFree || Math.random() < 0.5)) ? (x - 1) : (x + 1);
                            const target = this.grid[(y + 1) * BOARD_WIDTH + nx];
                            this.grid[(y + 1) * BOARD_WIDTH + nx] = MATERIAL_ASH;
                            this.grid[y * BOARD_WIDTH + x] = (target === MATERIAL_WATER) ? MATERIAL_WATER : MATERIAL_EMPTY;
                            moved = true;
                        }
                    }
                }
                // 7. NORMAL SAND DYNAMICS (BUOYANCY SINKING & TILT AVALANCHES)
                else {
                    const below = this.grid[(y + 1) * BOARD_WIDTH + x];
                    if (below === MATERIAL_EMPTY) {
                        this.grid[(y + 1) * BOARD_WIDTH + x] = mat;
                        this.grid[y * BOARD_WIDTH + x] = MATERIAL_EMPTY;
                        moved = true;
                    } else if (below === MATERIAL_WATER || below === MATERIAL_DILUTED_ACID) {
                        // Sand sinks through liquid, liquid rises
                        this.grid[(y + 1) * BOARD_WIDTH + x] = mat;
                        this.grid[y * BOARD_WIDTH + x] = below;
                        moved = true;
                    } else {
                        const dlVal = (x > 0) ? this.grid[(y + 1) * BOARD_WIDTH + (x - 1)] : 99;
                        const drVal = (x < BOARD_WIDTH - 1) ? this.grid[(y + 1) * BOARD_WIDTH + (x + 1)] : 99;

                        const dlOk = (dlVal === MATERIAL_EMPTY || dlVal === MATERIAL_WATER || dlVal === MATERIAL_DILUTED_ACID);
                        const drOk = (drVal === MATERIAL_EMPTY || drVal === MATERIAL_WATER || drVal === MATERIAL_DILUTED_ACID);

                        if (dlOk || drOk) {
                            const slideChance = strongTilt ? 0.85 : (preferLeft || preferRight ? 0.55 : 0.28);
                            if (Math.random() < slideChance) {
                                if (dlOk && drOk) {
                                    const nx = preferLeft ? (x - 1) : (preferRight ? (x + 1) : (Math.random() < 0.5 ? x - 1 : x + 1));
                                    const targetVal = this.grid[(y + 1) * BOARD_WIDTH + nx];
                                    this.grid[(y + 1) * BOARD_WIDTH + nx] = mat;
                                    this.grid[y * BOARD_WIDTH + x] = (targetVal === MATERIAL_WATER || targetVal === MATERIAL_DILUTED_ACID) ? targetVal : MATERIAL_EMPTY;
                                    moved = true;
                                } else if (dlOk && !preferRight) {
                                    const targetVal = this.grid[(y + 1) * BOARD_WIDTH + (x - 1)];
                                    this.grid[(y + 1) * BOARD_WIDTH + (x - 1)] = mat;
                                    this.grid[y * BOARD_WIDTH + x] = (targetVal === MATERIAL_WATER || targetVal === MATERIAL_DILUTED_ACID) ? targetVal : MATERIAL_EMPTY;
                                    moved = true;
                                } else if (drOk && !preferLeft) {
                                    const targetVal = this.grid[(y + 1) * BOARD_WIDTH + (x + 1)];
                                    this.grid[(y + 1) * BOARD_WIDTH + (x + 1)] = mat;
                                    this.grid[y * BOARD_WIDTH + x] = (targetVal === MATERIAL_WATER || targetVal === MATERIAL_DILUTED_ACID) ? targetVal : MATERIAL_EMPTY;
                                    moved = true;
                                }
                            }
                        } else if (strongTilt) {
                            // Phone tilt slides resting sand sideways
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
        if (this.isClassicGrid()) {
            return this.checkClassicLineClears();
        }

        const clearedCoords = [];
        let bandsCount = 0;
        let lastColor = 0;
        let isTidalWave = false;
        let isDilutedCleanse = false;
        let isIceClear = false;
        let isFireClear = false;
        let isAshClear = false;

        const visited = new Uint8Array(BOARD_WIDTH * BOARD_HEIGHT);

        const colorsToCheck = [1, 2, 3, 4, 5, 6];
        if (this.enableElements || this.mode === 'mystery') {
            colorsToCheck.push(MATERIAL_WATER, MATERIAL_ICE, MATERIAL_FIRE, MATERIAL_ASH, MATERIAL_DILUTED_ACID);
        }

        for (const color of colorsToCheck) {
            const startRows = [];
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                if (this.grid[y * BOARD_WIDTH + 0] === color) {
                    startRows.push(y);
                }
            }
            if (startRows.length === 0) continue;

            visited.fill(0);
            let liquidClearedAll = false;

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

                    if (color === MATERIAL_WATER) {
                        isTidalWave = true;
                        liquidClearedAll = true;
                    } else if (color === MATERIAL_DILUTED_ACID) {
                        isDilutedCleanse = true;
                        liquidClearedAll = true;
                    } else {
                        if (color === MATERIAL_ICE) isIceClear = true;
                        if (color === MATERIAL_FIRE) isFireClear = true;
                        if (color === MATERIAL_ASH) isAshClear = true;
                        for (const pt of component) {
                            clearedCoords.push(pt);
                        }
                    }
                }
            }

            // Tidal Wave & Diluted Cleanse: clears ALL of that fluid across the entire board!
            if (liquidClearedAll) {
                for (let y = 0; y < BOARD_HEIGHT; y++) {
                    for (let x = 0; x < BOARD_WIDTH; x++) {
                        if (this.grid[y * BOARD_WIDTH + x] === color) {
                            clearedCoords.push([y, x]);
                        }
                    }
                }
            }
        }

        if (clearedCoords.length > 0) {
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
            this.stats.bands += bandsCount;
            this.stats.maxCombo = Math.max(this.stats.maxCombo, this.combo);

            const comboMult = Math.pow(this.combo, 1.5);
            let baseScorePerBand = 400;
            if (isTidalWave || isDilutedCleanse) baseScorePerBand = 800;
            const gainedScore = Math.floor((finalCoords.length * 5 + bandsCount * baseScorePerBand) * comboMult);
            this.score += gainedScore;
            this.updateHighScore();

            // Line Goal victory check
            if (this.lineGoal > 0 && this.linesCleared >= this.lineGoal && !this.missionCompleted) {
                this.missionCompleted = true;
            }

            const neededSandBands = (this.level - this.startLevel + 1) * 3;
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
                isWaterWave: isTidalWave,
                isTidalWave,
                isDilutedCleanse,
                isIceClear,
                isFireClear,
                isAshClear,
                victory: this.missionCompleted
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
        if (count === 1) { this.stats.singles++; }
        else if (count === 2) { basePoints = 300; typeName = 'double'; this.stats.doubles++; }
        else if (count === 3) { basePoints = 500; typeName = 'triple'; this.stats.triples++; }
        else if (count >= 4) { basePoints = 800; typeName = 'tetris'; this.stats.tetrises++; }

        const gained = basePoints * this.level;
        this.score += gained;
        this.updateHighScore();

        // Line Goal check
        if (this.lineGoal > 0 && this.linesCleared >= this.lineGoal && !this.missionCompleted) {
            this.missionCompleted = true;
        }

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
            roast: (this.mode === 'troll_classic') ? getRandomTrollRoast(typeName) : null,
            victory: this.missionCompleted
        };
    }

    // ==========================================
    // Main Simulation Tick (Called every frame)
    // ==========================================
    tick(dtMs) {
        if (this.gameOver) return { gameOver: true };
        if (this.missionCompleted) return { victory: true };
        if (this.paused) return {};

        this.survivalTimeMs += dtMs;
        const tickResult = {};

        // Invert controls timer countdown
        if (this.controlsInverted) {
            this.controlsInvertTimer -= dtMs;
            if (this.controlsInvertTimer <= 0) {
                this.controlsInverted = false;
            }
        }

        // Calamities in Mystery Sandtrix and Troll Classic Mode
        if (this.isMysteryOrTroll()) {
            this.calamityTimer += dtMs;
            if (this.calamityTimer > 18000) {
                this.calamityTimer = 0;
                const calamityRoll = Math.random();
                if (calamityRoll < 0.35 && this.activePiece) {
                    // Wind gust pushes piece 1 column
                    const dir = Math.random() < 0.5 ? -1 : 1;
                    if (this.activePiece.tryMove(dir * MINO_SIZE, 0, this.grid)) {
                        tickResult.windGust = true;
                        tickResult.roast = (this.mode === 'troll_classic') ? getRandomTrollRoast('wind') : getRandomMysteryHype('calamity');
                    }
                } else if (calamityRoll < 0.70) {
                    // Earthquake tremor
                    this.triggerEarthquake();
                    tickResult.earthquake = true;
                    tickResult.roast = (this.mode === 'troll_classic') ? "EARTHQUAKE TREMOR!" : getRandomMysteryHype('calamity');
                } else {
                    // Invert controls
                    this.controlsInverted = true;
                    this.controlsInvertTimer = 5000;
                    tickResult.confusion = true;
                    tickResult.roast = (this.mode === 'troll_classic') ? getRandomTrollRoast('confusion') : "CONTROLS INVERTED!";
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
                            this.lockTimer = 0; // Reset lock timer so morphed piece never locks mid-air
                            tickResult.shapeShifted = true;
                            tickResult.newShape = newShape;
                            tickResult.roast = (this.mode === 'troll_classic') ? getRandomTrollRoast('morph') : getRandomMysteryHype('morph');
                        }
                    }
                }
            }
        }

        // Gravity intervals
        const gravityIntervals = this.isClassicGrid()
            ? [500, 440, 380, 320, 260, 210, 160, 120, 90, 70]
            : [45, 40, 35, 30, 25, 20, 16, 13, 10, 8];

        const targetInterval = this.isClassicGrid()
            ? (this.isSoftDropping ? 35 : gravityIntervals[Math.min(9, this.level - 1)])
            : (this.isSoftDropping ? 4 : gravityIntervals[Math.min(9, this.level - 1)]);

        this.gravityTimer += dtMs;
        const maxStepsPerFrame = this.isClassicGrid() ? 1 : 12;
        let stepsTaken = 0;
        const lockDelayMs = this.isClassicGrid() ? 450 : 140;

        while (this.gravityTimer >= targetInterval && stepsTaken < maxStepsPerFrame) {
            this.gravityTimer -= targetInterval;
            stepsTaken++;

            if (this.activePiece) {
                const dy = this.isClassicGrid() ? MINO_SIZE : 1;
                if (!this.activePiece.tryMove(0, dy, this.grid)) {
                    this.lockTimer += targetInterval;
                    const canLock = (this.lockTimer >= lockDelayMs || this.isSoftDropping);
                    if (canLock) {
                        const lockEvent = this.lockActivePiece();
                        Object.assign(tickResult, lockEvent);
                    }
                    break;
                } else {
                    this.lockTimer = 0;
                    this.checkActivePieceContactReactions();
                }
            } else {
                break;
            }
        }
        if (this.gravityTimer > targetInterval * 3) {
            this.gravityTimer = 0;
        }

        // Physics Sub-steps (Sandtrix & Mystery Modes)
        if (!this.isClassicGrid()) {
            const substeps = this.isSoftDropping ? 6 : 4;
            for (let substep = 0; substep < substeps; substep++) {
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
            this.combo = 0;
        }

        // Continuous danger ceiling breach check
        if (this.checkDangerCeiling()) {
            this.gameOver = true;
            this.updateHighScore();
            tickResult.gameOver = true;
            return tickResult;
        }

        if (this.gameOver) {
            tickResult.gameOver = true;
        }

        if (this.missionCompleted) {
            tickResult.victory = true;
        }

        return tickResult;
    }

    // Performance statistics helpers
    getPPS() {
        return (this.survivalTimeMs > 0) ? ((this.piecesPlaced * 1000.0) / this.survivalTimeMs).toFixed(2) : "0.00";
    }

    getKPS() {
        return (this.survivalTimeMs > 0) ? ((this.keysPressed * 1000.0) / this.survivalTimeMs).toFixed(2) : "0.00";
    }

    getKPP() {
        return (this.piecesPlaced > 0) ? (this.keysPressed / this.piecesPlaced).toFixed(2) : "0.00";
    }

    getLPP() {
        return (this.piecesPlaced > 0) ? (this.linesCleared / this.piecesPlaced).toFixed(2) : "0.00";
    }

    getFormattedTime() {
        const totalSecs = Math.floor(this.survivalTimeMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        const centis = Math.floor((this.survivalTimeMs % 1000) / 10);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
    }
}
