/**
 * Sandtrix Mobile Main Controller
 * - 60 FPS Game Loop
 * - Gyroscope & Motion Sensor Handling (Tilt steering, Tilt gravity, Shake to drop)
 * - Mobile Touch Gestures & Virtual On-Screen Controls
 * - Canvas Direct Image Buffer Blitting
 * - Particle Effects & Floating Troll Roasts
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
                color: '#C8FF00',
                size: 1.5 + Math.random() * 2.0,
                alpha: 1.0,
                life: 20,
                maxLife: 20
            });
        }
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
        // Update sparks
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const p = this.sparks[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15; // Gravity
            p.vx *= 0.98;
            p.life--;
            p.alpha = p.life / p.maxLife;
            if (p.life <= 0) this.sparks.splice(i, 1);
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y += t.vy;
            t.life--;
            t.alpha = t.life / t.maxLife;
            if (t.life <= 0) this.floatingTexts.splice(i, 1);
        }

        // Decay screen shake
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
        // Draw sparks
        for (const p of this.sparks) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw floating texts
        for (const t of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = t.alpha;
            ctx.font = `bold ${t.fontSize}px 'Segoe UI', system-ui, sans-serif`;
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

        // Image data buffer for high-speed canvas blitting
        this.imageData = this.ctx.createImageData(BOARD_WIDTH, BOARD_HEIGHT);
        this.pixelBuf = new Uint32Array(this.imageData.data.buffer);

        // Precompute color palette 32-bit hex values (ABGR format for little-endian Uint32Array)
        this.colorABGR = {
            0: 0xFF261B16,  // #161B26 (Cozy Deep Slate)
            1: 0xFF786DF2,  // #F26D78 (Soft Coral Rose)
            2: 0xFF53C4F6,  // #F6C453 (Warm Honey Amber)
            3: 0xFFA3CC4E,  // #4ECCA3 (Pastel Mint Jade)
            4: 0xFFE5925B,  // #5B92E5 (Soft Periwinkle Sky)
            5: 0xFFF18D9D,  // #9D8DF1 (Soft Lavender Purple)
            6: 0xFF439FFF,  // #FF9F43 (Pastel Tangerine Orange)
            50: 0xFFC79600, // #0096C7 (Crystal Sapphire Ocean Blue - Water)
            51: 0xFF00FFC8, // #C8FF00 (Radioactive Toxic Chartreuse - Acid)
            52: 0xFF6B6BFF  // #FF6B6B (Soft Blush Crimson)
        };

        // Engine State & Initial Preferences
        this.menuSelectedMode = localStorage.getItem('sandtrix_mode') || 'sandtrix';
        this.currentMode = this.menuSelectedMode;
        this.enableElements = true;
        this.startLevel = parseInt(localStorage.getItem('sandtrix_start_level') || '1', 10);
        this.engine = new SandEngine(this.currentMode, this.enableElements, this.startLevel);
        this.engine.paused = true; // Paused until user taps START GAME in menu
        this.gameStarted = false;
        this.gameOverDisplayed = false;

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

        // Native Hardware & Browser Back Button Bridge
        window.onNativeBackPress = () => this.handleBackPress();
        window.addEventListener('popstate', () => {
            if (this.currentPage === 'game' && this.gameStarted && !this.engine.gameOver) {
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

        // Start game loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    initDOM() {
        // Menu Elements
        const menuSandtrix = document.getElementById('menuModeSandtrix');
        const menuTroll = document.getElementById('menuModeTroll');
        const chkGyro = document.getElementById('chkMenuGyro');
        const btnStart = document.getElementById('btnStartGame');
        const btnBackToMenu = document.getElementById('btnBackToMenu');
        const btnGameRestart = document.getElementById('btnGameRestart');
        const btnGameOverMenu = document.getElementById('btnGameOverMenu');

        const updateMenuCards = () => {
            if (this.menuSelectedMode === 'sandtrix') {
                if (menuSandtrix) menuSandtrix.classList.add('active');
                if (menuTroll) menuTroll.classList.remove('active');
            } else {
                if (menuTroll) menuTroll.classList.add('active');
                if (menuSandtrix) menuSandtrix.classList.remove('active');
            }
        };

        if (menuSandtrix) {
            menuSandtrix.addEventListener('click', () => {
                this.sound.init();
                this.menuSelectedMode = 'sandtrix';
                updateMenuCards();
            });
        }

        if (menuTroll) {
            menuTroll.addEventListener('click', () => {
                this.sound.init();
                this.menuSelectedMode = 'troll_classic';
                updateMenuCards();
            });
        }

        if (chkGyro) {
            chkGyro.checked = this.gyroEnabled;
            chkGyro.addEventListener('change', (e) => {
                this.sound.init();
                this.setGyroEnabled(e.target.checked);
            });
        }

        if (btnStart) {
            btnStart.addEventListener('click', async () => {
                this.sound.init();
                // Request gyro permission on iOS if enabled
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

                // If mode changed or not started yet, switch mode
                if (this.currentMode !== this.menuSelectedMode || !this.gameStarted) {
                    this.currentMode = this.menuSelectedMode;
                    localStorage.setItem('sandtrix_mode', this.currentMode);
                    this.setMode(this.currentMode);
                }

                this.setGyroEnabled(this.gyroEnabled);
                this.gameStarted = true;
                this.showPage('game');
                this.showToast(`STARTED: ${this.currentMode === 'troll_classic' ? 'TROLL CLASSIC' : 'SANDTRIX'}`);
            });
        }

        if (btnBackToMenu) {
            btnBackToMenu.addEventListener('click', () => {
                this.sound.init();
                this.showPage('menu');
            });
        }

        if (btnGameRestart) {
            btnGameRestart.addEventListener('click', () => {
                this.restartGame();
            });
        }

        if (btnGameOverMenu) {
            btnGameOverMenu.addEventListener('click', () => {
                this.sound.init();
                this.hideGameOverOverlay();
                this.gameStarted = false;
                this.showPage('menu');
            });
        }

        // How To Play Modal Handlers
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

        // Settings Modal Handlers
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
                const sandHigh = parseInt(localStorage.getItem('sandtrix_mobile_high_sandtrix') || '0', 10);
                const trollHigh = parseInt(localStorage.getItem('sandtrix_mobile_high_troll') || '0', 10);
                const elSand = document.getElementById('settingsHighSandtrix');
                const elTroll = document.getElementById('settingsHighTroll');
                if (elSand) elSand.innerText = sandHigh.toLocaleString();
                if (elTroll) elTroll.innerText = trollHigh.toLocaleString();
                modalSettings.style.display = 'flex';
            });
        }

        const btnClearHighScores = document.getElementById('btnClearHighScores');
        if (btnClearHighScores) {
            btnClearHighScores.addEventListener('click', () => {
                this.sound.playClear();
                localStorage.removeItem('sandtrix_mobile_high_sandtrix');
                localStorage.removeItem('sandtrix_mobile_high_troll');
                localStorage.removeItem('sandtrix_mobile_high');

                if (this.engine) {
                    this.engine.highScore = 0;
                }

                const elSand = document.getElementById('settingsHighSandtrix');
                const elTroll = document.getElementById('settingsHighTroll');
                if (elSand) elSand.innerText = '0';
                if (elTroll) elTroll.innerText = '0';

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

        // Volume Control Slider
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

        // Level Selector Control
        const updateLevelDesc = (lvl) => {
            if (!lblLevelDesc) return;
            let tag = 'NORMAL';
            if (lvl >= 8) tag = 'EXTREME';
            else if (lvl >= 5) tag = 'FAST';
            else if (lvl >= 3) tag = 'MODERATE';
            lblLevelDesc.innerText = `LEVEL ${lvl} (${tag})`;
        };

        if (levelPickerGrid) {
            levelPickerGrid.innerHTML = '';
            for (let i = 1; i <= 10; i++) {
                const btn = document.createElement('button');
                btn.className = `level-btn ${i === this.startLevel ? 'active' : ''}`;
                btn.innerText = i.toString();
                btn.addEventListener('click', () => {
                    this.sound.init();
                    this.sound.playMove();
                    this.startLevel = i;
                    localStorage.setItem('sandtrix_start_level', i.toString());
                    levelPickerGrid.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    updateLevelDesc(i);
                    // If game not in progress, rebuild engine with chosen starting level
                    if (!this.gameStarted || this.engine.gameOver) {
                        this.restartGame();
                    }
                });
                levelPickerGrid.appendChild(btn);
            }
            updateLevelDesc(this.startLevel);
        }

        // In-game Restart & Pause
        document.getElementById('btnRestart').addEventListener('click', () => this.restartGame());
        document.getElementById('btnPause').addEventListener('click', () => {
            const nextState = !this.engine.paused;
            this.setPaused(nextState);
            this.sound.init();
            this.showToast(nextState ? 'PAUSED' : 'RESUMED');
        });

        updateMenuCards();
        this.setGyroEnabled(this.gyroEnabled);
        this.showPage('menu');
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
        // 1. Dismiss any open modal overlay
        const openModal = document.querySelector('.overlay.active');
        if (openModal) {
            openModal.classList.remove('active');
            return 'handled';
        }

        // 2. If playing the game
        if (this.currentPage === 'game' && this.gameStarted && !this.engine.gameOver) {
            if (!this.engine.paused) {
                // First back press: pause the game, do NOT exit
                this.setPaused(true);
                this.showToast('PAUSED - Press Back again to exit');
                return 'handled';
            } else {
                // Second back press while already paused: exit/close app
                if (window.AndroidApp && typeof window.AndroidApp.closeApp === 'function') {
                    window.AndroidApp.closeApp();
                }
                return 'close';
            }
        }

        // 3. If game is over, return to main menu
        if (this.currentPage === 'game' && this.engine.gameOver) {
            this.showPage('menu');
            return 'handled';
        }

        // 4. If on the main menu, exit/close app
        if (this.currentPage === 'menu') {
            if (window.AndroidApp && typeof window.AndroidApp.closeApp === 'function') {
                window.AndroidApp.closeApp();
            }
            return 'close';
        }

        return 'close';
    }

    updateMenuHighScores() {
        const sandHigh = parseInt(localStorage.getItem('sandtrix_mobile_high_sandtrix') || '0', 10);
        const trollHigh = parseInt(localStorage.getItem('sandtrix_mobile_high_troll') || '0', 10);
        const elSand = document.getElementById('menuHighScoreSandtrix');
        const elTroll = document.getElementById('menuHighScoreTroll');
        if (elSand) elSand.innerText = sandHigh.toLocaleString();
        if (elTroll) elTroll.innerText = trollHigh.toLocaleString();
    }

    showPage(page) {
        this.currentPage = page;
        const pageMenu = document.getElementById('pageMenu');
        const pageGame = document.getElementById('pageGame');
        const btnStart = document.getElementById('btnStartGame');

        if (page === 'menu') {
            this.gameOverDisplayed = false;
            if (pageMenu) pageMenu.classList.add('active');
            if (pageGame) pageGame.classList.remove('active');
            this.setPaused(true);
            if (btnStart) {
                btnStart.innerText = (this.gameStarted && !this.engine.gameOver) ? 'RESUME GAME' : 'START GAME';
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
        localStorage.setItem('sandtrix_mode', mode);
        this.engine = new SandEngine(this.currentMode, this.enableElements, this.startLevel);
        this.restartGame();

        const gameModePill = document.getElementById('gameModePill');
        if (gameModePill) {
            if (mode === 'sandtrix') {
                gameModePill.innerText = 'SANDTRIX';
                gameModePill.style.color = '#48CAE4';
                gameModePill.style.borderColor = 'rgba(72, 202, 228, 0.4)';
            } else {
                gameModePill.innerText = 'TROLL';
                gameModePill.style.color = '#F26D78';
                gameModePill.style.borderColor = 'rgba(242, 109, 120, 0.4)';
            }
        }
    }

    restartGame() {
        this.sound.init();
        this.gameOverDisplayed = false;
        this.engine = new SandEngine(this.currentMode, this.enableElements, this.startLevel);
        this.hideGameOverOverlay();
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

    // ==========================================
    // Gyroscope & Motion Sensor Architecture
    // ==========================================
    // ==========================================
    // Gyroscope & Motion Sensor Architecture
    // ==========================================
    initSensors() {
        // Expose Native Android Bridge (called from Android Java SensorManager)
        window.onNativeGyro = (roll, pitch, rotSpeed) => {
            this.handleOrientation(roll, pitch, rotSpeed);
        };

        // iOS 13+ requires explicit user interaction permission for DeviceOrientation
        const requestPermissionBtn = document.getElementById('btnRequestGyro');
        if (requestPermissionBtn) {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                requestPermissionBtn.style.display = 'block';
                requestPermissionBtn.addEventListener('click', async () => {
                    try {
                        const response = await DeviceOrientationEvent.requestPermission();
                        if (response === 'granted') {
                            this.bindOrientationListeners();
                            requestPermissionBtn.style.display = 'none';
                            this.showToast('MOTION SENSORS ACTIVE!');
                        }
                    } catch (e) {
                        console.error('Gyro permission error', e);
                    }
                });
            } else {
                requestPermissionBtn.style.display = 'none';
                this.bindOrientationListeners();
            }
        } else {
            this.bindOrientationListeners();
        }
    }

    bindOrientationListeners() {
        // 1. Standard DeviceOrientation (gamma = roll, beta = pitch)
        window.addEventListener('deviceorientation', (e) => {
            if (e.gamma !== null && e.gamma !== undefined) {
                this.handleOrientation(e.gamma, e.beta || 0);
            }
        });

        // 2. Absolute DeviceOrientation
        window.addEventListener('deviceorientationabsolute', (e) => {
            if (e.gamma !== null && e.gamma !== undefined) {
                this.handleOrientation(e.gamma, e.beta || 0);
            }
        });

        // 3. Acceleration & Rotation Rate via DeviceMotion
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', (e) => {
                const acc = e.accelerationIncludingGravity;
                if (acc && (!this.sensorActive || !this.currentRoll)) {
                    // Fallback to accelerometer angle if deviceorientation was blocked
                    const ax = acc.x || 0;
                    const ay = acc.y || 0;
                    const az = acc.z || 0;
                    const roll = Math.atan2(ax, Math.sqrt(ay * ay + az * az)) * (180 / Math.PI);
                    const pitch = Math.atan2(ay, az) * (180 / Math.PI);
                    this.handleOrientation(-roll, pitch);
                }

                // Shake detection threshold (> 23 m/s^2) for Hard Drop
                if (acc) {
                    const totalAcc = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
                    const now = performance.now();
                    if (totalAcc > 23 && now - this.lastShakeTime > 750) {
                        this.lastShakeTime = now;
                        this.onShakeGesture();
                    }
                }
            });
        }
    }

    handleOrientation(roll, pitch) {
        if (!this.gyroEnabled) return;

        if (!this.sensorActive) {
            this.sensorActive = true;
        }

        const effectiveRoll = roll - this.calibratedRollOffset;

        // Exponential Moving Average (EMA) low-pass filter
        // 0.22 response factor provides snappy reaction while eliminating sensor jitter
        this.smoothedRoll = (this.smoothedRoll * 0.78) + (effectiveRoll * 0.22);
        this.smoothedPitch = (this.smoothedPitch * 0.78) + (pitch * 0.22);

        this.currentRoll = this.smoothedRoll;
        this.currentPitch = this.smoothedPitch;

        // Feed filtered tilt into physics engine (fluid sloshing and granular tilt gravity)
        this.engine.setTilt(this.smoothedRoll);
    }

    onShakeGesture() {
        if (this.engine.gameOver || this.engine.paused) return;

        // In Troll Mode: Roast the user for violent shaking
        if (this.currentMode === 'troll_classic') {
            this.showTrollRoast(getRandomTrollRoast('shakeRoast'));
        }

        // Trigger Hard Drop
        const dropEv = this.engine.hardDrop();
        if (dropEv) {
            this.sound.playDrop();
            this.particles.triggerShake(9);
            if (navigator.vibrate) navigator.vibrate(40); // Haptic feedback
            this.handleTickEvents(dropEv);
        }
    }

    // ==========================================
    // Touch Controls & Gesture Gestures
    // ==========================================
    initTouchControls() {
        // Virtual Buttons
        const bindBtn = (id, action) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const handler = (e) => {
                e.preventDefault();
                this.sound.init();
                action();
            };
            btn.addEventListener('touchstart', handler, { passive: false });
            btn.addEventListener('mousedown', handler);
        };

        bindBtn('btnHold', () => {
            if (this.engine.holdCurrentPiece()) {
                this.sound.playMove();
            }
        });

        bindBtn('btnRotCW', () => {
            if (this.engine.rotatePiece(1)) {
                this.sound.playRotate();
            }
        });

        bindBtn('btnRotCCW', () => {
            if (this.engine.rotatePiece(-1)) {
                this.sound.playRotate();
            }
        });

        bindBtn('btnLeft', () => {
            if (this.engine.movePiece(-1)) {
                this.sound.playMove();
            }
        });

        bindBtn('btnRight', () => {
            if (this.engine.movePiece(1)) {
                this.sound.playMove();
            }
        });

        bindBtn('btnSoftDrop', () => {
            this.engine.isSoftDropping = true;
            setTimeout(() => { this.engine.isSoftDropping = false; }, 200);
        });

        bindBtn('btnHardDrop', () => {
            const dropEv = this.engine.hardDrop();
            if (dropEv) {
                this.sound.playDrop();
                this.particles.triggerShake(7);
                if (navigator.vibrate) navigator.vibrate(30);
                this.handleTickEvents(dropEv);
            }
        });

        // Touch Gestures on Canvas
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.sound.init();
            if (e.touches.length > 0) {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
                this.isSwiping = false;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const curX = e.touches[0].clientX;
                const curY = e.touches[0].clientY;
                const dx = curX - this.touchStartX;
                const dy = curY - this.touchStartY;

                // Horizontal drag nudges piece
                if (Math.abs(dx) > 30) {
                    const dir = dx > 0 ? 1 : -1;
                    if (this.engine.movePiece(dir)) {
                        this.sound.playMove();
                    }
                    this.touchStartX = curX;
                    this.isSwiping = true;
                }

                // Vertical swipe down soft drops
                if (dy > 45) {
                    this.engine.isSoftDropping = true;
                    this.touchStartY = curY;
                    this.isSwiping = true;
                }
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.engine.isSoftDropping = false;
            if (!this.isSwiping) {
                // If game is currently paused, tapping the playfield resumes the game!
                if (this.engine.paused && this.currentPage === 'game' && !this.engine.gameOver) {
                    this.setPaused(false);
                    this.sound.playRotate();
                    this.showToast('RESUMED');
                    return;
                }
                // Quick Tap on Canvas = Rotate Clockwise!
                if (this.engine.rotatePiece(1)) {
                    this.sound.playRotate();
                }
            }
        }, { passive: false });
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.sound.init();
            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    if (this.engine.movePiece(-1)) this.sound.playMove();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (this.engine.movePiece(1)) this.sound.playMove();
                    break;
                case 'ArrowUp':
                case 'KeyW':
                case 'KeyX':
                    if (this.engine.rotatePiece(1)) this.sound.playRotate();
                    break;
                case 'KeyZ':
                case 'ControlLeft':
                    if (this.engine.rotatePiece(-1)) this.sound.playRotate();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.engine.isSoftDropping = true;
                    break;
                case 'Space': {
                    const dropEv = this.engine.hardDrop();
                    if (dropEv) {
                        this.sound.playDrop();
                        this.particles.triggerShake(7);
                        this.handleTickEvents(dropEv);
                    }
                    break;
                }
                case 'KeyC':
                case 'ShiftLeft':
                    if (this.engine.holdCurrentPiece()) this.sound.playMove();
                    break;
                case 'KeyP':
                case 'Escape':
                    this.setPaused(!this.engine.paused);
                    this.showToast(this.engine.paused ? 'PAUSED' : 'RESUMED');
                    break;
                case 'KeyR':
                    this.restartGame();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.engine.isSoftDropping = false;
            }
        });
    }

    // ==========================================
    // Gyro Steering Physics Integration (Analog Continuous Velocity)
    // ==========================================
    processGyroSteering(dtMs) {
        if (!this.gyroEnabled || this.engine.gameOver || this.engine.paused) return;

        const deadzone = 4.5; // degrees threshold
        const absRoll = Math.abs(this.smoothedRoll);

        if (absRoll > deadzone) {
            const dir = Math.sign(this.smoothedRoll);
            const excess = Math.min(32.0, absRoll - deadzone);
            const normTilt = excess / 32.0;

            // Non-linear analog velocity curve:
            // 2.5 minos/sec (fine precision adjustments) up to 15.0 minos/sec (rapid tilt slide)
            const minosPerSec = 2.5 + Math.pow(normTilt, 1.25) * 12.5;

            this.steerAccumulator += dir * minosPerSec * (dtMs / 1000.0);

            while (Math.abs(this.steerAccumulator) >= 1.0) {
                const moveDir = Math.sign(this.steerAccumulator);
                if (this.engine.movePiece(moveDir)) {
                    this.sound.playMove();
                    this.steerAccumulator -= moveDir;
                } else {
                    // Piece reached the boundary wall: zero accumulator to avoid backlog
                    this.steerAccumulator = 0.0;
                    break;
                }
            }
        } else {
            // Instantly damp accumulator inside deadzone to prevent post-tilt drift
            this.steerAccumulator = 0.0;
        }
    }

    // ==========================================
    // Event Handler for Clears, Calamities & Audio
    // ==========================================
    handleTickEvents(ev) {
        if (!ev) return;

        if (ev.cleared) {
            this.sound.playClear(ev.combo || 1);
            this.particles.triggerShake(ev.isWaterWave ? 8 : 4);
            const colorHex = PALETTE[ev.color] || '#EB4B4B';
            this.particles.addSparks(ev.coords, colorHex, 2);

            const pointsStr = `+${ev.points}`;
            this.particles.addFloatingText(200, 320, pointsStr, '#FFD700', 20);

            if (ev.isWaterWave) {
                this.particles.addFloatingText(200, 280, 'TIDAL WAVE!', '#00D2D7', 24);
                this.sound.playWaterSplash();
            }

            if (ev.roast) {
                this.showTrollRoast(ev.roast);
            }
        }

        if (ev.landedWater) {
            this.sound.playWaterSplash();
            this.particles.addSplash(200, 680, '#0096C7', 25);
        }

        if (ev.landedAcid) {
            this.sound.playAcidSizzle();
        }

        if (ev.acidCorroded && ev.acidCorroded.length > 0) {
            this.sound.playAcidSizzle();
            this.particles.addAcidFizz(ev.acidCorroded);
        }

        if (ev.bombCrater && ev.bombCrater.length > 0) {
            this.sound.playBoom();
            this.particles.triggerShake(12);
            this.particles.addSparks(ev.bombCrater, '#FF6B6B', 3);
            if (this.currentMode === 'troll_classic') {
                this.showTrollRoast(getRandomTrollRoast('bomb'));
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
            this.showTrollRoast("SEISMIC TREMOR!");
        }

        if (ev.confusion) {
            this.sound.playTone(600, 200, 0.35, 'sawtooth');
            if (ev.roast) this.showTrollRoast(ev.roast);
        }

        if (ev.gameOver || (this.engine && this.engine.gameOver)) {
            if (!this.gameOverDisplayed) {
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
        const score = this.engine.score;
        const lines = this.engine.linesCleared;
        const rots = this.engine.rotationsCount || 0;
        const pieces = this.engine.piecesPlaced || 0;
        const mode = this.currentMode;

        const memes = [];

        if (lines === 0) {
            memes.push(
                "Not a single line cleared. The grid is judging you silently.",
                "Skill issue officially documented and stamped.",
                "The ceiling rejected your application in record time.",
                "Did gravity win or were your thumbs frozen?",
                "Zero lines? Even the ghost piece looked embarrassed."
            );
        } else if (rots >= 25) {
            memes.push(
                `Rotated ${rots} times like a fidget spinner, still hit the ceiling.`,
                "All that spinning just to drop it in the wrong slot.",
                "Certified spin doctor, questionable puzzle solver.",
                "Spin to win? More like spin to bin."
            );
        } else if (rots === 0 && pieces >= 3) {
            memes.push(
                "Zero rotations? Pure vertical purist or forgot the buttons existed?",
                "Playing without rotations is a dangerous lifestyle.",
                "Strictly vertical geometry. Respect the audacity."
            );
        } else if (score >= 25000) {
            memes.push(
                "Wait, you actually cooked?! Someone call the championship.",
                "Calculated perfection or pure accidental genius?",
                "Bro entered the zone and cleared the universe."
            );
        } else if (score >= 8000) {
            memes.push(
                "Respectable run, but that panic drop at the end hurt.",
                "Solid effort! The blocks demand another sacrifice though.",
                "You fought bravely, but the stack was hungrier."
            );
        } else {
            memes.push(
                "Panic drop into the danger zone: A timeless tragedy.",
                "The Tetris gods are filing a restraining order against your thumbs.",
                "Your piece saw the open gap, got scared, and stacked anyway.",
                "Rest in pieces. May the next bag bless your soul.",
                "Physics said no, and you did not argue back."
            );
        }

        if (mode === 'troll_classic') {
            memes.push(
                "The troll edition lived up to its name and humbled you.",
                "Calamity struck, brain malfunctioned, game ended.",
                "You got trolled by geometry itself."
            );
        }

        return memes[Math.floor(Math.random() * memes.length)];
    }

    formatSurvivalTime(ms) {
        const totalSec = Math.floor(Math.max(0, ms) / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        if (mins >= 60) {
            const hrs = Math.floor(mins / 60);
            const remMins = mins % 60;
            return `${hrs}h ${remMins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    showGameOverOverlay() {
        const overlay = document.getElementById('gameOverOverlay');
        if (overlay) {
            document.getElementById('finalScoreLabel').innerText = this.engine.score.toLocaleString();
            
            const hsEl = document.getElementById('finalHighScoreLabel');
            if (hsEl) hsEl.innerText = this.engine.highScore.toLocaleString();

            const timeEl = document.getElementById('finalTimeLabel');
            if (timeEl) timeEl.innerText = this.formatSurvivalTime(this.engine.survivalTimeMs || 0);

            const linesEl = document.getElementById('finalLinesLabel');
            if (linesEl) linesEl.innerText = this.engine.linesCleared.toLocaleString();

            const rotEl = document.getElementById('finalRotationsLabel');
            if (rotEl) rotEl.innerText = (this.engine.rotationsCount || 0).toLocaleString();

            const pieceEl = document.getElementById('finalPiecesLabel');
            if (pieceEl) pieceEl.innerText = (this.engine.piecesPlaced || 0).toLocaleString();

            const modeEl = document.getElementById('finalModeLabel');
            if (modeEl) modeEl.innerText = (this.currentMode === 'troll_classic') ? 'Troll Classic' : 'Sandtrix';

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

    // ==========================================
    // 60 FPS Game Loop & Direct Canvas Blitting
    // ==========================================
    gameLoop(now) {
        const dtMs = Math.min(60, now - this.lastTime);
        this.lastTime = now;

        if (this.currentPage === 'game' && this.gameStarted) {
            if (this.engine.gameOver) {
                this.handleTickEvents({ gameOver: true });
            } else if (!this.engine.paused) {
                // Process Gyroscope Steering
                if (this.gyroEnabled) {
                    this.processGyroSteering(dtMs);
                }

                // Simulation Tick
                const tickEvents = this.engine.tick(dtMs);
                if (this.engine.gameOver) {
                    tickEvents.gameOver = true;
                }
                this.handleTickEvents(tickEvents);
            }
        }

        // Render Frame & Sync HUD only when on game screen
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

        // 1. Direct Framebuffer Blitting of Sand/Block Grid
        const grid = this.engine.grid;
        for (let i = 0; i < BOARD_WIDTH * BOARD_HEIGHT; i++) {
            const mat = grid[i];
            this.pixelBuf[i] = this.colorABGR[mat] || this.colorABGR[0];
        }

        // Create temporary canvas to scale 80x140 grid up to 400x700 with pixel perfection
        if (!this.offscreenCanvas) {
            this.offscreenCanvas = document.createElement('canvas');
            this.offscreenCanvas.width = BOARD_WIDTH;
            this.offscreenCanvas.height = BOARD_HEIGHT;
            this.offCtx = this.offscreenCanvas.getContext('2d');
        }

        this.offCtx.putImageData(this.imageData, 0, 0);

        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(this.offscreenCanvas, 0, 0, 400, 700);

        // 2. Playfield Boundary Walls (crisp high-contrast frame)
        this.ctx.strokeStyle = '#2A364F';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(1, 1, 398, 698);

        // 3. Render Danger Line
        const dangerY = ((this.currentMode === 'troll_classic') ? (4 + MINO_SIZE) : DANGER_ROW) * 5;
        this.ctx.strokeStyle = 'rgba(235, 75, 75, 0.45)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(2, dangerY);
        this.ctx.lineTo(398, dangerY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // 4. Render Ghost Piece
        if (this.engine.activePiece && !this.engine.gameOver) {
            const ghostY = this.engine.activePiece.getGhostY(this.engine.grid, (this.currentMode === 'troll_classic') ? MINO_SIZE : 1);
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
                            const drawX = worldX * 5;
                            this.ctx.fillRect(drawX, drawY, 5, 5);
                        }
                    }
                }
            }

            // 5. Render Active Piece
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
                            const drawX = worldX * 5;
                            this.ctx.fillRect(drawX, drawY, 5, 5);
                        }
                    }
                }
            }
        }

        // 5. Render Particle System
        this.particles.draw(this.ctx);

        this.ctx.restore();

        // 6. Render Paused Screen Overlay on Playfield Canvas
        if (this.engine.paused && this.currentPage === 'game' && this.gameStarted && !this.engine.gameOver) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(11, 14, 20, 0.78)';
            this.ctx.fillRect(0, 0, 400, 700);

            this.ctx.font = '700 32px Comfortaa, Nunito, sans-serif';
            this.ctx.fillStyle = '#48CAE4';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('PAUSED', 200, 320);

            this.ctx.font = '700 13px Nunito, sans-serif';
            this.ctx.fillStyle = '#F3F6FA';
            this.ctx.fillText('PRESS BACK TO EXIT', 200, 360);

            this.ctx.font = '600 12px Nunito, sans-serif';
            this.ctx.fillStyle = '#9AA7BD';
            this.ctx.fillText('TAP SCREEN TO RESUME', 200, 385);
            this.ctx.restore();
        }
    }

    syncHUD() {
        const scoreEl = document.getElementById('lblScore');
        if (scoreEl) {
            const val = this.engine.score;
            scoreEl.innerText = val.toLocaleString();
            if (val >= 10000000) {
                scoreEl.style.fontSize = '0.70rem';
            } else if (val >= 1000000) {
                scoreEl.style.fontSize = '0.80rem';
            } else {
                scoreEl.style.fontSize = '';
            }
        }

        const hsEl = document.getElementById('lblHighScore');
        if (hsEl) {
            hsEl.innerText = this.engine.highScore.toLocaleString();
        }

        const linesEl = document.getElementById('lblLines');
        if (linesEl) linesEl.innerText = this.engine.linesCleared.toString();

        const levelEl = document.getElementById('lblLevel');
        if (levelEl) levelEl.innerText = this.engine.level.toString();

        const comboBadge = document.getElementById('badgeCombo');
        if (comboBadge) {
            if (this.engine.combo > 1) {
                comboBadge.innerText = `${this.engine.combo}x COMBO`;
                comboBadge.style.display = 'inline-block';
            } else {
                comboBadge.style.display = 'none';
            }
        }

        // Render Hold Piece Preview
        this.renderPiecePreview('holdCanvas', this.engine.holdPiece);

        // Render Next Pieces Queue (Incoming elements queue)
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

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.app = new SandtrixApp();
});
