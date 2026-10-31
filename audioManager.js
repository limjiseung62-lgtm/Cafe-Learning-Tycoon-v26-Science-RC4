import { audioRegistry } from './audioRegistry.js';
export const audioPreferenceKey = 'cafe-learning-tycoon.audio.v1';
const clamp = (n, fallback) => typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
export function normalizeAudioPreferences(v = {}) { return { muted: v.muted === true, musicEnabled: v.musicEnabled !== false, effectsEnabled: v.effectsEnabled !== false, musicVolume: clamp(v.musicVolume, .22), effectsVolume: clamp(v.effectsVolume, .5) }; }
export class AudioManager {
    storage;
    factory;
    loader;
    now;
    preferences;
    unlocked = false;
    failures = 0;
    lastError = '';
    activeEffects = 0;
    effectsStarted = 0;
    musicStarted = 0;
    master = null;
    effectsBus = null;
    context = null;
    music = null;
    musicGain = null;
    buffers = new Map();
    cooldown = new Map();
    playing = false;
    duck = 1;
    constructor(storage = null, factory = () => { const C = globalThis.AudioContext ?? globalThis.webkitAudioContext; return C ? new C() : null; }, loader = fetch.bind(globalThis), now = () => performance.now() / 1000) {
        this.storage = storage;
        this.factory = factory;
        this.loader = loader;
        this.now = now;
        let data = {};
        try {
            data = JSON.parse(storage?.getItem(audioPreferenceKey) ?? '{}') ?? {};
        }
        catch { }
        this.preferences = normalizeAudioPreferences(data);
    }
    setPreferences(change) { this.preferences = normalizeAudioPreferences({ ...this.preferences, ...change }); try {
        this.storage?.setItem(audioPreferenceKey, JSON.stringify(this.preferences));
    }
    catch { } if (this.master && this.context) {
        this.master.gain.setTargetAtTime(this.preferences.muted ? 0 : 1, this.context.currentTime, .02);
        this.effectsBus.gain.setTargetAtTime(this.preferences.effectsEnabled ? this.preferences.effectsVolume : 0, this.context.currentTime, .02);
    } this.updateMusic(); if (this.playing && !this.music && !this.preferences.muted && this.preferences.musicEnabled)
        void this.startMusic(); }
    async unlock() { try {
        this.context ??= this.factory();
        if (!this.context)
            return false;
        if (!this.master) {
            this.master = this.context.createGain();
            this.master.gain.value = this.preferences.muted ? 0 : 1;
            this.master.connect(this.context.destination);
            this.effectsBus = this.context.createGain();
            this.effectsBus.gain.value = this.preferences.effectsEnabled ? this.preferences.effectsVolume : 0;
            this.effectsBus.connect(this.master);
        }
        await this.context.resume();
        this.unlocked = this.context.state === 'running';
        if (this.playing)
            void this.startMusic();
        return this.unlocked;
    }
    catch (error) {
        this.lastError = String(error);
        this.failures++;
        return false;
    } }
    buffer(file) { if (!this.buffers.has(file))
        this.buffers.set(file, (async () => { try {
            const response = await this.loader(file);
            if (!response.ok)
                throw Error('audio unavailable');
            return await this.context.decodeAudioData(await response.arrayBuffer());
        }
        catch (error) {
            this.lastError = String(error);
            this.failures++;
            return null;
        } })()); return this.buffers.get(file); }
    volume() { return this.preferences.muted || !this.preferences.musicEnabled ? 0 : this.preferences.musicVolume * this.duck; }
    updateMusic() { if (this.musicGain && this.context) {
        this.musicGain.gain.cancelScheduledValues(this.context.currentTime);
        this.musicGain.gain.setTargetAtTime(this.playing ? this.volume() : 0, this.context.currentTime, .12);
    } }
    setDucking(open) { const next = open ? .78 : 1; if (next === this.duck)
        return; this.duck = next; this.updateMusic(); }
    async startMusic() { this.playing = true; if (!this.unlocked || this.music || this.preferences.muted || !this.preferences.musicEnabled)
        return; const context = this.context, buffer = await this.buffer(audioRegistry.bgm_cafe.file); if (!context || !buffer || !this.playing || this.music)
        return; try {
        this.music = context.createBufferSource();
        this.music.buffer = buffer;
        this.music.loop = true;
        this.musicGain = context.createGain();
        this.musicGain.gain.value = this.volume();
        this.music.connect(this.musicGain);
        this.musicGain.connect(this.master);
        this.music.start();
        this.musicStarted++;
    }
    catch (error) {
        this.lastError = String(error);
        this.failures++;
        this.music = null;
    } }
    stopMusic() { this.playing = false; this.updateMusic(); const source = this.music, gain = this.musicGain; this.music = null; this.musicGain = null; if (source && this.context) {
        try {
            source.stop(this.context.currentTime + .6);
        }
        catch { }
        setTimeout(() => { try {
            source.disconnect();
            gain?.disconnect();
        }
        catch { } }, 700);
    } }
    async effect(id) { const pref = this.preferences, entry = audioRegistry[id], time = this.now(); if (!this.unlocked || pref.muted || !pref.effectsEnabled || pref.effectsVolume === 0 || this.activeEffects >= (["correct", "wrong", "levelup", "vip", "last-order", "close"].includes(id) ? 6 : 4) || time - (this.cooldown.get(id) ?? -Infinity) < entry.cooldown)
        return false; this.cooldown.set(id, time); this.activeEffects++; try {
        const buffer = await this.buffer(entry.file);
        if (!buffer || !this.context || this.preferences.muted || !this.preferences.effectsEnabled) {
            this.activeEffects--;
            return false;
        }
        const source = this.context.createBufferSource(), gain = this.context.createGain();
        source.buffer = buffer;
        gain.gain.value = entry.gain;
        source.connect(gain);
        gain.connect(this.effectsBus);
        let cleaned = false;
        const clean = () => { if (cleaned)
            return; cleaned = true; this.activeEffects--; source.disconnect(); gain.disconnect(); };
        source.onended = clean;
        source.start();
        this.effectsStarted++;
        setTimeout(clean, Math.ceil(buffer.duration * 1000) + 300);
        return true;
    }
    catch {
        this.activeEffects--;
        this.failures++;
        return false;
    } }
}
