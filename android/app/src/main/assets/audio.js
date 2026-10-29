/**
 * Procedural Web Audio Synthesizer for Sandtrix Mobile.
 * Generates all sound effects dynamically via Web Audio API.
 * Zero external audio assets required.
 */
class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        const savedVol = localStorage.getItem('sandtrix_volume');
        this.volume = (savedVol !== null) ? parseFloat(savedVol) : 0.7;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMuted(m) {
        this.muted = m;
    }

    setVolume(v) {
        this.volume = Math.max(0, Math.min(1, v));
        localStorage.setItem('sandtrix_volume', this.volume.toString());
    }

    playTestTone() {
        this.init();
        this.playTone(440, 520, 0.08, 'sine', 0.6);
    }

    playTone(startFreq, endFreq, duration, type = 'sine', gainScale = 1.0) {
        if (this.muted || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(startFreq, now);
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);

            const peak = this.volume * gainScale * 0.4;
            gain.gain.setValueAtTime(peak, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {
            // Audio context not allowed yet
        }
    }

    playMove() {
        this.playTone(380, 220, 0.04, 'sine', 0.5);
    }

    playRotate() {
        this.playTone(320, 640, 0.06, 'triangle', 0.6);
    }

    playDrop() {
        this.playTone(180, 50, 0.08, 'sine', 0.8);
    }

    playLock() {
        this.playTone(140, 45, 0.07, 'sine', 0.9);
    }

    playClear(combo = 1) {
        if (this.muted || !this.ctx) return;
        try {
            const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5, D5, E5, G5, A5, C6
            const baseIdx = Math.min((combo - 1) % pentatonic.length, pentatonic.length - 1);
            const freqs = [
                pentatonic[baseIdx],
                pentatonic[Math.min(baseIdx + 1, pentatonic.length - 1)],
                pentatonic[Math.min(baseIdx + 2, pentatonic.length - 1)]
            ];

            const now = this.ctx.currentTime;
            freqs.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);

                const peak = this.volume * 0.4;
                gain.gain.setValueAtTime(0.001, now + idx * 0.05);
                gain.gain.linearRampToValueAtTime(peak, now + idx * 0.05 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.28);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + idx * 0.05);
                osc.stop(now + idx * 0.05 + 0.3);
            });
        } catch (e) {}
    }

    playWaterSplash() {
        if (this.muted || !this.ctx) return;
        try {
            const bufferSize = this.ctx.sampleRate * 0.15;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(800, this.ctx.currentTime);
            filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start();
        } catch (e) {}
    }

    playAcidSizzle() {
        if (this.muted || !this.ctx) return;
        try {
            const bufferSize = this.ctx.sampleRate * 0.18;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.05) * Math.exp(-i / (bufferSize * 0.5));
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(2200, this.ctx.currentTime);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(this.volume * 0.45, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.18);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start();
        } catch (e) {}
    }

    playIceFreeze() {
        if (this.muted || !this.ctx) return;
        try {
            // Crystalline high-frequency chime
            const now = this.ctx.currentTime;
            [1200, 1600, 2400].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.03);
                gain.gain.setValueAtTime(this.volume * 0.25, now + idx * 0.03);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.03 + 0.18);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.03);
                osc.stop(now + idx * 0.03 + 0.2);
            });
        } catch (e) {}
    }

    playFireScorch() {
        if (this.muted || !this.ctx) return;
        try {
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.16);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(this.volume * 0.45, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.16);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start();
        } catch (e) {}
    }

    playGasHiss() {
        if (this.muted || !this.ctx) return;
        try {
            this.playTone(900, 1800, 0.14, 'sine', 0.2);
        } catch (e) {}
    }

    playBoom() {
        if (this.muted || !this.ctx) return;
        try {
            this.playTone(90, 25, 0.45, 'sawtooth', 1.0);
            this.playTone(150, 40, 0.35, 'square', 0.6);
        } catch (e) {}
    }

    playMorph() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(750, now + 0.08);
            osc.frequency.linearRampToValueAtTime(300, now + 0.16);

            gain.gain.setValueAtTime(this.volume * 0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
        } catch (e) {}
    }

    playVictory() {
        if (this.muted || !this.ctx) return;
        try {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            const now = this.ctx.currentTime;
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.12);

                gain.gain.setValueAtTime(this.volume * 0.5, now + idx * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.45);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.12);
                osc.stop(now + idx * 0.12 + 0.48);
            });
        } catch (e) {}
    }

    playGameOver() {
        if (this.muted || !this.ctx) return;
        try {
            const notes = [392.00, 370.00, 349.23, 311.13]; // G4, F#4, F4, D#4
            const now = this.ctx.currentTime;
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now + idx * 0.12);

                gain.gain.setValueAtTime(this.volume * 0.4, now + idx * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.12);
                osc.stop(now + idx * 0.12 + 0.26);
            });
        } catch (e) {}
    }
}
