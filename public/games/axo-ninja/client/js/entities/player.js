import { Entity } from "./entity.js";
import { CONST } from "../config/constants.js";
import { HEROES } from "../config/heroes.js";
import { getImage, HERO_SPRITES, HERO_SPRITE_META } from "../core/assets.js";
import { resolveEntityMovement } from "../core/collision.js";
import { clamp, distance } from "../utils/math.js";
import {
  ELEMENT,
  ELEMENT_COLOR,
  HERO_DEFAULT_ELEMENT,
  getCorePassiveCategory,
  getCorePassiveValue,
} from "../config/elements.js";

const FRAMES_PER_HEART = 100;
const ICE_SLIP_PENALTY = 0.45;
const POWER_KEYS = ["skill"];
const RESPAWN_DROP_GRAVITY_SCALE = 0.24;
const RESPAWN_DROP_MAX_FALL_SCALE = 0.38;
const RESPAWN_DROP_AIR_CONTROL_SCALE = 1.2;
const RESPAWN_BLINK_MS = 140;
const SWIM_GRAVITY_SCALE = 0.2;
const SWIM_MAX_FALL_SPEED = 5.8;
const SWIM_MAX_RISE_SPEED = 8.2;
const SWIM_VERTICAL_ACCEL = 1.45;
const SWIM_BUOYANCY_ACCEL = 0.26;
const SWIM_JUMP_IMPULSE = 8.4;
const SWIM_DESCEND_SPEED = 5.4;
const SWIM_NEUTRAL_DRIFT = 0.18;
const SWIM_HORIZONTAL_DAMP = 0.9;
const SWIM_VERTICAL_DAMP = 0.86;
const SWIM_HORIZONTAL_SPEED_SCALE = 0.72;
const DEFAULT_HERO_HEARTS = 5;
const DEFAULT_HERO_DAMAGE = 20;

function toHeroKey(value) {
  const hero = String(value || "")
    .trim()
    .toLowerCase();
  if (hero === "ninja") return "ninja";
  if (hero === "axolittle") return "ninja";
  if (hero === "pudge") return "ninja";
  if (hero === "seal") return "ninja";
  return "ninja";
}

export class Player extends Entity {
  constructor(heroId, maxHeartsOverride = null, runtimeHeroConfig = null) {
    super();
    this.heroId = toHeroKey(heroId);
    const baseHero = HEROES[this.heroId] || HEROES.ninja;
    this.hero = { ...baseHero };
    if (runtimeHeroConfig && typeof runtimeHeroConfig === "object") {
      const runtimeName = String(runtimeHeroConfig.heroName || "").trim();
      if (runtimeName) {
        this.hero.name = runtimeName;
      }
      const runtimeHearts = Number(runtimeHeroConfig.maxHearts);
      if (Number.isFinite(runtimeHearts) && runtimeHearts > 0) {
        this.hero.hearts = Math.max(1, Math.floor(runtimeHearts));
      }
      const runtimeDamage = Number(runtimeHeroConfig.damage);
      if (Number.isFinite(runtimeDamage) && runtimeDamage > 0) {
        this.hero.damage = Math.max(1, Math.floor(runtimeDamage));
      }
    }
    this.name = this.hero.name;
    this.w = 40;
    this.h = 60;
    this.stepHeight = 12;
    this.renderScaleX = 1.32;
    this.renderScaleY = 1.22;
    this.facing = 1;

    const configuredHearts = Number(this.hero?.hearts);
    this.maxHearts = Number.isFinite(maxHeartsOverride)
      ? Number(maxHeartsOverride)
      : Number.isFinite(configuredHearts)
        ? Math.max(1, Math.round(configuredHearts))
        : DEFAULT_HERO_HEARTS;
    this.maxHp = this.maxHearts * FRAMES_PER_HEART;
    this.hp = this.maxHp;

    this.damage = this.getHeroDamage();
    this.state = "Idle";

    this.currentElement = HERO_DEFAULT_ELEMENT[this.heroId] || ELEMENT.WATER;
    this.worldElement = this.currentElement;
    this.permanentCore = null;
    this.veteranModeEnabled = false;
    this.corePassiveCategory = null;

    this.invincibility = 0;
    this.attackCooldown = 0;
    this.attackTimer = 0;

    this.skillCooldown = 0;
    this.abilityAcd = 0;
    this.abilityBcd = 0;
    this.abilityLock = 0;
    this.ultimateLock = 0;

    this.ultCharge = 0;
    this.dead = false;
    this.powerUnlocks = {
      skill: true,
    };

    this.waterShieldTimer = 0;
    this.waterShieldHits = 0;
    this.damageReduction = 0;
    this.damageReductionTimer = 0;
    this.dashTimer = 0;
    this.dashDamage = 0;
    this.dashSpeed = 0;
    this.poisonTick = 0;

    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.onIceLastFrame = false;
    this.airControlBonus = 1;
    this.trail = [];
    this.trailTick = 0;
    this.respawnDropTimer = 0;
    this.inWater = false;
    this.powerUnlocks = { skill: true };
  }

  setAttunement(currentElement, worldElement, coreState = {}) {
    this.currentElement = currentElement || this.currentElement;
    this.worldElement = worldElement || this.worldElement;
    this.permanentCore = coreState.permanentCore || null;
    this.veteranModeEnabled = Boolean(coreState.veteranModeEnabled);
    this.corePassiveCategory = getCorePassiveCategory(this.permanentCore);
  }

  resetAt(x, y, maxHearts = null) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.state = "Idle";
    this.invincibility = 0;
    this.dead = false;
    this.attackCooldown = 0;
    this.attackTimer = 0;
    this.skillCooldown = 0;
    this.abilityAcd = 0;
    this.abilityBcd = 0;
    this.abilityLock = 0;
    this.ultimateLock = 0;
    this.waterShieldTimer = 0;
    this.waterShieldHits = 0;
    this.damageReduction = 0;
    this.damageReductionTimer = 0;
    this.dashTimer = 0;
    this.dashDamage = 0;
    this.poisonTick = 0;

    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.onIceLastFrame = false;
    this.airControlBonus = 1;
    this.trail = [];
    this.trailTick = 0;
    this.respawnDropTimer = 0;
    this.inWater = false;

    if (maxHearts != null) {
      this.maxHearts = maxHearts;
      this.maxHp = this.maxHearts * FRAMES_PER_HEART;
    }

    this.hp = this.maxHp;
    this.damage = this.getHeroDamage();
    this.active = true;
    this.powerUnlocks = { skill: true };
  }

  get currentHearts() {
    return Math.ceil(this.hp / FRAMES_PER_HEART);
  }

  isLocked() {
    return this.abilityLock > 0 || this.dead;
  }

  isPowerUnlocked(key) {
    return Boolean(this.powerUnlocks?.[key]);
  }

  unlockPower(key) {
    if (!Object.prototype.hasOwnProperty.call(this.powerUnlocks, key))
      return false;
    if (this.powerUnlocks[key]) return false;
    this.powerUnlocks[key] = true;
    return true;
  }

  getUnlockedPowerCount() {
    return POWER_KEYS.reduce(
      (count, key) => count + (this.powerUnlocks[key] ? 1 : 0),
      0,
    );
  }

  getTotalPowerCount() {
    return POWER_KEYS.length;
  }

  hasPermanentCore() {
    return Boolean(this.permanentCore);
  }

  isCorePassiveActive(world, category = null) {
    if (!this.hasPermanentCore()) return false;
    const passiveCategory = category || this.corePassiveCategory;
    if (!passiveCategory) return false;
    if (
      typeof world?.isCorePassiveSuppressed === "function" &&
      world.isCorePassiveSuppressed(passiveCategory)
    ) {
      return false;
    }
    return true;
  }

  getCoreAirControlMultiplier(world) {
    if (this.permanentCore !== ELEMENT.ICE) return 1;
    if (!this.isCorePassiveActive(world, "movement")) return 1;
    return getCorePassiveValue(ELEMENT.ICE).airControlMultiplier || 1;
  }

  getCoreKnockbackMultiplier(world) {
    if (this.permanentCore !== ELEMENT.SAND) return 1;
    if (!this.isCorePassiveActive(world, "defense")) return 1;
    return getCorePassiveValue(ELEMENT.SAND).knockbackMultiplier || 1;
  }

  getCoreUltKillMultiplier(world) {
    if (this.permanentCore !== ELEMENT.DARK) return 1;
    if (!this.isCorePassiveActive(world, "meter")) return 1;
    return getCorePassiveValue(ELEMENT.DARK).ultKillMultiplier || 1;
  }

  canSwimInCurrentContext(world) {
    const swimEnabled =
      typeof world?.isWaterSwimEnabled === "function" &&
      world.isWaterSwimEnabled();
    if (!swimEnabled) return false;
    const swimSuppressed =
      typeof world?.isWaterSwimSuppressedAt === "function" &&
      world.isWaterSwimSuppressedAt({
        x: this.x,
        y: this.y,
        w: this.w,
        h: this.h,
      });
    return !swimSuppressed;
  }

  update(dt, world, input) {
    if (!this.active) return;

    const frameScale = dt * 60;
    this.tickTimers(dt);

    if (this.dead) {
      this.state = "Death";
      return;
    }

    const horizontal =
      (input.isDown("right") ? 1 : 0) - (input.isDown("left") ? 1 : 0);
    if (horizontal !== 0) this.facing = horizontal;

    if (input.justPressed("jump")) {
      this.jumpBufferTimer = CONST.JUMP.JumpBufferSec;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    this.coyoteTimer = this.onGround
      ? CONST.JUMP.CoyoteTimeSec
      : Math.max(0, this.coyoteTimer - dt);

    if (input.justReleased("jump") && this.vy < 0) {
      this.vy *= CONST.JUMP.ShortHopCut;
    }

    this.handleCombatInputs(world, input);
    this.airControlBonus = this.getCoreAirControlMultiplier(world);
    const canSwimInLevel = this.canSwimInCurrentContext(world);
    const isSwimming = canSwimInLevel && this.inWater;

    if (!this.isLocked()) {
      this.applyHorizontalMovement(horizontal, false, frameScale, world);
      if (!isSwimming) {
        this.tryJump(world);
      }
    } else if (this.onGround && Math.abs(this.vx) < 0.15) {
      this.vx = 0;
    }

    if (this.dashTimer > 0) {
      this.vx = this.dashSpeed * this.facing;
      if (this.dashDamage > 0) {
        world.damageEnemiesInAABB(
          {
            x: this.x - 8,
            y: this.y,
            w: this.w + 16,
            h: this.h,
          },
          this.dashDamage,
          this,
          { isAbilityHit: true, direct: true },
        );
      }
    }

    const isJumpHeld = input.isDown("jump");
    const wasSwimming = isSwimming;
    const gravity =
      this.vy < 0
        ? isJumpHeld
          ? CONST.JUMP.GravityHold
          : CONST.JUMP.Gravity
        : CONST.JUMP.Gravity;
    const respawnSlowFall = this.respawnDropTimer > 0;
    const gravityScale = respawnSlowFall
      ? RESPAWN_DROP_GRAVITY_SCALE
      : wasSwimming
        ? SWIM_GRAVITY_SCALE
        : 1;
    const maxFallSpeed = respawnSlowFall
      ? CONST.MOVE.MaxFallSpeed * RESPAWN_DROP_MAX_FALL_SCALE
      : wasSwimming
        ? SWIM_MAX_FALL_SPEED
        : CONST.MOVE.MaxFallSpeed;
    this.vy = Math.min(
      maxFallSpeed,
      this.vy + gravity * frameScale * gravityScale,
    );

    const collisionInfo = resolveEntityMovement(this, world.map, dt, {
      onBrickHeadHit: (tx, ty, tileId) => world.onBrickHit(tx, ty, tileId),
      arenaLock: world.getArenaCollisionBounds(),
      blockOneWayFromBelow: canSwimInLevel,
    });

    this.onIceLastFrame = collisionInfo.onIce;

    this.applySurfaceRules(dt, collisionInfo, world, input, frameScale);
    this.applyHazards(dt, collisionInfo, world);

    if (this.onGround && this.respawnDropTimer > 0) {
      // End sky-drop state exactly when touching down and trigger landing FX once.
      this.respawnDropTimer = 0;
      world.onRespawnLanding?.(this);
    }

    // Buffered jump executes on landing even if key was pressed slightly early.
    if (
      !this.isLocked() &&
      !isSwimming &&
      this.onGround &&
      this.jumpBufferTimer > 0
    ) {
      this.tryJump(world);
    }

    this.updateCoreTrail(dt, world);
    this.updateAnimation(horizontal);
  }

  tickTimers(dt) {
    this.invincibility = Math.max(0, this.invincibility - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.skillCooldown = Math.max(0, this.skillCooldown - dt);
    this.abilityAcd = Math.max(0, this.abilityAcd - dt);
    this.abilityBcd = Math.max(0, this.abilityBcd - dt);
    this.abilityLock = Math.max(0, this.abilityLock - dt);
    this.ultimateLock = Math.max(0, this.ultimateLock - dt);
    this.waterShieldTimer = Math.max(0, this.waterShieldTimer - dt);
    this.damageReductionTimer = Math.max(0, this.damageReductionTimer - dt);
    this.dashTimer = Math.max(0, this.dashTimer - dt);
    this.respawnDropTimer = Math.max(0, this.respawnDropTimer - dt);

    if (this.waterShieldTimer <= 0) this.waterShieldHits = 0;
    if (this.damageReductionTimer <= 0) this.damageReduction = 0;
  }

  getIcePenaltyAdjusted(value) {
    return value * (1 - ICE_SLIP_PENALTY);
  }

  getHeroMoveSpeedScale() {
    const scale = Number(this.hero?.runtimeMoveSpeedScale);
    if (!Number.isFinite(scale)) return 1;
    return clamp(scale, 0.25, 4);
  }

  getHeroDamage() {
    const raw = Number(this.hero?.damage);
    if (!Number.isFinite(raw)) return DEFAULT_HERO_DAMAGE;
    return Math.max(1, Math.round(raw));
  }

  applyHorizontalMovement(horizontal, isRunHeld, frameScale, world) {
    const airControlBonus = this.airControlBonus || 1;
    const respawnAirControlScale =
      !this.onGround && this.respawnDropTimer > 0
        ? RESPAWN_DROP_AIR_CONTROL_SCALE
        : 1;
    const heroMoveScale = this.getHeroMoveSpeedScale();
    const maxSpeed =
      (isRunHeld ? CONST.MOVE.RunMaxSpeed : CONST.MOVE.WalkMaxSpeed) *
      heroMoveScale *
      (this.onGround
        ? 1
        : CONST.MOVE.AirControl * airControlBonus * respawnAirControlScale);

    if (horizontal !== 0) {
      const turning = this.vx !== 0 && Math.sign(this.vx) !== horizontal;
      let accel = this.onGround ? CONST.MOVE.GroundAccel : CONST.MOVE.AirAccel;
      if (this.onGround && turning) {
        accel *= CONST.MOVE.TurnAccelBoost;
      }
      if (!this.onGround) {
        accel *= airControlBonus * respawnAirControlScale;
      }
      if (this.onGround && this.onIceLastFrame) {
        accel = this.getIcePenaltyAdjusted(accel);
      }
      accel *= heroMoveScale;

      this.vx += horizontal * accel * frameScale;
    } else {
      let decel = this.onGround ? CONST.MOVE.GroundDecel : CONST.MOVE.AirDecel;
      if (this.onGround && this.onIceLastFrame) {
        decel = this.getIcePenaltyAdjusted(decel);
      }

      if (this.vx > 0) {
        this.vx = Math.max(0, this.vx - decel * frameScale);
      } else if (this.vx < 0) {
        this.vx = Math.min(0, this.vx + decel * frameScale);
      }

      if (this.onGround && Math.abs(this.vx) < 0.15) {
        this.vx = 0;
      }
    }

    this.vx = clamp(this.vx, -maxSpeed, maxSpeed);
  }

  updateCoreTrail(dt, world) {
    if (!this.hasPermanentCore()) {
      this.trail.length = 0;
      return;
    }
    if (!this.isCorePassiveActive(world)) {
      return;
    }

    this.trailTick -= dt;
    if (this.trailTick <= 0) {
      this.trailTick = 0.05;
      this.trail.push({ x: this.center.x, y: this.center.y });
      if (this.trail.length > 12) {
        this.trail.shift();
      }
    }
  }

  tryJump(world) {
    const canJump =
      this.jumpBufferTimer > 0 && (this.onGround || this.coyoteTimer > 0);
    if (!canJump) return;

    this.vy = CONST.JUMP.JumpVelocity;
    this.onGround = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    world.playSfx("jump");
  }

  handleCombatInputs(world, input) {
    if (this.dead || this.isLocked()) return;
    const dirPanel = this.getFirePanelDirection(input);
    const pressedPanel =
      dirPanel &&
      (input.consume("fireUp") ||
        input.consume("fireDown") ||
        input.consume("fireLeft") ||
        input.consume("fireRight") ||
        input.consume("fireUpLeft") ||
        input.consume("fireUpRight") ||
        input.consume("fireDownLeft") ||
        input.consume("fireDownRight"));
    const pressedFire = input.consume("attack") || input.consume("skill");
    const heldFire = input.isDown("attack") || input.isDown("skill");
    const heldPanel =
      dirPanel &&
      (input.isDown("fireUp") ||
        input.isDown("fireDown") ||
        input.isDown("fireLeft") ||
        input.isDown("fireRight") ||
        input.isDown("fireUpLeft") ||
        input.isDown("fireUpRight") ||
        input.isDown("fireDownLeft") ||
        input.isDown("fireDownRight"));
    const fired =
      pressedPanel ||
      (heldPanel && this.skillCooldown <= 0) ||
      pressedFire ||
      (heldFire && this.skillCooldown <= 0);
    if (!fired || this.skillCooldown > 0) return;

    let aimDirX;
    let aimDirY;
    if (dirPanel && (pressedPanel || heldPanel)) {
      aimDirX = dirPanel.x;
      aimDirY = dirPanel.y;
    } else if (
      input.touchAimDirection &&
      (input.touchAimDirection.x !== 0 || input.touchAimDirection.y !== 0)
    ) {
      aimDirX = input.touchAimDirection.x;
      aimDirY = input.touchAimDirection.y;
    } else {
      const lookUp = input.isDown("lookUp");
      const lookDown = input.isDown("lookDown");
      const aimLeft = input.isDown("left");
      const aimRight = input.isDown("right");
      aimDirX = this.facing;
      if (aimLeft && !aimRight) aimDirX = -1;
      else if (aimRight && !aimLeft) aimDirX = 1;
      aimDirY = 0;
      if (lookUp && !lookDown) aimDirY = -1;
      else if (lookDown && !lookUp) aimDirY = 1;
      if (aimDirY !== 0 && !aimLeft && !aimRight) aimDirX = 0;
      const norm = Math.hypot(aimDirX, aimDirY) || 1;
      aimDirX /= norm;
      aimDirY /= norm;
    }

    this.state = "Ability";
    this.skillCooldown = 0.58;
    this.abilityLock = 0.18;
    world.playSfx("blade");
    const throwDamage = this.getHeroDamage();
    world.castHeroSkill(this, throwDamage, 460, {
      isAbilityHit: true,
      projectile: true,
      speed: 8.9,
      radius: 13,
      dirX: aimDirX,
      dirY: aimDirY,
    });
  }

  getFirePanelDirection(input) {
    if (
      input.isDown("fireUp") &&
      !input.isDown("fireDown") &&
      !input.isDown("fireLeft") &&
      !input.isDown("fireRight")
    )
      return { x: 0, y: -1 };
    if (
      input.isDown("fireDown") &&
      !input.isDown("fireUp") &&
      !input.isDown("fireLeft") &&
      !input.isDown("fireRight")
    )
      return { x: 0, y: 1 };
    if (
      input.isDown("fireLeft") &&
      !input.isDown("fireRight") &&
      !input.isDown("fireUp") &&
      !input.isDown("fireDown")
    )
      return { x: -1, y: 0 };
    if (
      input.isDown("fireRight") &&
      !input.isDown("fireLeft") &&
      !input.isDown("fireUp") &&
      !input.isDown("fireDown")
    )
      return { x: 1, y: 0 };
    const invSqrt2 = 1 / Math.SQRT2;
    if (input.isDown("fireUpLeft")) return { x: -invSqrt2, y: -invSqrt2 };
    if (input.isDown("fireUpRight")) return { x: invSqrt2, y: -invSqrt2 };
    if (input.isDown("fireDownLeft")) return { x: -invSqrt2, y: invSqrt2 };
    if (input.isDown("fireDownRight")) return { x: invSqrt2, y: invSqrt2 };
    return null;
  }

  activateAbilityA(world) {
    this.state = "Ability";
    this.abilityLock = 0.25;

    if (this.heroId === "ninja") {
      this.abilityAcd = this.hero.abilities.A.cooldown;
      this.waterShieldHits = this.hero.abilities.A.blocksHits;
      this.waterShieldTimer = this.hero.abilities.A.duration;
      // } else if (this.heroId === "flora") {
      //   this.abilityAcd = this.hero.abilities.A.cooldown;
      //   world.castHeroSkill(this, this.getHeroDamage(), 380, {
      //     isAbilityHit: true,
      //     projectile: true,
      //     speed: 8.1,
      //     radius: 16,
      //   });
      // } else if (this.heroId === "jelly") {
      //   this.abilityAcd = this.hero.abilities.A.cooldown;
      //   this.dashTimer = CONST.DASH.Duration;
      //   this.dashSpeed = CONST.DASH.Distance / (CONST.DASH.Duration * 60);
      //   this.dashDamage = this.getHeroDamage();
    }
  }

  activateAbilityB(world) {
    this.state = "Ability";
    this.abilityLock = 0.25;

    if (this.heroId === "ninja") {
      this.abilityBcd = this.hero.abilities.B.cooldown;
      this.dashTimer = CONST.DASH.Duration;
      this.dashSpeed = CONST.DASH.Distance / (CONST.DASH.Duration * 60);
      this.dashDamage = 0;
      // } else if (this.heroId === "flora") {
      //   this.abilityBcd = this.hero.abilities.B.cooldown;
      //   this.damageReduction = this.hero.abilities.B.reduction;
      //   this.damageReductionTimer = this.hero.abilities.B.duration;
      // } else if (this.heroId === "jelly") {
      //   this.abilityBcd = this.hero.abilities.B.cooldown;
      //   const freezeDamage = this.getHeroDamage();
      //   world.castHeroSkill(this, freezeDamage, 340, {
      //     isAbilityHit: true,
      //     projectile: true,
      //     freezeSec: this.hero.abilities.B.freezeSec,
      //     speed: 8.8,
      //     radius: 14,
      //   });
    }
  }

  activateUltimate(world) {
    this.state = "Ultimate";
    this.ultCharge = 0;
    this.ultimateLock = 0.6;
    const heroDamage = this.getHeroDamage();

    if (this.heroId === "ninja") {
      world.castHeroSkill(this, heroDamage, 560, {
        isAbilityHit: true,
        isUltimate: true,
        projectile: true,
        speed: 8.6,
        radius: 18,
        impactRadius: this.hero.abilities.ultimate.radius,
        impactDamage: heroDamage,
      });
      // } else if (this.heroId === "flora") {
      //   world.castHeroSkill(this, heroDamage, 520, {
      //     isAbilityHit: true,
      //     isUltimate: true,
      //     projectile: true,
      //     speed: 7.8,
      //     radius: 21,
      //     impactRadius: 220,
      //     impactDamage: heroDamage,
      //     staggerSec: 0.2,
      //   });
      // } else if (this.heroId === "jelly") {
      //   const stormDamage = heroDamage;
      //   world.castHeroSkill(this, stormDamage, 540, {
      //     isAbilityHit: true,
      //     isUltimate: true,
      //     projectile: true,
      //     speed: 9,
      //     radius: 19,
      //     freezeSec: 1.1,
      //     impactRadius: this.hero.abilities.ultimate.radius,
      //     impactDamage: stormDamage,
      //     impactFreezeSec: this.hero.abilities.ultimate.freezeSec,
      //   });
    }
  }

  applySurfaceRules(dt, collisionInfo, world, input, frameScale) {
    void dt;
    const canSwimInLevel = this.canSwimInCurrentContext(world);
    const inWaterTile = Boolean(collisionInfo?.inWater);
    // Water world should still allow normal running when standing on floor.
    // Keep swim controls for water tiles and while airborne in water stages.
    const inWaterWorldVolume = Boolean(
      canSwimInLevel && !inWaterTile && !this.onGround,
    );
    const inWater = Boolean(
      canSwimInLevel && (inWaterTile || inWaterWorldVolume),
    );
    this.inWater = inWater;
    if (!inWater) return;

    const swimUp = input.isDown("jump") || input.isDown("lookUp");
    const swimDown = input.isDown("lookDown");
    let verticalAxis = 0;
    if (swimUp && !swimDown) verticalAxis = -1;
    else if (swimDown && !swimUp) verticalAxis = 1;

    // Swim state: decouple from grounded platform rules.
    this.onGround = false;
    this.vx *= SWIM_HORIZONTAL_DAMP;
    this.vy *= SWIM_VERTICAL_DAMP;

    // Hold jump/up in water level => rise with near zero-gravity feel.
    if (swimUp && !swimDown) {
      this.vy = -SWIM_JUMP_IMPULSE;
    } else if (swimDown && !swimUp) {
      this.vy = SWIM_DESCEND_SPEED;
    } else {
      // Mario-style water: without UP input, hero slowly sinks.
      this.vy = clamp(
        this.vy + SWIM_NEUTRAL_DRIFT,
        -SWIM_MAX_RISE_SPEED,
        SWIM_MAX_FALL_SPEED,
      );
    }

    if (verticalAxis !== 0) {
      this.vy += verticalAxis * SWIM_VERTICAL_ACCEL * frameScale * 0.15;
    } else {
      this.vy += SWIM_BUOYANCY_ACCEL * frameScale * 0.12;
    }

    this.vy = clamp(this.vy, -SWIM_MAX_RISE_SPEED, SWIM_MAX_FALL_SPEED);
    const swimMaxSpeed =
      CONST.MOVE.WalkMaxSpeed *
      SWIM_HORIZONTAL_SPEED_SCALE *
      this.getHeroMoveSpeedScale();
    this.vx = clamp(this.vx, -swimMaxSpeed, swimMaxSpeed);
  }

  applyHazards(dt, collisionInfo, world) {
    if (collisionInfo.touchingSpikes) {
      this.takeDamage(20, world, {
        knockbackX: -this.facing * 3,
        knockbackY: -2,
      });
    }

    if (collisionInfo.inPoison) {
      if (this.poisonTick === 0) {
        this.takeDamage(8, world);
        this.poisonTick = 0.5;
      } else {
        this.poisonTick += dt;
        if (this.poisonTick >= 0.5) {
          this.poisonTick = 0;
          this.takeDamage(8, world);
        }
      }
    } else {
      this.poisonTick = 0;
    }
  }

  takeDamage(rawDamage, world, options = {}) {
    if (this.dead) return;
    if (this.invincibility > 0) return;
    void rawDamage;
    void options;

    if (this.waterShieldHits > 0) {
      this.waterShieldHits -= 1;
      this.invincibility = CONST.COMBAT.InvincibilityAfterHit;
      return;
    }

    // One confirmed hit always removes exactly one heart.
    const heartsAfterHit = Math.max(0, this.currentHearts - 1);
    this.hp = heartsAfterHit * FRAMES_PER_HEART;
    this.invincibility = CONST.COMBAT.InvincibilityAfterHit;
    world.playSfx("hit");

    // On each lost heart, player "dies" and respawns (handled by scene).
    this.dead = true;
    this.state = "Death";
    world.onPlayerDeath?.();
  }

  gainUlt(amount) {
    this.ultCharge = clamp(this.ultCharge + amount, 0, CONST.ULT.Max);
  }

  onDealDamageToBoss(amount) {
    this.gainUlt(Math.floor(amount / 100) * CONST.ULT.Gain.BossHitPer100Damage);
  }

  updateAnimation(horizontalInput) {
    if (this.dead) {
      this.state = "Death";
      return;
    }

    if (this.ultimateLock > 0) {
      this.state = "Ultimate";
      return;
    }

    if (this.abilityLock > 0 || this.dashTimer > 0) {
      this.state = "Ability";
      return;
    }

    if (this.attackTimer > 0) {
      this.state = "Attack";
      return;
    }

    if (this.invincibility > 0 && this.state === "Hurt") {
      return;
    }

    if (!this.onGround) {
      this.state = this.vy < 0 ? "Jump" : "Fall";
      return;
    }

    if (Math.abs(horizontalInput) > 0 || Math.abs(this.vx) > 0.4) {
      this.state = "Run";
    } else {
      this.state = "Idle";
    }
  }

  draw(ctx, camera) {
    const isBlinkFrame =
      this.invincibility > 0 &&
      Math.floor(performance.now() / RESPAWN_BLINK_MS) % 3 === 0;
    if (isBlinkFrame) {
      return;
    }

    const x = this.x - camera.x;
    const y = this.y - camera.y;
    let drawW = Math.round(this.w * this.renderScaleX);
    let drawH = Math.round(this.h * this.renderScaleY);
    let drawX = x - Math.floor((drawW - this.w) * 0.5);
    let drawY = y - (drawH - this.h);

    if (this.trail.length > 0) {
      const trailColor =
        ELEMENT_COLOR[this.permanentCore] ||
        ELEMENT_COLOR[this.currentElement] ||
        "#ffffff";
      for (let i = 0; i < this.trail.length; i += 1) {
        const t = this.trail[i];
        const alpha = ((i + 1) / this.trail.length) * 0.24;
        const r = 4 + (i / this.trail.length) * 6;
        ctx.fillStyle = colorWithAlpha(trailColor, alpha);
        ctx.beginPath();
        ctx.arc(t.x - camera.x, t.y - camera.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const spriteKey = String(this.state || "Idle").toLowerCase();
    const spritePath =
      HERO_SPRITES[this.heroId]?.[spriteKey] || HERO_SPRITES[this.heroId]?.idle;
    const sprite = spritePath ? getImage(spritePath) : null;
    const spriteMeta =
      HERO_SPRITE_META[this.heroId]?.[spriteKey] ||
      HERO_SPRITE_META[this.heroId]?.idle ||
      null;
    const hasUsableSprite = Boolean(
      sprite && sprite.width > 2 && sprite.height > 2,
    );

    if (hasUsableSprite) {
      const frameInfo = this.getSpriteFrameInfo(sprite, spriteMeta);
      const frameW = Math.floor(sprite.width / frameInfo.frameCount);
      const sx = frameInfo.frameIndex * frameW;
      // Locked ratio: one scale, +5% size; height +5% extra
      if (frameW > 0 && sprite.height > 0) {
        const scale = Math.max(this.w / frameW, this.h / sprite.height) * 0.8 * 1.05;
        drawW = Math.round(frameW * scale);
        drawH = Math.round(sprite.height * scale * 1.05 * 1.15); // +5% height, then +5% more
        drawX = x - Math.floor((drawW - this.w) * 0.5);
        drawY = y + this.h - drawH; // keep bottom aligned
      }
      ctx.save();
      if (this.facing < 0) {
        ctx.translate(drawX + drawW, drawY);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, sx, 0, frameW, sprite.height, 0, 0, drawW, drawH);
      } else {
        ctx.drawImage(
          sprite,
          sx,
          0,
          frameW,
          sprite.height,
          drawX,
          drawY,
          drawW,
          drawH,
        );
      }
      ctx.restore();
    } else {
      const gradient = ctx.createLinearGradient(
        drawX,
        drawY,
        drawX,
        drawY + drawH,
      );
      if (this.heroId === "ninja") {
        gradient.addColorStop(0, "#91ddff");
        gradient.addColorStop(1, "#2b87d3");
        // } else if (this.heroId === "flora") {
        //   gradient.addColorStop(0, "#d2a45e");
        //   gradient.addColorStop(1, "#8a5b2f");
      } else {
        gradient.addColorStop(0, "#d8f5ff");
        gradient.addColorStop(1, "#5eaad8");
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(drawX, drawY, drawW, drawH);

      ctx.fillStyle = "#132029";
      const eyeX = this.facing > 0 ? drawX + drawW - 14 : drawX + 8;
      ctx.fillRect(eyeX, drawY + 16, 6, 6);
    }
  }

  getSpriteFrameInfo(sprite, spriteMeta = null) {
    const ratio = sprite.width / Math.max(1, sprite.height);
    const detectedFrameCount = ratio >= 1.8 ? 2 : 1;
    const frameCount = Math.max(
      1,
      Number(spriteMeta?.frameCount) || detectedFrameCount,
    );
    if (frameCount === 1) {
      return { frameCount: 1, frameIndex: 0 };
    }

    const movingState =
      this.state === "Run" ||
      this.state === "Attack" ||
      this.state === "Ability";
    const fps = Number(spriteMeta?.fps) || (movingState ? 8 : 3);
    const t = performance.now() / 1000;
    const frameIndex = Math.floor((t * fps) % frameCount);
    return { frameCount, frameIndex };
  }
}

export function damageFormula(damage, powerMultiplier = 1) {
  return damage * powerMultiplier;
}

export function inMeleeRange(player, target, reach = 110) {
  return distance(player.center, target.center) <= reach;
}

function colorWithAlpha(hex, alpha) {
  const raw = String(hex || "").replace("#", "");
  if (raw.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
