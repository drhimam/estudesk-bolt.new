/**
 * High-quality procedural Web Audio ambient soundscape engine.
 * Generates:
 * 1. 🪈 Melodious Flute & Meditation Notes (Pentatonic Shakuhachi/Bansuri woodwind melodies)
 * 2. 🐦 Melodious Bird Calls & Morning Forest (Realistic FM-modulated chirps & trills)
 * 3. 🧠 Alpha Waves & Concentration Drone (432Hz + 10Hz binaural beats for deep focus)
 * 4. 🌧️ Gentle Rain & Calming Breeze
 */

export type AmbientSoundType = 'flute' | 'birds' | 'alpha' | 'rain' | 'off';

class AmbientAudioManager {
  private ctx: AudioContext | null = null;
  private currentType: AmbientSoundType = 'off';
  private masterGain: GainNode | null = null;
  private activeIntervals: number[] = [];
  private activeTimeouts: number[] = [];
  private activeNodes: AudioNode[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  // Helper: Create pink noise buffer
  private createPinkNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('No AudioContext');
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // --- 1. 🪈 MELODIOUS FLUTE & ZEN MEDITATION ---
  private startMelodiousFlute() {
    if (!this.ctx || !this.masterGain) return;

    // Peaceful Pentatonic Scale (C Major Pentatonic across 2 octaves)
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];

    // Soft warm background drone
    const droneOsc = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    const droneFilter = this.ctx.createBiquadFilter();

    droneOsc.type = 'triangle';
    droneOsc.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3 warm root
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(250, this.ctx.currentTime);
    droneGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.masterGain);
    droneOsc.start();
    this.activeNodes.push(droneOsc, droneGain, droneFilter);

    // Procedural flute player
    const playNote = () => {
      if (this.currentType !== 'flute' || !this.ctx || !this.masterGain) return;

      const freq = scale[Math.floor(Math.random() * scale.length)];
      const duration = 2.0 + Math.random() * 2.5;
      const now = this.ctx.currentTime;

      // Primary tone (sine + soft harmonics)
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Vibrato LFO (5.2 Hz gentle vibrato)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5.2 + (Math.random() * 0.6 - 0.3), now);
      lfoGain.gain.setValueAtTime(3.5, now);
      lfo.connect(osc.frequency);
      lfo.connect(osc2.frequency);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now); // soft 2nd harmonic octave

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 3, now);
      filter.Q.setValueAtTime(1.8, now);

      // Flute envelope: Soft breath attack -> sustain with vibrato -> gentle decay
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.16, now + 0.35);
      noteGain.gain.setValueAtTime(0.16, now + duration * 0.6);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.masterGain);

      lfo.start(now);
      osc.start(now);
      osc2.start(now);

      lfo.stop(now + duration + 0.1);
      osc.stop(now + duration + 0.1);
      osc2.stop(now + duration + 0.1);

      // Schedule next note in musical spacing
      const nextDelay = (duration * 0.8 + 1.0 + Math.random() * 2.2) * 1000;
      const timeoutId = window.setTimeout(playNote, nextDelay);
      this.activeTimeouts.push(timeoutId);
    };

    playNote();
  }

  // --- 2. 🐦 MELODIOUS BIRDS & MORNING FOREST ---
  private startMelodiousBirds() {
    if (!this.ctx || !this.masterGain) return;

    // Ambient forest breeze (gentle pink noise)
    const noiseBuffer = this.createPinkNoiseBuffer();
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const breezeFilter = this.ctx.createBiquadFilter();
    breezeFilter.type = 'lowpass';
    breezeFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

    const breezeGain = this.ctx.createGain();
    breezeGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    noiseSource.connect(breezeFilter);
    breezeFilter.connect(breezeGain);
    breezeGain.connect(this.masterGain);
    noiseSource.start();
    this.activeNodes.push(noiseSource, breezeFilter, breezeGain);

    // Realistic bird call generator
    const playBirdPhrase = () => {
      if (this.currentType !== 'birds' || !this.ctx || !this.masterGain) return;

      const numChirps = 2 + Math.floor(Math.random() * 4);
      const baseFreq = 2600 + Math.random() * 1200;
      let delayOffset = 0;

      for (let i = 0; i < numChirps; i++) {
        const chirpDelay = delayOffset;
        const chirpTimeout = window.setTimeout(() => {
          if (this.currentType !== 'birds' || !this.ctx || !this.masterGain) return;

          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const chirpGain = this.ctx.createGain();
          const chirpDuration = 0.08 + Math.random() * 0.09;

          osc.type = 'sine';
          // Pitch sweep (up-down chirping warble)
          const sweepPeak = baseFreq + 400 + Math.random() * 600;
          osc.frequency.setValueAtTime(baseFreq, now);
          osc.frequency.exponentialRampToValueAtTime(sweepPeak, now + chirpDuration * 0.4);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.85, now + chirpDuration);

          // Fast chirp envelope
          chirpGain.gain.setValueAtTime(0.0001, now);
          chirpGain.gain.linearRampToValueAtTime(0.09, now + 0.02);
          chirpGain.gain.exponentialRampToValueAtTime(0.0001, now + chirpDuration);

          osc.connect(chirpGain);
          chirpGain.connect(this.masterGain);

          osc.start(now);
          osc.stop(now + chirpDuration + 0.05);
        }, chirpDelay * 1000);

        this.activeTimeouts.push(chirpTimeout);
        delayOffset += 0.12 + Math.random() * 0.18;
      }

      // Schedule next bird song
      const nextSongDelay = (2.5 + Math.random() * 4.5) * 1000;
      const timeoutId = window.setTimeout(playBirdPhrase, nextSongDelay);
      this.activeTimeouts.push(timeoutId);
    };

    playBirdPhrase();
  }

  // --- 3. 🧠 ALPHA WAVES & CONCENTRATION DRONE (432Hz + 10Hz Binaural) ---
  private startAlphaWaves() {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // 432Hz fundamental with 10Hz alpha difference (432Hz vs 442Hz)
    const baseFreq = 432;
    const alphaDifference = 10; // 10 Hz Alpha Wave (Cognitive flow & relaxed alertness)

    const oscLeft = this.ctx.createOscillator();
    const oscRight = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();

    const merger = this.ctx.createChannelMerger(2);
    const gainLeft = this.ctx.createGain();
    const gainRight = this.ctx.createGain();
    const subGain = this.ctx.createGain();
    const lowpass = this.ctx.createBiquadFilter();

    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(baseFreq, now);

    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(baseFreq + alphaDifference, now);

    // 108Hz sub harmonic for warmth
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(108, now);

    gainLeft.gain.setValueAtTime(0.12, now);
    gainRight.gain.setValueAtTime(0.12, now);
    subGain.gain.setValueAtTime(0.08, now);

    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(600, now);

    oscLeft.connect(gainLeft);
    gainLeft.connect(merger, 0, 0); // Left ear

    oscRight.connect(gainRight);
    gainRight.connect(merger, 0, 1); // Right ear

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    merger.connect(lowpass);
    lowpass.connect(this.masterGain);

    oscLeft.start(now);
    oscRight.start(now);
    subOsc.start(now);

    this.activeNodes.push(oscLeft, oscRight, subOsc, gainLeft, gainRight, subGain, merger, lowpass);
  }

  // --- 4. 🌧️ GENTLE RAIN ---
  private startRain() {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createPinkNoiseBuffer();
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.masterGain);

    noiseSource.start();
    this.activeNodes.push(noiseSource, filter, rainGain);
  }

  public play(type: AmbientSoundType, volume = 0.35) {
    this.stop();
    if (type === 'off') return;

    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.currentType = type;
    this.masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);

    if (type === 'flute') {
      this.startMelodiousFlute();
    } else if (type === 'birds') {
      this.startMelodiousBirds();
    } else if (type === 'alpha') {
      this.startAlphaWaves();
    } else if (type === 'rain') {
      this.startRain();
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public stop() {
    this.activeTimeouts.forEach((t) => clearTimeout(t));
    this.activeIntervals.forEach((i) => clearInterval(i));
    this.activeTimeouts = [];
    this.activeIntervals = [];

    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {}
    });
    this.activeNodes = [];
    this.currentType = 'off';
  }

  public isPlaying(): boolean {
    return this.currentType !== 'off';
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }
}

export const ambientAudio = new AmbientAudioManager();
