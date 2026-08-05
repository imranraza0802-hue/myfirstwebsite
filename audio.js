class AudioSynth {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.currentMusic = null;
        this.musicInterval = null;
        this.tempo = 120;
        this.volume = 0.15;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopMusic();
        } else {
            // resume music if we are in a level
            if (window.game && window.game.isPlaying && window.game.currentLevelIndex !== undefined) {
                this.playLevelMusic(window.game.currentLevelIndex);
            }
        }
        return this.muted;
    }

    // Synthesized Sound Effects
    playSFX(type) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        switch (type) {
            case 'jump': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(650, now + 0.16);
                
                gain.gain.setValueAtTime(this.volume * 0.8, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.16);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.17);
                break;
            }
            case 'coin': {
                const osc1 = this.ctx.createOscillator();
                const osc2 = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc1.type = 'sine';
                osc2.type = 'sine';
                
                // Classic B5 -> E6 chime
                osc1.frequency.setValueAtTime(988, now);
                osc1.frequency.setValueAtTime(1318, now + 0.08);
                osc2.frequency.setValueAtTime(1200, now);
                osc2.frequency.setValueAtTime(1500, now + 0.08);

                gain.gain.setValueAtTime(this.volume * 0.7, now);
                gain.gain.setValueAtTime(this.volume * 0.7, now + 0.08);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(this.ctx.destination);
                
                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.4);
                osc2.stop(now + 0.4);
                break;
            }
            case 'stomp': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(120, now);
                osc.frequency.linearRampToValueAtTime(40, now + 0.1);
                
                gain.gain.setValueAtTime(this.volume * 1.5, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            }
            case 'break': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(80, now);
                osc.frequency.setValueAtTime(50, now + 0.05);
                osc.frequency.setValueAtTime(30, now + 0.1);

                gain.gain.setValueAtTime(this.volume * 2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            }
            case 'powerup': {
                const notes = [330, 392, 659, 523, 587, 784]; // E4, G4, E5, C5, D5, G5
                const noteDur = 0.07;
                notes.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(freq, now + idx * noteDur);
                    
                    gain.gain.setValueAtTime(this.volume * 0.5, now + idx * noteDur);
                    gain.gain.setValueAtTime(0.01, now + (idx + 1) * noteDur - 0.01);
                    
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * noteDur);
                    osc.stop(now + (idx + 1) * noteDur);
                });
                break;
            }
            case 'powerdown': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.25);
                
                gain.gain.setValueAtTime(this.volume * 1.2, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
                break;
            }
            case 'fireball': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(450, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
                
                gain.gain.setValueAtTime(this.volume * 0.8, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.08);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            }
            case 'kick': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);
                
                gain.gain.setValueAtTime(this.volume * 1.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
                break;
            }
            case 'hurt': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(50, now + 0.15);
                
                gain.gain.setValueAtTime(this.volume * 1.5, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            }
            case 'bowser_hurt': {
                // Low rumbling noise / saw sweep
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(90, now);
                osc.frequency.linearRampToValueAtTime(30, now + 0.3);
                
                gain.gain.setValueAtTime(this.volume * 2.0, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.3);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            }
            case 'gameover': {
                this.stopMusic();
                const notes = [
                    { f: 392, d: 0.12 }, // G4
                    { f: 330, d: 0.12 }, // E4
                    { f: 261, d: 0.12 }, // C4
                    { f: 220, d: 0.18 }, // A3
                    { f: 247, d: 0.18 }, // B3
                    { f: 220, d: 0.18 }, // A3
                    { f: 196, d: 0.35 }  // G3
                ];
                let delay = 0;
                notes.forEach(note => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(note.f, now + delay);
                    gain.gain.setValueAtTime(this.volume * 0.8, now + delay);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + delay + note.d);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + delay);
                    osc.stop(now + delay + note.d);
                    delay += note.d + 0.02;
                });
                break;
            }
            case 'stageclear': {
                this.stopMusic();
                const melody = [
                    261, 329, 392, 523, 659, 784, 987, 1046, // C4 E4 G4 C5 E5 G5 B5 C6
                ];
                const durations = [0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.4];
                let delay = 0;
                melody.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + delay);
                    gain.gain.setValueAtTime(this.volume, now + delay);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + delay + durations[idx]);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + delay);
                    osc.stop(now + delay + durations[idx]);
                    delay += durations[idx] + 0.02;
                });
                break;
            }
        }
    }

    // Dynamic Looping Music Sequencer
    playLevelMusic(levelIdx) {
        if (this.muted) return;
        this.stopMusic();
        this.init();
        if (!this.ctx) return;

        let notes, speed, type;
        
        switch (levelIdx) {
            case 0: // Grassland - Upbeat melody
                type = 'square';
                speed = 0.16; // 16th notes
                notes = [
                    659, 659, 0, 659, 0, 523, 659, 0, 784, 0, 0, 0, 392, 0, 0, 0,
                    523, 0, 0, 392, 0, 0, 330, 0, 0, 440, 0, 494, 0, 466, 440, 0,
                    392, 659, 784, 880, 0, 698, 784, 0, 659, 0, 523, 587, 494, 0, 0
                ];
                break;
            case 1: // Cave - Spooky Chromatic Bass
                type = 'triangle';
                speed = 0.25;
                notes = [
                    110, 116, 123, 0, 130, 0, 123, 0, 98, 104, 110, 0, 0, 0, 0, 0,
                    110, 116, 123, 0, 130, 0, 147, 0, 138, 130, 123, 0, 0, 0, 0, 0
                ];
                break;
            case 2: // Cloud/Athletic - Fast bouncy melody
                type = 'triangle';
                speed = 0.14;
                notes = [
                    523, 659, 523, 659, 784, 0, 784, 0, 880, 784, 698, 587, 523, 0, 0, 0,
                    440, 554, 440, 554, 659, 0, 659, 0, 784, 659, 587, 494, 523, 0, 0, 0
                ];
                break;
            case 3: // Water - Flowing 3/4 Waltz
                type = 'sine';
                speed = 0.3;
                notes = [
                    392, 523, 659, 784, 0, 784, 698, 0, 698, 587, 0, 0,
                    349, 494, 587, 698, 0, 698, 659, 0, 659, 523, 0, 0
                ];
                break;
            case 4: // Castle - Dark dramatic minor key
                type = 'sawtooth';
                speed = 0.2;
                notes = [
                    220, 220, 261, 261, 293, 293, 311, 0, 293, 293, 261, 261, 220, 0, 0, 0,
                    196, 196, 233, 233, 261, 261, 277, 0, 261, 261, 233, 233, 196, 0, 0, 0
                ];
                break;
            default:
                return;
        }

        let idx = 0;
        const playTick = () => {
            const now = this.ctx.currentTime;
            const freq = notes[idx];
            
            if (freq > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc.type = type;
                osc.frequency.value = freq;
                
                // Add minor vibrato for Castle theme
                if (levelIdx === 4) {
                    const lfo = this.ctx.createOscillator();
                    const lfoGain = this.ctx.createGain();
                    lfo.frequency.value = 6; // 6Hz frequency
                    lfoGain.gain.value = 5; // vibrato range +/- 5Hz
                    lfo.connect(lfoGain);
                    lfoGain.connect(osc.frequency);
                    lfo.start(now);
                    lfo.stop(now + speed - 0.02);
                }

                // Volume envelope
                gain.gain.setValueAtTime(this.volume * (type === 'sawtooth' ? 0.3 : 0.6), now);
                gain.gain.exponentialRampToValueAtTime(0.005, now + speed - 0.01);
                
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + speed - 0.01);
            }
            
            idx = (idx + 1) % notes.length;
        };

        playTick();
        this.musicInterval = setInterval(playTick, speed * 1000);
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

// Global audio object
window.audio = new AudioSynth();
