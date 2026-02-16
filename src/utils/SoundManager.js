
class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('sfx-muted') === 'true';
        // Initialize on first user interaction to satisfy browser policies
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('sfx-muted', this.muted);
        return this.muted;
    }

    // Helper to generic oscillators
    _playTone(freq, type, duration, vol = 0.1) {
        if (this.muted) return;
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playHover() {
        // High, short tech blip
        this._playTone(800, 'sine', 0.1, 0.1);
    }

    playClick() {
        // Confirmation beep
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.15);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(t + 0.15);
    }

    playUiSelect() {
        // Soft interaction
        this._playTone(1200, 'triangle', 0.1, 0.1);
    }

    playError() {
        // Low buzz
        this._playTone(150, 'sawtooth', 0.2, 0.05);
    }

    playEnterMap() {
        // Soft "engage" sound
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Softer sine wave entry
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, t); // E4
        osc.frequency.linearRampToValueAtTime(440, t + 0.1); // -> A4 (slight rise)

        gain.gain.setValueAtTime(0.1, t); // Much quieter
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(t + 0.15);
    }
}

export const sfx = new SoundManager();
