/**
 * Web Audio procedural sound synthesizer for Flores RPG
 * Uses pure Web Audio API without external audio asset dependencies.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private ambientInterval: number | null = null;
  private isMusicPlaying: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.6, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Play short noise burst for physical hits or swooshes
  private playNoise(duration: number, filterFreq: number, type: BiquadFilterType = 'lowpass', gainLevel: number = 0.2) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
  }

  // Attack with Parang (Blade Slash)
  public playAttackSlash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(480, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
    this.playNoise(0.08, 1200, 'bandpass', 0.15);
  }

  // Caci Whip Crack (Cambuk Caci) - Sharp crack with acoustic echo
  public playWhipCrack() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    
    // High pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.06);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);

    // Whip snap noise
    this.playNoise(0.12, 3500, 'highpass', 0.35);

    // Deep resonance tail
    setTimeout(() => {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(140, this.ctx.currentTime);
      sub.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.15);
      subGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);
      sub.connect(subGain);
      subGain.connect(this.masterGain);
      sub.start();
      sub.stop(this.ctx.currentTime + 0.16);
    }, 20);
  }

  // Hit Impact (Flesh / Armor)
  public playHitImpact(isHeavy = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isHeavy ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isHeavy ? 180 : 220, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + (isHeavy ? 0.2 : 0.1));

    gain.gain.setValueAtTime(isHeavy ? 0.5 : 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isHeavy ? 0.22 : 0.12));

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + (isHeavy ? 0.23 : 0.13));

    this.playNoise(isHeavy ? 0.18 : 0.08, isHeavy ? 800 : 1500, 'lowpass', isHeavy ? 0.3 : 0.2);
  }

  // Dodge / Roll
  public playRoll() {
    this.playNoise(0.16, 600, 'lowpass', 0.15);
  }

  // Kelimutu Elemental Magic
  public playMagicCast(type: 'fire' | 'ice' | 'nature') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'fire') {
      // Roaring fire blast
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.3);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      this.playNoise(0.3, 1400, 'bandpass', 0.25);
    } else if (type === 'ice') {
      // Sparkling mystical ice chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1760, t + 0.25);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    } else {
      // Emerald nature surge
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(554, t + 0.08);
      osc.frequency.setValueAtTime(659, t + 0.16);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Gong / Gamelan resonance (Traditional Flores music note)
  public playGongTone(freq = 130) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);
    
    // Slight detune for metallic bronze resonance
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 1.015, t);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 2.0);
    osc2.stop(t + 2.0);
  }

  // Sasando plucked string tone
  public playSasandoNote(freq: number, duration = 0.8) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  // Item Pickup / Chest Open
  public playItemPickup() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.16);
      }, idx * 45);
    });
  }

  // Level Up / Quest Fanfare
  public playLevelUp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const notes = [392, 523.25, 659.25, 783.99, 1046.5, 1318.5]; // G4, C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.45);
      }, idx * 80);
    });
    this.playGongTone(160);
  }

  // Dragon / Komodo Roar
  public playDragonRoar() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.3);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.8);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.9);

    this.playNoise(0.7, 700, 'bandpass', 0.3);
  }

  // Interactive UI Click
  public playUiClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  // Ambient Procedural Flores Soundtrack (Pentatonic Sasando / Gamelan Arpeggio)
  public startAmbientMusic(region: 'NAGEKEO' | 'ENDE' | 'MAUMERE' | 'KELIMUTU' = 'NAGEKEO') {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.initCtx();

    // Pentatonic scale frequencies (tuned like authentic Indonesian Sasando / Slendro & Pelog)
    const scales: Record<string, number[]> = {
      NAGEKEO: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25], // Peaceful highland mountain scale
      ENDE: [220.00, 246.94, 261.63, 329.63, 349.23, 440.00], // Mysterious ancient karst scale
      MAUMERE: [293.66, 369.99, 440.00, 554.37, 587.33, 739.99], // Lively coastal tropical breeze
      KELIMUTU: [196.00, 207.65, 261.63, 311.13, 392.00, 415.30], // Mythical sacred volcanic scale
    };

    let step = 0;
    const currentScale = scales[region] || scales.NAGEKEO;

    this.ambientInterval = window.setInterval(() => {
      if (this.isMuted || !this.isMusicPlaying) return;
      step++;

      // Play a peaceful plucked note
      const note = currentScale[step % currentScale.length];
      const octaveMultiplier = Math.random() > 0.4 ? 1 : 2;
      this.playSasandoNote(note * octaveMultiplier, 0.7);

      // Every 8 beats, play a deep calming gong chime
      if (step % 8 === 0) {
        this.playGongTone(currentScale[0] * 0.5);
      }
    }, 420);
  }

  public stopAmbientMusic() {
    this.isMusicPlaying = false;
    if (this.ambientInterval !== null) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  public switchRegionMusic(region: 'NAGEKEO' | 'ENDE' | 'MAUMERE' | 'KELIMUTU') {
    this.stopAmbientMusic();
    this.startAmbientMusic(region);
  }
}

export const sound = new SoundEngine();
