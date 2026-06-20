const CONTROL_SCHEME_STORAGE_KEY = "axo_control_scheme";
const CUSTOM_BINDINGS_STORAGE_KEY = "axo_custom_bindings";

const CONTROL_SCHEMES = {
  dual_keyboard: {
    label: "DUAL KEYBOARD",
    description: "",
    bindings: [
      ["KeyA", "left"],
      ["KeyD", "right"],
      ["ArrowLeft", "left"],
      ["ArrowRight", "right"],
      ["KeyW", "lookUp"],
      ["KeyS", "lookDown"],
      ["ArrowUp", "lookUp"],
      ["ArrowDown", "lookDown"],
      ["Space", "jump"],
      ["ShiftLeft", "skill"],
      ["KeyF", "skill"],
      ["Enter", "skill"],
      ["Enter", "confirm"]
    ]
  },
  contra_panel: {
    label: "CONTRA PANEL",
    description: "Move with A/D or Arrows. Numpad = fire in that direction (8-way key panel).",
    bindings: [
      ["KeyA", "left"],
      ["KeyD", "right"],
      ["ArrowLeft", "left"],
      ["ArrowRight", "right"],
      ["KeyW", "lookUp"],
      ["KeyS", "lookDown"],
      ["ArrowUp", "lookUp"],
      ["ArrowDown", "lookDown"],
      ["Space", "jump"],
      ["ShiftLeft", "skill"],
      ["KeyF", "skill"],
      ["Enter", "skill"],
      ["Enter", "confirm"],
      ["Numpad8", "fireUp"],
      ["Numpad2", "fireDown"],
      ["Numpad4", "fireLeft"],
      ["Numpad6", "fireRight"],
      ["Numpad7", "fireUpLeft"],
      ["Numpad9", "fireUpRight"],
      ["Numpad1", "fireDownLeft"],
      ["Numpad3", "fireDownRight"]
    ]
  }
};

const DEFAULT_CONTROL_SCHEME = "dual_keyboard";

const BASE_KEY_BINDINGS = [
  ["ShiftRight", "skill"],
  ["Numpad8", "fireUp"],
  ["Numpad2", "fireDown"],
  ["Numpad4", "fireLeft"],
  ["Numpad6", "fireRight"],
  ["Numpad7", "fireUpLeft"],
  ["Numpad9", "fireUpRight"],
  ["Numpad1", "fireDownLeft"],
  ["Numpad3", "fireDownRight"],
  ["Escape", "pause"],
  ["KeyR", "restart"],
  ["Enter", "confirm"],
  ["Backspace", "back"]
];

const ACTIONS = [
  "left",
  "right",
  "lookUp",
  "lookDown",
  "jump",
  "attack",
  "abilityA",
  "abilityB",
  "skill",
  "fireUp",
  "fireDown",
  "fireLeft",
  "fireRight",
  "fireUpLeft",
  "fireUpRight",
  "fireDownLeft",
  "fireDownRight",
  "ultimate",
  "pause",
  "restart",
  "confirm",
  "back"
];

const REBINDABLE_ACTIONS = [
  "left",
  "right",
  "lookUp",
  "lookDown",
  "jump",
  "skill",
  "fireUp",
  "fireDown",
  "fireLeft",
  "fireRight",
  "fireUpLeft",
  "fireUpRight",
  "fireDownLeft",
  "fireDownRight"
];

const ACTION_LABELS = {
  left: "Move Left",
  right: "Move Right",
  lookUp: "Look Up",
  lookDown: "Look Down",
  jump: "Jump",
  skill: "Fire (aim with keys)",
  fireUp: "Fire Up",
  fireDown: "Fire Down",
  fireLeft: "Fire Left",
  fireRight: "Fire Right",
  fireUpLeft: "Fire Up-Left",
  fireUpRight: "Fire Up-Right",
  fireDownLeft: "Fire Down-Left",
  fireDownRight: "Fire Down-Right"
};

function clearLegacySettingsStorage() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(CONTROL_SCHEME_STORAGE_KEY);
    localStorage.removeItem(CUSTOM_BINDINGS_STORAGE_KEY);
  } catch {}
}

function normalizeSchemeId(value) {
  const id = String(value || "").trim();
  if (Object.prototype.hasOwnProperty.call(CONTROL_SCHEMES, id)) {
    return id;
  }
  return DEFAULT_CONTROL_SCHEME;
}

function addBindingToMap(map, code, action) {
  const list = map.get(code) || [];
  if (!list.includes(action)) {
    list.push(action);
    map.set(code, list);
  }
}

function removeActionFromMap(map, action) {
  for (const [code, actions] of map.entries()) {
    const next = actions.filter((a) => a !== action);
    if (next.length === 0) {
      map.delete(code);
      continue;
    }
    map.set(code, next);
  }
}

function createKeyActionMap(controlSchemeId, customBindings = {}) {
  const map = new Map();
  BASE_KEY_BINDINGS.forEach(([code, action]) => addBindingToMap(map, code, action));
  const scheme = CONTROL_SCHEMES[controlSchemeId] || CONTROL_SCHEMES[DEFAULT_CONTROL_SCHEME];
  scheme.bindings.forEach(([code, action]) => addBindingToMap(map, code, action));

  for (const [action, codes] of Object.entries(customBindings || {})) {
    if (!Array.isArray(codes) || codes.length === 0) continue;
    if (!REBINDABLE_ACTIONS.includes(action)) continue;
    removeActionFromMap(map, action);
    for (const code of codes) {
      if (!code) continue;
      addBindingToMap(map, code, action);
    }
  }

  return map;
}

function sanitizeCustomBindings(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  REBINDABLE_ACTIONS.forEach((action) => {
    const values = raw[action];
    if (!Array.isArray(values)) return;
    const clean = values
      .map((code) => String(code || "").trim())
      .filter((code) => code.length > 0);
    if (clean.length > 0) {
      out[action] = [...new Set(clean)];
    }
  });
  return out;
}

function formatKeyCode(code) {
  const labels = {
    ArrowLeft: "LEFT",
    ArrowRight: "RIGHT",
    ArrowUp: "UP",
    ArrowDown: "DOWN",
    KeyA: "A",
    KeyD: "D",
    KeyW: "W",
    KeyF: "F",
    KeyS: "S",
    Space: "SPACE",
    ShiftLeft: "SHIFT",
    ShiftRight: "SHIFT",
    Escape: "ESC",
    KeyR: "R",
    Enter: "ENTER",
    Backspace: "BACKSPACE",
    Numpad1: "NP1",
    Numpad2: "NP2",
    Numpad3: "NP3",
    Numpad4: "NP4",
    Numpad6: "NP6",
    Numpad7: "NP7",
    Numpad8: "NP8",
    Numpad9: "NP9"
  };
  return labels[code] || code;
}

export class InputManager {
  constructor() {
    clearLegacySettingsStorage();
    this.keyboardDown = new Set();
    this.gamepadDown = new Set();
    this.mouseDown = new Set();
    this.virtualDown = new Set();
    this.down = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.pointer = { x: 0, y: 0, clicked: false };
    this.touchAimDirection = { x: 0, y: 0 };
    this.onSettingsChanged = null;

    this.controlScheme = DEFAULT_CONTROL_SCHEME;
    this.customBindings = {};
    this.keyActions = createKeyActionMap(this.controlScheme, this.customBindings);

    window.addEventListener("keydown", (e) => {
      const actions = this.keyActions.get(e.code);
      if (!actions || actions.length === 0) return;
      actions.forEach((action) => this.beginAction(action, this.keyboardDown));
      if (!actions.includes("pause")) e.preventDefault();
    });

    window.addEventListener("keyup", (e) => {
      const actions = this.keyActions.get(e.code);
      if (!actions || actions.length === 0) return;
      actions.forEach((action) => this.endAction(action, this.keyboardDown));
      e.preventDefault();
    });

    window.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      const target = e.target;
      if (!(target instanceof HTMLElement) || target.id !== "gameCanvas") return;
      this.beginAction("attack", this.mouseDown);
      e.preventDefault();
    });

    window.addEventListener("mouseup", (e) => {
      if (e.button !== 0) return;
      this.endAction("attack", this.mouseDown);
    });

    window.addEventListener("blur", () => {
      this.clearAll();
    });

    window.addEventListener("focus", () => {
      // Prevent stuck keys when keyup was missed while the tab/window was inactive.
      this.clearAll();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") {
        this.clearAll();
      }
    });
  }

  getControlScheme() {
    return this.controlScheme;
  }

  getControlSchemeOptions() {
    return Object.entries(CONTROL_SCHEMES).map(([id, cfg]) => ({
      id,
      label: cfg.label,
      description: cfg.description
    }));
  }

  setSettingsChangeHandler(handler) {
    this.onSettingsChanged = typeof handler === "function" ? handler : null;
  }

  emitSettingsChanged() {
    if (typeof this.onSettingsChanged !== "function") return;
    this.onSettingsChanged(this.getSettingsSnapshot());
  }

  getSettingsSnapshot() {
    return {
      controlScheme: this.controlScheme,
      customBindings: sanitizeCustomBindings(this.customBindings)
    };
  }

  applySettingsSnapshot(settings = {}) {
    const nextSettings =
      settings && typeof settings === "object" && !Array.isArray(settings)
        ? settings
        : {};
    this.controlScheme = normalizeSchemeId(nextSettings.controlScheme);
    this.customBindings = sanitizeCustomBindings(nextSettings.customBindings);
    this.keyActions = createKeyActionMap(this.controlScheme, this.customBindings);
    this.clearAll();
  }

  setControlScheme(controlSchemeId) {
    const nextId = normalizeSchemeId(controlSchemeId);
    if (nextId === this.controlScheme) return false;
    this.controlScheme = nextId;
    this.keyActions = createKeyActionMap(this.controlScheme, this.customBindings);
    this.clearAll();
    this.emitSettingsChanged();
    return true;
  }

  getRebindableBindings() {
    return REBINDABLE_ACTIONS.map((action) => ({
      action,
      label: ACTION_LABELS[action] || action,
      keys: this.getCodesForAction(action).map((code) => formatKeyCode(code))
    }));
  }

  setCustomBinding(action, code) {
    if (!REBINDABLE_ACTIONS.includes(action)) return false;
    const normalizedCode = String(code || "").trim();
    if (!normalizedCode) return false;

    this.customBindings[action] = [normalizedCode];
    this.keyActions = createKeyActionMap(this.controlScheme, this.customBindings);
    this.clearAll();
    this.emitSettingsChanged();
    return true;
  }

  resetCustomBindings() {
    this.customBindings = {};
    this.keyActions = createKeyActionMap(this.controlScheme, this.customBindings);
    this.clearAll();
    this.emitSettingsChanged();
  }

  getActionHint(action) {
    const labels = [];
    for (const [code, mappedActions] of this.keyActions.entries()) {
      if (mappedActions.includes(action)) {
        labels.push(formatKeyCode(code));
      }
    }
    const unique = [...new Set(labels)];
    return unique.join(" / ");
  }

  update() {
    const gpActions = new Set();
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads && pads[0];

    if (gp) {
      const axisX = gp.axes[0] || 0;
      if (axisX < -0.3) gpActions.add("left");
      if (axisX > 0.3) gpActions.add("right");
      if (gp.buttons[12]?.pressed) gpActions.add("lookUp");
      if (gp.buttons[0]?.pressed) gpActions.add("jump");
      if (gp.buttons[2]?.pressed) gpActions.add("attack");
      if (gp.buttons[4]?.pressed) gpActions.add("abilityA");
      if (gp.buttons[5]?.pressed) gpActions.add("abilityB");
      if (gp.buttons[3]?.pressed) gpActions.add("skill");
      if (gp.buttons[1]?.pressed) gpActions.add("ultimate");
      if (gp.buttons[9]?.pressed) gpActions.add("pause");
      if (gp.buttons[10]?.pressed) gpActions.add("restart");
      if (gp.buttons[0]?.pressed) gpActions.add("confirm");
      if (gp.buttons[8]?.pressed) gpActions.add("back");
    }

    for (const action of ACTIONS) {
      const prev = this.gamepadDown.has(action);
      const curr = gpActions.has(action);
      if (!prev && curr) this.pressed.add(action);
      if (prev && !curr) this.released.add(action);
    }

    this.gamepadDown = gpActions;
    this.down = new Set([...this.keyboardDown, ...this.gamepadDown, ...this.mouseDown, ...this.virtualDown]);
  }

  getCodesForAction(action) {
    const codes = [];
    for (const [code, mappedActions] of this.keyActions.entries()) {
      if (mappedActions.includes(action)) {
        codes.push(code);
      }
    }
    return [...new Set(codes)];
  }

  isDown(action) {
    return this.down.has(action);
  }

  justPressed(action) {
    return this.pressed.has(action);
  }

  justReleased(action) {
    return this.released.has(action);
  }

  wasPressed(action) {
    return this.justPressed(action);
  }

  consume(action) {
    const hit = this.pressed.has(action);
    this.pressed.delete(action);
    return hit;
  }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
    this.pointer.clicked = false;
  }

  setPointerClick(canvasX, canvasY) {
    this.pointer.x = canvasX;
    this.pointer.y = canvasY;
    this.pointer.clicked = true;
  }

  setPointerPosition(canvasX, canvasY) {
    this.pointer.x = canvasX;
    this.pointer.y = canvasY;
  }

  clearAll() {
    this.keyboardDown.clear();
    this.gamepadDown.clear();
    this.mouseDown.clear();
    this.virtualDown.clear();
    this.down.clear();
    this.pressed.clear();
    this.released.clear();
    this.touchAimDirection.x = 0;
    this.touchAimDirection.y = 0;
  }

  setTouchAimDirection(dx, dy) {
    const norm = Math.hypot(dx, dy) || 0;
    if (norm < 0.01) {
      this.touchAimDirection.x = 0;
      this.touchAimDirection.y = 0;
      return;
    }
    this.touchAimDirection.x = dx / norm;
    this.touchAimDirection.y = dy / norm;
  }

  clearTouchAim() {
    this.touchAimDirection.x = 0;
    this.touchAimDirection.y = 0;
  }

  setVirtualAction(action, isDown) {
    if (!ACTIONS.includes(action)) return;
    if (isDown) {
      this.beginAction(action, this.virtualDown);
      return;
    }
    this.endAction(action, this.virtualDown);
  }

  beginAction(action, bucket) {
    if (!bucket.has(action)) {
      this.pressed.add(action);
    }
    bucket.add(action);
  }

  endAction(action, bucket) {
    if (bucket.has(action)) {
      this.released.add(action);
    }
    bucket.delete(action);
  }
}
