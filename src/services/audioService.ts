/**
 * Web Audio & Sequential Speech Synthesis Service
 * Provides a polite railway-style announcer engine with guaranteed sequential queueing:
 * each audible alert completely finishes before the next begins.
 */

export type ChimeStyle = 'railway_3tone' | 'station_bell' | 'subtle_ping';
export type AnnouncerStyle = 'polite_railway' | 'modern_crisp' | 'urgent_kitchen';

export interface QueuedAlert {
  id: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: number;
}

export interface AudioSettings {
  voiceURI: string;
  announcerStyle: AnnouncerStyle;
  chimeStyle: ChimeStyle;
  rate: number;
  pitch: number;
  volume: number;
}

class AudioService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private queue: QueuedAlert[] = [];
  private isProcessing: boolean = false;
  private currentItem: QueuedAlert | null = null;
  private listeners: Set<() => void> = new Set();

  private settings: AudioSettings = {
    voiceURI: '',
    announcerStyle: 'polite_railway',
    chimeStyle: 'railway_3tone',
    rate: 0.94, // Polite measured cadence
    pitch: 0.98, // Warm tone
    volume: 0.85,
  };

  constructor() {
    try {
      const savedMute = localStorage.getItem('store_alerts_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
      const savedSettings = localStorage.getItem('store_alerts_audio_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch {
      // ignore
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem('store_alerts_audio_settings', JSON.stringify(this.settings));
    } catch {
      // ignore
    }
    this.notify();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem('store_alerts_muted', String(muted));
    } catch {
      // ignore
    }
    this.notify();
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getQueueState(): {
    queueLength: number;
    currentItem: QueuedAlert | null;
    isMuted: boolean;
  } {
    return {
      queueLength: this.queue.length,
      currentItem: this.currentItem,
      isMuted: this.isMuted,
    };
  }

  public clearQueue(): void {
    this.queue = [];
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isProcessing = false;
    this.currentItem = null;
    this.notify();
  }

  /**
   * Play the classic polite British Railway station chime (F4 -> A4 -> C5)
   */
  public playRailwayChime(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isMuted) return resolve();

      try {
        const ctx = this.getAudioContext();
        if (!ctx) return resolve();

        const now = ctx.currentTime;
        const volume = this.settings.volume;

        // British railway 3-tone chime: F4 (349.2Hz), A4 (440Hz), C5 (523.3Hz)
        const notes = [
          { freq: 349.23, start: 0.0, dur: 0.35 },
          { freq: 440.0, start: 0.22, dur: 0.38 },
          { freq: 523.25, start: 0.44, dur: 0.65 },
        ];

        notes.forEach(({ freq, start, dur }, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = idx === 2 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, now + start);

          // Envelope
          gain.gain.setValueAtTime(0.001, now + start);
          gain.gain.linearRampToValueAtTime(0.3 * volume, now + start + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + start);
          osc.stop(now + start + dur);
        });

        // Resolve after chime completes
        setTimeout(resolve, 850);
      } catch (e) {
        console.warn('Railway chime error:', e);
        resolve();
      }
    });
  }

  /**
   * Standard chime fallback
   */
  public playChime(priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'): Promise<void> {
    if (this.settings.chimeStyle === 'railway_3tone') {
      return this.playRailwayChime();
    }

    return new Promise((resolve) => {
      if (this.isMuted) return resolve();

      try {
        const ctx = this.getAudioContext();
        if (!ctx) return resolve();

        const now = ctx.currentTime;
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.01, now);
        gainNode.connect(ctx.destination);

        const freq1 = priority === 'urgent' ? 987.77 : priority === 'high' ? 880 : 784;
        const freq2 = priority === 'urgent' ? 1318.51 : priority === 'high' ? 1174.66 : 1046.5;

        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq1, now);
        gainNode.gain.linearRampToValueAtTime(0.25 * this.settings.volume, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc1.connect(gainNode);
        osc1.start(now);
        osc1.stop(now + 0.3);

        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq2, now + 0.12);
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0.01, now + 0.12);
        gain2.gain.linearRampToValueAtTime(0.3 * this.settings.volume, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
        gain2.connect(ctx.destination);
        osc2.connect(gain2);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.55);

        setTimeout(resolve, 600);
      } catch (e) {
        resolve();
      }
    });
  }

  /**
   * Enqueue an announcement. Guaranteed sequential playback:
   * each audible alert will completely finish before the next begins.
   */
  public speak(message: string, priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'): void {
    if (this.isMuted) return;

    const newAlert: QueuedAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      message,
      priority,
      createdAt: Date.now(),
    };

    if (priority === 'urgent') {
      // Place directly after current playing item
      this.queue.unshift(newAlert);
    } else {
      this.queue.push(newAlert);
    }

    this.notify();
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.isMuted || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.currentItem = this.queue.shift() || null;
    this.notify();

    if (!this.currentItem) {
      this.isProcessing = false;
      return;
    }

    const { message, priority } = this.currentItem;

    try {
      // 1. Play polite chime and wait for it to complete
      await this.playChime(priority);

      // 2. Play speech announcement and wait for speech end event
      await this.speakUtterance(message);
    } catch (err) {
      console.warn('Queue announcement error:', err);
    } finally {
      this.currentItem = null;
      this.notify();

      // Brief respectful pause (350ms) like in a railway broadcast before processing next alert
      setTimeout(() => {
        this.isProcessing = false;
        this.processQueue();
      }, 350);
    }
  }

  private speakUtterance(message: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return resolve();
      }

      try {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.volume = this.settings.volume;
        utterance.rate = this.settings.rate;
        utterance.pitch = this.settings.pitch;

        // Polite railway announcer voice selection (British en-GB)
        const voices = window.speechSynthesis.getVoices();

        let chosenVoice: SpeechSynthesisVoice | undefined;

        if (this.settings.voiceURI) {
          chosenVoice = voices.find((v) => v.voiceURI === this.settings.voiceURI);
        }

        if (!chosenVoice) {
          // Prioritize UK British voices for the authentic polite railway announcement
          const ukVoices = voices.filter(
            (v) =>
              v.lang === 'en-GB' ||
              v.name.includes('United Kingdom') ||
              v.name.includes('British') ||
              v.name.includes('English (UK)')
          );

          chosenVoice =
            ukVoices.find(
              (v) =>
                v.name.includes('Daniel') ||
                v.name.includes('Oliver') ||
                v.name.includes('George') ||
                v.name.includes('Natural') ||
                v.name.includes('Google')
            ) ||
            ukVoices[0] ||
            voices.find((v) => v.lang.startsWith('en')) ||
            voices[0];
        }

        if (chosenVoice) {
          utterance.voice = chosenVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error:', e);
          resolve();
        };

        // Safety timeout in case browser speech engine hangs (max 10s per announcement)
        const safetyTimer = setTimeout(() => {
          resolve();
        }, 10000);

        const originalOnEnd = utterance.onend;
        utterance.onend = (e) => {
          clearTimeout(safetyTimer);
          if (originalOnEnd) originalOnEnd.call(utterance, e);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('speakUtterance failed:', err);
        resolve();
      }
    });
  }

  /**
   * Helper to retrieve all available system voices
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices();
  }
}

export const audioService = new AudioService();
