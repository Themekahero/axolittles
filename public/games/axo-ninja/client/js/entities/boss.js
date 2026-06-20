import { Entity } from "./entity.js";
import { BOSSES, BOSS_PHASE_THRESHOLDS, BOSS_ENRAGE } from "../config/bosses.js";
import { ENEMIES } from "../config/enemies.js";
import { CONST } from "../config/constants.js";
import {
  BOSS_PROJECTILE_SPRITES,
  BOSS_SPRITES,
  BOSS_SPRITE_META,
  getImage,
} from "../core/assets.js";
import { resolveEntityMovement } from "../core/collision.js";
import { TILE } from "../config/tileIds.js";
import { randomRange, compactInPlace } from "../utils/math.js";
import {
  predictTargetPosition,
  resolveFacingWithDeadzone,
} from "../utils/aiming.js";

const BOSS_SIZE_SCALE = 1.25;
const BOSS_FACING_DEADZONE = 20;
const BOSS_ABOVE_VERTICAL_GAP = 44;
const BOSS_ABOVE_HORIZONTAL_BAND = 82;
const BOSS_ABOVE_AIM_SIDE_OFFSET = 34;
const BOSS_ABOVE_AIM_UPWARD_OFFSET = 26;
const BOSS_PROJECTILE_LEAD_FACTOR = 0.52;
const BOSS_PROJECTILE_MAX_LEAD_FRAMES = 22;
const BOSS_STOMP_CHAIN_WINDOW_SEC = 1.35;
const BOSS_STOMP_CHAIN_TRIGGER = 3;
const BOSS_STOMP_REACTION_COOLDOWN_SEC = 2.1;
const BOSS_STOMP_EVADE_SEC = 0.34;
const BOSS_STOMP_EVADE_SPEED_MULT = 2.55;
const BOSS_HIT_RETALIATE_WINDOW_SEC = 1.05;
const BOSS_HIT_RETALIATE_THRESHOLD = 2;
const BOSS_HIT_RETALIATE_COOLDOWN_SEC = 1.9;
const BOSS_DAMAGE_SHIELD_SEC = 0.65;
const BOSS_DAMAGE_SHIELD_FADE_IN_RATIO = 0.22;
const BOSS_DAMAGE_SHIELD_FADE_OUT_RATIO = 0.36;
const SEA_GUARDIAN_SWIM_RETARGET_MIN_SEC = 0.45;
const SEA_GUARDIAN_SWIM_RETARGET_MAX_SEC = 1.1;
const SEA_GUARDIAN_SWIM_REACHED_DISTANCE = 14;
const SEA_GUARDIAN_HERO_TARGET_X_JITTER = 120;
const SEA_GUARDIAN_HERO_TARGET_Y_JITTER = 84;
const ICE_REBIRTH_DEATH_HOLD_SEC = 0.9;
const ICE_REBIRTH_FORM_SEC = 1.15;
const ICE_REBIRTH_CHILD_COUNT = 1;
const ICE_REBIRTH_CHILD_SPREAD_PX = 86;
const ICE_REBIRTH_CHILD_SIZE_RATIO = 0.72;
const ICE_TITAN_ORIGIN_WIDTH = Math.max(
  1,
  Math.round(Number(BOSSES?.iceTitan?.w) || 156),
);
const ICE_TITAN_ORIGIN_HEIGHT = Math.max(
  1,
  Math.round(Number(BOSSES?.iceTitan?.h) || 178),
);
const ICE_REBIRTH_CHILD_ORIGIN_WIDTH = Math.max(
  1,
  Math.round(Number(ENEMIES?.iceTitan?.w) || 108),
);
const ICE_REBIRTH_CHILD_ORIGIN_HEIGHT = Math.max(
  1,
  Math.round(Number(ENEMIES?.iceTitan?.h) || 116),
);
// death.png frames are not evenly spaced; use hand-tuned source rects for stable playback.
const ICE_TITAN_DEATH_FRAME_BOUNDS = [
  { x: 39, w: 481 },
  { x: 528, w: 513 },
  { x: 1050, w: 520 },
  { x: 1576, w: 508 },
  { x: 2111, w: 509 },
];

const NECRO_SOLID_FLOOR_TILES = new Set([
  TILE.SOLID,
  TILE.ICE,
  TILE.BRICK,
  TILE.GIFT_BOX,
]);

const NECRO_STATE = {
  INACTIVE: "inactive",
  AWAKEN: "awaken",
  FLOAT_PHASE1: "float_phase1",
  ATTACK1_SKULL_SEQUENCE: "attack1_lamp_skull_sequence",
  PHASE1_DEATH: "phase1_death",
  REVIVE_WAIT: "revive_wait",
  TRANSITION: "transition_to_phase2",
  FLOAT_PHASE2: "float_phase2",
  ATTACK2_SCREAM: "attack2_scream",
  HURT_PHASE1: "hurt_phase1",
  HURT_PHASE2: "hurt_phase2",
  DEAD: "dead",
};

const NECRO_SKULL_STAGE = {
  READY: "ready",
  FIRE: "fire",
  GROWING: "growing",
  COOLDOWN: "cooldown",
  DONE: "done",
};

const DEFAULT_NECRO_CONFIG = {
  introDuration: 0.55,
  entryApproachDuration: 1.25,
  entryApproachSpeed: 0,
  floatMoveSpeedPhase1: 1.45,
  floatMoveSpeedPhase2: 1.95,
  floatMoveSpeedScream: 0.75,
  moveDeadzone: 24,
  floatVelocitySmoothing: 8.5,
  bossFloatHeight: 36,
  floatBobAmplitude: 6,
  floatBobFrequency: 1.8,
  floatYLerp: 0.22,
  arenaPadding: 30,
  phase1AttackDelay: 0,
  phase1SkullCount: 9999,
  phase1SkullInterval: 4,
  skullGrowDuration: 0.42,
  skullInitialScale: 0.9,
  skullFinalScale: 2.2,
  skullRadius: 16,
  skullGroundOffset: 34,
  skullSpeed: 2.2,
  skullHitPoints: 3,
  skullRange: 620,
  skullDamageMultiplier: 1,
  skullAimLead: 0.46,
  skullAimLeadMaxFrames: 20,
  lampFireDuration: 0.45,
  lampFireDurationMin: 0.45,
  lampFireDurationMax: 0.45,
  lampFireOffsetX: 26,
  lampFireLift: 8,
  lampFireJitterX: 18,
  phase2HandAnchorXRatio: 0.29,
  phase2HandAnchorYRatio: 0.22,
  phase2GroundOffsetY: 14,
  phase2RespawnDelay: 1.4,
  phase2RespawnHpRatio: 1.0,
  phase2TransitionDuration: 0.75,
  phase2VerticalAmplitude: 0,
  phase2VerticalFrequency: 0.8,
  phase2TopOffsetY: 150,
  phase2SideRatio: 0.18,
  phase2RiseSpeed: 3.8,
  phase2SlideSpeed: 3.2,
  phase2DropSpeed: 4.2,
  phase2PostAttackPauseSec: 1.25,
  phase2DownPauseSec: 2.2,
  screamDuration: 1.6,
  screamRadius: 340,
  screamDamage: 40,
  screamTickInterval: 0.32,
  screamRingCount: 8,
  screamRingInterval: 0.24,
  screamRingSpeed: 300,
  screamRingThickness: 24,
  screamRingMaxRadius: 560,
  screamRingDamage: 34,
  screamRingKnockbackX: 2.8,
  screamRingKnockbackY: -1.7,
  phase2HandFireInterval: 5.0,
  phase2HandFireIntervalMin: 5.0,
  phase2HandFireIntervalMax: 5.0,
  screamHandFireInterval: 5.0,
  screamHandFireSpeed: 8.4,
  screamHandFireRadius: 12,
  screamHandFireDamage: 24,
  screamHandFireSpriteScale: 1.65,
  screamSkyFireInterval: 0.8,
  screamSkyFireSpreadX: 110,
  screamSkyFireStartHeight: 230,
  screamSkyFireSpeed: 7.2,
  screamSkyFireFallDuration: 2.8,
  screamSkyFireSpawnYRatio: 0.2,
  screamSkyFireRadius: 14,
  screamSkyFireDamage: 30,
  screamSkyFireSpriteScale: 1.8,
  screamBlastRange: 340,
  screamBlastHalfAngleDeg: 34,
  screamBlastDamage: 52,
  screamBlastKnockbackX: 4.2,
  screamBlastKnockbackY: -2.3,
  screamCooldown: 5.0,
  immuneWhileScreaming: false,
  hurtDurationSec: 0.55,
  hitRetaliateWindowSec: 1.1,
  hitRetaliateThreshold: 2,
  hitRetaliateCooldown: 2.0,
  deathDurationSec: 3.2,
};

function nowSeconds() {
  return (
    (typeof performance !== "undefined" ? performance.now() : Date.now()) *
    0.001
  );
}

function toFinite(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function resolveBossType(type) {
  const raw = String(type || "").trim();
  if (!raw) return "iceTitan";
  if (BOSSES[raw]) return raw;
  const compact = raw.replace(/[\s_-]+/g, "").toLowerCase();
  const alias = {
    icetitan: "iceTitan",
    crabboss: "crabBoss",
    gravewitch: "necroKing",
    sandboss: "sandBoss",
  };
  return alias[compact] || "iceTitan";
}

export class Boss extends Entity {
  constructor() {
    super();
    this.type = "iceTitan";
    this.cfg = BOSSES[this.type];
    if (this.type === "iceTitan") {
      this.w = ICE_TITAN_ORIGIN_WIDTH;
      this.h = ICE_TITAN_ORIGIN_HEIGHT;
    } else {
      this.w = this.resolveBossSize(this.cfg, "w", Math.round(96 * BOSS_SIZE_SCALE));
      this.h = this.resolveBossSize(this.cfg, "h", Math.round(104 * BOSS_SIZE_SCALE));
    }
    this.drawOffsetY = Number(this.cfg?.drawOffsetY) || 0;
    this.state = "Idle";
    this.maxHp = 1;
    this.hp = 1;
    this.attackCd = 0;
    this.patternTimer = 0;
    this.telegraphTimer = 0;
    this.damageDone = false;
    this.phaseIndex = 0;
    this.phaseTransitionTimer = 0;
    this.enraged = false;
    this.minionTimer = 10;
    this.facing = -1;
    this.facingLocked = false;
    this.engaged = false;
    this.dead = false;
    this.burnTimer = 0;
    this.burnTick = 0;
    this.burnDps = 0;
    this.slowTimer = 0;
    this.veteranBonusAddSpawned = false;
    this.hurtTimer = 0;
    this.openingBeamPending = false;
    this.attackWindupTimer = 0;
    this.attackWindupDuration = 0;
    this.pendingPrimarySpeedMult = 1;
    this.stompChainCount = 0;
    this.stompChainTimer = 0;
    this.stompReactionCooldown = 0;
    this.evadeTimer = 0;
    this.evadeDirection = 0;
    this.pendingEvadeCounterAttack = false;
    this.hitRetaliateWindowTimer = 0;
    this.hitRetaliateCount = 0;
    this.hitRetaliateCooldownTimer = 0;
    this.damageShieldDuration = BOSS_DAMAGE_SHIELD_SEC;
    this.damageShieldTimer = 0;
    this.seaSwimTargetX = 0;
    this.seaSwimTargetY = 0;
    this.seaSwimRetargetTimer = 0;
    this.iceRebirthActive = false;
    this.iceRebirthStage = "";
    this.iceRebirthTimer = 0;
    this.iceRebirthDeathDuration = ICE_REBIRTH_DEATH_HOLD_SEC;
    this.iceRebirthFormDuration = ICE_REBIRTH_FORM_SEC;
    this.iceRebirthDefeatHandled = false;
    this.standardDeathTimer = 0;
    this.standardDeathDuration = 0;
    this.standardDeathDefeatHandled = false;

    this.necroCfg = { ...DEFAULT_NECRO_CONFIG };
    this.resetNecroRuntimeState();
  }

  reset(type, x, y) {
    const resolvedType = resolveBossType(type);
    this.type = resolvedType;
    this.cfg = BOSSES[resolvedType] || BOSSES.iceTitan;
    if (this.type === "iceTitan") {
      this.w = ICE_TITAN_ORIGIN_WIDTH;
      this.h = ICE_TITAN_ORIGIN_HEIGHT;
    } else {
      this.w = this.resolveBossSize(this.cfg, "w", Math.round(96 * BOSS_SIZE_SCALE));
      this.h = this.resolveBossSize(this.cfg, "h", Math.round(104 * BOSS_SIZE_SCALE));
    }
    this.drawOffsetY = Number(this.cfg?.drawOffsetY) || 0;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.state = "Idle";
    this.maxHp = this.cfg.maxHp;
    this.hp = this.maxHp;
    this.attackCd = 1.0;
    this.patternTimer = 0;
    this.telegraphTimer = 0;
    this.damageDone = false;
    this.phaseIndex = 0;
    this.phaseTransitionTimer = 0;
    this.enraged = false;
    this.minionTimer = 10;
    this.facing = -1;
    this.facingLocked = false;
    this.engaged = false;
    this.dead = false;
    this.burnTimer = 0;
    this.burnTick = 0;
    this.burnDps = 0;
    this.slowTimer = 0;
    this.veteranBonusAddSpawned = false;
    this.hurtTimer = 0;
    this.openingBeamPending = false;
    this.attackWindupTimer = 0;
    this.attackWindupDuration = 0;
    this.pendingPrimarySpeedMult = 1;
    this.stompChainCount = 0;
    this.stompChainTimer = 0;
    this.stompReactionCooldown = 0;
    this.evadeTimer = 0;
    this.evadeDirection = 0;
    this.pendingEvadeCounterAttack = false;
    this.hitRetaliateWindowTimer = 0;
    this.hitRetaliateCount = 0;
    this.hitRetaliateCooldownTimer = 0;
    this.damageShieldDuration = this.resolveDamageShieldDuration(this.cfg);
    this.damageShieldTimer = 0;
    this.seaSwimTargetX = x;
    this.seaSwimTargetY = y;
    this.seaSwimRetargetTimer = 0;
    this.iceRebirthActive = false;
    this.iceRebirthStage = "";
    this.iceRebirthTimer = 0;
    this.iceRebirthDeathDuration = ICE_REBIRTH_DEATH_HOLD_SEC;
    this.iceRebirthFormDuration = ICE_REBIRTH_FORM_SEC;
    this.iceRebirthDefeatHandled = false;
    this.standardDeathTimer = 0;
    this.standardDeathDuration = 0;
    this.standardDeathDefeatHandled = false;
    this.necroCfg = this.resolveNecroConfig(this.cfg?.necro);
    this.resetNecroRuntimeState();
    if (this.type === "necroKing") {
      this.initNecroRuntime();
    }
    this.active = true;
  }

  update(dt, world) {
    if (!this.active) return;
    if (this.type === "necroKing") {
      this.updateNecroKing(dt, world);
      return;
    }
    if (this.iceRebirthActive) {
      this.updateIceRebirth(dt, world);
      return;
    }
    if (this.dead) {
      this.updateStandardDeath(dt, world);
      return;
    }
    if (!this.engaged) return;

    this.attackCd = Math.max(0, this.attackCd - dt);
    this.telegraphTimer = Math.max(0, this.telegraphTimer - dt);
    this.minionTimer -= dt;
    this.slowTimer = Math.max(0, this.slowTimer - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.damageShieldTimer = Math.max(0, this.damageShieldTimer - dt);
    this.hitRetaliateCooldownTimer = Math.max(0, this.hitRetaliateCooldownTimer - dt);
    this.hitRetaliateWindowTimer = Math.max(0, this.hitRetaliateWindowTimer - dt);
    this.stompReactionCooldown = Math.max(0, this.stompReactionCooldown - dt);
    this.stompChainTimer = Math.max(0, this.stompChainTimer - dt);
    if (this.stompChainTimer <= 0) {
      this.stompChainCount = 0;
    }
    if (this.hitRetaliateWindowTimer <= 0) {
      this.hitRetaliateCount = 0;
    }

    this.applyBurn(dt, world);
    if (this.dead) return;

    if (this.hurtTimer > 0) {
      this.state = "Hurt";
      this.facingLocked = false;
      this.applyGravityAndMovement(dt, world, false);
      return;
    }

    if (this.evadeTimer > 0) {
      this.evadeTimer = Math.max(0, this.evadeTimer - dt);
      this.state = "Evade";
      this.facingLocked = true;
      this.applyGravityAndMovement(dt, world, false, {
        forcedDirection: this.evadeDirection,
        speedScale: BOSS_STOMP_EVADE_SPEED_MULT,
      });
      if (this.evadeTimer <= 0) {
        this.facingLocked = false;
        this.pendingEvadeCounterAttack = true;
      }
      return;
    }

    if (this.pendingEvadeCounterAttack) {
      this.pendingEvadeCounterAttack = false;
      this.fireEvadeCounterAttack(world);
      this.applyGravityAndMovement(dt, world, false);
      return;
    }

    const player = world.player;
    const dxToPlayer = player.center.x - this.center.x;
    const heroAboveBoss = this.isHeroDirectlyAbove(player);
    this.facing = resolveFacingWithDeadzone(
      this.facing,
      dxToPlayer,
      BOSS_FACING_DEADZONE,
      this.facingLocked || heroAboveBoss,
    );

    const ratio = this.hp / this.maxHp;
    if (this.phaseIndex < BOSS_PHASE_THRESHOLDS.length && ratio <= BOSS_PHASE_THRESHOLDS[this.phaseIndex]) {
      this.state = "PhaseTransition";
      this.phaseTransitionTimer = 1.4;
      this.phaseIndex += 1;
      this.attackWindupTimer = 0;
      this.evadeTimer = 0;
      this.pendingEvadeCounterAttack = false;
      this.facingLocked = false;
      if (world.isVeteranMode?.() && !this.veteranBonusAddSpawned) {
        this.veteranBonusAddSpawned = true;
        world.spawnBossMinion(this.type, this.center.x + randomRange(-80, 80), this.center.y);
      }
    }

    if (!this.enraged && ratio <= 0.2) {
      this.enraged = true;
      this.state = "Enrage";
      this.attackCd = 0.8;
    }

    if (this.phaseTransitionTimer > 0) {
      this.phaseTransitionTimer -= dt;
      if (this.phaseTransitionTimer <= 0) {
        this.castSpecial(world);
      }
      this.applyGravityAndMovement(dt, world, false);
      return;
    }

    if (this.minionTimer <= 0) {
      this.minionTimer = randomRange(10, 15);
      world.spawnBossMinion(this.type, this.x + this.w * 0.5, this.y + this.h * 0.5);
    }

    const speedMult = this.enraged ? BOSS_ENRAGE.speedMultiplier : 1;

    if (this.openingBeamPending) {
      this.openingBeamPending = false;
      this.startPrimaryAttackWindup(speedMult, world);
    }

    if (this.attackWindupTimer > 0) {
      this.attackWindupTimer = Math.max(0, this.attackWindupTimer - dt);
      this.state = "AttackPattern1";
      if (this.attackWindupTimer <= 0) {
        this.releasePrimaryAttack(world, this.pendingPrimarySpeedMult || speedMult);
      }
      this.applyGravityAndMovement(dt, world, false);
      return;
    }

    if (this.attackCd <= 0) {
      this.startPrimaryAttackWindup(speedMult, world);
      this.applyGravityAndMovement(dt, world, false);
      return;
    }

    if (this.state !== "PhaseTransition" && this.state !== "Enrage") {
      this.state = "Idle";
    }

    this.applyGravityAndMovement(dt, world, true);
  }

  updateNecroKing(dt, world) {
    if (this.dead) {
      if (this.state === NECRO_STATE.PHASE1_DEATH) {
        this.necroPhase1DeathTimer = Math.max(0, (this.necroPhase1DeathTimer || 0) - dt);
        if (this.necroPhase1DeathTimer <= 0) {
          this.state = NECRO_STATE.REVIVE_WAIT;
          this.necroRevivePending = true;
        }
        return;
      }
      if (this.necroRevivePending) {
        this.updateNecroPhase2Revive(dt, world);
        return;
      }
      this.updateNecroDeath(dt, world);
      return;
    }

    this.slowTimer = Math.max(0, this.slowTimer - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.damageShieldTimer = Math.max(0, this.damageShieldTimer - dt);
    this.necroHitRetaliateWindowTimer = Math.max(0, this.necroHitRetaliateWindowTimer - dt);
    if (this.necroHitRetaliateWindowTimer <= 0) {
      this.necroHitRetaliateCount = 0;
    }
    this.necroHitRetaliateCooldownTimer = Math.max(0, this.necroHitRetaliateCooldownTimer - dt);
    this.necroStateTimer = Math.max(0, this.necroStateTimer - dt);
    this.necroSkullTimer = Math.max(0, this.necroSkullTimer - dt);
    this.necroScreamCooldownTimer = Math.max(0, this.necroScreamCooldownTimer - dt);
    this.necroScreamTickTimer = Math.max(0, this.necroScreamTickTimer - dt);
    this.necroScreamRingTimer = Math.max(0, this.necroScreamRingTimer - dt);
    this.necroScreamHandFireTimer = Math.max(0, this.necroScreamHandFireTimer - dt);
    this.necroScreamSkyFireTimer = Math.max(0, this.necroScreamSkyFireTimer - dt);
    this.necroLampFireTimer = Math.max(0, this.necroLampFireTimer - dt);
    this.necroPhase2HoldTimer = Math.max(0, this.necroPhase2HoldTimer - dt);

    this.applyBurn(dt, world);
    if (this.dead) {
      if (this.state === NECRO_STATE.PHASE1_DEATH) {
        this.necroPhase1DeathTimer = Math.max(0, (this.necroPhase1DeathTimer || 0) - dt);
        if (this.necroPhase1DeathTimer <= 0) {
          this.state = NECRO_STATE.REVIVE_WAIT;
          this.necroRevivePending = true;
        }
        return;
      }
      if (this.necroRevivePending) {
        this.updateNecroPhase2Revive(dt, world);
        return;
      }
      this.updateNecroDeath(dt, world);
      return;
    }

    this.updateNecroChargingSkull(dt, world);
    this.updateActiveNecroScreamRings(dt, world);

    const player = world?.player || null;
    const dxToPlayer = player ? player.center.x - this.center.x : 0;
    this.facing = resolveFacingWithDeadzone(
      this.facing,
      dxToPlayer,
      BOSS_FACING_DEADZONE,
      this.facingLocked,
    );

    if (!this.engaged) {
      this.state = NECRO_STATE.INACTIVE;
      this.updateNecroFloatMovement(dt, world, 0, false);
      return;
    }

    if (this.state === NECRO_STATE.INACTIVE) {
      // Boss trigger logic: do a short approach toward hero before first attack.
      this.state = NECRO_STATE.AWAKEN;
      this.necroStateTimer = Math.max(0.1, this.necroCfg.entryApproachDuration);
      return;
    }

    if (this.hurtTimer > 0 && this.isNecroHurtState()) {
      // Keep the current relocation trajectory during phase-2 hurt so hits do not
      // snap the boss down to grounded float and then restart the rise.
      if (this.necroPhase >= 2 && this.necroPhase2RelocatePending) {
        this.updateNecroPhase2Relocation(dt, world);
        return;
      }
      const hurtSpeed = this.necroPhase >= 2
        ? this.necroCfg.floatMoveSpeedPhase2 * 0.45
        : this.necroCfg.floatMoveSpeedPhase1 * 0.4;
      this.updateNecroFloatMovement(dt, world, hurtSpeed, false);
      return;
    }

    if (this.hurtTimer <= 0 && this.isNecroHurtState()) {
      this.state = this.necroResumeState
        || (this.necroPhase >= 2 ? NECRO_STATE.FLOAT_PHASE2 : NECRO_STATE.FLOAT_PHASE1);
      this.necroResumeState = "";
    }

    if (this.state === NECRO_STATE.AWAKEN) {
      // Move a little toward hero on arena entry, then continue phase 1.
      this.updateNecroFloatMovement(
        dt,
        world,
        this.necroCfg.entryApproachSpeed,
        true,
      );
      if (this.necroStateTimer <= 0) {
        if (this.necroPhase <= 1) {
          this.startNecroPhase1AttackSequence();
        } else {
          this.state = NECRO_STATE.FLOAT_PHASE2;
          this.necroScreamCooldownTimer = Math.max(
            0.1,
            this.necroCfg.screamCooldown,
          );
        }
      }
      return;
    }

    if (this.necroPhase <= 1) {
      if (this.state === NECRO_STATE.FLOAT_PHASE1) {
        // Walk sprite state should stay in one position (no horizontal drift/chase).
        this.updateNecroFloatMovement(dt, world, 0, false);
        if (this.necroSkullTimer <= 0) {
          this.startNecroPhase1AttackSequence();
        }
        return;
      }

      if (this.state === NECRO_STATE.ATTACK1_SKULL_SEQUENCE) {
        // First attack should hold position while summoning skulls.
        this.updateNecroFloatMovement(dt, world, 0, false);
        this.updateNecroPhase1AttackSequence(world);
        return;
      }

      this.updateNecroFloatMovement(dt, world, 0, false);
      this.state = NECRO_STATE.FLOAT_PHASE1;
      return;
    }

    if (this.state === NECRO_STATE.ATTACK2_SCREAM) {
      // Requested phase 2 behavior: screaming in one position.
      this.updateNecroFloatMovement(dt, world, 0, false);
      this.updateNecroScreamAttack(dt, world);
      return;
    }

    if (this.state !== NECRO_STATE.FLOAT_PHASE2 && this.state !== NECRO_STATE.TRANSITION) {
      this.state = NECRO_STATE.FLOAT_PHASE2;
    }

    // Phase 2 pattern: attack, then relocate up->side->down, then attack again.
    if (this.updateNecroPhase2Relocation(dt, world)) {
      return;
    }

    this.updateNecroFloatMovement(dt, world, 0, false);
    if (this.necroScreamHandFireTimer <= 0) {
      this.necroPhase2AttackLatch = true;
      this.startNecroScreamAttack(world);
      this.necroScreamHandFireTimer = Math.max(
        0.05,
        this.necroCfg.phase2HandFireInterval,
      );
    }
  }

  startNecroPhase1AttackSequence() {
    if (this.necroPhase >= 2) return;
    if (this.state === NECRO_STATE.ATTACK1_SKULL_SEQUENCE) return;
    this.necroSkullPatternStarted = true;
    this.state = NECRO_STATE.ATTACK1_SKULL_SEQUENCE;
    this.necroSkullStage = NECRO_SKULL_STAGE.READY;
    this.necroSkullTimer = Math.max(0, this.necroCfg.phase1AttackDelay);
    this.necroLampFireTimer = 0;
    this.necroSummonPoint = null;
    this.necroChargeSkull = null;
  }

  updateNecroPhase1AttackSequence(world) {
    if (this.necroSkullStage === NECRO_SKULL_STAGE.DONE) {
      this.finishNecroSkullPattern();
      return;
    }

    if (this.necroSkullStage === NECRO_SKULL_STAGE.READY) {
      this.startNecroLampFire(world);
      return;
    }

    if (this.necroSkullStage === NECRO_SKULL_STAGE.FIRE) {
      if (this.necroSkullTimer <= 0) {
        this.spawnNecroChargingSkull(this.necroCfg.skullGrowDuration);
        this.necroLampFireTimer = 0;
        this.necroSkullStage = NECRO_SKULL_STAGE.GROWING;
      }
      return;
    }

    if (this.necroSkullStage === NECRO_SKULL_STAGE.GROWING) {
      // The growth/launch stage is handled by updateNecroChargingSkull.
      return;
    }
  }

  startNecroLampFire(world) {
    const lamp = this.getNecroLampAnchor();
    const summonX =
      lamp.x
      + this.facing * this.necroCfg.lampFireOffsetX
      + randomRange(-this.necroCfg.lampFireJitterX, this.necroCfg.lampFireJitterX);
    const floorY = this.sampleNecroFloorY(world, summonX);
    const summonY = floorY - Math.max(2, this.necroCfg.lampFireLift);

    // Short floor flame pulse: no long continuous lamp ray.
    this.necroCurrentLampFireDuration = Math.max(
      0.06,
      this.necroCfg.lampFireDuration,
    );

    // Phase 1 attack sequence: lamp sends ghost fire to floor before skull birth.
    this.necroSummonPoint = { x: summonX, y: summonY };
    this.necroSkullTimer = this.necroCurrentLampFireDuration;
    this.necroLampFireTimer = this.necroSkullTimer;
    this.necroSkullStage = NECRO_SKULL_STAGE.FIRE;
    this.necroChargeSkull = null;
    void world;
  }

  spawnNecroChargingSkull(growDurationSec = this.necroCfg.skullGrowDuration) {
    const point = this.necroSummonPoint || this.center;
    // Skull forms on the floor: starts small then increases width/height.
    const totalGrowDuration = Math.max(
      this.necroCfg.skullGrowDuration,
      growDurationSec,
    );
    this.necroChargeSkull = {
      x: point.x,
      y: point.y,
      timer: Math.max(0.08, totalGrowDuration),
      duration: Math.max(0.08, totalGrowDuration),
      initialScale: Math.max(0.08, this.necroCfg.skullInitialScale),
      finalScale: Math.max(this.necroCfg.skullInitialScale, this.necroCfg.skullFinalScale),
    };
  }

  updateNecroChargingSkull(dt, world) {
    if (!this.necroChargeSkull) return;
    // Skull growth logic: charge in place before it becomes a real projectile.
    this.necroChargeSkull.timer = Math.max(0, this.necroChargeSkull.timer - dt);
    if (this.necroChargeSkull.timer > 0) return;

    const completedGrowthDuration = Math.max(
      0.08,
      Number(this.necroChargeSkull.duration) || this.necroCfg.skullGrowDuration,
    );
    this.launchNecroSkullProjectile(world, this.necroChargeSkull);
    this.necroChargeSkull = null;
    this.necroSummonPoint = null;
    this.necroSkullsLaunched += 1;

    // After each attack1 cycle, go back to walk1 and wait full interval.
    this.necroSkullPatternStarted = false;
    this.necroSkullStage = NECRO_SKULL_STAGE.READY;
    this.necroSkullTimer = Math.max(0.05, this.necroCfg.phase1SkullInterval);
    this.state = NECRO_STATE.FLOAT_PHASE1;
    void completedGrowthDuration;
  }

  launchNecroSkullProjectile(world, charge) {
    if (!world || typeof world.launchBossProjectile !== "function") return;
    const projectileSprite = BOSS_PROJECTILE_SPRITES.necroKing || null;
    const speed = Math.max(0.2, this.necroCfg.skullSpeed);
    const target = this.resolveNecroSkullTarget(world, charge, speed);
    const initialDir = Math.sign(target.x - charge.x) || this.facing || 1;

    const floorSurfaceY = this.sampleNecroFloorY(world, charge.x);
    const groundOffset = Math.max(2, this.necroCfg.skullGroundOffset);

    world.launchBossProjectile(this, {
      damage: this.getDamage() * this.necroCfg.skullDamageMultiplier,
      speed,
      radius: this.necroCfg.skullRadius,
      range: 20000,
      life: 9999,
      color: "#ff9f67",
      kind: "orb",
      dirX: initialDir,
      dirY: 0,
      spawnX: charge.x,
      spawnY: floorSurfaceY - groundOffset,
      targetX: target.x,
      targetY: floorSurfaceY - groundOffset,
      spritePath: projectileSprite?.path,
      spriteScale: this.necroCfg.skullFinalScale,
      spriteFrameCount: projectileSprite?.frameCount,
      spriteFps: projectileSprite?.fps,
      spinRate: 0.008,
      groundSkull: true,
      floorY: floorSurfaceY,
      groundYOffset: groundOffset,
      chasePlayer: true,
      hitsToDestroy: this.necroCfg.skullHitPoints,
      ignoreTerrain: true,
    });
  }

  resolveNecroSkullTarget(world, charge, speed) {
    const player = world?.player || null;
    if (!player) {
      return { x: this.center.x + this.facing * 120, y: this.center.y };
    }

    return predictTargetPosition(
      { x: charge.x, y: charge.y },
      player.center,
      { x: player.vx || 0, y: player.vy || 0 },
      speed,
      this.necroCfg.skullAimLead,
      this.necroCfg.skullAimLeadMaxFrames,
    );
  }

  finishNecroSkullPattern() {
    if (this.necroSkullPatternCompleted) return;
    // Stop phase-1 skull summon loop cleanly (used when force-switching out of phase 1).
    this.necroSkullPatternCompleted = true;
    this.necroSkullPatternStarted = false;
    this.state = NECRO_STATE.FLOAT_PHASE1;
    this.necroStateTimer = 0;
    this.necroSkullStage = NECRO_SKULL_STAGE.DONE;
    this.necroSkullTimer = 0;
    this.necroLampFireTimer = 0;
    this.necroChargeSkull = null;
    this.necroSummonPoint = null;
  }

  beginNecroPhase2Transition() {
    this.finishNecroSkullPattern();
  }

  startNecroPhase2Revive(world) {
    if (this.necroRevivePending || this.necroPhase >= 2) return;
    // First HP break: play phase 1 death sprite (1-witch die), then revive into phase 2 scream.
    this.necroPhase = 2;
    this.dead = true;
    this.state = NECRO_STATE.PHASE1_DEATH;
    this.necroPhase1DeathTimer = this.resolveNecroPhase1DeathDuration();
    this.hurtTimer = 0;
    this.vx = 0;
    this.vy = 0;
    this.facingLocked = false;
    this.necroRevivePending = false;
    this.necroReviveTimer = Math.max(0.8, this.necroCfg.phase2RespawnDelay);
    this.necroSkullPatternCompleted = true;
    this.necroSkullPatternStarted = false;
    this.necroSkullStage = NECRO_SKULL_STAGE.DONE;
    this.necroSkullTimer = 0;
    this.necroLampFireTimer = 0;
    this.necroChargeSkull = null;
    this.necroSummonPoint = null;
    this.necroScreamTimer = 0;
    this.necroScreamTickTimer = 0;
    this.necroScreamCooldownTimer = 0;
    this.necroScreamRingSpawned = 0;
    this.necroScreamRingTimer = 0;
    this.necroScreamRings = [];
    this.necroScreamBlastDone = false;
    this.necroScreamHandFireTimer = 0;
    this.necroPhase2AttackLatch = false;
    this.necroScreamSkyFireTimer = 0;
    this.necroPhase2RelocatePending = false;
    this.necroPhase2MoveStage = "idle";
    this.necroPhase2NextSide = -1;
    this.necroPhase2HoldTimer = 0;
    if (Array.isArray(world?.bossProjectiles)) {
      world.bossProjectiles.length = 0;
    }
  }

  updateNecroPhase2Revive(dt, world) {
    if (!this.necroRevivePending) return;
    this.necroReviveTimer = Math.max(0, this.necroReviveTimer - dt);
    if (this.necroReviveTimer > 0) return;

    this.necroRevivePending = false;
    this.dead = false;
    this.state = NECRO_STATE.ATTACK2_SCREAM;
    const hpRatio = Math.max(0.1, Math.min(1, this.necroCfg.phase2RespawnHpRatio));
    this.hp = Math.max(1, Math.ceil(this.maxHp * hpRatio));
    this.necroResumeState = NECRO_STATE.FLOAT_PHASE2;
    this.necroScreamTimer = Math.max(0.2, this.necroCfg.screamDuration);
    this.necroScreamTickTimer = 0;
    this.necroScreamRingSpawned = 0;
    this.necroScreamRingTimer = 0;
    this.necroScreamRings = [];
    this.necroScreamBlastDone = false;
    this.necroScreamHandFireTimer = 0;
    this.necroPhase2AttackLatch = false;
    this.necroScreamSkyFireTimer = 0;
    this.necroPhase2RelocatePending = false;
    this.necroPhase2MoveStage = "idle";
    this.necroPhase2NextSide = -1;
    this.necroPhase2HoldTimer = 0;
    this.necroScreamCooldownTimer = Math.max(0.1, this.necroCfg.screamCooldown);
    if (typeof world?.playSfx === "function") {
      world.playSfx("scream");
    }
    this.engaged = true;
    this.vx = 0;
    this.vy = 0;
    // Phase 2 should be grounded (no hovering/flying).
    const floorY = this.sampleNecroFloorY(world, this.center.x);
    this.necroFloorY = floorY;
    this.y =
      floorY
      - this.h
      - this.drawOffsetY
      + this.necroCfg.phase2GroundOffsetY;
    this.necroScreamHandFireTimer = Math.max(
      0.05,
      this.necroCfg.phase2HandFireInterval,
    );
    if (Array.isArray(world?.bossProjectiles)) {
      world.bossProjectiles.length = 0;
    }
  }

  startNecroScreamAttack(world = null) {
    this.state = NECRO_STATE.ATTACK2_SCREAM;
    this.necroPhase2RelocatePending = false;
    this.necroPhase2MoveStage = "idle";
    this.necroPhase2HoldTimer = 0;
    this.necroScreamTimer = Math.max(0.2, this.necroCfg.screamDuration);
    this.necroScreamTickTimer = 0;
    this.necroScreamRingSpawned = 0;
    this.necroScreamRingTimer = 0;
    this.necroScreamRings = [];
    this.necroScreamBlastDone = false;
    this.necroScreamSkyFireTimer = 0;
    this.necroScreamCooldownTimer = Math.max(0.1, this.necroCfg.screamCooldown);
    if (typeof world?.playSfx === "function") {
      world.playSfx("scream");
    }
  }

  rollNecroHandFireInterval() {
    const minGap = Math.max(0.05, this.necroCfg.phase2HandFireIntervalMin || this.necroCfg.phase2HandFireInterval);
    const maxGap = Math.max(minGap, this.necroCfg.phase2HandFireIntervalMax || minGap);
    return randomRange(minGap, maxGap);
  }

  updateNecroScreamAttack(dt, world) {
    this.necroScreamTimer = Math.max(0, this.necroScreamTimer - dt);

    const totalRings = Math.max(1, this.necroCfg.screamRingCount);
    const ringGap = Math.max(0.05, this.necroCfg.screamRingInterval);
    while (
      this.necroScreamRingSpawned < totalRings
      && this.necroScreamRingTimer <= 0
    ) {
      // Triple ring sequence during attack2 scream.
      this.spawnNecroScreamRing(world);
      this.necroScreamRingSpawned += 1;
      this.necroScreamRingTimer += ringGap;
    }

    if (this.necroScreamTimer <= 0) {
      // End of scream: single lantern burst to finish the combo.
      if (!this.necroScreamBlastDone) {
        this.fireNecroLanternBlast(world);
        this.necroScreamBlastDone = true;
      }
      this.necroScreamRings = [];
      this.necroScreamSkyFireTimer = 0;
      // Phase 2 movement pattern: pause, then move up/side/down before next attack.
      this.necroPhase2RelocatePending = this.necroPhase >= 2;
      this.necroPhase2MoveStage = "idle";
      this.necroPhase2HoldTimer = this.necroPhase2RelocatePending
        ? Math.max(0, this.necroCfg.phase2PostAttackPauseSec)
        : 0;
      this.necroScreamHandFireTimer = 0;
      this.state = NECRO_STATE.FLOAT_PHASE2;
    }
  }

  updateActiveNecroScreamRings(dt, world) {
    if (!Array.isArray(this.necroScreamRings) || this.necroScreamRings.length === 0) return;

    const player = world?.player || null;
    compactInPlace(this.necroScreamRings, (ring) => {
      ring.radius += ring.speed * dt;

      if (player && !player.dead && !ring.hitHero) {
        const dx = player.center.x - this.center.x;
        const dy = player.center.y - this.center.y;
        const dist = Math.hypot(dx, dy);
        const heroRadius = Math.max(player.w, player.h) * 0.3;
        const band = Math.abs(dist - ring.radius);
        const hitBand = ring.thickness * 0.5 + heroRadius;
        if (band <= hitBand) {
          ring.hitHero = true;
          const kbXDir = Math.sign(dx) || this.facing || 1;
          player.takeDamage(ring.damage, world, {
            knockbackX: kbXDir * this.necroCfg.screamRingKnockbackX,
            knockbackY: this.necroCfg.screamRingKnockbackY,
          });
        }
      }

      return ring.radius <= ring.maxRadius + ring.thickness;
    });
  }

  spawnNecroScreamRing(world) {
    if (!Array.isArray(this.necroScreamRings)) {
      this.necroScreamRings = [];
    }
    this.necroScreamRings.push({
      radius: 0,
      speed: this.necroCfg.screamRingSpeed,
      thickness: this.necroCfg.screamRingThickness,
      maxRadius: this.necroCfg.screamRingMaxRadius,
      damage: this.necroCfg.screamRingDamage,
      hitHero: false,
    });
    void world;
  }

  spawnNecroScreamHandFire(world) {
    if (!world || typeof world.launchBossProjectile !== "function") return;
    const source = this.getAttackHandAnchor();
    const player = world.player || null;
    const speed = Math.max(0.2, this.necroCfg.screamHandFireSpeed);
    const target = player
      ? predictTargetPosition(
        { x: source.x, y: source.y },
        player.center,
        { x: player.vx || 0, y: player.vy || 0 },
        speed,
        this.necroCfg.skullAimLead,
        this.necroCfg.skullAimLeadMaxFrames,
      )
      : { x: source.x + this.facing * 220, y: source.y };

    world.launchBossProjectile(this, {
      damage: this.necroCfg.screamHandFireDamage,
      speed,
      radius: this.necroCfg.screamHandFireRadius,
      range: 1200,
      life: 1.4,
      // Beach-style hand shot, but keep it ball-only (no beam/stick visuals).
      color: "#8be9ff",
      kind: "orb",
      spawnX: source.x,
      spawnY: source.y,
      targetX: target.x,
      targetY: target.y,
      spritePath: BOSS_PROJECTILE_SPRITES.crabBoss?.path,
      spriteScale: this.necroCfg.screamHandFireSpriteScale,
      forceNoSprite: true,
      ignoreTerrain: true,
      silentImpact: true,
    });
  }

  spawnNecroScreamSkyFireball(world) {
    if (!world || typeof world.launchBossProjectile !== "function") return;
    const arena = world.getArenaCollisionBounds?.() || null;
    let dropX = this.center.x + randomRange(-this.necroCfg.screamSkyFireSpreadX, this.necroCfg.screamSkyFireSpreadX);
    if (arena) {
      const pad = Math.max(12, this.necroCfg.arenaPadding);
      // Sky fire should fall from random sky positions, not directly above hero.
      dropX = randomRange(arena.x + pad, arena.x + arena.w - pad);
    }

    const floorY = this.sampleNecroFloorY(world, dropX);
    const spawnRatio = this.necroCfg.screamSkyFireSpawnYRatio;
    const ratioStartY = arena
      ? arena.y + arena.h * spawnRatio
      : floorY - this.necroCfg.screamSkyFireStartHeight;
    const startY = Math.min(floorY - 24, ratioStartY);
    const travelDistance = Math.max(24, floorY - startY);
    const fallDuration = Math.max(0.4, this.necroCfg.screamSkyFireFallDuration);
    // Projectile speed uses "pixels-per-frame @ 60fps"; compute from desired fall duration.
    const fallSpeed = travelDistance / (fallDuration * 60);
    const fireballSprite =
      BOSS_PROJECTILE_SPRITES.necroKingSkyFire
      || BOSS_PROJECTILE_SPRITES.crabBoss
      || null;
    const spritePath =
      typeof fireballSprite === "string"
        ? fireballSprite
        : fireballSprite?.path;

    world.launchBossProjectile(this, {
      damage: this.necroCfg.screamSkyFireDamage,
      speed: Math.max(0.2, Math.min(this.necroCfg.screamSkyFireSpeed, fallSpeed)),
      radius: this.necroCfg.screamSkyFireRadius,
      range: 20000,
      life: fallDuration + 0.8,
      color: "#ffb469",
      kind: "orb",
      dirX: 0,
      dirY: 1,
      spawnX: dropX,
      spawnY: startY,
      targetX: dropX,
      targetY: floorY,
      spritePath,
      spriteScale: this.necroCfg.screamSkyFireSpriteScale,
      spinRate: 0,
      ignoreTerrain: false,
      silentImpact: true,
    });
  }

  fireNecroLanternBlast(world) {
    const player = world?.player || null;
    const origin = this.getNecroLampAnchor();
    const facing = this.facing || 1;
    const range = Math.max(30, this.necroCfg.screamBlastRange);
    const halfAngleRad = (this.necroCfg.screamBlastHalfAngleDeg * Math.PI) / 180;

    if (!player || player.dead) return;
    const dx = player.center.x - origin.x;
    const dy = player.center.y - origin.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 0.001 || dist > range) return;

    const dirX = dx / dist;
    const dirY = dy / dist;
    const dot = Math.max(-1, Math.min(1, dirX * facing + dirY * 0));
    const angle = Math.acos(dot);
    if (angle > halfAngleRad) return;

    player.takeDamage(this.necroCfg.screamBlastDamage, world, {
      knockbackX: facing * this.necroCfg.screamBlastKnockbackX,
      knockbackY: this.necroCfg.screamBlastKnockbackY,
    });
  }

  updateNecroPhase2Relocation(dt, world) {
    if (this.necroPhase < 2 || !this.necroPhase2RelocatePending) return false;

    // Pause briefly after each scream+fire before moving to the other side.
    if (this.necroPhase2HoldTimer > 0) {
      this.updateNecroFloatMovement(dt, world, 0, false);
      return true;
    }

    const floorY = this.sampleNecroFloorY(world, this.center.x);
    this.necroFloorY = floorY;
    const groundY = floorY - this.h - this.drawOffsetY + this.necroCfg.phase2GroundOffsetY;
    const topY = groundY - Math.max(20, this.necroCfg.phase2TopOffsetY);
    const sideX = this.resolveNecroPhase2SideTargetX(world, this.necroPhase2NextSide);

    if (!this.necroPhase2MoveStage || this.necroPhase2MoveStage === "idle") {
      this.necroPhase2MoveStage = "rise";
    }

    if (this.necroPhase2MoveStage === "rise") {
      this.y = this.moveAxisToward(this.y, topY, this.necroCfg.phase2RiseSpeed, dt);
      this.vx = 0;
      if (Math.abs(this.y - topY) <= 0.01) {
        this.necroPhase2MoveStage = "slide";
      }
      return true;
    }

    if (this.necroPhase2MoveStage === "slide") {
      this.y = topY;
      this.x = this.moveAxisToward(this.x, sideX, this.necroCfg.phase2SlideSpeed, dt);
      this.vx = 0;
      if (Math.abs(this.x - sideX) <= 0.01) {
        this.necroPhase2MoveStage = "drop";
      }
      return true;
    }

    // Drop straight down on the new side, then immediately attack.
    this.x = sideX;
    this.y = this.moveAxisToward(this.y, groundY, this.necroCfg.phase2DropSpeed, dt);
    this.vx = 0;
    if (Math.abs(this.y - groundY) <= 0.01) {
      this.necroPhase2MoveStage = "idle";
      this.necroPhase2RelocatePending = false;
      this.necroPhase2NextSide *= -1;
      this.necroPhase2AttackLatch = false;
      // Wait at bottom before next attack cycle starts.
      this.necroScreamHandFireTimer = Math.max(0, this.necroCfg.phase2DownPauseSec);
    }
    return true;
  }

  resolveNecroPhase2SideTargetX(world, side) {
    const arena = world?.getArenaCollisionBounds?.() || null;
    if (!arena) return this.x;
    const pad = Math.max(0, this.necroCfg.arenaPadding);
    const minX = arena.x + pad;
    const maxX = arena.x + arena.w - this.w - pad;
    if (maxX <= minX) return minX;

    const minCenter = minX + this.w * 0.5;
    const maxCenter = maxX + this.w * 0.5;
    const ratio = Math.max(0.05, Math.min(0.45, this.necroCfg.phase2SideRatio));
    const span = maxCenter - minCenter;
    const targetCenter =
      side < 0
        ? minCenter + span * ratio
        : maxCenter - span * ratio;
    return targetCenter - this.w * 0.5;
  }

  moveAxisToward(current, target, speed, dt) {
    const step = Math.max(0.01, speed) * dt * 60;
    const delta = target - current;
    if (Math.abs(delta) <= step) return target;
    return current + Math.sign(delta) * step;
  }

  updateNecroFloatMovement(dt, world, speed, chaseHero) {
    const arena = world?.getArenaCollisionBounds?.() || null;
    const halfW = this.w * 0.5;
    const pad = Math.max(0, this.necroCfg.arenaPadding);
    const centerNow = this.center.x;
    let targetX = centerNow;

    if (chaseHero && world?.player) {
      targetX = world.player.center.x;
    }

    if (arena) {
      const minCenter = arena.x + pad + halfW;
      const maxCenter = arena.x + arena.w - pad - halfW;
      targetX = Math.max(minCenter, Math.min(maxCenter, targetX));
    }

    const dx = targetX - centerNow;
    const deadzone = Math.max(0, this.necroCfg.moveDeadzone);
    const slowMul = this.slowTimer > 0 ? 0.82 : 1;
    const desiredVx =
      Math.abs(dx) <= deadzone ? 0 : Math.sign(dx) * speed * slowMul;
    const smooth = Math.max(1, this.necroCfg.floatVelocitySmoothing);
    const blend = Math.min(1, dt * smooth);
    this.vx += (desiredVx - this.vx) * blend;

    this.x += this.vx * dt * 60;

    if (arena) {
      const minX = arena.x + pad;
      const maxX = arena.x + arena.w - this.w - pad;
      if (this.x < minX) {
        this.x = minX;
        this.vx = 0;
      } else if (this.x > maxX) {
        this.x = maxX;
        this.vx = 0;
      }
    }

    const floorY = this.sampleNecroFloorY(world, this.center.x);
    this.necroFloorY = floorY;
    const phase2Grounded = this.type === "necroKing" && this.necroPhase >= 2;
    this.necroHoverPhase +=
      dt
      * Math.max(
        0.1,
        phase2Grounded
          ? this.necroCfg.phase2VerticalFrequency
          : this.necroCfg.floatBobFrequency,
      )
      * Math.PI
      * 2;
    const bob = phase2Grounded
      ? Math.sin(this.necroHoverPhase) * this.necroCfg.phase2VerticalAmplitude
      : Math.sin(this.necroHoverPhase) * this.necroCfg.floatBobAmplitude;
    // Phase 1 uses ghost hover, phase 2 uses controlled vertical motion.
    const desiredY = phase2Grounded
      ? floorY - this.h - this.drawOffsetY + this.necroCfg.phase2GroundOffsetY + bob
      : floorY - this.h - this.necroCfg.bossFloatHeight + bob;
    const yBlend = clamp01(this.necroCfg.floatYLerp * dt * 60);
    this.y += (desiredY - this.y) * yBlend;
    this.vy = 0;
  }

  sampleNecroFloorY(world, worldX) {
    const map = world?.map;
    if (!map) return this.necroFloorY || this.y + this.h + this.necroCfg.bossFloatHeight;
    const tileSize = map.tileSize || CONST.GAME.TILE;
    const tx = Math.floor(worldX / tileSize);
    const startTy = Math.max(0, Math.floor((this.y + this.h) / tileSize));
    for (let ty = startTy; ty < map.height; ty += 1) {
      const tile = map.getTile(tx, ty);
      if (NECRO_SOLID_FLOOR_TILES.has(tile)) {
        return ty * tileSize;
      }
    }
    return this.necroFloorY || this.y + this.h + this.necroCfg.bossFloatHeight;
  }

  resolveNecroConfig(rawConfig = {}) {
    const merged = {
      ...DEFAULT_NECRO_CONFIG,
      ...(rawConfig || {}),
    };
    const lampDuration = Math.max(
      0.06,
      toFinite(merged.lampFireDuration, DEFAULT_NECRO_CONFIG.lampFireDuration),
    );
    const lampDurationMin = Math.max(
      0.06,
      toFinite(merged.lampFireDurationMin, lampDuration),
    );
    const lampDurationMax = Math.max(
      lampDurationMin,
      toFinite(merged.lampFireDurationMax, lampDurationMin),
    );
    return {
      introDuration: Math.max(0.05, toFinite(merged.introDuration, DEFAULT_NECRO_CONFIG.introDuration)),
      entryApproachDuration: Math.max(
        0.05,
        toFinite(
          merged.entryApproachDuration,
          DEFAULT_NECRO_CONFIG.entryApproachDuration,
        ),
      ),
      entryApproachSpeed: Math.max(
        0,
        toFinite(merged.entryApproachSpeed, DEFAULT_NECRO_CONFIG.entryApproachSpeed),
      ),
      floatMoveSpeedPhase1: Math.max(0, toFinite(merged.floatMoveSpeedPhase1, DEFAULT_NECRO_CONFIG.floatMoveSpeedPhase1)),
      floatMoveSpeedPhase2: Math.max(0, toFinite(merged.floatMoveSpeedPhase2, DEFAULT_NECRO_CONFIG.floatMoveSpeedPhase2)),
      floatMoveSpeedScream: Math.max(0, toFinite(merged.floatMoveSpeedScream, DEFAULT_NECRO_CONFIG.floatMoveSpeedScream)),
      moveDeadzone: Math.max(0, toFinite(merged.moveDeadzone, DEFAULT_NECRO_CONFIG.moveDeadzone)),
      floatVelocitySmoothing: Math.max(1, toFinite(merged.floatVelocitySmoothing, DEFAULT_NECRO_CONFIG.floatVelocitySmoothing)),
      bossFloatHeight: Math.max(0, toFinite(merged.bossFloatHeight, DEFAULT_NECRO_CONFIG.bossFloatHeight)),
      floatBobAmplitude: Math.max(0, toFinite(merged.floatBobAmplitude, DEFAULT_NECRO_CONFIG.floatBobAmplitude)),
      floatBobFrequency: Math.max(0, toFinite(merged.floatBobFrequency, DEFAULT_NECRO_CONFIG.floatBobFrequency)),
      floatYLerp: Math.max(0.01, toFinite(merged.floatYLerp, DEFAULT_NECRO_CONFIG.floatYLerp)),
      arenaPadding: Math.max(0, toFinite(merged.arenaPadding, DEFAULT_NECRO_CONFIG.arenaPadding)),
      phase1AttackDelay: Math.max(0, toFinite(merged.phase1AttackDelay, DEFAULT_NECRO_CONFIG.phase1AttackDelay)),
      phase1SkullCount: Math.max(1, Math.round(toFinite(merged.phase1SkullCount, DEFAULT_NECRO_CONFIG.phase1SkullCount))),
      phase1SkullInterval: Math.max(0.05, toFinite(merged.phase1SkullInterval, DEFAULT_NECRO_CONFIG.phase1SkullInterval)),
      skullGrowDuration: Math.max(0.05, toFinite(merged.skullGrowDuration, DEFAULT_NECRO_CONFIG.skullGrowDuration)),
      skullInitialScale: Math.max(0.05, toFinite(merged.skullInitialScale, DEFAULT_NECRO_CONFIG.skullInitialScale)),
      skullFinalScale: Math.max(0.05, toFinite(merged.skullFinalScale, DEFAULT_NECRO_CONFIG.skullFinalScale)),
      skullRadius: Math.max(4, toFinite(merged.skullRadius, DEFAULT_NECRO_CONFIG.skullRadius)),
      skullGroundOffset: Math.max(2, toFinite(merged.skullGroundOffset, DEFAULT_NECRO_CONFIG.skullGroundOffset)),
      skullSpeed: Math.max(0.2, toFinite(merged.skullSpeed, DEFAULT_NECRO_CONFIG.skullSpeed)),
      skullHitPoints: Math.max(1, Math.round(toFinite(merged.skullHitPoints, DEFAULT_NECRO_CONFIG.skullHitPoints))),
      skullRange: Math.max(40, toFinite(merged.skullRange, DEFAULT_NECRO_CONFIG.skullRange)),
      skullDamageMultiplier: Math.max(0.1, toFinite(merged.skullDamageMultiplier, DEFAULT_NECRO_CONFIG.skullDamageMultiplier)),
      skullAimLead: Math.max(0, toFinite(merged.skullAimLead, DEFAULT_NECRO_CONFIG.skullAimLead)),
      skullAimLeadMaxFrames: Math.max(0, Math.round(toFinite(merged.skullAimLeadMaxFrames, DEFAULT_NECRO_CONFIG.skullAimLeadMaxFrames))),
      lampFireDuration: lampDuration,
      lampFireDurationMin: lampDurationMin,
      lampFireDurationMax: lampDurationMax,
      lampFireOffsetX: toFinite(merged.lampFireOffsetX, DEFAULT_NECRO_CONFIG.lampFireOffsetX),
      lampFireLift: toFinite(merged.lampFireLift, DEFAULT_NECRO_CONFIG.lampFireLift),
      lampFireJitterX: Math.max(0, toFinite(merged.lampFireJitterX, DEFAULT_NECRO_CONFIG.lampFireJitterX)),
      phase2HandAnchorXRatio: Math.max(
        0.05,
        Math.min(
          0.45,
          toFinite(
            merged.phase2HandAnchorXRatio,
            DEFAULT_NECRO_CONFIG.phase2HandAnchorXRatio,
          ),
        ),
      ),
      phase2HandAnchorYRatio: Math.max(
        0.05,
        Math.min(
          0.45,
          toFinite(
            merged.phase2HandAnchorYRatio,
            DEFAULT_NECRO_CONFIG.phase2HandAnchorYRatio,
          ),
        ),
      ),
      phase2GroundOffsetY: Math.max(
        0,
        Math.min(
          24,
          toFinite(
            merged.phase2GroundOffsetY,
            DEFAULT_NECRO_CONFIG.phase2GroundOffsetY,
          ),
        ),
      ),
      phase2RespawnDelay: Math.max(0.2, toFinite(merged.phase2RespawnDelay, DEFAULT_NECRO_CONFIG.phase2RespawnDelay)),
      phase2RespawnHpRatio: Math.max(0.1, Math.min(1, toFinite(merged.phase2RespawnHpRatio, DEFAULT_NECRO_CONFIG.phase2RespawnHpRatio))),
      phase2TransitionDuration: Math.max(0.05, toFinite(merged.phase2TransitionDuration, DEFAULT_NECRO_CONFIG.phase2TransitionDuration)),
      phase2VerticalAmplitude: Math.max(
        0,
        Math.min(
          40,
          toFinite(
            merged.phase2VerticalAmplitude,
            DEFAULT_NECRO_CONFIG.phase2VerticalAmplitude,
          ),
        ),
      ),
      phase2VerticalFrequency: Math.max(
        0.05,
        Math.min(
          2,
          toFinite(
            merged.phase2VerticalFrequency,
            DEFAULT_NECRO_CONFIG.phase2VerticalFrequency,
          ),
        ),
      ),
      phase2TopOffsetY: Math.max(
        20,
        Math.min(
          420,
          toFinite(
            merged.phase2TopOffsetY,
            DEFAULT_NECRO_CONFIG.phase2TopOffsetY,
          ),
        ),
      ),
      phase2SideRatio: Math.max(
        0.05,
        Math.min(
          0.45,
          toFinite(
            merged.phase2SideRatio,
            DEFAULT_NECRO_CONFIG.phase2SideRatio,
          ),
        ),
      ),
      phase2RiseSpeed: Math.max(
        0.2,
        Math.min(
          10,
          toFinite(
            merged.phase2RiseSpeed,
            DEFAULT_NECRO_CONFIG.phase2RiseSpeed,
          ),
        ),
      ),
      phase2SlideSpeed: Math.max(
        0.2,
        Math.min(
          10,
          toFinite(
            merged.phase2SlideSpeed,
            DEFAULT_NECRO_CONFIG.phase2SlideSpeed,
          ),
        ),
      ),
      phase2DropSpeed: Math.max(
        0.2,
        Math.min(
          10,
          toFinite(
            merged.phase2DropSpeed,
            DEFAULT_NECRO_CONFIG.phase2DropSpeed,
          ),
        ),
      ),
      phase2PostAttackPauseSec: Math.max(
        0,
        Math.min(
          4,
          toFinite(
            merged.phase2PostAttackPauseSec,
            DEFAULT_NECRO_CONFIG.phase2PostAttackPauseSec,
          ),
        ),
      ),
      phase2DownPauseSec: Math.max(
        0,
        Math.min(
          8,
          toFinite(
            merged.phase2DownPauseSec,
            DEFAULT_NECRO_CONFIG.phase2DownPauseSec,
          ),
        ),
      ),
      screamDuration: Math.max(0.1, toFinite(merged.screamDuration, DEFAULT_NECRO_CONFIG.screamDuration)),
      screamRadius: Math.max(8, toFinite(merged.screamRadius, DEFAULT_NECRO_CONFIG.screamRadius)),
      screamDamage: Math.max(1, toFinite(merged.screamDamage, DEFAULT_NECRO_CONFIG.screamDamage)),
      screamTickInterval: Math.max(0.05, toFinite(merged.screamTickInterval, DEFAULT_NECRO_CONFIG.screamTickInterval)),
      screamRingCount: Math.max(1, Math.round(toFinite(merged.screamRingCount, DEFAULT_NECRO_CONFIG.screamRingCount))),
      screamRingInterval: Math.max(0.05, toFinite(merged.screamRingInterval, DEFAULT_NECRO_CONFIG.screamRingInterval)),
      screamRingSpeed: Math.max(20, toFinite(merged.screamRingSpeed, DEFAULT_NECRO_CONFIG.screamRingSpeed)),
      screamRingThickness: Math.max(4, toFinite(merged.screamRingThickness, DEFAULT_NECRO_CONFIG.screamRingThickness)),
      screamRingMaxRadius: Math.max(40, toFinite(merged.screamRingMaxRadius, DEFAULT_NECRO_CONFIG.screamRingMaxRadius)),
      screamRingDamage: Math.max(1, toFinite(merged.screamRingDamage, DEFAULT_NECRO_CONFIG.screamRingDamage)),
      screamRingKnockbackX: Math.max(0, toFinite(merged.screamRingKnockbackX, DEFAULT_NECRO_CONFIG.screamRingKnockbackX)),
      screamRingKnockbackY: toFinite(merged.screamRingKnockbackY, DEFAULT_NECRO_CONFIG.screamRingKnockbackY),
      phase2HandFireInterval: Math.max(0.05, toFinite(merged.phase2HandFireInterval, DEFAULT_NECRO_CONFIG.phase2HandFireInterval)),
      phase2HandFireIntervalMin: Math.max(
        0.05,
        toFinite(
          merged.phase2HandFireIntervalMin,
          toFinite(merged.phase2HandFireInterval, DEFAULT_NECRO_CONFIG.phase2HandFireIntervalMin),
        ),
      ),
      phase2HandFireIntervalMax: Math.max(
        Math.max(
          0.05,
          toFinite(
            merged.phase2HandFireIntervalMin,
            toFinite(merged.phase2HandFireInterval, DEFAULT_NECRO_CONFIG.phase2HandFireIntervalMin),
          ),
        ),
        toFinite(
          merged.phase2HandFireIntervalMax,
          toFinite(merged.phase2HandFireInterval, DEFAULT_NECRO_CONFIG.phase2HandFireIntervalMax),
        ),
      ),
      screamHandFireInterval: Math.max(0.05, toFinite(merged.screamHandFireInterval, DEFAULT_NECRO_CONFIG.screamHandFireInterval)),
      screamHandFireSpeed: Math.max(0.2, toFinite(merged.screamHandFireSpeed, DEFAULT_NECRO_CONFIG.screamHandFireSpeed)),
      screamHandFireRadius: Math.max(4, toFinite(merged.screamHandFireRadius, DEFAULT_NECRO_CONFIG.screamHandFireRadius)),
      screamHandFireDamage: Math.max(1, toFinite(merged.screamHandFireDamage, DEFAULT_NECRO_CONFIG.screamHandFireDamage)),
      screamHandFireSpriteScale: Math.max(0.2, toFinite(merged.screamHandFireSpriteScale, DEFAULT_NECRO_CONFIG.screamHandFireSpriteScale)),
      screamSkyFireInterval: Math.max(0.05, toFinite(merged.screamSkyFireInterval, DEFAULT_NECRO_CONFIG.screamSkyFireInterval)),
      screamSkyFireSpreadX: Math.max(0, toFinite(merged.screamSkyFireSpreadX, DEFAULT_NECRO_CONFIG.screamSkyFireSpreadX)),
      screamSkyFireStartHeight: Math.max(30, toFinite(merged.screamSkyFireStartHeight, DEFAULT_NECRO_CONFIG.screamSkyFireStartHeight)),
      screamSkyFireSpeed: Math.max(0.2, toFinite(merged.screamSkyFireSpeed, DEFAULT_NECRO_CONFIG.screamSkyFireSpeed)),
      screamSkyFireFallDuration: Math.max(0.4, toFinite(merged.screamSkyFireFallDuration, DEFAULT_NECRO_CONFIG.screamSkyFireFallDuration)),
      screamSkyFireSpawnYRatio: Math.max(0, Math.min(0.8, toFinite(merged.screamSkyFireSpawnYRatio, DEFAULT_NECRO_CONFIG.screamSkyFireSpawnYRatio))),
      screamSkyFireRadius: Math.max(4, toFinite(merged.screamSkyFireRadius, DEFAULT_NECRO_CONFIG.screamSkyFireRadius)),
      screamSkyFireDamage: Math.max(1, toFinite(merged.screamSkyFireDamage, DEFAULT_NECRO_CONFIG.screamSkyFireDamage)),
      screamSkyFireSpriteScale: Math.max(0.2, toFinite(merged.screamSkyFireSpriteScale, DEFAULT_NECRO_CONFIG.screamSkyFireSpriteScale)),
      screamBlastRange: Math.max(30, toFinite(merged.screamBlastRange, DEFAULT_NECRO_CONFIG.screamBlastRange)),
      screamBlastHalfAngleDeg: Math.max(
        5,
        Math.min(89, toFinite(merged.screamBlastHalfAngleDeg, DEFAULT_NECRO_CONFIG.screamBlastHalfAngleDeg)),
      ),
      screamBlastDamage: Math.max(1, toFinite(merged.screamBlastDamage, DEFAULT_NECRO_CONFIG.screamBlastDamage)),
      screamBlastKnockbackX: Math.max(0, toFinite(merged.screamBlastKnockbackX, DEFAULT_NECRO_CONFIG.screamBlastKnockbackX)),
      screamBlastKnockbackY: toFinite(merged.screamBlastKnockbackY, DEFAULT_NECRO_CONFIG.screamBlastKnockbackY),
      screamCooldown: Math.max(0.1, toFinite(merged.screamCooldown, DEFAULT_NECRO_CONFIG.screamCooldown)),
      immuneWhileScreaming: Boolean(merged.immuneWhileScreaming),
      hurtDurationSec: Math.max(0.05, toFinite(merged.hurtDurationSec, DEFAULT_NECRO_CONFIG.hurtDurationSec)),
      hitRetaliateWindowSec: Math.max(0.15, toFinite(merged.hitRetaliateWindowSec, DEFAULT_NECRO_CONFIG.hitRetaliateWindowSec)),
      hitRetaliateThreshold: Math.max(1, Math.round(toFinite(merged.hitRetaliateThreshold, DEFAULT_NECRO_CONFIG.hitRetaliateThreshold))),
      hitRetaliateCooldown: Math.max(0.1, toFinite(merged.hitRetaliateCooldown, DEFAULT_NECRO_CONFIG.hitRetaliateCooldown)),
      deathDurationSec: Math.max(0.1, toFinite(merged.deathDurationSec, DEFAULT_NECRO_CONFIG.deathDurationSec)),
    };
  }

  resetNecroRuntimeState() {
    this.necroPhase = 1;
    this.necroStateTimer = 0;
    this.necroSkullStage = NECRO_SKULL_STAGE.READY;
    this.necroSkullPatternStarted = false;
    this.necroSkullPatternCompleted = false;
    this.necroSkullsLaunched = 0;
    this.necroSkullTimer = 0;
    this.necroLampFireTimer = 0;
    this.necroCurrentLampFireDuration = this.necroCfg?.lampFireDuration || DEFAULT_NECRO_CONFIG.lampFireDuration;
    this.necroSummonPoint = null;
    this.necroChargeSkull = null;
    this.necroHoverPhase = randomRange(0, Math.PI * 2);
    this.necroFloorY = 0;
    this.necroResumeState = "";
    this.necroScreamTimer = 0;
    this.necroScreamTickTimer = 0;
    this.necroScreamCooldownTimer = 0;
    this.necroScreamRingSpawned = 0;
    this.necroScreamRingTimer = 0;
    this.necroScreamRings = [];
    this.necroScreamBlastDone = false;
    this.necroScreamHandFireTimer = 0;
    this.necroPhase2AttackLatch = false;
    this.necroScreamSkyFireTimer = 0;
    this.necroPhase2RelocatePending = false;
    this.necroPhase2MoveStage = "idle";
    this.necroPhase2NextSide = -1;
    this.necroPhase2HoldTimer = 0;
    this.necroRevivePending = false;
    this.necroReviveTimer = 0;
    this.necroPhase1DeathTimer = 0;
    this.necroHitRetaliateWindowTimer = 0;
    this.necroHitRetaliateCount = 0;
    this.necroHitRetaliateCooldownTimer = 0;
    this.necroDeathTimer = 0;
    this.necroDefeatHandled = false;
  }

  initNecroRuntime() {
    this.state = NECRO_STATE.INACTIVE;
    this.necroPhase = 1;
    this.necroSkullStage = NECRO_SKULL_STAGE.READY;
    this.necroSkullPatternStarted = false;
    this.necroSkullPatternCompleted = false;
    this.necroSkullsLaunched = 0;
    this.necroSkullTimer = 0;
    this.necroLampFireTimer = 0;
    this.necroCurrentLampFireDuration = this.necroCfg?.lampFireDuration || DEFAULT_NECRO_CONFIG.lampFireDuration;
    this.necroSummonPoint = null;
    this.necroChargeSkull = null;
    this.necroResumeState = "";
    this.necroScreamTimer = 0;
    this.necroScreamTickTimer = 0;
    this.necroScreamCooldownTimer = 0;
    this.necroScreamRingSpawned = 0;
    this.necroScreamRingTimer = 0;
    this.necroScreamRings = [];
    this.necroScreamBlastDone = false;
    this.necroScreamHandFireTimer = 0;
    this.necroPhase2AttackLatch = false;
    this.necroScreamSkyFireTimer = 0;
    this.necroPhase2RelocatePending = false;
    this.necroPhase2MoveStage = "idle";
    this.necroPhase2NextSide = -1;
    this.necroPhase2HoldTimer = 0;
    this.necroRevivePending = false;
    this.necroReviveTimer = 0;
    this.necroPhase1DeathTimer = 0;
    this.necroHitRetaliateWindowTimer = 0;
    this.necroHitRetaliateCount = 0;
    this.necroHitRetaliateCooldownTimer = 0;
    this.necroDeathTimer = this.resolveNecroDeathDuration();
    this.necroDefeatHandled = false;
    this.necroFloorY = this.y + this.h;
    this.y -= this.necroCfg.bossFloatHeight;
    this.vx = 0;
    this.vy = 0;
  }

  isNecroHurtState() {
    return (
      this.state === NECRO_STATE.HURT_PHASE1
      || this.state === NECRO_STATE.HURT_PHASE2
    );
  }

  isNecroImmuneNow() {
    return (
      this.type === "necroKing"
      && this.state === NECRO_STATE.ATTACK2_SCREAM
      && this.necroScreamTimer > 0
      && this.necroCfg.immuneWhileScreaming
    );
  }

  resolveNecroResumeState() {
    if (this.necroPhase >= 2) {
      if (this.state === NECRO_STATE.ATTACK2_SCREAM) {
        return NECRO_STATE.ATTACK2_SCREAM;
      }
      return NECRO_STATE.FLOAT_PHASE2;
    }

    if (this.necroSkullPatternCompleted) {
      return NECRO_STATE.FLOAT_PHASE1;
    }

    if (this.state === NECRO_STATE.ATTACK1_SKULL_SEQUENCE) {
      return NECRO_STATE.ATTACK1_SKULL_SEQUENCE;
    }

    return NECRO_STATE.FLOAT_PHASE1;
  }

  registerNecroHitRetaliation(world) {
    if (!this.engaged || this.dead || this.necroRevivePending) return;
    if (this.state === NECRO_STATE.ATTACK1_SKULL_SEQUENCE || this.state === NECRO_STATE.ATTACK2_SCREAM) return;

    const windowSec = Math.max(0.15, this.necroCfg.hitRetaliateWindowSec);
    const neededHits = Math.max(1, Math.round(this.necroCfg.hitRetaliateThreshold));
    const retaliateCooldown = Math.max(0.1, this.necroCfg.hitRetaliateCooldown);

    if (this.necroHitRetaliateWindowTimer <= 0) {
      this.necroHitRetaliateCount = 0;
    }
    this.necroHitRetaliateWindowTimer = windowSec;
    this.necroHitRetaliateCount += 1;

    if (this.necroHitRetaliateCount < neededHits) return;
    if (this.necroHitRetaliateCooldownTimer > 0) return;

    this.necroHitRetaliateCount = 0;
    this.necroHitRetaliateWindowTimer = 0;
    this.necroHitRetaliateCooldownTimer = retaliateCooldown;
    this.hurtTimer = 0;

    // Counter attack on hit-spam: boss immediately retaliates at close pressure.
    if (this.necroPhase >= 2) {
      if (this.necroPhase2RelocatePending) {
        return;
      }
      this.startNecroScreamAttack(world);
      this.necroScreamHandFireTimer = Math.max(0.05, this.necroCfg.phase2HandFireInterval);
      return;
    }

    this.startNecroPhase1AttackSequence();
  }

  resolveNecroDeathDuration() {
    const configured = Number(this.necroCfg?.deathDurationSec);
    if (Number.isFinite(configured) && configured > 0) {
      return configured;
    }
    const deathMeta = BOSS_SPRITE_META[this.type]?.death || null;
    const frames = Math.max(1, Number(deathMeta?.frameCount) || 1);
    const fps = Math.max(1, Number(deathMeta?.fps) || 5);
    return Math.max(0.5, frames / fps + 0.08);
  }

  resolveNecroPhase1DeathDuration() {
    const death1Meta = BOSS_SPRITE_META[this.type]?.death1 || null;
    const frames = Math.max(1, Number(death1Meta?.frameCount) || 1);
    const fps = Math.max(1, Number(death1Meta?.fps) || 5);
    return Math.max(0.3, frames / fps + 0.05);
  }

  getNecroPhase1DeathFrameInfo(sprite, spriteMeta = null) {
    const configuredFrameCount = Number(spriteMeta?.frameCount);
    const inferredFrameCount = this.inferFrameCountFromSprite(sprite);
    const frameCount = Math.max(
      1,
      Number.isFinite(configuredFrameCount) && configuredFrameCount > 0
        ? Math.round(configuredFrameCount)
        : inferredFrameCount,
    );
    if (frameCount === 1) {
      return { frameCount: 1, frameIndex: 0 };
    }
    const duration = Math.max(0.001, this.resolveNecroPhase1DeathDuration());
    const elapsed = Math.max(0, duration - (Number(this.necroPhase1DeathTimer) || 0));
    const progress = clamp01(elapsed / duration);
    const frameIndex = Math.min(frameCount - 1, Math.floor(progress * frameCount));
    return { frameCount, frameIndex };
  }

  startNecroDeath(world) {
    if (this.dead) return;
    this.dead = true;
    this.state = NECRO_STATE.DEAD;
    this.necroRevivePending = false;
    this.necroReviveTimer = 0;
    this.hurtTimer = 0;
    this.vx = 0;
    this.vy = 0;
    this.facingLocked = false;
    this.necroChargeSkull = null;
    this.necroSkullStage = NECRO_SKULL_STAGE.DONE;
    this.necroSkullTimer = 0;
    this.necroLampFireTimer = 0;
    this.necroScreamTimer = 0;
    this.necroScreamTickTimer = 0;
    this.necroScreamRingSpawned = 0;
    this.necroScreamRingTimer = 0;
    this.necroScreamRings = [];
    this.necroScreamBlastDone = false;
    this.necroScreamHandFireTimer = 0;
    this.necroScreamSkyFireTimer = 0;
    const floorY = this.sampleNecroFloorY(world, this.center.x);
    this.necroFloorY = floorY;
    // Final defeat should settle exactly on floor (account for draw offset).
    this.y =
      floorY
      - this.h
      - this.drawOffsetY
      + this.necroCfg.phase2GroundOffsetY;
    this.necroDeathTimer = this.resolveNecroDeathDuration();
    this.necroDefeatHandled = false;
    if (Array.isArray(world?.bossProjectiles)) {
      world.bossProjectiles.length = 0;
    }
  }

  updateNecroDeath(dt, world) {
    if (!this.dead) return;
    this.necroDeathTimer = Math.max(0, this.necroDeathTimer - dt);
    if (this.necroDefeatHandled || this.necroDeathTimer > 0) return;
    this.necroDefeatHandled = true;
    world?.onBossDefeated?.();
    this.active = false;
  }

  startStandardDeath(world) {
    if (this.dead) return;
    this.dead = true;
    this.state = "Death";
    this.facingLocked = false;
    this.evadeTimer = 0;
    this.pendingEvadeCounterAttack = false;
    this.attackWindupTimer = 0;
    this.attackCd = 0;
    this.hurtTimer = 0;
    this.damageShieldTimer = 0;
    this.telegraphTimer = 0;
    this.vx = 0;
    this.vy = 0;
    this.burnTimer = 0;
    this.burnTick = 0;
    this.standardDeathDuration = this.resolveStandardDeathDuration();
    this.standardDeathTimer = this.standardDeathDuration;
    this.standardDeathDefeatHandled = false;
    if (Array.isArray(world?.bossProjectiles)) {
      world.bossProjectiles.length = 0;
    }
  }

  updateStandardDeath(dt, world) {
    if (!this.dead || this.type === "necroKing" || this.iceRebirthActive) return;
    this.vx = 0;
    this.vy = 0;
    this.standardDeathTimer = Math.max(
      0,
      (Number(this.standardDeathTimer) || 0) - dt,
    );
    if (this.standardDeathDefeatHandled || this.standardDeathTimer > 0) return;
    this.standardDeathDefeatHandled = true;
    world?.onBossDefeated?.();
    this.active = false;
  }

  startIceRebirth(world) {
    if (this.type !== "iceTitan" || this.iceRebirthActive) return;
    this.iceRebirthDeathDuration = this.resolveIceRebirthDeathDuration();
    this.iceRebirthFormDuration = this.resolveIceRebirthFormDuration();
    this.dead = true;
    this.state = "Death";
    this.iceRebirthActive = true;
    this.iceRebirthStage = "death";
    this.iceRebirthTimer = this.iceRebirthDeathDuration;
    this.iceRebirthDefeatHandled = false;
    this.facingLocked = false;
    this.evadeTimer = 0;
    this.pendingEvadeCounterAttack = false;
    this.attackWindupTimer = 0;
    this.attackCd = 0;
    this.vx = 0;
    this.vy = 0;
    this.burnTimer = 0;
    this.burnTick = 0;
    if (Array.isArray(world?.bossProjectiles)) {
      world.bossProjectiles.length = 0;
    }
  }

  updateIceRebirth(dt, world) {
    if (!this.iceRebirthActive || this.type !== "iceTitan") return;
    this.iceRebirthTimer = Math.max(0, this.iceRebirthTimer - dt);
    this.vx = 0;
    this.vy = 0;

    if (this.iceRebirthStage === "death") {
      this.state = "Death";
      if (this.iceRebirthTimer > 0) return;
      if (!this.iceRebirthDefeatHandled) {
        this.iceRebirthDefeatHandled = true;
        const spawnedChildren = this.spawnIceRebirthChildren(world);
        if (spawnedChildren > 0) {
          world?.onIceRebirthChildrenSpawned?.(spawnedChildren);
        } else {
          world?.onBossDefeated?.();
        }
      }
      this.iceRebirthActive = false;
      this.active = false;
      return;
    }
  }

  spawnIceRebirthChildren(world) {
    if (!world || typeof world.spawnEnemy !== "function") return 0;
    const count = Math.max(1, ICE_REBIRTH_CHILD_COUNT);
    const centerIndex = (count - 1) * 0.5;
    const childWidth = Math.max(
      48,
      Number.isFinite(ICE_REBIRTH_CHILD_ORIGIN_WIDTH)
        ? ICE_REBIRTH_CHILD_ORIGIN_WIDTH
        : Math.round(this.w * ICE_REBIRTH_CHILD_SIZE_RATIO),
    );
    const childHeight = Math.max(
      52,
      Number.isFinite(ICE_REBIRTH_CHILD_ORIGIN_HEIGHT)
        ? ICE_REBIRTH_CHILD_ORIGIN_HEIGHT
        : Math.round(this.h * ICE_REBIRTH_CHILD_SIZE_RATIO),
    );
    const spawnBottomY = this.y + this.h;
    const childTopY = spawnBottomY - childHeight;
    const hero = world?.player || null;
    let spawnedCount = 0;
    for (let i = 0; i < count; i += 1) {
      const offset = (i - centerIndex) * ICE_REBIRTH_CHILD_SPREAD_PX;
      const spawnCenterX = this.center.x + offset;
      const child = world.spawnEnemy("iceTitan", spawnCenterX - childWidth * 0.5, childTopY, {
        isBossMinion: true,
        challengeTag: "ice_rebirth_child",
        forceSpawnDuringArenaLock: true,
        forceAggroHero: true,
        spawnRebirthVisualSec: 3.2,
      });
      if (child) {
        spawnedCount += 1;
        // Keep rebirth child size aligned with the defeated boss size.
        child.w = childWidth;
        child.h = childHeight;
        child.x = spawnCenterX - child.w * 0.5;
        child.y = spawnBottomY - child.h;
        child.spawnX = child.x;
        child.spawnY = child.y;
        const towardHero = hero ? Math.sign(hero.center.x - child.center.x) : 0;
        child.facing = towardHero || (offset >= 0 ? -1 : 1);
        child.vx = child.cfg.speed * child.facing;
        // Rebirth children should pressure the hero immediately after spawning.
        child.forceAggroHero = true;
        child.state = "Chase";
        const childHp = Math.max(1, Math.round(child.maxHp * 0.45));
        child.maxHp = childHp;
        child.hp = Math.min(child.hp, childHp);
        child.attackTimer = 0;
        child.attackCooldown = 0;
        child.rangedCooldown = 0;
      }
      world.createTelegraph?.(
        spawnCenterX,
        childTopY + 58,
        26,
        "rgba(162,236,255,0.9)",
        0.25,
      );
    }
    return spawnedCount;
  }

  applyBurn(dt, world) {
    if (this.burnTimer <= 0) return;
    this.burnTimer = Math.max(0, this.burnTimer - dt);
    if (this.isNecroImmuneNow()) {
      this.burnTick = 0;
      return;
    }
    if (this.damageShieldTimer > 0) {
      // Shield suppresses additional hero DOT ticks while still letting burn expire naturally.
      this.burnTick = 0;
      return;
    }
    this.burnTick += dt;

    while (this.burnTick >= 0.5 && !this.dead) {
      this.burnTick -= 0.5;
      this.hp -= this.burnDps * 0.5;
      if (this.hp <= 0) {
        this.hp = 0;
        if (this.type === "necroKing") {
          if (this.necroPhase <= 1) {
            this.startNecroPhase2Revive(world);
          } else {
            this.startNecroDeath(world);
          }
          return;
        }
        if (this.type === "iceTitan") {
          this.startIceRebirth(world);
          return;
        }
        this.startStandardDeath(world);
        return;
      }
    }
  }

  getDamage() {
    const mult = this.enraged ? BOSS_ENRAGE.damageMultiplier : 1;
    return this.cfg.baseDamage * mult;
  }

  startPrimaryAttackWindup(speedMult = 1, world = null) {
    const player = world?.player || null;
    if (player && !player.dead) {
      const dxToPlayer = player.center.x - this.center.x;
      this.facing = resolveFacingWithDeadzone(
        this.facing,
        dxToPlayer,
        BOSS_FACING_DEADZONE,
        false,
      );
    }
    const baseWindup = this.type === "iceTitan"
      ? 0.44
      : this.type === "crabBoss"
        ? 0.52
        : 0.28;
    this.attackWindupDuration = this.enraged ? baseWindup * 0.84 : baseWindup;
    this.attackWindupTimer = this.attackWindupDuration;
    this.pendingPrimarySpeedMult = speedMult;
    this.facingLocked = true;
    this.state = "AttackPattern1";
    this.telegraphTimer = Math.max(this.telegraphTimer, this.attackWindupDuration * 0.7);
  }

  releasePrimaryAttack(world, speedMult = 1) {
    this.attackWindupTimer = 0;
    this.facingLocked = false;
    const isIceShardThrow = this.type === "iceTitan";
    const isCrabBeam = this.type === "crabBoss";
    const projectileSpeed = (
      isCrabBeam ? 8.6 : isIceShardThrow ? 6.8 : 5.8
    ) * speedMult;
    const hand = this.getAttackHandAnchor();
    const player = world?.player || null;
    const heroAboveBoss = isIceShardThrow
      && player
      && this.center.y - player.center.y >= BOSS_ABOVE_VERTICAL_GAP;
    const heroDirectlyAbove = heroAboveBoss
      && Math.abs(player.center.x - this.center.x) <= BOSS_ABOVE_HORIZONTAL_BAND;
    const launchFromHand = isCrabBeam || (isIceShardThrow && !heroDirectlyAbove);
    const launchOrigin = launchFromHand ? hand : this.center;
    const target = heroDirectlyAbove && player
      ? { x: launchOrigin.x, y: player.center.y }
      : this.buildPrimaryAttackTarget(world, launchOrigin, projectileSpeed);
    const useManualSpawn = launchFromHand || heroDirectlyAbove;
    world.launchBossProjectile(this, {
      damage: this.getDamage(),
      speed: projectileSpeed,
      radius: isCrabBeam ? 14 : isIceShardThrow ? 20 : this.type === "crabBoss" ? 16 : 12,
      range: isCrabBeam ? 760 : isIceShardThrow ? 760 : 520,
      color: isCrabBeam
        ? (this.enraged ? "#5dc7ff" : "#8be9ff")
        : isIceShardThrow
          ? (this.enraged ? "#7fd8ff" : "#b5efff")
          : (this.enraged ? "#76ccff" : "#98deff"),
      kind: isCrabBeam ? "beam" : "orb",
      trailLength: isCrabBeam ? 130 : 0,
      spawnX: useManualSpawn ? launchOrigin.x : undefined,
      spawnY: useManualSpawn ? launchOrigin.y : undefined,
      targetX: target.x,
      targetY: target.y,
      spinRate: isIceShardThrow ? 0 : undefined,
      orientToVelocity: true,
    });
    const baseCooldown = Number.isFinite(this.cfg.attackCooldownSec)
      ? this.cfg.attackCooldownSec
      : 2.4;
    this.attackCd = baseCooldown / speedMult;
  }

  castSpecial(world) {
    this.state = "Special";
    this.facingLocked = false;
    this.telegraphTimer = 0.32;
    if (typeof world.damagePlayerIfInRadius === "function") {
      const specialRadius = this.type === "crabBoss" ? 132 : 116;
      world.damagePlayerIfInRadius(
        this.center,
        specialRadius,
        this.getDamage() * 1.25,
      );
    }
    this.attackCd = Number.isFinite(this.cfg.specialCooldownSec)
      ? this.cfg.specialCooldownSec
      : 1.6;
  }

  applyGravityAndMovement(dt, world, canMove, options = {}) {
    const forcedDirection = Number(options?.forcedDirection);
    const hasForcedDirection =
      Number.isFinite(forcedDirection) && Math.abs(forcedDirection) > 0;
    const useCrabBossSwim =
      this.type === "crabBoss" &&
      world?.levelData?.world === "water" &&
      !hasForcedDirection;
    if (useCrabBossSwim) {
      this.applyCrabBossSwimMovement(dt, world, canMove);
      return;
    }
    if (canMove || hasForcedDirection) {
      const slowMul = this.slowTimer > 0 ? 0.85 : 1;
      const direction = hasForcedDirection ? Math.sign(forcedDirection) : this.facing;
      const speedScale = Number.isFinite(options?.speedScale)
        ? Math.max(0, Number(options.speedScale))
        : 1;
      if (hasForcedDirection) this.facing = direction;
      this.vx =
        direction *
        this.cfg.moveSpeed *
        slowMul *
        (this.enraged ? 1.1 : 1) *
        speedScale;
    }

    this.vy = Math.min(CONST.PHYSICS.MaxFallSpeed, this.vy + CONST.PHYSICS.Gravity);
    resolveEntityMovement(this, world.map, dt, { arenaLock: world.getArenaCollisionBounds() });
    this.vx *= this.onGround ? CONST.PHYSICS.GroundFriction : 0.98;
  }

  resolveSeaGuardianSwimBounds(world) {
    const arena = world?.getArenaCollisionBounds?.() || null;
    if (arena) {
      const minX = arena.x + 8;
      const maxX = Math.max(minX, arena.x + arena.w - this.w - 8);
      const minY = arena.y + 8;
      const maxY = Math.max(minY, arena.y + arena.h - this.h - 8);
      return { minX, maxX, minY, maxY };
    }

    const map = world?.map || null;
    const tileSize = Number(map?.tileSize) || CONST.GAME.TILE;
    const mapWidthPx =
      Number.isFinite(Number(map?.width)) && Number(map.width) > 0
        ? Number(map.width) * tileSize
        : this.x + this.w + 1;
    const mapHeightPx =
      Number.isFinite(Number(map?.height)) && Number(map.height) > 0
        ? Number(map.height) * tileSize
        : this.y + this.h + 1;
    const minX = 4;
    const maxX = Math.max(minX, mapWidthPx - this.w - 4);
    const minY = tileSize * 1.2;
    const maxY = Math.max(minY, mapHeightPx - this.h - tileSize * 1.1);
    return { minX, maxX, minY, maxY };
  }

  pickSeaGuardianSwimTarget(bounds, world) {
    const player = world?.player || null;
    if (player && !player.dead) {
      const targetX =
        player.center.x -
        this.w * 0.5 +
        randomRange(
          -SEA_GUARDIAN_HERO_TARGET_X_JITTER,
          SEA_GUARDIAN_HERO_TARGET_X_JITTER,
        );
      const targetY =
        player.center.y -
        this.h * 0.5 +
        randomRange(
          -SEA_GUARDIAN_HERO_TARGET_Y_JITTER,
          SEA_GUARDIAN_HERO_TARGET_Y_JITTER,
        );
      this.seaSwimTargetX = Math.max(bounds.minX, Math.min(bounds.maxX, targetX));
      this.seaSwimTargetY = Math.max(bounds.minY, Math.min(bounds.maxY, targetY));
    } else {
      this.seaSwimTargetX = randomRange(bounds.minX, bounds.maxX);
      this.seaSwimTargetY = randomRange(bounds.minY, bounds.maxY);
    }
    this.seaSwimRetargetTimer = randomRange(
      SEA_GUARDIAN_SWIM_RETARGET_MIN_SEC,
      SEA_GUARDIAN_SWIM_RETARGET_MAX_SEC,
    );
  }

  applyCrabBossSwimMovement(dt, world, canMove) {
    const bounds = this.resolveSeaGuardianSwimBounds(world);
    this.seaSwimRetargetTimer = Math.max(0, this.seaSwimRetargetTimer - dt);
    const hasTarget =
      Number.isFinite(this.seaSwimTargetX) && Number.isFinite(this.seaSwimTargetY);
    if (!hasTarget || this.seaSwimRetargetTimer <= 0) {
      this.pickSeaGuardianSwimTarget(bounds, world);
    }

    let dx = this.seaSwimTargetX - this.x;
    let dy = this.seaSwimTargetY - this.y;
    let dist = Math.hypot(dx, dy);
    if (dist <= SEA_GUARDIAN_SWIM_REACHED_DISTANCE) {
      this.pickSeaGuardianSwimTarget(bounds, world);
      dx = this.seaSwimTargetX - this.x;
      dy = this.seaSwimTargetY - this.y;
      dist = Math.hypot(dx, dy);
    }

    const speedMul = this.slowTimer > 0 ? 0.85 : 1;
    const moveScale = canMove ? 0.96 : 0.44;
    const speed =
      this.cfg.moveSpeed *
      speedMul *
      (this.enraged ? 1.14 : 1) *
      moveScale;

    if (dist > 0.001) {
      this.vx = (dx / dist) * speed;
      this.vy = (dy / dist) * speed;
    } else {
      this.vx = 0;
      this.vy = 0;
    }

    resolveEntityMovement(this, world.map, dt, {
      arenaLock: world.getArenaCollisionBounds(),
    });
    this.onGround = false;
    this.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.x));
    this.y = Math.max(bounds.minY, Math.min(bounds.maxY, this.y));
    const player = world?.player || null;
    if (!this.facingLocked && player && !player.dead) {
      const dxToPlayer = player.center.x - this.center.x;
      this.facing = resolveFacingWithDeadzone(
        this.facing,
        dxToPlayer,
        BOSS_FACING_DEADZONE,
        false,
      );
    } else if (!this.facingLocked && Math.abs(this.vx) > 0.05) {
      this.facing = this.vx >= 0 ? 1 : -1;
    }
  }

  takeDamage(amount, world, effects = {}) {
    if (this.type === "necroKing") {
      return this.takeNecroDamage(amount, world, effects);
    }

    if (this.iceRebirthActive) return false;
    if (this.dead) return false;
    const isCrabBossDirectStomp =
      this.type === "crabBoss" && effects?.direct === true;
    if (this.damageShieldTimer > 0) {
      if (!isCrabBossDirectStomp) {
        this.registerStandardHitRetaliation(world);
      }
      if (isCrabBossDirectStomp) {
        // Do not force Hurt on blocked stomps; otherwise continuous jump-stomps
        // can keep resetting hurt and prevent crab boss attacks/counters.
        this.telegraphTimer = Math.max(this.telegraphTimer, 0.08);
      }
      return false;
    }
    const hitAmount = Math.max(0, Number(amount) || 0);
    if (hitAmount <= 0) return false;

    this.hp -= hitAmount;

    if (effects.burnSec) {
      this.burnTimer = Math.max(this.burnTimer, effects.burnSec);
      this.burnDps = effects.burnDps || 2;
    }
    if (effects.slowSec) {
      this.slowTimer = Math.max(this.slowTimer, effects.slowSec);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      if (this.type === "iceTitan") {
        this.startIceRebirth(world);
        return true;
      }
      this.startStandardDeath(world);
      return true;
    }

    if (!isCrabBossDirectStomp && this.registerStandardHitRetaliation(world)) {
      return true;
    }

    this.attackWindupTimer = 0;
    this.evadeTimer = 0;
    this.pendingEvadeCounterAttack = false;
    this.facingLocked = false;
    this.state = "Hurt";
    this.hurtTimer = this.resolveHurtDuration();
    this.activateDamageShield();
    return true;
  }

  takeNecroDamage(amount, world, effects = {}) {
    if (this.dead) return false;
    if (this.isNecroImmuneNow()) {
      // State-based immunity: the scream window ignores all incoming hero damage.
      world?.createTelegraph?.(
        this.center.x,
        this.center.y,
        Math.max(this.w, this.h) * 0.4,
        "rgba(170,220,255,0.9)",
        0.16,
      );
      return false;
    }
    // Anti-stunlock window so continuous hero hits do not permanently lock boss in hurt.
    if (this.damageShieldTimer > 0) {
      this.registerNecroHitRetaliation(world);
      return false;
    }
    const hitAmount = Math.max(0, Number(amount) || 0);
    if (hitAmount <= 0) return false;
    this.hp -= hitAmount;

    if (effects.burnSec) {
      this.burnTimer = Math.max(this.burnTimer, effects.burnSec);
      this.burnDps = effects.burnDps || 2;
    }
    if (effects.slowSec) {
      this.slowTimer = Math.max(this.slowTimer, effects.slowSec);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      if (this.necroPhase <= 1) {
        this.startNecroPhase2Revive(world);
      } else {
        this.startNecroDeath(world);
      }
      return true;
    }

    this.necroResumeState = this.resolveNecroResumeState();
    this.hurtTimer = this.necroCfg.hurtDurationSec;
    this.state = this.necroPhase >= 2 ? NECRO_STATE.HURT_PHASE2 : NECRO_STATE.HURT_PHASE1;
    this.registerNecroHitRetaliation(world);
    this.activateDamageShield();
    return true;
  }

  draw(ctx, camera) {
    if (!this.active) return;
    if (this.type === "necroKing" && this.necroRevivePending) return;
    const x = this.x - camera.x;
    const y = this.y - camera.y + this.drawOffsetY;
    const spriteKey =
      this.type === "necroKing"
        ? this.resolveNecroSpriteKey()
        : this.resolveStandardSpriteKey();
    const spritePath = BOSS_SPRITES[this.type]?.[spriteKey] || BOSS_SPRITES[this.type]?.idle;
    const sprite = spritePath ? getImage(spritePath) : null;
    const spriteMeta =
      BOSS_SPRITE_META[this.type]?.[spriteKey]
      || BOSS_SPRITE_META[this.type]?.idle
      || null;

    if (sprite) {
      const isIceRebirthDeath =
        this.type === "iceTitan"
        && this.iceRebirthActive
        && this.iceRebirthStage === "death"
        && this.state === "Death";
      const isIceRebirthForm =
        this.type === "iceTitan"
        && this.iceRebirthActive
        && this.iceRebirthStage === "rebirth"
        && this.state === "Rebirth";
      const isStandardDeath =
        this.type !== "necroKing"
        && !isIceRebirthDeath
        && this.dead
        && this.state === "Death";
      const frameInfo =
        this.type === "necroKing" && this.state === NECRO_STATE.DEAD
          ? this.getNecroDeathFrameInfo(sprite, spriteMeta)
          : this.type === "necroKing" && this.state === NECRO_STATE.PHASE1_DEATH
            ? this.getNecroPhase1DeathFrameInfo(sprite, spriteMeta)
          : isIceRebirthDeath
            ? this.getIceRebirthDeathFrameInfo(sprite, spriteMeta)
          : isIceRebirthForm
            ? this.getIceRebirthFormFrameInfo(sprite, spriteMeta)
          : isStandardDeath
            ? this.getStandardDeathFrameInfo(sprite, spriteMeta)
          : this.getSpriteFrameInfo(sprite, spriteMeta);
      const deathFrameBounds = isIceRebirthDeath
        ? ICE_TITAN_DEATH_FRAME_BOUNDS[
          Math.max(
            0,
            Math.min(
              ICE_TITAN_DEATH_FRAME_BOUNDS.length - 1,
              frameInfo.frameIndex,
            ),
          )
        ]
        : null;
      const frameW = deathFrameBounds
        ? deathFrameBounds.w
        : Math.max(
          1,
          Math.floor(sprite.width / Math.max(1, frameInfo.frameCount)),
        );
      const sx = deathFrameBounds
        ? deathFrameBounds.x
        : Math.max(
          0,
          Math.min(
            sprite.width - frameW,
            frameInfo.frameIndex * frameW,
          ),
        );
      const frameAspect = frameW / Math.max(1, sprite.height);
      const keepExactBounds =
        this.type === "iceTitan";
      const drawH = this.h;
      const baseDrawW = keepExactBounds ? this.w : drawH * frameAspect;
      const drawW = baseDrawW;
      const drawX = x + (this.w - drawW) * 0.5;
      ctx.save();
      const shouldMirror = this.type === "iceTitan"
        ? this.facing > 0
        : this.facing < 0;
      if (shouldMirror) {
        ctx.translate(drawX + drawW, y);
        ctx.scale(-1, 1);
        ctx.drawImage(
          sprite,
          sx,
          0,
          frameW,
          sprite.height,
          0,
          0,
          drawW,
          drawH,
        );
      } else {
        ctx.drawImage(
          sprite,
          sx,
          0,
          frameW,
          sprite.height,
          drawX,
          y,
          drawW,
          drawH,
        );
      }
      ctx.restore();
    } else {
      const gradient = ctx.createLinearGradient(x, y, x, y + this.h);
      gradient.addColorStop(0, this.enraged ? "#c63a3a" : "#7a8ca2");
      gradient.addColorStop(1, this.enraged ? "#6a1111" : "#2c3c50");
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, this.w, this.h);
    }

    if (this.type === "necroKing") {
      this.drawNecroLampFireEffect(ctx, camera);
      this.drawNecroChargingSkull(ctx, camera);
      this.drawNecroScreamRings(ctx, camera);
    }

    if (
      this.type !== "necroKing"
      && this.type !== "iceTitan"
      && this.state === "AttackPattern1"
      && this.attackWindupTimer > 0
    ) {
      const isSandBoss = this.type === "sandBoss";
      if (!isSandBoss) {
        const duration = Math.max(0.001, this.attackWindupDuration || 0.001);
        const progress = Math.max(0, Math.min(1, 1 - this.attackWindupTimer / duration));
        const hand = this.getAttackHandAnchor();
        const handX = hand.x - camera.x;
        const handY = hand.y - camera.y;
        const coreRadius = 4 + progress * 8;
        const glowRadius = coreRadius * 2.2;
        const coreColor = this.type === "crabBoss" ? "#9cefff" : "#ffd5a3";
        const glowColor = this.type === "crabBoss" ? "rgba(115,226,255,0.45)" : "rgba(255,180,120,0.42)";

        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(handX, handY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.arc(handX, handY, coreRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (this.isDamageShieldActive()) {
      this.drawDamageShield(ctx, x + this.w * 0.5, y + this.h * 0.5);
    }

    if (this.dead) return;
    if (!this.engaged) return;

    const hpRatio = this.hp / this.maxHp;
    ctx.fillStyle = "rgba(15,15,20,0.8)";
    ctx.fillRect(x - 4, y - 14, this.w + 8, 8);
    ctx.fillStyle = "#e04d4d";
    ctx.fillRect(x - 4, y - 14, (this.w + 8) * hpRatio, 8);
  }

  resolveNecroSpriteKey() {
    if (this.state === NECRO_STATE.DEAD) return "death";
    if (this.state === NECRO_STATE.PHASE1_DEATH) return "death1";
    if (this.state === NECRO_STATE.HURT_PHASE2) return "hurt2";
    if (this.state === NECRO_STATE.HURT_PHASE1) return "hurt";
    if (this.state === NECRO_STATE.ATTACK1_SKULL_SEQUENCE) return "attack1";
    if (this.state === NECRO_STATE.ATTACK2_SCREAM) return "attack2";
    if (this.state === NECRO_STATE.TRANSITION || this.state === NECRO_STATE.FLOAT_PHASE2) {
      return "walk2";
    }
    return "idle";
  }

  resolveStandardSpriteKey() {
    if (this.state === "Rebirth") return "rebirth";
    if (this.state === "Death" || this.dead) return "death";
    if (this.state === "Hurt") return "hurt";
    if (this.state === "Evade") return "attack2";
    if (this.state === "AttackPattern1") return "attack1";
    if (this.state === "AttackPattern2") return "attack2";
    if (this.state === "Special" || this.state === "PhaseTransition" || this.state === "Enrage") {
      return "special";
    }
    return "idle";
  }

  drawNecroLampFireEffect(ctx, camera) {
    if (this.state !== NECRO_STATE.ATTACK1_SKULL_SEQUENCE) return;
    if (this.necroLampFireTimer <= 0 || !this.necroSummonPoint) return;

    const toX = this.necroSummonPoint.x - camera.x;
    const toY = this.necroSummonPoint.y - camera.y;
    const duration = Math.max(
      0.001,
      this.necroCurrentLampFireDuration || this.necroCfg.lampFireDuration,
    );
    const progress = clamp01(1 - this.necroLampFireTimer / duration);

    ctx.save();
    // Requested visual: no beam/ray line. Only short flame pulse before skull birth.
    const floorRadius = 18 + progress * 12;
    const floorGlow = ctx.createRadialGradient(
      toX,
      toY,
      Math.max(2, floorRadius * 0.22),
      toX,
      toY,
      floorRadius,
    );
    floorGlow.addColorStop(0, "rgba(255,238,190,0.9)");
    floorGlow.addColorStop(0.55, "rgba(255,156,82,0.65)");
    floorGlow.addColorStop(1, "rgba(255,92,36,0)");
    ctx.fillStyle = floorGlow;
    ctx.beginPath();
    ctx.arc(toX, toY, floorRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawNecroChargingSkull(ctx, camera) {
    if (!this.necroChargeSkull) return;
    const charge = this.necroChargeSkull;
    const duration = Math.max(0.001, charge.duration || this.necroCfg.skullGrowDuration);
    const progress = clamp01(1 - charge.timer / duration);
    const scale =
      charge.initialScale
      + (charge.finalScale - charge.initialScale) * progress;
    const baseSize = Math.max(18, this.necroCfg.skullRadius * 2);
    const drawSize = baseSize * scale * 1.35;
    const cx = charge.x - camera.x;
    const cy = charge.y - camera.y;

    const skullFallPath = BOSS_SPRITES.necroKing?.skullFall || null;
    const skullFallMeta = BOSS_SPRITE_META.necroKing?.skullFall || null;
    const spritePath = skullFallPath;
    const sprite = spritePath ? getImage(spritePath) : null;

    if (sprite) {
      const frameInfo = this.getSpriteFrameInfo(sprite, {
        frameCount: skullFallMeta?.frameCount,
        fps: skullFallMeta?.fps,
      });
      const frameW = sprite.width / frameInfo.frameCount;
      const sx = frameInfo.frameIndex * frameW;
      const frameAspect = sprite.height / Math.max(1, frameW);
      const drawW = drawSize;
      const drawH = drawSize * frameAspect;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((progress * 0.45) + nowSeconds() * 0.8);
      ctx.drawImage(
        sprite,
        sx,
        0,
        frameW,
        sprite.height,
        -drawW * 0.5,
        -drawH * 0.5,
        drawW,
        drawH,
      );
      ctx.restore();
      return;
    }

    ctx.fillStyle = "rgba(255,165,92,0.92)";
    ctx.beginPath();
    ctx.arc(cx, cy, drawSize * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  drawNecroScreamAura(ctx, camera) {
    if (this.state !== NECRO_STATE.ATTACK2_SCREAM || this.necroScreamTimer <= 0) return;
    const duration = Math.max(0.001, this.necroCfg.screamDuration);
    const lifeRatio = clamp01(this.necroScreamTimer / duration);
    const pulse = 0.88 + Math.sin(nowSeconds() * 10.5) * 0.12;
    const radius = this.necroCfg.screamRadius * pulse;
    const cx = this.center.x - camera.x;
    const cy = this.center.y - camera.y;

    ctx.save();
    ctx.globalAlpha = 0.28 + (1 - lifeRatio) * 0.2;
    ctx.fillStyle = "rgba(255,122,176,0.35)";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "rgba(255,181,216,0.92)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.97, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawNecroScreamRings(ctx, camera) {
    if (!Array.isArray(this.necroScreamRings) || this.necroScreamRings.length === 0) return;
    const cx = this.center.x - camera.x;
    const cy = this.center.y - camera.y;

    ctx.save();
    for (const ring of this.necroScreamRings) {
      const lifeRatio = clamp01(1 - ring.radius / Math.max(1, ring.maxRadius));
      const alpha = 0.16 + lifeRatio * 0.22;
      // Minimal outline style.
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "rgba(248,244,255,0.5)";
      ctx.lineWidth = Math.max(1, ring.thickness * 0.14);
      ctx.beginPath();
      ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = Math.min(0.3, alpha + 0.05);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1, ring.radius - ring.thickness * 0.12), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  resolveBossSize(cfg, key, fallback) {
    const raw = Number(cfg?.[key]);
    if (!Number.isFinite(raw) || raw <= 0) return fallback;
    return Math.round(raw);
  }

  resolveDamageShieldDuration(cfg) {
    const raw = Number(cfg?.damageShieldSec);
    if (!Number.isFinite(raw)) return BOSS_DAMAGE_SHIELD_SEC;
    return Math.max(0.06, Math.min(2.5, raw));
  }

  activateDamageShield(durationSec = this.damageShieldDuration) {
    const duration = Number(durationSec);
    const safeDuration = Number.isFinite(duration)
      ? Math.max(0.06, Math.min(2.5, duration))
      : BOSS_DAMAGE_SHIELD_SEC;
    this.damageShieldDuration = safeDuration;
    this.damageShieldTimer = safeDuration;
  }

  isDamageShieldActive() {
    return this.damageShieldTimer > 0 && !this.dead;
  }

  getDamageShieldVisualAlpha() {
    if (!this.isDamageShieldActive()) return 0;
    const duration = Math.max(0.001, this.damageShieldDuration);
    const elapsedRatio = 1 - this.damageShieldTimer / duration;
    const fadeIn = Math.min(
      1,
      elapsedRatio / BOSS_DAMAGE_SHIELD_FADE_IN_RATIO,
    );
    const fadeOut = Math.min(
      1,
      (1 - elapsedRatio) / BOSS_DAMAGE_SHIELD_FADE_OUT_RATIO,
    );
    const envelope = Math.max(0, Math.min(1, fadeIn * fadeOut));
    const nowSec =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) *
      0.001;
    const pulse = 0.84 + Math.sin(nowSec * 13) * 0.16;
    return envelope * pulse;
  }

  drawDamageShield(ctx, cx, cy) {
    const alpha = this.getDamageShieldVisualAlpha();
    if (alpha <= 0.001) return;

    const nowSec =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) *
      0.001;
    const rx = this.w * 0.62;
    const ry = this.h * 0.58;
    const glowRadius = Math.max(rx, ry) + 14 + Math.sin(nowSec * 8) * 2.8;

    ctx.save();
    ctx.translate(cx, cy);

    const glow = ctx.createRadialGradient(
      0,
      0,
      Math.max(8, Math.min(rx, ry) * 0.3),
      0,
      0,
      glowRadius,
    );
    glow.addColorStop(0, `rgba(126,224,255,${0.18 * alpha})`);
    glow.addColorStop(1, "rgba(126,224,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  isHeroDirectlyAbove(player) {
    if (!player) return false;
    const verticalGap = this.center.y - player.center.y;
    const horizontalGap = Math.abs(player.center.x - this.center.x);
    return (
      verticalGap >= BOSS_ABOVE_VERTICAL_GAP &&
      horizontalGap <= BOSS_ABOVE_HORIZONTAL_BAND
    );
  }

  buildPrimaryAttackTarget(world, attackOrigin, projectileSpeed) {
    const player = world?.player;
    if (!player) return { x: this.center.x, y: this.center.y };
    const predicted = predictTargetPosition(
      attackOrigin,
      player.center,
      { x: player.vx || 0, y: player.vy || 0 },
      projectileSpeed,
      BOSS_PROJECTILE_LEAD_FACTOR,
      BOSS_PROJECTILE_MAX_LEAD_FRAMES,
    );
    if (!this.isHeroDirectlyAbove(player)) return predicted;

    // Keep aim stable while hero is above; avoid jitter from tiny x oscillations.
    const stableX = this.center.x + this.facing * BOSS_ABOVE_AIM_SIDE_OFFSET;
    return {
      x: stableX * 0.7 + predicted.x * 0.3,
      y: Math.min(predicted.y, this.center.y - BOSS_ABOVE_AIM_UPWARD_OFFSET),
    };
  }

  registerHeadStomp(world, player) {
    if (!this.active || this.dead || !this.engaged) return;
    this.stompChainCount = this.stompChainTimer > 0 ? this.stompChainCount + 1 : 1;
    this.stompChainTimer = BOSS_STOMP_CHAIN_WINDOW_SEC;
    const requiredStomps = this.type === "crabBoss"
      ? Math.max(2, BOSS_STOMP_CHAIN_TRIGGER - 1)
      : BOSS_STOMP_CHAIN_TRIGGER;
    if (this.stompChainCount < requiredStomps) return;
    if (this.stompReactionCooldown > 0 || this.evadeTimer > 0) return;
    this.triggerStompDefensiveReaction(world, player || world?.player);
  }

  triggerStompDefensiveReaction(world, player) {
    const target = player || world?.player || null;
    const awayDx = target ? this.center.x - target.center.x : 0;
    let direction = Math.sign(awayDx);
    if (!direction) {
      direction = -this.facing || 1;
    }

    this.evadeDirection = direction;
    this.facing = direction;
    this.facingLocked = true;
    // If reaction starts during hurt, clear hurt so evade/counter executes now.
    this.hurtTimer = 0;
    this.evadeTimer = BOSS_STOMP_EVADE_SEC;
    this.pendingEvadeCounterAttack = false;
    this.stompReactionCooldown = BOSS_STOMP_REACTION_COOLDOWN_SEC;
    this.stompChainCount = 0;
    this.stompChainTimer = 0;
    this.attackWindupTimer = 0;
    this.state = "Evade";
    this.telegraphTimer = Math.max(this.telegraphTimer, 0.14);
  }

  registerStandardHitRetaliation(world) {
    if (this.type === "necroKing") return false;
    if (!this.engaged || this.dead || this.iceRebirthActive) return false;
    if (
      this.phaseTransitionTimer > 0
      || this.state === "PhaseTransition"
      || this.state === "Enrage"
      || this.state === "Special"
      || this.attackWindupTimer > 0
      || this.state === "AttackPattern1"
      || this.state === "AttackPattern2"
    ) {
      return false;
    }

    if (this.hitRetaliateWindowTimer <= 0) {
      this.hitRetaliateCount = 0;
    }
    this.hitRetaliateWindowTimer = BOSS_HIT_RETALIATE_WINDOW_SEC;
    this.hitRetaliateCount += 1;

    if (this.hitRetaliateCount < BOSS_HIT_RETALIATE_THRESHOLD) return false;
    if (this.hitRetaliateCooldownTimer > 0) return false;

    this.hitRetaliateCount = 0;
    this.hitRetaliateWindowTimer = 0;
    this.hitRetaliateCooldownTimer = BOSS_HIT_RETALIATE_COOLDOWN_SEC;
    this.hurtTimer = 0;
    this.evadeTimer = 0;
    this.pendingEvadeCounterAttack = false;
    this.facingLocked = false;
    const speedMult = this.enraged ? BOSS_ENRAGE.speedMultiplier : 1;
    this.startPrimaryAttackWindup(speedMult, world);
    this.activateDamageShield(Math.max(0.34, this.damageShieldDuration));
    return true;
  }

  fireEvadeCounterAttack(world) {
    if (!this.active || this.dead || !this.engaged) return;
    const speed = (this.type === "crabBoss" ? 7.2 : 6.2) * (this.enraged ? 1.08 : 1);
    const target = this.buildPrimaryAttackTarget(world, this.center, speed);
    world.launchBossProjectile(this, {
      damage: this.getDamage() * 0.92,
      speed,
      radius: this.type === "crabBoss" ? 13 : 11,
      range: this.type === "crabBoss" ? 680 : 560,
      color: this.enraged ? "#6dcfff" : "#93e6ff",
      kind: "orb",
      targetX: target.x,
      targetY: target.y,
    });
    this.attackCd = Math.max(this.attackCd, 1.05);
    this.telegraphTimer = Math.max(this.telegraphTimer, 0.1);
  }

  getNecroLampAnchor() {
    if (this.necroPhase >= 2) {
      // Phase 2 hand-fire should originate from raised right hand.
      return {
        x:
          this.x
          + this.w * 0.5
          + this.facing * this.w * this.necroCfg.phase2HandAnchorXRatio,
        y:
          this.y
          + this.drawOffsetY
          + this.h * this.necroCfg.phase2HandAnchorYRatio,
      };
    }
    return {
      x: this.x + this.w * 0.5 + this.facing * this.w * 0.22,
      y: this.y + this.drawOffsetY + this.h * 0.5,
    };
  }

  getAttackHandAnchor() {
    if (this.type === "necroKing") {
      return this.getNecroLampAnchor();
    }
    const xRatio = this.type === "iceTitan" ? 0.42 : this.type === "crabBoss" ? 0.32 : 0.24;
    const yRatio = this.type === "iceTitan" ? 0.47 : this.type === "crabBoss" ? 0.38 : 0.44;
    return {
      x: this.x + this.w * 0.5 + this.facing * this.w * xRatio,
      y: this.y + this.drawOffsetY + this.h * yRatio,
    };
  }

  getSpriteFrameInfo(sprite, spriteMeta = null) {
    const configuredFrameCount = Number(spriteMeta?.frameCount);
    const inferredFrameCount = this.inferFrameCountFromSprite(sprite);
    const frameCount = Math.max(
      1,
      Number.isFinite(configuredFrameCount) && configuredFrameCount > 0
        ? Math.round(configuredFrameCount)
        : inferredFrameCount,
    );
    if (frameCount === 1) {
      return { frameCount: 1, frameIndex: 0 };
    }
    const fps = Math.max(1, Number(spriteMeta?.fps) || 6);
    const t = nowSeconds();
    const frameIndex = Math.floor((t * fps) % frameCount);
    return { frameCount, frameIndex };
  }

  getStandardDeathFrameInfo(sprite, spriteMeta = null) {
    const configuredFrameCount = Number(spriteMeta?.frameCount);
    const inferredFrameCount = this.inferFrameCountFromSprite(sprite);
    const frameCount = Math.max(
      1,
      Number.isFinite(configuredFrameCount) && configuredFrameCount > 0
        ? Math.round(configuredFrameCount)
        : inferredFrameCount,
    );
    if (frameCount === 1) {
      return { frameCount: 1, frameIndex: 0 };
    }

    const fps = Math.max(0.1, Number(spriteMeta?.fps) || 6);
    const duration = Math.max(
      0.001,
      Number(this.standardDeathDuration) || this.resolveStandardDeathDuration(),
    );
    const elapsed = Math.max(0, duration - (Number(this.standardDeathTimer) || 0));
    const frameIndex = Math.min(frameCount - 1, Math.floor(elapsed * fps));
    return { frameCount, frameIndex };
  }

  getNecroDeathFrameInfo(sprite, spriteMeta = null) {
    const configuredFrameCount = Number(spriteMeta?.frameCount);
    const inferredFrameCount = this.inferFrameCountFromSprite(sprite);
    const frameCount = Math.max(
      1,
      Number.isFinite(configuredFrameCount) && configuredFrameCount > 0
        ? Math.round(configuredFrameCount)
        : inferredFrameCount,
    );
    if (frameCount === 1) {
      return { frameCount: 1, frameIndex: 0 };
    }

    const duration = Math.max(0.001, this.resolveNecroDeathDuration());
    const elapsed = Math.max(0, duration - (Number(this.necroDeathTimer) || 0));
    const progress = clamp01(elapsed / duration);
    // Final death should play once and hold the last frame.
    const frameIndex = Math.min(frameCount - 1, Math.floor(progress * frameCount));
    return { frameCount, frameIndex };
  }

  getIceRebirthDeathFrameInfo(sprite, spriteMeta = null) {
    const frameCount = Math.max(1, ICE_TITAN_DEATH_FRAME_BOUNDS.length);
    if (frameCount === 1) {
      return { frameCount: 1, frameIndex: 0 };
    }

    const duration = Math.max(
      0.001,
      Number(this.iceRebirthDeathDuration) || ICE_REBIRTH_DEATH_HOLD_SEC,
    );
    const elapsed = Math.max(0, duration - (Number(this.iceRebirthTimer) || 0));
    const progress = clamp01(elapsed / duration);
    // Death should play once and hold on the last frame until rebirth stage starts.
    const frameIndex = Math.min(frameCount - 1, Math.floor(progress * frameCount));
    return { frameCount, frameIndex };
  }

  getIceRebirthFormFrameInfo(sprite, spriteMeta = null) {
    const configuredFrameCount = Number(spriteMeta?.frameCount);
    const inferredFrameCount = this.inferFrameCountFromSprite(sprite);
    const frameCount = Math.max(
      1,
      Number.isFinite(configuredFrameCount) && configuredFrameCount > 0
        ? Math.round(configuredFrameCount)
        : inferredFrameCount,
    );
    if (frameCount === 1) {
      return { frameCount: 1, frameIndex: 0 };
    }

    const duration = Math.max(
      0.001,
      Number(this.iceRebirthFormDuration) || ICE_REBIRTH_FORM_SEC,
    );
    const elapsed = Math.max(0, duration - (Number(this.iceRebirthTimer) || 0));
    const progress = clamp01(elapsed / duration);
    // Rebirth should play once from frame 0 to last frame.
    const frameIndex = Math.min(frameCount - 1, Math.floor(progress * frameCount));
    return { frameCount, frameIndex };
  }

  inferFrameCountFromSprite(sprite) {
    if (!sprite?.width || !sprite?.height) return 1;
    const ratio = sprite.width / sprite.height;
    if (!Number.isFinite(ratio) || ratio < 1.35) return 1;
    return Math.max(1, Math.round(ratio));
  }

  resolveStandardDeathDuration() {
    const deathMeta = BOSS_SPRITE_META[this.type]?.death || null;
    const frameCount = Math.max(1, Number(deathMeta?.frameCount) || 1);
    const fps = Math.max(0.1, Number(deathMeta?.fps) || 5);
    return Math.max(0.18, frameCount / fps + 0.08);
  }

  resolveIceRebirthDeathDuration() {
    const deathMeta = BOSS_SPRITE_META.iceTitan?.death || null;
    const frameCount = Math.max(1, Number(deathMeta?.frameCount) || 1);
    const fps = Math.max(1, Number(deathMeta?.fps) || 5);
    const fullAnimSec = frameCount / fps;
    // Play the death sheet once, but keep it a bit snappier before rebirth child spawn.
    return Math.max(
      ICE_REBIRTH_DEATH_HOLD_SEC,
      Math.min(3.1, fullAnimSec + 0.12),
    );
  }

  resolveIceRebirthFormDuration() {
    const rebirthMeta = BOSS_SPRITE_META.iceTitan?.rebirth || null;
    const frameCount = Math.max(1, Number(rebirthMeta?.frameCount) || 1);
    const fps = Math.max(1, Number(rebirthMeta?.fps) || 7);
    const fullAnimSec = frameCount / fps;
    // Ensure full rebirth sheet plays once before child spawn.
    return Math.max(
      ICE_REBIRTH_FORM_SEC,
      Math.min(3.2, fullAnimSec + 0.05),
    );
  }

  resolveHurtDuration() {
    if (this.type === "necroKing") {
      return this.necroCfg.hurtDurationSec;
    }
    const hurtMeta = BOSS_SPRITE_META[this.type]?.hurt || null;
    const frameCount = Math.max(1, Number(hurtMeta?.frameCount) || 1);
    const fps = Math.max(1, Number(hurtMeta?.fps) || 6);
    // Keep Hurt active long enough to display the intended animation frames.
    const fullAnimSec = frameCount / fps;
    return Math.max(0.2, Math.min(0.8, fullAnimSec + 0.06));
  }
}
