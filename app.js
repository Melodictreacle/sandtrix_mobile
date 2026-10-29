/**
 * Sandtrix Mobile Application Coordinator & Canvas Renderer
 * - Full 4 Game Modes: Sandtrix, Classic Tetris, Mystery Sandtrix, Troll Classic
 * - Elemental Cellular Automata Visuals & Sound Integration
 * - Mission Line Goals (Endless, 20L, 40L, 100L) with Victory Overlay
 * - Advanced Run Metrics: PPS, KPS, KPP, Lines Per Piece, Accuracy
 * - Gyroscope & Accelerometer hardware integration + virtual touch controls
 */

class ParticleSystem {
    constructor() {
        this.sparks = [];
        this.floatingTexts = [];
        this.shakeIntensity = 0;
    }

    triggerShake(intensity = 6) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    addSparks(coords, colorHex, countPerGrain = 1) {
        for (const pt of coords) {
            for (let i = 0; i < countPerGrain; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1.0 + Math.random() * 3.5;
                this.sparks.push({
                    x: pt.x * 5 + 2.5,
                    y: pt.y * 5 + 2.5,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 1.0,
                    color: colorHex,
                    size: 2.0 + Math.random() * 2.0,
                    alpha: 1.0,
                    life: 25 + Math.floor(Math.random() * 20),
                    maxLife: 45
                });
            }
        }
    }

    addSplash(pixelX, pixelY, colorHex = '#00D2D7', count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 1.5;
            const speed = 2.0 + Math.random() * 4.0;
            this.sparks.push({
                x: pixelX,
                y: pixelY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colorHex,
                size: 2.5 + Math.random() * 2.5,
                alpha: 0.9,
                life: 30,
                maxLife: 30
            });
        }
    }

    addAcidFizz(coords) {
        for (const pt of coords) {
            this.sparks.push({
                x: pt.x * 5 + Math.random() * 5,
                y: pt.y * 5,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -1.0 - Math.random() * 2.0,
                color: '#CDEB2D',
                size: 1.5 + Math.random() * 2.0,
                alpha: 1.0,
                life: 20,
                maxLife: 20
            });
        }
    }

    addIceShatter(coords) {
        this.addSparks(coords, '#99E6FF', 2);
    }

    addFireBurst(coords) {
        this.addSparks(coords, '#FF4500', 2);
    }

    addFloatingText(x, y, text, color = '#FFD700', fontSize = 16) {
        this.floatingTexts.push({
            x,
            y,
            text,
            color,
            fontSize,
            vy: -1.2,
            alpha: 1.0,
            life: 55,
            maxLife: 55
        });
    }

    update() {
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const p = this.sparks[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.vx *= 0.98;
            p.life--;
            p.alpha = p.life / p.maxLife;
            if (p.life <= 0) this.sparks.splice(i, 1);
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y += t.vy;
            t.life--;
            t.alpha = t.life / t.maxLife;
            if (t.life <= 0) this.floatingTexts.splice(i, 1);
        }

        let shakeX = 0, shakeY = 0;
        if (this.shakeIntensity > 0.1) {
            shakeX = (Math.random() * 2 - 1) * this.shakeIntensity;
            shakeY = (Math.random() * 2 - 1) * this.shakeIntensity;
            this.shakeIntensity *= 0.88;
        } else {
            this.shakeIntensity = 0;
        }

        return { shakeX, shakeY };
    }

    draw(ctx) {
        for (const p of this.sparks) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        for (const t of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = t.alpha;
            ctx.font = `bold ${t.fontSize}px 'Nunito', 'Segoe UI', system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = t.color;
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        }
    }
}

class SandtrixApp {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.sound = new SoundManager();
        this.particles = new ParticleSystem();

        // 80 columns x 140 rows * 5px scale = 400 x 700 px
        this.canvas.width = 400;
        this.canvas.height = 700;

        this.imageData = this.ctx.createImageData(BOARD_WIDTH, BOARD_HEIGHT);
        this.pixelBuf = new Uint32Array(this.imageData.data.buffer);

        // Precompute color palette 32-bit hex values (ABGR format for little-endian Uint32Array)
        this.colorABGR = {
            0:  0xFF1C1512,  // #12151C (Deep Slate Background)
            1:  0xFF4B4BEB,  // #EB4B4B (Crimson Ruby)
            2:  0xFF23B9F5,  // #F5B923 (Amber Gold)
            3:  0xFF64B928,  // #28B964 (Emerald Jade)
            4:  0xFFEB7D32,  // #327DEB (Sapphire Blue)
            5:  0xFFF18D9D,  // #9D8DF1 (Soft Lavender Purple)
            6:  0xFF439FFF,  // #FF9F43 (Pastel Tangerine Orange)
            50: 0xFFD7D200,  // #00D2D7 (Turquoise Aqua - Water)
            51: 0xFF2DEBCD,  // #CDEB2D (Chartreuse Lime - Acid)
            52: 0xFF4B4BFF,  // #FF4B4B (TNT Red - Bomb)
            53: 0xFFFFE699,  // #99E6FF (Glacial Frost Blue - Ice)
            54: 0xFF0045FF,  // #FF4500 (Blazing Fiery Orange - Fire)
            55: 0xD0F5EBE1,  // #E1EBF5 (Soft Mist White-Blue - Steam)
            56: 0xE014FF39,  // #39FF14 (Radioactive Neon Green - Toxic Gas)
            57: 0xFF96908A,  // #8A9096 (Charcoal Ash Gray - Ash)
            58: 0xFFCCE418   // #18E4CC (Shimmering Aquamarine - Diluted Acid)
        };

        // Engine State & Preferences
        this.menuSelectedMode = localStorage.getItem('sandtrix_mode') || 'sandtrix';
        this.currentMode = this.menuSelectedMode;
        this.enableElements = localStorage.getItem('sandtrix_elements') !== 'false';
        this.startLevel = parseInt(localStorage.getItem('sandtrix_start_level') || '1', 10);
        this.lineGoal = parseInt(localStorage.getItem('sandtrix_line_goal') || '0', 10);

        this.engine = new SandEngine(this.currentMode, this.enableElements, this.startLevel, this.lineGoal);
        this.engine.paused = true;
        this.gameStarted = false;
        this.gameOverDisplayed = false;
        this.victoryDisplayed = false;

        // Gyroscope / Motion Sensor State
        this.gyroEnabled = localStorage.getItem('sandtrix_gyro') !== 'false';
        this.calibratedRollOffset = 0;
        this.currentRoll = 0;
        this.currentPitch = 0;
        this.smoothedRoll = 0;
        this.smoothedPitch = 0;
        this.steerAccumulator = 0;
        this.lastShakeTime = 0;

        // Timing
        this.lastTime = performance.now();
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isSwiping = false;

        this.currentPage = 'menu';

        // Android / Browser Back Button Bridge
        window.onNativeBackPress = () => this.handleBackPress();
        window.addEventListener('popstate', () => {
            if (this.currentPage === 'game' && this.gameStarted && !this.engine.gameOver && !this.engine.missionCompleted) {
                if (!this.engine.paused) {
                    try { history.pushState({ page: 'game', paused: true }, ''); } catch (e) {}
                    this.setPaused(true);
                    this.showToast('PAUSED - Press Back again to exit');
                } else {
                    this.showPage('menu');
                }
            }
        });

        this.initDOM();
        this.initSensors();
        this.initTouchControls();
        this.initKeyboard();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    initDOM() {
        const modeCards = {
            'sandtrix': document.getElementById('menuModeSandtrix'),
            'classic': document.getElementById('menuModeClassic'),
            'mystery': document.getElementById('menuModeMystery'),
            'troll_classic': document.getElementById('menuModeTroll')
        };

        const updateMenuCards = () => {
            Object.entries(modeCards).forEach(([m, el]) => {
                if (el) {
                    if (this.menuSelectedMode === m) {
                        el.classList.add('active');
                    } else {
                        el.classList.remove('active');
                    }
                }
            });
        };

        Object.entries(modeCards).forEach(([m, el]) => {
            if (el) {
                el.addEventListener('click', () => {
                    this.sound.init();
                    this.menuSelectedMode = m;
                    updateMenuCards();
                });
            }
        });

        const chkGyro = document.getElementById('chkMenuGyro');
        if (chkGyro) {
            chkGyro.checked = this.gyroEnabled;
            chkGyro.addEventListener('change', (e) => {
                this.sound.init();
                this.setGyroEnabled(e.target.checked);
            });
        }

        const chkElements = document.getElementById('chkMenuElements');
        if (chkElements) {
            chkElements.checked = this.enableElements;
            chkElements.addEventListener('change', (e) => {
                this.sound.init();
                this.enableElements = e.target.checked;
                localStorage.setItem('sandtrix_elements', this.enableElements.toString());
                if (!this.gameStarted || this.engine.gameOver) {
                    this.restartGame();
                }
            });
        }

        // Line Goal Selector in Menu
        const goalPills = document.querySelectorAll('.goal-pill');
        goalPills.forEach(pill => {
            const goalVal = parseInt(pill.getAttribute('data-goal') || '0', 10);
            if (goalVal === this.lineGoal) pill.classList.add('active');
            pill.addEventListener('click', () => {
                this.sound.init();
                this.sound.playMove();
                this.lineGoal = goalVal;
                localStorage.setItem('sandtrix_line_goal', this.lineGoal.toString());
                goalPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                if (!this.gameStarted || this.engine.gameOver) {
                    this.restartGame();
                }
            });
        });

        const btnStart = document.getElementById('btnStartGame');
        if (btnStart) {
            btnStart.addEventListener('click', async () => {
                this.sound.init();
                if (this.gyroEnabled && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                    try {
                        const perm = await DeviceOrientationEvent.requestPermission();
                        if (perm === 'granted') {
                            this.bindOrientationListeners();
                        }
                    } catch (e) {
                        console.error('Gyro permission error', e);
                    }
                }

                if (this.currentMode !== this.menuSelectedMode || !this.gameStarted) {
                    this.currentMode = this.menuSelectedMode;
                    localStorage.setItem('sandtrix_mode', this.currentMode);
                    this.setMode(this.currentMode);
                }

                this.setGyroEnabled(this.gyroEnabled);
                this.gameStarted = true;
                this.showPage('game');
                
                const modeNames = {
                    'sandtrix': 'SANDTRIX',
                    'classic': 'CLASSIC TETRIS',
                    'mystery': 'MYSTERY SANDTRIX',
                    'troll_classic': 'TROLL CLASSIC'
                };
                this.showToast(`STARTED: ${modeNames[this.currentMode] || 'SANDTRIX'}`);
            });
        }

        const btnBackToMenu = document.getElementById('btnBackToMenu');
        if (btnBackToMenu) {
            btnBackToMenu.addEventListener('click', () => {
                this.sound.init();
                this.showPage('menu');
            });
        }

        const btnGameRestart = document.getElementById('btnGameRestart');
        if (btnGameRestart) {
            btnGameRestart.addEventListener('click', () => {
                this.restartGame();
            });
        }

        const btnGameOverMenu = document.getElementById('btnGameOverMenu');
        if (btnGameOverMenu) {
            btnGameOverMenu.addEventListener('click', () => {
                this.sound.init();
                this.hideGameOverOverlay();
                this.gameStarted = false;
                this.showPage('menu');
            });
        }

        const btnVictoryMenu = document.getElementById('btnVictoryMenu');
        if (btnVictoryMenu) {
            btnVictoryMenu.addEventListener('click', () => {
                this.sound.init();
                this.hideVictoryOverlay();
                this.gameStarted = false;
                this.showPage('menu');
            });
        }

        const btnVictoryRestart = document.getElementById('btnVictoryRestart');
        if (btnVictoryRestart) {
            btnVictoryRestart.addEventListener('click', () => {
                this.hideVictoryOverlay();
                this.restartGame();
            });
        }

        // Modals: How To Play
        const modalHowToPlay = document.getElementById('howToPlayModal');
        const btnHowToPlay = document.getElementById('btnHowToPlay');
        const btnCloseHowToPlay = document.getElementById('btnCloseHowToPlay');
        const btnCloseHowToPlayTop = document.getElementById('btnCloseHowToPlayTop');

        if (btnHowToPlay && modalHowToPlay) {
            btnHowToPlay.addEventListener('click', () => {
                this.sound.init();
                modalHowToPlay.style.display = 'flex';
            });
        }
        const closeHowToPlay = () => {
            if (modalHowToPlay) modalHowToPlay.style.display = 'none';
        };
        if (btnCloseHowToPlay) btnCloseHowToPlay.addEventListener('click', closeHowToPlay);
        if (btnCloseHowToPlayTop) btnCloseHowToPlayTop.addEventListener('click', closeHowToPlay);
        if (modalHowToPlay) {
            modalHowToPlay.addEventListener('click', (e) => {
                if (e.target === modalHowToPlay) closeHowToPlay();
            });
        }

        // Modals: Settings
        const modalSettings = document.getElementById('settingsModal');
        const btnSettings = document.getElementById('btnSettings');
        const btnCloseSettings = document.getElementById('btnCloseSettings');
        const btnCloseSettingsTop = document.getElementById('btnCloseSettingsTop');
        const sliderVolume = document.getElementById('sliderVolume');
        const lblVolumeVal = document.getElementById('lblVolumeVal');
        const levelPickerGrid = document.getElementById('levelPickerGrid');
        const lblLevelDesc = document.getElementById('lblLevelDesc');

        if (btnSettings && modalSettings) {
            btnSettings.addEventListener('click', () => {
                this.sound.init();
                this.syncSettingsHighScores();
                modalSettings.style.display = 'flex';
            });
        }

        const btnClearHighScores = document.getElementById('btnClearHighScores');
        if (btnClearHighScores) {
            btnClearHighScores.addEventListener('click', () => {
                this.sound.playClear();
                ['sandtrix', 'classic', 'mystery', 'troll_classic', 'sandtrix_mobile_high'].forEach(k => {
                    localStorage.removeItem(`sandtrix_mobile_high_${k}`);
                    localStorage.removeItem(k);
                });

                if (this.engine) this.engine.highScore = 0;
                this.syncSettingsHighScores();
                const lblHighScore = document.getElementById('lblHighScore');
                if (lblHighScore) lblHighScore.innerText = '0';
                this.updateMenuHighScores();
                this.showToast('HIGH SCORES CLEARED');
            });
        }

        const closeSettings = () => {
            if (modalSettings) modalSettings.style.display = 'none';
        };
        if (btnCloseSettings) btnCloseSettings.addEventListener('click', closeSettings);
        if (btnCloseSettingsTop) btnCloseSettingsTop.addEventListener('click', closeSettings);
        if (modalSettings) {
            modalSettings.addEventListener('click', (e) => {
                if (e.target === modalSettings) closeSettings();
            });
        }

        // Volume slider
        if (sliderVolume && lblVolumeVal) {
            const currentVolPct = Math.round(this.sound.volume * 100);
            sliderVolume.value = currentVolPct;
            lblVolumeVal.innerText = (currentVolPct === 0) ? '0% (OFF)' : `${currentVolPct}%`;

            sliderVolume.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                lblVolumeVal.innerText = (val === 0) ? '0% (OFF)' : `${val}%`;
                this.sound.setVolume(val / 100.0);
                this.sound.playTestTone();
            });
        }

        // Level / Difficulty Pickers (Main Menu & Settings Modal)
        const menuLevelPickerGrid = document.getElementById('menuLevelPickerGrid');
        const menuLevelDesc = document.getElementById('menuLevelDesc');

        const updateAllLevelDescs = (lvl) => {
            let tag = 'NORMAL';
            if (lvl === 10) tag = 'HYPER';
            else if (lvl >= 8) tag = 'EXTREME';
            else if (lvl >= 5) tag = 'FAST';
            else if (lvl >= 3) tag = 'MODERATE';

            const txt = `LVL ${lvl} (${tag})`;
            if (lblLevelDesc) lblLevelDesc.innerText = `LEVEL ${lvl} (${tag})`;
            if (menuLevelDesc) menuLevelDesc.innerText = txt;
        };

        const syncLevelButtons = (targetLvl) => {
            document.querySelectorAll('.level-btn').forEach(btn => {
                const bLvl = parseInt(btn.getAttribute('data-level') || '1', 10);
                if (bLvl === targetLvl) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            updateAllLevelDescs(targetLvl);
        };

        const createLevelButtons = (gridEl) => {
            if (!gridEl) return;
            gridEl.innerHTML = '';
            for (let i = 1; i <= 10; i++) {
                const btn = document.createElement('button');
                btn.className = `level-btn ${i === this.startLevel ? 'active' : ''}`;
                btn.setAttribute('data-level', i.toString());
                btn.innerText = i.toString();
                btn.addEventListener('click', () => {
                    this.sound.init();
                    this.sound.playMove();
                    this.startLevel = i;
                    localStorage.setItem('sandtrix_start_level', i.toString());
                    syncLevelButtons(i);
                    if (!this.gameStarted || this.engine.gameOver) {
                        this.restartGame();
                    }
                });
                gridEl.appendChild(btn);
            }
        };

        createLevelButtons(menuLevelPickerGrid);
        createLevelButtons(levelPickerGrid);
        updateAllLevelDescs(this.startLevel);

        // Pause & Restart
        const btnRestart = document.getElementById('btnRestart');
        if (btnRestart) btnRestart.addEventListener('click', () => this.restartGame());

        const btnPause = document.getElementById('btnPause');
        if (btnPause) {
            btnPause.addEventListener('click', () => {
                const nextState = !this.engine.paused;
                this.setPaused(nextState);
                this.sound.init();
                this.showToast(nextState ? 'PAUSED' : 'RESUMED');
            });
        }

        updateMenuCards();
        this.setGyroEnabled(this.gyroEnabled);
        this.showPage('menu');
    }

    syncSettingsHighScores() {
        const modes = ['sandtrix', 'classic', 'mystery', 'troll_classic'];
        modes.forEach(m => {
            const el = document.getElementById(`settingsHigh_${m}`);
            if (el) {
                const val = parseInt(localStorage.getItem(`sandtrix_mobile_high_${m}`) || '0', 10);
                el.innerText = val.toLocaleString();
            }
        });
    }

    setPaused(isPaused) {
        this.engine.paused = isPaused;
        const btnPause = document.getElementById('btnPause');
        if (btnPause) {
            btnPause.innerText = isPaused ? 'RESUME' : 'PAUSE';
            if (isPaused) {
                btnPause.classList.add('paused-state');
            } else {
                btnPause.classList.remove('paused-state');
            }
        }
    }

    handleBackPress() {
        const openModal = document.querySelector('.overlay.active');
        if (openModal) {
            openModal.classList.remove('active');
            return 'handled';
        }

        if (this.currentPage === 'game' && this.gameStarted && !this.engine.gameOver && !this.engine.missionCompleted) {
            if (!this.engine.paused) {
                this.setPaused(true);
                this.showToast('PAUSED - Press Back again to exit');
                return 'handled';
            } else {
                if (window.AndroidApp && typeof window.AndroidApp.closeApp === 'function') {
                    window.AndroidApp.closeApp();
                }
                return 'close';
            }
        }

        if (this.currentPage === 'game' && (this.engine.gameOver || this.engine.missionCompleted)) {
            this.showPage('menu');
            return 'handled';
        }

        if (this.currentPage === 'menu') {
            if (window.AndroidApp && typeof window.AndroidApp.closeApp === 'function') {
                window.AndroidApp.closeApp();
            }
            return 'close';
        }

        return 'close';
    }

    updateMenuHighScores() {
        const hsKey = `sandtrix_mobile_high_${this.currentMode}`;
        const val = parseInt(localStorage.getItem(hsKey) || '0', 10);
        const el = document.getElementById('lblHighScore');
        if (el) el.innerText = val.toLocaleString();
    }

    showPage(page) {
        this.currentPage = page;
        const pageMenu = document.getElementById('pageMenu');
        const pageGame = document.getElementById('pageGame');
        const btnStart = document.getElementById('btnStartGame');

        if (page === 'menu') {
            this.gameOverDisplayed = false;
            this.victoryDisplayed = false;
            if (pageMenu) pageMenu.classList.add('active');
            if (pageGame) pageGame.classList.remove('active');
            this.setPaused(true);
            if (btnStart) {
                btnStart.innerText = (this.gameStarted && !this.engine.gameOver && !this.engine.missionCompleted) ? 'RESUME GAME' : 'START GAME';
            }
            this.updateMenuHighScores();
        } else {
            if (pageGame) pageGame.classList.add('active');
            if (pageMenu) pageMenu.classList.remove('active');
            this.setPaused(false);
            this.updateGyroControlsVisibility();
            try { history.pushState({ page: 'game' }, ''); } catch (e) {}
        }
    }

    setGyroEnabled(enabled) {
        this.gyroEnabled = !!enabled;
        localStorage.setItem('sandtrix_gyro', this.gyroEnabled.toString());

        const chk = document.getElementById('chkMenuGyro');
        const subtext = document.getElementById('gyroToggleSubtext');

        if (chk) chk.checked = this.gyroEnabled;
        if (subtext) {
            subtext.innerText = this.gyroEnabled ? 'Tilt phone to steer pieces & slide sand' : 'Touch buttons & gesture swipes only';
        }

        if (!this.gyroEnabled) {
            this.smoothedRoll = 0;
            this.smoothedPitch = 0;
            this.currentRoll = 0;
            this.currentPitch = 0;
            this.steerAccumulator = 0;
            this.engine.setTilt(0);
        }

        this.updateGyroControlsVisibility();
    }

    updateGyroControlsVisibility() {
        const btnLeft = document.getElementById('btnLeft');
        const btnRight = document.getElementById('btnRight');
        const controlsPanel = document.querySelector('.controls-panel');

        if (controlsPanel) {
            controlsPanel.classList.toggle('gyro-active', this.gyroEnabled);
        }
        if (btnLeft) {
            btnLeft.style.display = this.gyroEnabled ? 'none' : '';
        }
        if (btnRight) {
            btnRight.style.display = this.gyroEnabled ? 'none' : '';
        }
    }

    setMode(mode) {
        this.sound.init();
        this.currentMode = mode;
        this.menuSelectedMode = mode;
        this.gameOverDisplayed = false;
        this.victoryDisplayed = false;
        localStorage.setItem('sandtrix_mode', mode);
        this.engine = new SandEngine(this.currentMode, this.enableElements, this.startLevel, this.lineGoal);
        this.restartGame();

        const gameModePill = document.getElementById('gameModePill');
        if (gameModePill) {
            const pillInfo = {
                'sandtrix':      { label: 'SANDTRIX', color: '#00D2D7' },
                'classic':       { label: 'CLASSIC',  color: '#28B964' },
                'mystery':       { label: 'MYSTERY',  color: '#F5B923' },
                'troll_classic': { label: 'TROLL',    color: '#FF4B4B' }
            }[mode] || { label: 'SANDTRIX', color: '#00D2D7' };

            gameModePill.innerText = pillInfo.label;
            gameModePill.style.color = pillInfo.color;
            gameModePill.style.borderColor = pillInfo.color;
        }
    }

    restartGame() {
        this.sound.init();
        this.gameOverDisplayed = false;
        this.victoryDisplayed = false;
        this.engine = new SandEngine(this.currentMode, this.enableElements, this.startLevel, this.lineGoal);
        this.hideGameOverOverlay();
        this.hideVictoryOverlay();
    }

    showToast(msg) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.innerText = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 1500);
        }
    }

    showTrollRoast(msg) {
        const roastBanner = document.getElementById('trollRoastBanner');
        if (roastBanner) {
            roastBanner.innerText = msg;
            roastBanner.classList.add('pop');
            setTimeout(() => roastBanner.classList.remove('pop'), 2800);
        }
        this.particles.addFloatingText(200, 260, msg, '#FF4B4B', 16);
    }

    // Sensors
    initSensors() {
        window.onNativeGyro = (roll, pitch, rotSpeed) => {
            this.handleOrientation(roll, pitch);
            if (Math.abs(rotSpeed) > 380) {
                const now = performance.now();
                if (now - this.lastShakeTime > 750) {
                    this.lastShakeTime = now;
                    this.onShakeGesture();
                }
            }
        };

        if (window.DeviceOrientationEvent) {
            this.bindOrientationListeners();
        }

        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', (e) => {
                const acc = e.accelerationIncludingGravity || e.acceleration;
                if (!acc) return;
                const mag = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
                if (mag > 26) {
                    const now = performance.now();
                    if (now - this.lastShakeTime > 900) {
                        this.lastShakeTime = now;
                        this.onShakeGesture();
                    }
                }
            }, false);
        }
    }

    bindOrientationListeners() {
        window.addEventListener('deviceorientation', (e) => {
            if (e.gamma !== null && e.beta !== null) {
                this.handleOrientation(e.gamma, e.beta);
            }
        }, false);
    }

    handleOrientation(roll, pitch) {
        if (!this.gyroEnabled) return;
        const effectiveRoll = roll - this.calibratedRollOffset;
        this.smoothedRoll = (this.smoothedRoll * 0.78) + (effectiveRoll * 0.22);
        this.smoothedPitch = (this.smoothedPitch * 0.78) + (pitch * 0.22);
        this.currentRoll = this.smoothedRoll;
        this.currentPitch = this.smoothedPitch;
        this.engine.setTilt(this.smoothedRoll);
    }

    onShakeGesture() {
        if (this.engine.gameOver || this.engine.missionCompleted || this.engine.paused) return;

        if (this.currentMode === 'troll_classic') {
            this.showTrollRoast(getRandomTrollRoast('shakeRoast'));
        }

        const dropEv = this.engine.hardDrop();
        if (dropEv) {
            this.sound.playDrop();
            this.particles.triggerShake(9);
            if (navigator.vibrate) navigator.vibrate(40);
            this.handleTickEvents(dropEv);
        }
    }

    processGyroSteering(dtMs) {
        if (!this.gyroEnabled || !this.engine.activePiece) return;

        const deadzone = 7.0;
        const roll = this.smoothedRoll;

        if (Math.abs(roll) > deadzone) {
            const dir = (roll > 0) ? 1 : -1;
            const excess = Math.abs(roll) - deadzone;
            const rate = Math.min(1.0, excess / 28.0);
            const interval = 220 - (rate * 140); // 220ms down to 80ms

            this.steerAccumulator += dtMs;
            if (this.steerAccumulator >= interval) {
                this.steerAccumulator = 0;
                if (this.engine.movePiece(dir)) {
                    this.sound.playMove();
                }
            }
        } else {
            this.steerAccumulator = 0;
        }
    }

    // Touch controls
    initTouchControls() {
        const bindBtn = (id, action, repeat = false) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            let repTimer = null;
            let repInterval = null;

            const trigger = () => {
                this.sound.init();
                action();
            };

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btn.classList.add('pressed');
                trigger();

                if (repeat) {
                    repTimer = setTimeout(() => {
                        repInterval = setInterval(trigger, 40);
                    }, 140);
                }
            }, { passive: false });

            const stopRepeat = () => {
                btn.classList.remove('pressed');
                if (repTimer) clearTimeout(repTimer);
                if (repInterval) clearInterval(repInterval);
                repTimer = null;
                repInterval = null;
            };

            btn.addEventListener('touchend', stopRepeat);
            btn.addEventListener('touchcancel', stopRepeat);
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                btn.classList.add('pressed');
                trigger();
            });
            btn.addEventListener('mouseup', () => btn.classList.remove('pressed'));
            btn.addEventListener('mouseleave', () => btn.classList.remove('pressed'));
        };

        bindBtn('btnHold', () => {
            if (this.engine.holdCurrentPiece()) this.sound.playLock();
        });
        bindBtn('btnRotCW', () => {
            if (this.engine.rotatePiece(1)) this.sound.playRotate();
        });
        bindBtn('btnRotCCW', () => {
            if (this.engine.rotatePiece(-1)) this.sound.playRotate();
        });
        bindBtn('btnLeft', () => {
            if (this.engine.movePiece(-1)) this.sound.playMove();
        }, true);
        bindBtn('btnRight', () => {
            if (this.engine.movePiece(1)) this.sound.playMove();
        }, true);
        bindBtn('btnSoftDrop', () => {
            this.engine.registerInput();
            this.engine.isSoftDropping = true;
        }, true);
        bindBtn('btnHardDrop', () => {
            const ev = this.engine.hardDrop();
            if (ev) {
                this.sound.playDrop();
                this.particles.triggerShake(7);
                if (navigator.vibrate) navigator.vibrate(30);
                this.handleTickEvents(ev);
            }
        });

        const btnSoftDrop = document.getElementById('btnSoftDrop');
        if (btnSoftDrop) {
            const stopDrop = () => { this.engine.isSoftDropping = false; };
            btnSoftDrop.addEventListener('touchend', stopDrop);
            btnSoftDrop.addEventListener('touchcancel', stopDrop);
            btnSoftDrop.addEventListener('mouseup', stopDrop);
            btnSoftDrop.addEventListener('mouseleave', stopDrop);
        }

        // Canvas gestures
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
                this.isSwiping = false;
            }
        }, { passive: true });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                const dx = e.touches[0].clientX - this.touchStartX;
                const dy = e.touches[0].clientY - this.touchStartY;

                if (!this.gyroEnabled && Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) {
                    this.isSwiping = true;
                    const dir = dx > 0 ? 1 : -1;
                    if (this.engine.movePiece(dir)) this.sound.playMove();
                    this.touchStartX = e.touches[0].clientX;
                } else if (dy > 35 && Math.abs(dy) > Math.abs(dx)) {
                    this.isSwiping = true;
                    this.engine.registerInput();
                    this.engine.isSoftDropping = true;
                }
            }
        }, { passive: true });

        this.canvas.addEventListener('touchend', () => {
            this.engine.isSoftDropping = false;
            if (!this.isSwiping) {
                if (this.engine.rotatePiece(1)) this.sound.playRotate();
            }
        }, { passive: true });
    }

    // Keyboard controls
    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (this.currentPage !== 'game' || this.engine.gameOver || this.engine.missionCompleted) return;
            this.sound.init();

            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    if (this.engine.movePiece(-1)) this.sound.playMove();
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (this.engine.movePiece(1)) this.sound.playMove();
                    e.preventDefault();
                    break;
                case 'ArrowUp':
                case 'KeyW':
                case 'KeyX':
                    if (this.engine.rotatePiece(1)) this.sound.playRotate();
                    e.preventDefault();
                    break;
                case 'KeyZ':
                case 'ControlLeft':
                case 'ControlRight':
                    if (this.engine.rotatePiece(-1)) this.sound.playRotate();
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.engine.registerInput();
                    this.engine.isSoftDropping = true;
                    e.preventDefault();
                    break;
                case 'Space':
                    const ev = this.engine.hardDrop();
                    if (ev) {
                        this.sound.playDrop();
                        this.particles.triggerShake(7);
                        this.handleTickEvents(ev);
                    }
                    e.preventDefault();
                    break;
                case 'KeyC':
                case 'ShiftLeft':
                case 'ShiftRight':
                    if (this.engine.holdCurrentPiece()) this.sound.playLock();
                    e.preventDefault();
                    break;
                case 'KeyP':
                case 'Escape':
                    this.setPaused(!this.engine.paused);
                    e.preventDefault();
                    break;
                case 'KeyR':
                    this.restartGame();
                    e.preventDefault();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.engine.isSoftDropping = false;
            }
        });
    }

    handleTickEvents(ev) {
        if (!ev) return;

        // Line clears & special element clears
        if (ev.cleared) {
            this.sound.playClear(ev.combo || 1);
            this.particles.triggerShake(ev.isTidalWave ? 9 : 4);
            const colorHex = PALETTE[ev.color] || '#EB4B4B';
            this.particles.addSparks(ev.coords, colorHex, 2);

            if (ev.isTidalWave) {
                this.particles.addFloatingText(200, 270, 'TIDAL WAVE!', '#00D2D7', 22);
                this.sound.playWaterSplash();
                this.particles.addSplash(200, 350, '#00D2D7', 40);
            } else if (ev.isDilutedCleanse) {
                this.particles.addFloatingText(200, 270, 'DILUTED ACID CLEANSE!', '#18E4CC', 20);
                this.sound.playWaterSplash();
                this.particles.addSplash(200, 350, '#18E4CC', 35);
            } else if (ev.isIceClear) {
                this.particles.addFloatingText(200, 270, 'FROST SHATTER!', '#99E6FF', 20);
                this.sound.playIceFreeze();
                this.particles.addIceShatter(ev.coords);
            } else if (ev.isFireClear) {
                this.particles.addFloatingText(200, 270, 'FIRE STORM!', '#FF4500', 20);
                this.sound.playFireScorch();
                this.particles.addFireBurst(ev.coords);
            } else if (ev.isAshClear) {
                this.particles.addFloatingText(200, 270, 'ASH PURGED!', '#8A9096', 20);
                this.sound.playMove();
            } else if (ev.combo > 1) {
                this.particles.addFloatingText(200, 270, `COMBO x${ev.combo}!`, '#FFD700', 18);
            }

            this.particles.addFloatingText(200, 320, `+${ev.points}`, '#FFD700', 18);

            if (ev.roast) {
                this.showTrollRoast(ev.roast);
            }
        }

        // Elemental landing reactions
        if (ev.isWater) {
            this.sound.playWaterSplash();
            this.particles.addSplash(200, 680, '#00D2D7', 20);
        }
        if (ev.isIce) {
            this.sound.playIceFreeze();
        }
        if (ev.isFire) {
            this.sound.playFireScorch();
        }
        if (ev.isAcid) {
            this.sound.playAcidSizzle();
        }

        if (ev.iceMelted) {
            this.sound.playWaterSplash();
            this.particles.addFloatingText(200, 250, 'ICE MELTED!', '#00D2D7', 16);
        }
        if (ev.sandBurned) {
            this.sound.playFireScorch();
            this.particles.addFloatingText(200, 250, 'SAND SCORCHED!', '#FF4500', 16);
        }
        if (ev.toxicGasSpawned) {
            this.sound.playGasHiss();
            this.particles.addFloatingText(200, 250, 'TOXIC CLOUD!', '#39FF14', 16);
        }
        if (ev.fireExtinguished) {
            this.sound.playWaterSplash();
            this.particles.addFloatingText(200, 250, 'FIRE EXTINGUISHED!', '#00D2D7', 15);
        }
        if (ev.acidDiluted) {
            this.sound.playAcidSizzle();
            this.particles.addFloatingText(200, 250, 'ACID DILUTED!', '#18E4CC', 15);
        }

        if (ev.acidCorroded && ev.acidCorroded.length > 0) {
            this.sound.playAcidSizzle();
            this.particles.addAcidFizz(ev.acidCorroded);
        }

        if (ev.bombCrater && ev.bombCrater.length > 0) {
            this.sound.playBoom();
            this.particles.triggerShake(12);
            this.particles.addSparks(ev.bombCrater, '#FF4B4B', 3);
            if (this.currentMode === 'troll_classic') {
                this.showTrollRoast(getRandomTrollRoast('bomb'));
            } else {
                this.particles.addFloatingText(200, 260, 'KABOOM! EXCAVATED!', '#FF4B4B', 18);
            }
        }

        if (ev.shapeShifted) {
            this.sound.playMorph();
            this.particles.triggerShake(4);
            if (ev.roast) this.showTrollRoast(ev.roast);
        }

        if (ev.windGust) {
            this.sound.playTone(280, 520, 0.25, 'triangle');
            this.particles.triggerShake(4);
            if (ev.roast) this.showTrollRoast(ev.roast);
        }

        if (ev.earthquake) {
            this.sound.playTone(80, 40, 0.4, 'sawtooth');
            this.particles.triggerShake(14);
            if (ev.roast) this.showTrollRoast(ev.roast);
        }

        if (ev.confusion) {
            this.sound.playTone(600, 200, 0.35, 'sawtooth');
            if (ev.roast) this.showTrollRoast(ev.roast);
        }

        // Victory
        if (ev.victory || (this.engine && this.engine.missionCompleted)) {
            if (!this.victoryDisplayed) {
                this.victoryDisplayed = true;
                this.sound.playVictory();
                this.showVictoryOverlay();
            }
        }

        // Game Over
        if (ev.gameOver || (this.engine && this.engine.gameOver)) {
            if (!this.gameOverDisplayed && !this.victoryDisplayed) {
                this.gameOverDisplayed = true;
                this.sound.playGameOver();
                this.showGameOverOverlay();
                if (this.currentMode === 'troll_classic') {
                    this.showTrollRoast(getRandomTrollRoast('gameOver'));
                }
            }
        }
    }

    getGameOverMeme() {
        const lines = this.engine.linesCleared;
        const rots = this.engine.rotationsCount || 0;
        const pieces = this.engine.piecesPlaced || 0;

        if (lines === 0) {
            return "Not a single line cleared. The grid is judging you silently.";
        } else if (rots >= 25) {
            return `Rotated ${rots} times like a fidget spinner, still hit the ceiling.`;
        } else if (rots === 0 && pieces >= 3) {
            return "Zero rotations? Pure vertical purist or forgot the buttons existed?";
        } else if (this.engine.score >= 25000) {
            return "Wait, you actually cooked?! Someone call the championship.";
        }
        return "You fought bravely, but the stack was hungrier.";
    }

    showVictoryOverlay() {
        const overlay = document.getElementById('victoryOverlay');
        if (!overlay) return;

        const timeStr = this.engine.getFormattedTime();
        document.getElementById('vicTimeLabel').innerText = timeStr;
        document.getElementById('vicScoreLabel').innerText = this.engine.score.toLocaleString();
        document.getElementById('vicLinesLabel').innerText = this.engine.linesCleared.toLocaleString();
        document.getElementById('vicGoalLabel').innerText = `${this.engine.lineGoal} LINES`;
        document.getElementById('vicPPSLabel').innerText = this.engine.getPPS();
        document.getElementById('vicKPSLabel').innerText = this.engine.getKPS();
        document.getElementById('vicKPPLabel').innerText = this.engine.getKPP();
        document.getElementById('vicLPPLabel').innerText = this.engine.getLPP();

        overlay.style.display = 'flex';
    }

    hideVictoryOverlay() {
        const overlay = document.getElementById('victoryOverlay');
        if (overlay) overlay.style.display = 'none';
        this.victoryDisplayed = false;
    }

    showGameOverOverlay() {
        const overlay = document.getElementById('gameOverOverlay');
        if (overlay) {
            document.getElementById('finalScoreLabel').innerText = this.engine.score.toLocaleString();
            
            const hsEl = document.getElementById('finalHighScoreLabel');
            if (hsEl) hsEl.innerText = this.engine.highScore.toLocaleString();

            const timeEl = document.getElementById('finalTimeLabel');
            if (timeEl) timeEl.innerText = this.engine.getFormattedTime();

            const linesEl = document.getElementById('finalLinesLabel');
            if (linesEl) linesEl.innerText = this.engine.linesCleared.toLocaleString();

            const rotEl = document.getElementById('finalRotationsLabel');
            if (rotEl) rotEl.innerText = (this.engine.rotationsCount || 0).toLocaleString();

            const pieceEl = document.getElementById('finalPiecesLabel');
            if (pieceEl) pieceEl.innerText = (this.engine.piecesPlaced || 0).toLocaleString();

            const ppsEl = document.getElementById('finalPPSLabel');
            if (ppsEl) ppsEl.innerText = this.engine.getPPS();

            const kpsEl = document.getElementById('finalKPSLabel');
            if (kpsEl) kpsEl.innerText = this.engine.getKPS();

            const modeNames = {
                'sandtrix': 'Sandtrix',
                'classic': 'Classic Tetris',
                'mystery': 'Mystery Sandtrix',
                'troll_classic': 'Troll Classic'
            };
            const modeEl = document.getElementById('finalModeLabel');
            if (modeEl) modeEl.innerText = modeNames[this.currentMode] || 'Sandtrix';

            const memeEl = document.getElementById('modalMemeLine');
            if (memeEl) memeEl.innerText = `"${this.getGameOverMeme()}"`;

            overlay.style.display = 'flex';
        }
    }

    hideGameOverOverlay() {
        const overlay = document.getElementById('gameOverOverlay');
        if (overlay) overlay.style.display = 'none';
        this.gameOverDisplayed = false;
    }

    gameLoop(now) {
        const dtMs = Math.min(60, now - this.lastTime);
        this.lastTime = now;

        if (this.currentPage === 'game' && this.gameStarted) {
            if (this.engine.missionCompleted) {
                this.handleTickEvents({ victory: true });
            } else if (this.engine.gameOver) {
                this.handleTickEvents({ gameOver: true });
            } else if (!this.engine.paused) {
                if (this.gyroEnabled) {
                    this.processGyroSteering(dtMs);
                }

                const tickEvents = this.engine.tick(dtMs);
                if (this.engine.missionCompleted) {
                    tickEvents.victory = true;
                }
                if (this.engine.gameOver) {
                    tickEvents.gameOver = true;
                }
                this.handleTickEvents(tickEvents);
            }
        }

        if (this.currentPage === 'game') {
            this.render();
            this.syncHUD();
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    render() {
        const { shakeX, shakeY } = this.particles.update();

        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);

        // 1. Framebuffer Blitting
        const grid = this.engine.grid;
        for (let i = 0; i < BOARD_WIDTH * BOARD_HEIGHT; i++) {
            const mat = grid[i];
            this.pixelBuf[i] = this.colorABGR[mat] || this.colorABGR[0];
        }

        if (!this.offscreenCanvas) {
            this.offscreenCanvas = document.createElement('canvas');
            this.offscreenCanvas.width = BOARD_WIDTH;
            this.offscreenCanvas.height = BOARD_HEIGHT;
            this.offCtx = this.offscreenCanvas.getContext('2d');
        }

        this.offCtx.putImageData(this.imageData, 0, 0);
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(this.offscreenCanvas, 0, 0, 400, 700);

        // 2. Classic Mino Grid Lines (Classic & Troll Modes)
        if (this.engine.isClassicGrid()) {
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();

            for (let c = 1; c < 10; c++) {
                const gx = c * 40;
                this.ctx.moveTo(gx, 20);
                this.ctx.lineTo(gx, 700);
            }
            for (let r = 0; r <= 17; r++) {
                const gy = 20 + r * 40;
                this.ctx.moveTo(0, gy);
                this.ctx.lineTo(400, gy);
            }
            this.ctx.stroke();
            this.ctx.restore();
        }

        // Boundary Frame
        this.ctx.strokeStyle = '#2A364F';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(1, 1, 398, 698);

        // Danger Line
        const dangerY = (this.engine.isClassicGrid() ? (4 + MINO_SIZE) : DANGER_ROW) * 5;
        this.ctx.strokeStyle = 'rgba(235, 75, 75, 0.45)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(2, dangerY);
        this.ctx.lineTo(398, dangerY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Ghost Piece
        if (this.engine.activePiece && !this.engine.gameOver && !this.engine.missionCompleted) {
            const step = this.engine.isClassicGrid() ? MINO_SIZE : 1;
            const ghostY = this.engine.activePiece.getGhostY(this.engine.grid, step);
            const mask = this.engine.activePiece.grainMask;
            const mw = this.engine.activePiece.maskWidth;
            const mh = this.engine.activePiece.maskHeight;
            const px = this.engine.activePiece.x;

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
            for (let gy = 0; gy < mh; gy++) {
                const drawY = (ghostY + gy) * 5;
                if (drawY < 0 || drawY >= 700) continue;
                for (let gx = 0; gx < mw; gx++) {
                    if (mask[gy * mw + gx]) {
                        const worldX = px + gx;
                        if (worldX >= 0 && worldX < BOARD_WIDTH) {
                            this.ctx.fillRect(worldX * 5, drawY, 5, 5);
                        }
                    }
                }
            }

            // Active Piece
            const activeY = this.engine.activePiece.y;
            const colorHex = PALETTE[this.engine.activePiece.colorIdx] || '#EB4B4B';
            this.ctx.fillStyle = colorHex;
            for (let gy = 0; gy < mh; gy++) {
                const drawY = (activeY + gy) * 5;
                if (drawY < 0 || drawY >= 700) continue;
                for (let gx = 0; gx < mw; gx++) {
                    if (mask[gy * mw + gx]) {
                        const worldX = px + gx;
                        if (worldX >= 0 && worldX < BOARD_WIDTH) {
                            this.ctx.fillRect(worldX * 5, drawY, 5, 5);
                        }
                    }
                }
            }
        }

        // Draw particle effects & floating texts
        this.particles.draw(this.ctx);
        this.ctx.restore();
    }

    syncHUD() {
        const lblScore = document.getElementById('lblScore');
        const lblLines = document.getElementById('lblLines');
        const lblLevel = document.getElementById('lblLevel');
        const lblHighScore = document.getElementById('lblHighScore');
        const badgeCombo = document.getElementById('badgeCombo');

        if (lblScore) lblScore.innerText = this.engine.score.toLocaleString();
        if (lblLines) {
            if (this.engine.lineGoal > 0) {
                lblLines.innerText = `${this.engine.linesCleared}/${this.engine.lineGoal}`;
            } else {
                lblLines.innerText = this.engine.linesCleared.toLocaleString();
            }
        }
        if (lblLevel) lblLevel.innerText = this.engine.level.toString();
        if (lblHighScore) lblHighScore.innerText = this.engine.highScore.toLocaleString();

        if (badgeCombo) {
            if (this.engine.combo > 1) {
                badgeCombo.innerText = `${this.engine.combo}x COMBO`;
                badgeCombo.style.opacity = '1';
            } else {
                badgeCombo.style.opacity = '0';
            }
        }

        this.renderPiecePreview('holdCanvas', this.engine.holdPiece);
        const nextIds = ['nextCanvas', 'nextCanvas1', 'nextCanvas2'];
        for (let i = 0; i < nextIds.length; i++) {
            this.renderPiecePreview(nextIds[i], this.engine.nextQueue[i]);
        }
    }

    renderPiecePreview(canvasId, piece) {
        const c = document.getElementById(canvasId);
        if (!c) return;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);

        if (!piece) return;

        const matrix = SHAPES[piece.shape].rotations[0];
        const size = piece.size;
        const cellSize = Math.floor(c.width / (size + 1));
        const offX = Math.floor((c.width - size * cellSize) / 2);
        const offY = Math.floor((c.height - size * cellSize) / 2);

        ctx.fillStyle = PALETTE[piece.colorIdx] || '#EB4B4B';
        for (let r = 0; r < size; r++) {
            for (let col = 0; col < size; col++) {
                if (matrix[r][col]) {
                    ctx.fillRect(offX + col * cellSize, offY + r * cellSize, cellSize - 1, cellSize - 1);
                }
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new SandtrixApp();
});
