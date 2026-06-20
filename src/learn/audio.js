// AxoLearn v2 — audio engine: voice characters + playful tones
const AxoAudio = (function () {
  // Each teacher character = a different voice. We vary pitch/rate AND try to
  // map each character to a different installed system voice when available.
  const characters = [
    {
      id: "axo", name: "Axo", kind: "axolotl",
      color: "#fb7185", skin: "#ffd5dc",
      pitch: 1.3, rate: 0.66, voiceIndex: 0,
      sample: "Hi! I am Axo! Let's learn together!",
    },
    {
      id: "coco", name: "Coco", kind: "bunny",
      color: "#a78bfa", skin: "#ede9fe",
      pitch: 1.65, rate: 0.72, voiceIndex: 1,
      sample: "Hello hello! I am Coco the bunny!",
    },
    {
      id: "bruno", name: "Bruno", kind: "bear",
      color: "#d97706", skin: "#fde68a",
      pitch: 0.78, rate: 0.6, voiceIndex: 2,
      sample: "Hi friend! I am Bruno the bear!",
    },
    {
      id: "beep", name: "Beep", kind: "robot",
      color: "#0ea5e9", skin: "#bae6fd",
      pitch: 1.05, rate: 0.56, voiceIndex: 3,
      sample: "Beep boop! I am Beep the robot!",
    },
  ];

  let currentId = "axo";
  let englishVoices = [];

  function refreshVoices() {
    if (!("speechSynthesis" in window)) return;
    const all = window.speechSynthesis.getVoices() || [];
    englishVoices = all.filter((v) => /^en/i.test(v.lang));
    if (!englishVoices.length) englishVoices = all;
  }
  if ("speechSynthesis" in window) {
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }

  function getCharacter(id) {
    return characters.find((c) => c.id === (id || currentId)) || characters[0];
  }

  function makeRhythmic(text) {
    return text.replace(/^([A-Z]) for (.+)!?$/, "$1... for... $2!");
  }

  // Pre-recorded clips (same-origin /audio/) — PREFERRED when a clip exists for
  // the exact line, so the core lessons/feedback play reliably even on devices
  // where browser TTS is muted or has no voice. Loaded once; absent in dev.
  let clipMap = null;
  // One reusable audio element: iOS unlocks it once (in the welcome gesture),
  // then we just swap its src — far more reliable than a fresh Audio() per clip.
  let clipAudio = null;
  const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
  function getClipAudio() {
    if (!clipAudio) {
      try { clipAudio = new Audio(); clipAudio.preload = "auto"; } catch (e) { /* ignore */ }
    }
    return clipAudio;
  }
  function loadClips() {
    if (typeof fetch !== "function") return;
    fetch("/audio/manifest.json", { cache: "force-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && d.clips) clipMap = d.clips; })
      .catch(() => { /* no clips — TTS only */ });
  }
  loadClips();

  function ttsSpeak(text, opts) {
    if (!("speechSynthesis" in window)) return;
    const c = getCharacter(opts.characterId);
    // Only cancel when something is actually queued/speaking — an unconditional
    // cancel() right before speak() drops the FIRST utterance on Safari/iOS.
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(makeRhythmic(text));
    u.rate = opts.rate ?? c.rate;
    u.pitch = c.pitch;
    if (englishVoices.length) {
      u.voice = englishVoices[c.voiceIndex % englishVoices.length];
    }
    window.speechSynthesis.speak(u);
  }

  function speak(text, opts = {}) {
    if (!text) return;
    // Mirror to a screen-reader live region (works even if audio is unavailable).
    // Callers can target a dedicated region via opts.liveId — e.g. a quiz clue
    // uses its own region so transient feedback ("Good try!") doesn't clobber it.
    try {
      const live = document.getElementById(opts.liveId || "axo-live");
      if (live) live.textContent = text;
    } catch (e) { /* ignore */ }
    // Prefer a pre-recorded clip; fall back to TTS if none / if playback is blocked.
    const file = clipMap && clipMap[text];
    const a = file && getClipAudio();
    if (a) {
      try {
        stopSpeaking();
        a.muted = false;
        a.src = "/audio/" + file;
        const p = a.play();
        if (p && p.catch) p.catch(() => ttsSpeak(text, opts));
        return;
      } catch (e) { /* fall through to TTS */ }
    }
    ttsSpeak(text, opts);
  }

  function stopSpeaking() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (clipAudio) { try { clipAudio.pause(); } catch (e) { /* ignore */ } }
  }

  // ── Tones ──────────────────────────────────────────────────────────────────
  let ctx = null;
  const frequencies = {
    pop: [420, 680], chime: [620, 880], success: [523, 659, 784],
    crunch: [160, 90], bounce: [180, 360], meow: [520, 420], bark: [180, 140],
    trumpet: [220, 330], bubble: [300, 520], whoosh: [180, 80], roar: [120, 90],
    twinkle: [700, 980], chirp: [760, 920], sparkle: [820, 1040], hop: [260, 520],
    shine: [640, 840], rustle: [210, 170], rain: [480, 360], beep: [440, 440],
    splash: [190, 310], notes: [523, 659], spin: [500, 300],
    celebrate: [523, 659, 784, 1046],
    neigh: [440, 300, 520], baa: [360, 300], howl: [300, 600, 400], oink: [220, 280],
  };

  function playTone(type = "pop") {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      const notes = frequencies[type] ?? frequencies.pop;
      osc.type = ["roar", "crunch", "rustle"].includes(type) ? "sawtooth" : "sine";
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      osc.frequency.setValueAtTime(notes[0], now);
      notes.slice(1).forEach((note, i) => {
        osc.frequency.exponentialRampToValueAtTime(note, now + 0.12 + i * 0.09);
      });
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) { /* audio unavailable */ }
  }

  // Must be called from a user gesture (e.g. the welcome tap) so mobile browsers
  // allow audio: resumes the WebAudio context and primes speech synthesis so the
  // first spoken lesson line isn't silently dropped.
  function unlock() {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
    } catch (e) { /* ignore */ }
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.resume();
        const u = new SpeechSynthesisUtterance(" ");
        u.volume = 0;
        window.speechSynthesis.speak(u);
        refreshVoices();
      }
    } catch (e) { /* ignore */ }
    // Prime the reusable clip element inside the user gesture (play a silent
    // sound) so iOS lets us swap its src and play real clips later.
    try {
      const a = getClipAudio();
      if (a) {
        a.src = SILENT_WAV;
        a.muted = true;
        const p = a.play();
        if (p && p.then) p.then(() => { a.pause(); a.muted = false; }).catch(() => {});
      }
    } catch (e) { /* ignore */ }
  }

  function hasVoice() {
    return "speechSynthesis" in window;
  }

  // Number of usable voices currently loaded (0 until the OS populates them, or
  // permanently 0 on some locked-down devices). Used to decide when to show a
  // no-audio visual fallback so a pre-reader is never stuck on a silent prompt.
  function voiceCount() {
    return englishVoices.length;
  }

  return {
    characters,
    getCharacter,
    setCharacter(id) { currentId = id; },
    get currentId() { return currentId; },
    speak,
    stopSpeaking,
    playTone,
    unlock,
    hasVoice,
    voiceCount,
  };
})();

export { AxoAudio };
export default AxoAudio;
