import { CONST } from "../config/constants.js";
import { isIOSDevice } from "../utils/platform.js";
import { getAudio, SFX, toPublicAssetPath } from "./assets.js";

export class AudioManager {
  constructor() {
    this.master = CONST.AUDIO.MasterDefault;
    this.sfx = CONST.AUDIO.SfxDefault;
    this.music = CONST.AUDIO.MusicDefault;
    this.muted = false;
    this.audioEnabled = true;
    this.musicEnabled = true;
    this.lastMasterLevel = this.master;
    this.lastMusicLevel = this.music;
    this.lastSfxLevel = this.sfx;
    this.currentTrack = null;
    this.activeAudioNodes = new Set();
    this.musicRequestId = 0;
    this.pendingMusicNode = null;
    this.pendingMusicCleanup = null;
    this.iosConservativeAudio = isIOSDevice();
    this.useWebAudioForSfx = this.iosConservativeAudio;
    this.lastSfxStartedAt = new Map();
    this.audioContext = null;
    this.sfxGainNode = null;
    this.sfxBufferCache = new Map();
    this.sfxBufferLoads = new Map();
    this.activeBufferedSfx = new Set();
    this.sfxWarmPromise = null;
  }

  hasAudibleChannelLevel() {
    return this.music > 0.001 || this.sfx > 0.001;
  }

  isMuted() {
    return (
      Boolean(this.muted) ||
      this.master <= 0.001 ||
      !this.hasAudibleChannelLevel()
    );
  }

  getEffectiveMasterLevel() {
    return this.isMuted() ? 0 : this.master;
  }

  isAudioEnabled() {
    return !this.isMuted();
  }

  isMusicEnabled() {
    // Backward-compatible alias: gameplay UI uses this method for the top-right
    // audio button state, which now controls all audio.
    return this.isAudioEnabled();
  }

  getAudioContextConstructor() {
    if (typeof window === "undefined") return null;
    return window.AudioContext || window.webkitAudioContext || null;
  }

  async ensureUnlocked() {
    if (!this.useWebAudioForSfx) return null;
    const AudioContextCtor = this.getAudioContextConstructor();
    if (!AudioContextCtor) return null;
    if (!this.audioContext) {
      this.audioContext = new AudioContextCtor({ latencyHint: "interactive" });
      this.sfxGainNode = this.audioContext.createGain();
      this.sfxGainNode.connect(this.audioContext.destination);
      this.syncWebAudioState();
    }
    if (this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
      } catch {}
    }
    this.syncWebAudioState();
    return this.audioContext;
  }

  primeAudioElement(audioNode) {
    if (!audioNode) return;
    audioNode.preload = "metadata";
    try {
      audioNode.playsInline = true;
    } catch {}
    audioNode.setAttribute?.("playsinline", "");
    audioNode.setAttribute?.("webkit-playsinline", "");
  }

  registerNode(audioNode, type = "sfx") {
    if (!audioNode) return;
    this.primeAudioElement(audioNode);
    this.activeAudioNodes.add(audioNode);
    this.applyNodeState(audioNode, type);
    const cleanup = () => {
      this.activeAudioNodes.delete(audioNode);
      audioNode.removeEventListener("ended", cleanup);
      audioNode.removeEventListener("error", cleanup);
    };
    audioNode.addEventListener("ended", cleanup, { once: true });
    audioNode.addEventListener("error", cleanup, { once: true });
  }

  applyNodeState(audioNode, type = "sfx") {
    if (!audioNode) return;
    const effectiveMaster = this.getEffectiveMasterLevel();
    audioNode.muted = this.isMuted();
    const vol =
      type === "music"
        ? effectiveMaster * this.music
        : effectiveMaster * this.sfx;
    audioNode.volume = Math.max(0, Math.min(1, vol));
  }

  syncActiveAudioState() {
    this.activeAudioNodes.forEach((node) => {
      if (!node) return;
      const nodeType = node === this.currentTrack ? "music" : "sfx";
      this.applyNodeState(node, nodeType);
    });
    if (this.currentTrack) {
      this.applyNodeState(this.currentTrack, "music");
    }
    this.syncWebAudioState();
  }

  syncWebAudioState() {
    if (!this.audioContext || !this.sfxGainNode) return;
    const gainValue =
      !this.isMuted() && this.sfx > 0.001
        ? Math.max(0, Math.min(1, this.master * this.sfx))
        : 0;
    const now = this.audioContext.currentTime;
    try {
      this.sfxGainNode.gain.cancelScheduledValues(now);
      this.sfxGainNode.gain.setValueAtTime(gainValue, now);
    } catch {
      this.sfxGainNode.gain.value = gainValue;
    }
  }

  syncLegacyAudioFlags() {
    const enabled = !this.isMuted();
    this.audioEnabled = enabled;
    this.musicEnabled = enabled;
    return enabled;
  }

  restoreChannelLevelsIfNeeded() {
    if (this.music <= 0.001) {
      this.music =
        Number.isFinite(this.lastMusicLevel) && this.lastMusicLevel > 0
          ? this.lastMusicLevel
          : CONST.AUDIO.MusicDefault;
    }
    if (this.sfx <= 0.001) {
      this.sfx =
        Number.isFinite(this.lastSfxLevel) && this.lastSfxLevel > 0
          ? this.lastSfxLevel
          : CONST.AUDIO.SfxDefault;
    }
  }

  restoreAudibleMasterLevel() {
    const restoredMaster =
      Number.isFinite(this.lastMasterLevel) && this.lastMasterLevel > 0
        ? this.lastMasterLevel
        : CONST.AUDIO.MasterDefault;
    this.master = restoredMaster;
    return restoredMaster;
  }

  setMuted(muted) {
    const nextMuted = Boolean(muted);
    if (nextMuted) {
      if (this.master > 0.001) {
        this.lastMasterLevel = this.master;
      }
      if (this.music > 0.001) {
        this.lastMusicLevel = this.music;
      }
      if (this.sfx > 0.001) {
        this.lastSfxLevel = this.sfx;
      }
      this.muted = true;
      this.syncLegacyAudioFlags();
      this.syncActiveAudioState();
      return this.isAudioEnabled();
    }

    if (this.master <= 0.001) {
      this.restoreAudibleMasterLevel();
    }
    this.restoreChannelLevelsIfNeeded();
    this.muted = false;
    const enabled = this.syncLegacyAudioFlags();
    this.syncActiveAudioState();
    if (enabled && this.currentTrack?.paused) {
      this.currentTrack.play().catch(() => {});
    }
    return enabled;
  }

  toggleMuted() {
    return this.setMuted(!this.isMuted());
  }

  setAudioEnabled(enabled) {
    return this.setMuted(!enabled);
  }

  toggleAudioEnabled() {
    return this.toggleMuted();
  }

  setMusicEnabled(enabled) {
    return this.setAudioEnabled(enabled);
  }

  toggleMusicEnabled() {
    return this.toggleAudioEnabled();
  }

  setMasterLevel(level) {
    const next = Math.max(0, Math.min(1, Number(level) || 0));
    if (next > 0.001) {
      this.lastMasterLevel = next;
    }

    this.master = next;

    if (next <= 0.001) {
      this.muted = true;
      this.syncLegacyAudioFlags();
      this.syncActiveAudioState();
      return false;
    }

    this.restoreChannelLevelsIfNeeded();
    this.muted = false;
    const enabled = this.syncLegacyAudioFlags();
    this.syncActiveAudioState();
    if (enabled && this.currentTrack?.paused) {
      this.currentTrack.play().catch(() => {});
    }
    return enabled;
  }

  stepMasterLevel(delta, step = 0.1) {
    const direction = Math.sign(Number(delta) || 0);
    if (direction === 0) return this.isAudioEnabled();
    const size = Math.max(0.01, Math.min(1, Number(step) || 0.1));
    const current = this.getEffectiveMasterLevel();
    const next = Math.max(0, Math.min(1, current + direction * size));
    return this.setMasterLevel(next);
  }

  clearPendingMusicStart() {
    if (typeof this.pendingMusicCleanup === "function") {
      this.pendingMusicCleanup();
    }
    this.pendingMusicCleanup = null;
    if (this.pendingMusicNode && this.pendingMusicNode !== this.currentTrack) {
      try {
        this.pendingMusicNode.pause();
      } catch {}
      try {
        this.pendingMusicNode.currentTime = 0;
      } catch {}
      this.activeAudioNodes.delete(this.pendingMusicNode);
    }
    this.pendingMusicNode = null;
  }

  stopMusic(resetPosition = true) {
    this.musicRequestId += 1;
    this.clearPendingMusicStart();
    if (!this.currentTrack) return;
    this.currentTrack.pause();
    if (resetPosition) {
      this.currentTrack.currentTime = 0;
    }
    this.activeAudioNodes.delete(this.currentTrack);
    this.currentTrack = null;
  }

  resolveSfxPath(input) {
    if (!input) return "";
    if (typeof input === "string") {
      return String(SFX[input] || input).trim();
    }
    return this.getSfxKey(input);
  }

  loadSfx(nameOrPath) {
    const path = this.resolveSfxPath(nameOrPath);
    if (!path) return null;
    return getAudio(path);
  }

  getSfxKey(audioNode) {
    const raw = audioNode?.currentSrc || audioNode?.src || "";
    return String(raw || "").trim();
  }

  getActiveSfxCount() {
    let count = this.activeBufferedSfx.size;
    this.activeAudioNodes.forEach((node) => {
      if (!node || node === this.currentTrack) return;
      if (!node.paused && !node.ended) count += 1;
    });
    return count;
  }

  async decodeAudioData(arrayBuffer) {
    if (!this.audioContext || !arrayBuffer) return null;
    return new Promise((resolve, reject) => {
      let settled = false;
      const finishResolve = (buffer) => {
        if (settled) return;
        settled = true;
        resolve(buffer);
      };
      const finishReject = (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };
      try {
        const result = this.audioContext.decodeAudioData(
          arrayBuffer.slice(0),
          finishResolve,
          finishReject,
        );
        if (result && typeof result.then === "function") {
          result.then(finishResolve, finishReject);
        }
      } catch (error) {
        finishReject(error);
      }
    });
  }

  async loadSfxBuffer(nameOrPath) {
    const path = this.resolveSfxPath(nameOrPath);
    if (!path || !this.useWebAudioForSfx) return null;
    if (this.sfxBufferCache.has(path)) {
      return this.sfxBufferCache.get(path);
    }
    if (this.sfxBufferLoads.has(path)) {
      return this.sfxBufferLoads.get(path);
    }
    const loadPromise = this.ensureUnlocked()
      .then(async (ctx) => {
        if (!ctx) return null;
        const response = await fetch(toPublicAssetPath(path), {
          cache: "force-cache",
        });
        if (!response.ok) return null;
        const bytes = await response.arrayBuffer();
        if (!bytes || !bytes.byteLength) return null;
        const decoded = await this.decodeAudioData(bytes);
        if (decoded) {
          this.sfxBufferCache.set(path, decoded);
        }
        return decoded;
      })
      .catch(() => null)
      .finally(() => {
        this.sfxBufferLoads.delete(path);
      });
    this.sfxBufferLoads.set(path, loadPromise);
    return loadPromise;
  }

  startBufferedSfx(buffer, startOffsetSec = 0) {
    if (!buffer || !this.audioContext || !this.sfxGainNode) return false;
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.sfxGainNode);
    this.activeBufferedSfx.add(source);
    source.onended = () => {
      this.activeBufferedSfx.delete(source);
    };
    const offset = Number(startOffsetSec);
    const safeOffset =
      Number.isFinite(offset) && offset > 0 && buffer.duration > offset + 0.01
        ? offset
        : 0;
    try {
      source.start(0, safeOffset);
      return true;
    } catch {
      this.activeBufferedSfx.delete(source);
      return false;
    }
  }

  warmSfx(namesOrPaths = []) {
    if (!this.useWebAudioForSfx) return Promise.resolve([]);
    const targets = [
      ...new Set(
        (namesOrPaths || [])
          .map((value) => this.resolveSfxPath(value))
          .filter(Boolean),
      ),
    ];
    if (targets.length === 0) return Promise.resolve([]);
    this.sfxWarmPromise = this.ensureUnlocked()
      .then((ctx) => {
        if (!ctx) return [];
        return Promise.all(targets.map((path) => this.loadSfxBuffer(path)));
      })
      .catch(() => []);
    return this.sfxWarmPromise.finally(() => {
      this.sfxWarmPromise = null;
    });
  }

  playSfx(audioNode, startOffsetSec = 0) {
    if (!audioNode) return;
    if (this.isMuted() || this.sfx <= 0.001) return;
    const path = this.resolveSfxPath(audioNode);
    const requestedOffset = Number(startOffsetSec);
    if (this.iosConservativeAudio) {
      const now =
        typeof performance !== "undefined" && Number.isFinite(performance.now())
          ? performance.now()
          : Date.now();
      const key = path || this.getSfxKey(audioNode);
      const minGapMs = 90;
      if (key) {
        const lastStart = this.lastSfxStartedAt.get(key) || 0;
        if (now - lastStart < minGapMs) return;
      }
      if (this.getActiveSfxCount() >= 2) return;
      if (key) this.lastSfxStartedAt.set(key, now);
    }
    if (this.useWebAudioForSfx && path) {
      const cachedBuffer = this.sfxBufferCache.get(path);
      if (cachedBuffer && this.startBufferedSfx(cachedBuffer, requestedOffset)) {
        return;
      }
      // Warm the buffer in the background; if it is not ready yet, fall back
      // to HTMLAudio for this play so audio still works everywhere.
      void this.loadSfxBuffer(path);
    }
    this.registerNode(audioNode, "sfx");
    audioNode.volume = Math.max(
      0,
      Math.min(1, this.getEffectiveMasterLevel() * this.sfx),
    );
    const safeOffset =
      Number.isFinite(requestedOffset) &&
      requestedOffset > 0 &&
      Number.isFinite(audioNode.duration) &&
      audioNode.duration > requestedOffset + 0.01
        ? requestedOffset
        : 0;
    audioNode.currentTime = safeOffset;
    audioNode.play().catch(() => {});
  }

  crossfadeTo(audioNode, durationOverrideSec = null) {
    if (!audioNode) return;
    const requestId = ++this.musicRequestId;
    this.clearPendingMusicStart();
    this.pendingMusicNode = audioNode;
    audioNode.loop = true;
    this.registerNode(audioNode, "music");
    audioNode.volume = 0;
    const from =
      this.currentTrack && this.currentTrack !== audioNode
        ? this.currentTrack
        : null;
    if (from) {
      this.registerNode(from, "music");
    }
    let crossfadeStarted = false;
    let unlockListenersAttached = false;
    let readyTimeoutId = null;
    const retryEvents = [
      "pointerdown",
      "pointerup",
      "keydown",
      "touchstart",
      "touchend",
      "mousedown",
      "click",
    ];
    const isStale = () => requestId !== this.musicRequestId;

    const releasePendingStart = () => {
      if (this.pendingMusicCleanup === cleanupPendingStart) {
        this.pendingMusicCleanup = null;
      }
      if (this.pendingMusicNode === audioNode) {
        this.pendingMusicNode = null;
      }
    };

    const removeUnlockRetryListeners = () => {
      if (!unlockListenersAttached) return;
      unlockListenersAttached = false;
      if (typeof window !== "undefined") {
        retryEvents.forEach((eventName) => {
          window.removeEventListener(eventName, unlockAndRetry);
        });
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityRetry);
      }
    };

    const addUnlockRetryListeners = () => {
      if (unlockListenersAttached) return;
      unlockListenersAttached = true;
      if (typeof window !== "undefined") {
        retryEvents.forEach((eventName) => {
          window.addEventListener(eventName, unlockAndRetry);
        });
      }
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", onVisibilityRetry);
      }
    };

    const onReady = () => {
      audioNode.removeEventListener("canplaythrough", onReady);
      audioNode.removeEventListener("canplay", onReady);
      audioNode.removeEventListener("loadeddata", onReady);
      audioNode.removeEventListener("error", onReady);
      if (readyTimeoutId !== null) {
        clearTimeout(readyTimeoutId);
        readyTimeoutId = null;
      }
      if (isStale()) return;
      tryStartPlayback();
    };

    const cleanupPendingStart = () => {
      removeUnlockRetryListeners();
      audioNode.removeEventListener("canplaythrough", onReady);
      audioNode.removeEventListener("canplay", onReady);
      audioNode.removeEventListener("loadeddata", onReady);
      audioNode.removeEventListener("error", onReady);
      if (readyTimeoutId !== null) {
        clearTimeout(readyTimeoutId);
        readyTimeoutId = null;
      }
    };

    this.pendingMusicCleanup = cleanupPendingStart;

    const startCrossfade = () => {
      if (crossfadeStarted || isStale()) return;
      crossfadeStarted = true;
      removeUnlockRetryListeners();
      releasePendingStart();
      const configuredDuration = Number(durationOverrideSec);
      const duration = Number.isFinite(configuredDuration)
        ? Math.max(0.01, configuredDuration)
        : CONST.AUDIO.CrossfadeSeconds;
      const start = performance.now();

      const tick = (now) => {
        if (isStale()) return;
        const t = Math.min(1, (now - start) / (duration * 1000));
        const effectiveMaster = this.getEffectiveMasterLevel();
        audioNode.volume = Math.max(
          0,
          Math.min(1, t * effectiveMaster * this.music),
        );
        audioNode.muted = this.isMuted();
        if (from) {
          from.volume = Math.max(
            0,
            Math.min(1, (1 - t) * effectiveMaster * this.music),
          );
        }
        if (from) from.muted = this.isMuted();
        if (t < 1) {
          requestAnimationFrame(tick);
        } else if (from) {
          from.pause();
          this.activeAudioNodes.delete(from);
        }
      };

      requestAnimationFrame(tick);
      this.currentTrack = audioNode;
    };

    const tryStartPlayback = () => {
      if (crossfadeStarted || isStale()) return;
      audioNode
        .play()
        .then(() => {
          if (isStale()) {
            audioNode.pause();
            return;
          }
          startCrossfade();
        })
        .catch(() => {
          if (isStale()) return;
          // Keep retry hooks active; autoplay and background-tab pauses can be transient.
          addUnlockRetryListeners();
        });
    };

    const runWhenReady = (fn) => {
      if (isStale()) return;
      if (audioNode.readyState >= 2) {
        fn();
        return;
      }
      audioNode.addEventListener("canplaythrough", onReady, { once: true });
      audioNode.addEventListener("canplay", onReady, { once: true });
      audioNode.addEventListener("loadeddata", onReady, { once: true });
      audioNode.addEventListener("error", onReady, { once: true });
      readyTimeoutId = setTimeout(() => {
        onReady();
      }, 2000);
    };

    const onVisibilityRetry = () => {
      if (isStale()) {
        removeUnlockRetryListeners();
        return;
      }
      if (typeof document === "undefined") return;
      if (document.visibilityState !== "visible") return;
      unlockAndRetry();
    };

    const unlockAndRetry = () => {
      if (isStale()) {
        removeUnlockRetryListeners();
        return;
      }
      if (crossfadeStarted) {
        removeUnlockRetryListeners();
        return;
      }
      if (audioNode === this.currentTrack && !audioNode.paused) {
        removeUnlockRetryListeners();
        return;
      }
      tryStartPlayback();
    };

    runWhenReady(tryStartPlayback);

    // Browser autoplay policies may block music until first user interaction.
    addUnlockRetryListeners();
  }
}
