/**
 * Native Web Audio API ambient noise generator.
 * Zero external audio files required. Generates smooth pink noise, rainfall, and gentle waves.
 */

class AmbientAudioManager {
  private ctx: AudioContext | null = null;
  private currentType: 'rain' | 'whitenoise' | 'waves' | null = null;
  private gainNode: GainNode | null = null;
  private noiseSource: AudioNode | null = null;
  private filterNode: BiquadFilterNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Create a 5-second buffer of pink noise
  private createPinkNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    const bufferSize = this.ctx.sampleRate * 5;
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
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  public play(type: 'rain' | 'whitenoise' | 'waves', volume = 0.3) {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.currentType = type;
    const buffer = this.createPinkNoiseBuffer();
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);

    if (type === 'rain') {
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(1000, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(1.5, this.ctx.currentTime);
    } else if (type === 'whitenoise') {
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(3200, this.ctx.currentTime);
    } else if (type === 'waves') {
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.setValueAtTime(500, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(2.0, this.ctx.currentTime);
    }

    source.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    source.start();
    this.noiseSource = source;
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public stop() {
    if (this.noiseSource) {
      try {
        (this.noiseSource as AudioBufferSourceNode).stop();
        this.noiseSource.disconnect();
      } catch {}
      this.noiseSource = null;
    }
    this.currentType = null;
  }

  public isPlaying(): boolean {
    return this.currentType !== null;
  }

  public getCurrentType() {
    return this.currentType;
  }
}

export const ambientAudio = new AmbientAudioManager();
