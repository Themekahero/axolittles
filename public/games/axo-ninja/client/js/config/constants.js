export const CONST = {
  GAME: { W: 1280, H: 720, FPS: 60, TILE: 64 },

  MOVE: {
    WalkMaxSpeed: 6.2,
    RunMaxSpeed: 8.8,
    GroundAccel: 0.85,
    GroundDecel: 0.95,
    TurnAccelBoost: 1.15,
    AirAccel: 0.55,
    AirDecel: 0.35,
    AirControl: 0.92,
    MaxFallSpeed: 20
  },

  JUMP: {
    JumpVelocity: -15.8,
    ShortHopCut: 0.55,
    Gravity: 0.85,
    GravityHold: 0.65,
    CoyoteTimeSec: 0.10,
    JumpBufferSec: 0.12
  },

  PHYSICS: {
    Gravity: 0.8,
    MaxFallSpeed: 18,
    JumpForce: -15,
    GroundFriction: 0.85,
    IceFriction: 0.96,
    AirControlMultiplier: 0.75
  },

  HERO_SPEED: {
    ninja: 5.5
    // flora: 4.0,
    // jelly: 6.0
  },

  DASH: {
    Distance: 220,
    Duration: 0.25
  },

  COMBAT: {
    InvincibilityAfterHit: 0.8,
    AttackCooldown: 0.6,
    KnockbackLight: { pxPerFrame: 6, seconds: 0.15 },
    KnockbackHeavy: { pxPerFrame: 3, seconds: 0.15 }
  },

  ULT: {
    Gain: { BasicKill: 3, EliteKill: 6, MiniBossKill: 10, BossHitPer100Damage: 1 },
    Max: 100
  },

  ECONOMY: {
    MaxHeartsCap: 8,
    UpgradeCostBase: 500,
    OneHealthUpgradePerLevelPerHero: true,
    CoinsNotSavedIfLevelUnfinished: true
  },

  AUDIO: {
    MasterDefault: 0.70,
    SfxDefault: 0.80,
    MusicDefault: 0.60,
    CrossfadeSeconds: 1.5
  },

  MENU: {
    // Offline kids build: no external/social links.
    SOCIAL_LINKS: []
  }
};

// Backward compatibility for legacy hero ids still present in saved data.
CONST.HERO_SPEED.axolittle = CONST.HERO_SPEED.ninja;
CONST.HERO_SPEED.pudge = CONST.HERO_SPEED.ninja;
CONST.HERO_SPEED.seal = CONST.HERO_SPEED.ninja;
