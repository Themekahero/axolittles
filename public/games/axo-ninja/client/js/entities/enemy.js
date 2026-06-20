import { Entity } from "./entity.js";
import { ENEMIES } from "../config/enemies.js";
import { CONST } from "../config/constants.js";
import {
  BOSS_SPRITES,
  BOSS_SPRITE_META,
  ENEMY_SPRITES,
  ENEMY_SPRITE_META,
  getImage,
} from "../core/assets.js";
import { resolveEntityMovement } from "../core/collision.js";
import { TILE } from "../config/tileIds.js";
import { distance } from "../utils/math.js";
import {
  directionToTarget,
  predictTargetPosition,
  resolveFacingWithDeadzone,
} from "../utils/aiming.js";

const SPIKED_SKULL_TYPES = new Set(["spikedSkull", "spiked"]);
const SWIM_TYPES = new Set([
  "fishScout",
  "jellyBomber",
  "coralShooter",
  "eliteWaterGuard",
  "coralHydra",
]);
const FLYING_TYPES = new Set([...SPIKED_SKULL_TYPES, ...SWIM_TYPES]);
const FLYING_RANGED_TYPES = new Set([...SPIKED_SKULL_TYPES]);
const VOID_PLATFORM_TYPES = new Set(["plague", "red", "golden"]);
const MIRROR_FACING_RIGHT_TYPES = new Set(["fishScout", "eliteWaterGuard"]);
const HAZARD_TILES = new Set([
  TILE.SPIKES,
  TILE.BARBED_WIRE,
  TILE.WATER,
  TILE.POISON,
]);
const SAFE_GROUND_TILES = new Set([
  TILE.SOLID,
  TILE.ICE,
  TILE.BRICK,
  TILE.GIFT_BOX,
  TILE.ONE_WAY,
]);
const WALL_BLOCK_TILES = new Set([
  TILE.SOLID,
  TILE.ICE,
  TILE.BRICK,
  TILE.GIFT_BOX,
]);
const SKY_BOB_SPEED = 2.8;
const SKY_BOB_AMPLITUDE = 18;
const SWIM_BOB_SPEED = 2.1;
const SWIM_BOB_AMPLITUDE = 10;
const SWIM_LANE_ROAM = 176;
const SWIM_LANE_TARGET_REFRESH_MIN_SEC = 0.48;
const SWIM_LANE_TARGET_REFRESH_MAX_SEC = 0.9;
const BLOOPER_RETREAT_MARGIN = 26;
const BLOOPER_LUNGE_MARGIN = 8;
const SKY_ATTACK_RANGE = 280;
const SKY_ATTACK_COOLDOWN_SEC = 1.75;
const SKY_MIN_FLOOR_CLEARANCE = 52;
const SWIM_MIN_FLOOR_CLEARANCE = 68;
const SKY_VERTICAL_DEADZONE = 16;
const SKY_ATTACK_PROJECTILE_RANGE = 720;
const ENEMY_FACING_DEADZONE = 14;
const ENEMY_PROJECTILE_LEAD_FACTOR = 0.38;
const ENEMY_PROJECTILE_MAX_LEAD_FRAMES = 16;
const JELLY_LOOP_VERTICAL_AMPLITUDE = 24;
const JELLY_LOOP_VERTICAL_SPEED = 2.3;
const JELLY_LOOP_LEFT_SPEED_SCALE = 0.52;
const ICE_REBIRTH_CHILD_PROJECTILE_RANGE = 760;
const ICE_REBIRTH_CHILD_ATTACK_RANGE = 660;
const ICE_REBIRTH_CHILD_ATTACK_COOLDOWN_SEC = 1.55;
const ICE_REBIRTH_CHILD_DEATH_HOLD_SEC = 0.95;

export class Enemy extends Entity {
  constructor() {
    super();
    this.type = "iceSlime";
    this.cfg = ENEMIES[this.type];
    this.w = 44;
    this.h = 46;
    this.state = "Patrol";
    this.hp = 10;
    this.maxHp = 10;
    this.facing = 1;
    this.spawnX = 0;
    this.spawnY = 0;
    this.hoverBaseY = 0;
    this.hoverPhase = 0;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.attackDamageDone = false;
    this.facingLocked = false;
    this.rangedCooldown = 0;
    this.hurtTimer = 0;
    this.deathTimer = 0;
    this.freezeTimer = 0;
    this.slowTimer = 0;
    this.slowFactor = 0.75;
    this.burnTimer = 0;
    this.burnTick = 0;
    this.burnDps = 0;
    this.staggerTimer = 0;
    this.isBossMinion = false;
    this.challengeTag = null;
    this.forceAggroHero = false;
    this.spawnRebirthVisualDuration = 0;
    this.spawnRebirthVisualTimer = 0;
    this.deathAnimDuration = 0;
    this.swimLaneY = 0;
    this.swimRetargetTimer = 0;
    this.forceFlyRightToLeft = false;
  }

  reset(type, x, y, flags = {}) {
    this.type = type;
    const baseConfig = ENEMIES[type] || ENEMIES.iceSlime;
    this.cfg = { ...baseConfig };
    const runtimeEnemyConfig =
      flags?.runtimeEnemyConfig && typeof flags.runtimeEnemyConfig === "object"
        ? flags.runtimeEnemyConfig
        : null;
    if (runtimeEnemyConfig) {
      const runtimeHp = Number(runtimeEnemyConfig.hp);
      if (Number.isFinite(runtimeHp) && runtimeHp > 0) {
        this.cfg.hp = Math.max(1, Math.floor(runtimeHp));
      }
      const runtimeDamage = Number(runtimeEnemyConfig.damage);
      if (Number.isFinite(runtimeDamage) && runtimeDamage > 0) {
        this.cfg.damage = Math.max(1, Math.floor(runtimeDamage));
      }
      const runtimeReward = Number(runtimeEnemyConfig.reward);
      if (Number.isFinite(runtimeReward) && runtimeReward >= 0) {
        this.cfg.coins = Math.floor(runtimeReward);
      }
    }
    const hasExplicitSize =
      Number.isFinite(this.cfg.w) &&
      Number.isFinite(this.cfg.h) &&
      this.cfg.w > 0 &&
      this.cfg.h > 0;
    if ((this.isSwimmingType() || this.type === "coralHydra") && hasExplicitSize) {
      this.w = this.cfg.w;
      this.h = this.cfg.h;
    } else if (this.cfg.miniBoss) {
      this.w = 78;
      this.h = 88;
    } else if (this.isFlyingType()) {
      if (hasExplicitSize) {
        this.w = this.cfg.w;
        this.h = this.cfg.h;
      } else {
        this.w = 62;
        this.h = 62;
      }
    } else if (this.cfg.elite) {
      this.w = 56;
      this.h = 66;
    } else if (hasExplicitSize) {
      this.w = this.cfg.w;
      this.h = this.cfg.h;
    } else {
      this.w = 46;
      this.h = 52;
    }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
    const swimSpawnLift = this.isSwimmingType()
      ? Math.min(36, Math.max(18, Math.round(this.h * 0.42)))
      : 0;
    const spawnY = y - swimSpawnLift;
    this.x = x;
    this.y = spawnY;
    this.vx = 0;
    this.vy = 0;
    this.spawnX = x;
    this.spawnY = spawnY;
    this.hoverBaseY = spawnY;
    this.hoverPhase = Math.random() * Math.PI * 2;
    this.swimLaneY = spawnY;
    this.swimRetargetTimer =
      SWIM_LANE_TARGET_REFRESH_MIN_SEC +
      Math.random() *
      (SWIM_LANE_TARGET_REFRESH_MAX_SEC - SWIM_LANE_TARGET_REFRESH_MIN_SEC);
    const initialFacing =
      Number(flags.initialFacing) < 0 ? -1 : 1;
    this.hp = this.cfg.hp;
    this.maxHp = this.cfg.hp;
    this.state = "Patrol";
    this.facing = initialFacing;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.attackDamageDone = false;
    this.facingLocked = false;
    this.rangedCooldown = 0.35 + Math.random() * 0.35;
    this.hurtTimer = 0;
    this.deathTimer = 0;
    this.freezeTimer = 0;
    this.slowTimer = 0;
    this.burnTimer = 0;
    this.burnTick = 0;
    this.burnDps = 0;
    this.staggerTimer = 0;
    this.active = true;
    this.isBossMinion = !!flags.isBossMinion;
    this.challengeTag = flags.challengeTag || null;
    this.forceAggroHero = !!flags.forceAggroHero;
    this.forceFlyRightToLeft = flags.forceFlyRightToLeft === true;
    const spawnRebirthVisualSec = Math.max(
      0,
      Number(flags.spawnRebirthVisualSec) || 0,
    );
    this.spawnRebirthVisualDuration = spawnRebirthVisualSec;
    this.spawnRebirthVisualTimer = spawnRebirthVisualSec;
    this.deathAnimDuration = 0;
  }

  update(dt, world) {
    if (!this.active) return;

    this.slowTimer = Math.max(0, this.slowTimer - dt);
    this.staggerTimer = Math.max(0, this.staggerTimer - dt);
    this.rangedCooldown = Math.max(0, this.rangedCooldown - dt);
    this.spawnRebirthVisualTimer = Math.max(0, this.spawnRebirthVisualTimer - dt);

    this.applyBurn(dt, world);
    if (!this.active) return;

    if (this.isIceRebirthChild() && this.spawnRebirthVisualTimer > 0) {
      // Hold combat pressure until rebirth visual has fully played.
      this.state = "Patrol";
      this.facingLocked = false;
      this.vx = 0;
      this.attackTimer = 0;
      this.applyMovement(dt, world);
      return;
    }

    if (this.freezeTimer > 0) {
      this.freezeTimer = Math.max(0, this.freezeTimer - dt);
      this.vx *= 0.75;
      this.applyMovement(dt, world, { suppressFlightControl: true });
      return;
    }

    if (this.state === "Death") {
      this.facingLocked = false;
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        this.active = false;
      }
      return;
    }

    if (this.staggerTimer > 0) {
      this.vx *= 0.5;
      this.applyMovement(dt, world);
      return;
    }

    if (this.state === "Hurt") {
      this.facingLocked = false;
      this.hurtTimer -= dt;
      if (this.hurtTimer <= 0) this.state = "Patrol";
      this.applyMovement(dt, world);
      return;
    }

    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    const player = world.player;
    const dist = distance(this.center, player.center);
    const dxToPlayer = player.center.x - this.center.x;
    const speedMul = this.slowTimer > 0 ? this.slowFactor : 1;
    const baseDetectRange = this.cfg.detectRange * (this.cfg.elite ? 1.15 : 1);
    const detectRange = this.forceAggroHero
      ? Math.max(baseDetectRange, 4096)
      : baseDetectRange;
    const attackStartRange = Number.isFinite(this.cfg.attackStartRange)
      ? this.cfg.attackStartRange
      : 48;
    const attackHitRange = Number.isFinite(this.cfg.attackHitRange)
      ? this.cfg.attackHitRange
      : 62;
    const attackDurationSec = Number.isFinite(this.cfg.attackDurationSec)
      ? Math.max(0.2, this.cfg.attackDurationSec)
      : 0.5;
    if (this.isIceRebirthChild()) {
      // Fire first, then melee/chase state logic can continue in the same frame.
      this.tryIceRebirthChildAttack(world, player, dist);
    }
    if (this.isForcedFlyRightToLeft()) {
      this.updateForcedFlyRightToLeftState(dt, world, speedMul);
      this.applyMovement(dt, world);
      return;
    }
    if (this.isFlyingType()) {
      this.updateFlyingState(dt, world, player, dist, detectRange, speedMul);
      this.applyMovement(dt, world);
      return;
    }

    if (this.attackTimer > 0) {
      // Keep attack state active for the full attack window so attack sprites are visible.
      this.state = "Attack";
      this.facingLocked = true;
      this.vx = 0;
    } else if (dist <= attackStartRange && this.attackCooldown <= 0) {
      this.state = "Attack";
      this.attackTimer = attackDurationSec;
      this.attackDamageDone = false;
      this.facing = resolveFacingWithDeadzone(
        this.facing,
        dxToPlayer,
        ENEMY_FACING_DEADZONE,
      );
      this.facingLocked = true;
      this.vx = 0;
    } else if (dist <= detectRange) {
      this.state = "Chase";
      this.facing = resolveFacingWithDeadzone(
        this.facing,
        dxToPlayer,
        ENEMY_FACING_DEADZONE,
        this.facingLocked,
      );
      this.vx = this.cfg.speed * speedMul * this.facing;
    } else {
      this.facingLocked = false;
      this.state = "Patrol";
      const roam = 96;
      if (this.x <= this.spawnX - roam) this.facing = 1;
      if (this.x >= this.spawnX + roam) this.facing = -1;
      this.vx = this.cfg.speed * speedMul * 0.6 * this.facing;
    }

    if (this.attackTimer > 0) {
      this.attackTimer = Math.max(0, this.attackTimer - dt);
      const progress = 1 - this.attackTimer / attackDurationSec;
      if (!this.attackDamageDone && progress >= this.cfg.attackFramePoint) {
        this.attackDamageDone = true;
        if (distance(this.center, player.center) < attackHitRange) {
          player.takeDamage(this.cfg.damage, world, {
            knockbackX: this.facing * CONST.COMBAT.KnockbackLight.pxPerFrame,
            knockbackY: -CONST.COMBAT.KnockbackLight.seconds * 10
          });
        }
      }
      if (this.attackTimer <= 0) {
        this.facingLocked = false;
        const veteranCdMult = typeof world.getEnemyAttackCooldownMultiplier === "function"
          ? world.getEnemyAttackCooldownMultiplier()
          : 1;
        this.attackCooldown = this.cfg.attackCooldownSec * 0.9 * veteranCdMult;
      }
    }

    this.avoidUnsafeGroundAhead(world, speedMul);
    this.applyMovement(dt, world);
  }

  applyBurn(dt, world) {
    if (this.burnTimer <= 0) return;

    this.burnTimer = Math.max(0, this.burnTimer - dt);
    this.burnTick += dt;

    while (this.burnTick >= 0.5 && this.active && this.state !== "Death") {
      this.burnTick -= 0.5;
      this.hp -= this.burnDps * 0.5;
      if (this.hp <= 0) {
        this.hp = 0;
        this.die(world);
        return;
      }
    }
  }

  applyGravityAndCollision(dt, world) {
    // If a void enemy is placed on a ONE_WAY "air floor", it can spawn slightly
    // embedded and fall through because one-way collision only triggers on
    // downward crossing. Snap it onto the platform top when its feet are within
    // the tile's vertical band.
    if (
      VOID_PLATFORM_TYPES.has(this.type) &&
      world?.map &&
      typeof world.map.getTileAtPixel === "function"
    ) {
      const tileSize = Number(world.map.tileSize) || CONST.GAME.TILE;
      const footY = this.y + this.h;
      const sampleX = this.center?.x ?? this.x + this.w * 0.5;
      const tile = world.map.getTileAtPixel(sampleX, footY);
      if (tile === TILE.ONE_WAY) {
        const ty = Math.floor(footY / tileSize);
        const tileTop = ty * tileSize;
        if (footY >= tileTop && footY <= tileTop + tileSize) {
          this.y = tileTop - this.h;
          this.vy = 0;
          this.onGround = true;
        }
      }
    }

    this.vy = Math.min(CONST.PHYSICS.MaxFallSpeed, this.vy + CONST.PHYSICS.Gravity);
    resolveEntityMovement(this, world.map, dt, { arenaLock: world.getArenaCollisionBounds() });
    this.vx *= this.onGround ? CONST.PHYSICS.GroundFriction : 0.98;
  }

  applyFlyingMovement(dt, world, suppressFlightControl = false) {
    if (suppressFlightControl) {
      this.vy *= 0.7;
    } else {
      const targetY = this.hoverBaseY;
      const pullY = (targetY - this.y) * 0.16;
      this.vy = Math.max(-1.35, Math.min(1.35, pullY));
    }
    resolveEntityMovement(this, world.map, dt, { arenaLock: world.getArenaCollisionBounds() });
    if (this.onGround) {
      this.onGround = false;
      this.vy = Math.min(this.vy, -1.9);
      this.y -= 2;
    }
    this.keepFlyingClearance(world);
    this.vx *= 0.94;
  }

  keepFlyingClearance(world) {
    const minClearance = this.isSwimmingType()
      ? SWIM_MIN_FLOOR_CLEARANCE
      : SKY_MIN_FLOOR_CLEARANCE;
    const floorGap = this.getFloorGap(world?.map, minClearance);
    if (floorGap >= minClearance) return;
    const missing = minClearance - floorGap;
    this.vy = Math.min(this.vy, -1.2 - missing * 0.03);
    this.hoverBaseY -= Math.min(14, missing * 0.35);
  }

  getFloorGap(map, fallbackGap = SKY_MIN_FLOOR_CLEARANCE) {
    if (!map || typeof map.getTileAtPixel !== "function") return fallbackGap;
    const sampleX = [this.x + 6, this.center.x, this.x + this.w - 6];
    const maxScan = 220;
    const step = 4;
    const blockingTiles = new Set([
      TILE.SOLID,
      TILE.ICE,
      TILE.BRICK,
      TILE.GIFT_BOX,
      TILE.ONE_WAY,
      TILE.SPIKES,
      ...(this.isSwimmingType() ? [] : [TILE.WATER]),
      TILE.POISON
    ]);

    for (let offset = 0; offset <= maxScan; offset += step) {
      const y = this.y + this.h + offset;
      for (const x of sampleX) {
        const tile = map.getTileAtPixel(x, y);
        if (blockingTiles.has(tile)) {
          return offset;
        }
      }
    }

    return maxScan;
  }

  applyMovement(dt, world, options = {}) {
    if (this.isFlyingType()) {
      this.applyFlyingMovement(dt, world, options.suppressFlightControl === true);
      return;
    }
    this.applyGravityAndCollision(dt, world);
  }

  avoidUnsafeGroundAhead(world, speedMul = 1) {
    if (!this.onGround || !world?.map || typeof world.map.getTileAtPixel !== "function") {
      return;
    }
    if (this.state !== "Patrol" && this.state !== "Chase") {
      return;
    }

    const dir = this.vx === 0 ? this.facing : Math.sign(this.vx);
    if (!dir) return;

    const probeX = dir > 0 ? this.x + this.w + 10 : this.x - 10;
    const bodyY = this.y + this.h - 6;
    const supportY = this.y + this.h + 6;
    const wallProbeTopY = this.y + this.h * 0.35;
    const wallProbeMidY = this.y + this.h * 0.65;

    const bodyTile = world.map.getTileAtPixel(probeX, bodyY);
    const supportTile = world.map.getTileAtPixel(probeX, supportY);
    const wallTileTop = world.map.getTileAtPixel(probeX, wallProbeTopY);
    const wallTileMid = world.map.getTileAtPixel(probeX, wallProbeMidY);
    const hazardAhead =
      HAZARD_TILES.has(bodyTile) || HAZARD_TILES.has(supportTile);
    const noSupportAhead = !SAFE_GROUND_TILES.has(supportTile);
    const wallAhead =
      WALL_BLOCK_TILES.has(wallTileTop) || WALL_BLOCK_TILES.has(wallTileMid);

    if (!hazardAhead && !noSupportAhead && !wallAhead) return;

    this.facing *= -1;
    const baseSpeed =
      this.state === "Chase" ? this.cfg.speed : this.cfg.speed * 0.6;
    this.vx = baseSpeed * speedMul * this.facing;
  }

  updateFlyingState(dt, world, player, dist, detectRange, speedMul) {
    const swim = this.isSwimmingType();
    if (swim) {
      this.updateMarioSwimState(dt, world, player, dist, detectRange, speedMul);
      return;
    }
    const bobSpeed = swim ? SWIM_BOB_SPEED : SKY_BOB_SPEED;
    const bobAmplitude = swim ? SWIM_BOB_AMPLITUDE : SKY_BOB_AMPLITUDE;
    this.hoverPhase += dt * bobSpeed;
    this.hoverBaseY = this.spawnY + Math.sin(this.hoverPhase) * bobAmplitude;
    const dxToPlayer = player.center.x - this.center.x;

    if (this.attackTimer > 0) {
      this.state = "Attack";
      this.facingLocked = true;
      this.vx *= 0.82;
      this.attackTimer = Math.max(0, this.attackTimer - dt);
      if (this.attackTimer <= 0) {
        this.facingLocked = false;
        this.state = dist <= detectRange ? "Chase" : "Patrol";
      }
      return;
    }

    if (dist <= detectRange) {
      this.state = "Chase";
      this.facing = resolveFacingWithDeadzone(
        this.facing,
        dxToPlayer,
        SKY_VERTICAL_DEADZONE,
        this.facingLocked,
      );
      if (Math.abs(dxToPlayer) > SKY_VERTICAL_DEADZONE) {
        this.vx = this.cfg.speed * speedMul * 0.72 * this.facing;
      } else {
        // Avoid left/right jitter when hero is aligned vertically with this flyer.
        this.vx *= 0.85;
        if (Math.abs(this.vx) < 0.08) this.vx = 0;
      }
    } else {
      this.state = "Patrol";
      const roam = 104;
      if (this.x <= this.spawnX - roam) this.facing = 1;
      if (this.x >= this.spawnX + roam) this.facing = -1;
      this.vx = this.cfg.speed * speedMul * 0.45 * this.facing;
    }

    if (FLYING_RANGED_TYPES.has(this.type)) {
      this.trySkyAttack(world, player, dist, detectRange);
    }
  }

  updateMarioSwimState(dt, world, player, dist, detectRange, speedMul) {
    const bobSpeed = this.type === "jellyBomber"
      ? JELLY_LOOP_VERTICAL_SPEED
      : SWIM_BOB_SPEED;
    this.hoverPhase += dt * bobSpeed;
    const dxToPlayer = player.center.x - this.center.x;
    const dyToPlayer = player.center.y - this.center.y;

    if (this.attackTimer > 0) {
      this.state = "Attack";
      this.facingLocked = true;
      this.vx *= 0.82;
      this.attackTimer = Math.max(0, this.attackTimer - dt);
      if (this.attackTimer <= 0) {
        this.facingLocked = false;
        this.state = dist <= detectRange ? "Chase" : "Patrol";
      }
      return;
    }

    if (this.type === "jellyBomber") {
      this.updateBlooperSwimState(
        world,
        player,
        dist,
        detectRange,
        speedMul,
        dxToPlayer,
        dyToPlayer,
      );
      return;
    }

    this.updateLaneSwimState(dt, dist, detectRange, speedMul, dxToPlayer, dyToPlayer);
  }

  updateLaneSwimState(dt, dist, detectRange, speedMul, dxToPlayer, dyToPlayer) {
    const roam = this.cfg.miniBoss ? SWIM_LANE_ROAM * 0.6 : SWIM_LANE_ROAM;
    if (this.x <= this.spawnX - roam) this.facing = 1;
    if (this.x >= this.spawnX + roam) this.facing = -1;

    this.swimRetargetTimer = Math.max(0, this.swimRetargetTimer - dt);
    if (this.swimRetargetTimer <= 0) {
      this.swimRetargetTimer =
        SWIM_LANE_TARGET_REFRESH_MIN_SEC +
        Math.random() *
        (SWIM_LANE_TARGET_REFRESH_MAX_SEC - SWIM_LANE_TARGET_REFRESH_MIN_SEC);
      const randomOffset = (Math.random() * 2 - 1) * 18;
      const playerOffset = Math.max(-26, Math.min(26, dyToPlayer * 0.18));
      this.swimLaneY = this.spawnY + randomOffset + playerOffset;
    }

    const laneBob = Math.sin(this.hoverPhase) * SWIM_BOB_AMPLITUDE;
    const chaseYOffset =
      dist <= detectRange
        ? Math.max(-20, Math.min(20, dyToPlayer * 0.1))
        : 0;
    const laneTargetY = this.swimLaneY + laneBob + chaseYOffset;
    this.hoverBaseY += (laneTargetY - this.hoverBaseY) * 0.15;

    const chaseScale = this.cfg.elite || this.cfg.miniBoss ? 0.72 : 0.66;
    const patrolScale = this.cfg.miniBoss ? 0.58 : 0.62;
    if (dist <= detectRange) {
      this.state = "Chase";
      this.facing = resolveFacingWithDeadzone(
        this.facing,
        dxToPlayer,
        ENEMY_FACING_DEADZONE,
        this.facingLocked,
      );
      this.vx = this.cfg.speed * speedMul * chaseScale * this.facing;
    } else {
      this.state = "Patrol";
      this.vx = this.cfg.speed * speedMul * patrolScale * this.facing;
    }
  }

  updateBlooperSwimState(
    world,
    player,
    dist,
    detectRange,
    speedMul,
    dxToPlayer,
    dyToPlayer,
  ) {
    const inEngageRange = dist <= detectRange * 1.1;
    if (inEngageRange) {
      // When hero is close, jelly should come toward hero.
      this.state = "Chase";
      this.facing = resolveFacingWithDeadzone(
        this.facing,
        dxToPlayer,
        ENEMY_FACING_DEADZONE,
        this.facingLocked,
      );
      const nearHorizontally = Math.abs(dxToPlayer) <= 22;
      if (nearHorizontally) {
        this.vx *= 0.82;
        if (Math.abs(this.vx) < 0.06) this.vx = 0;
      } else {
        this.vx = this.cfg.speed * speedMul * 0.56 * this.facing;
      }
      const chaseTargetY =
        player.center.y -
        this.h * 0.5 +
        Math.sin(this.hoverPhase * 1.2) * (JELLY_LOOP_VERTICAL_AMPLITUDE * 0.62);
      this.hoverBaseY += (chaseTargetY - this.hoverBaseY) * 0.24;
      return;
    }

    // Patrol pattern: strict right->left travel with larger vertical bob.
    this.state = "Patrol";
    this.facing = -1;
    this.vx = -Math.abs(this.cfg.speed * speedMul * JELLY_LOOP_LEFT_SPEED_SCALE);

    const arenaBounds =
      typeof world?.getArenaCollisionBounds === "function"
        ? world.getArenaCollisionBounds()
        : null;
    if (!arenaBounds && this.x <= 2) {
      const tileSize = Number(world?.map?.tileSize) || CONST.GAME.TILE;
      const mapWidthTiles = Number(world?.map?.width);
      const mapWidthPx =
        Number.isFinite(mapWidthTiles) && mapWidthTiles > 0
          ? mapWidthTiles * tileSize
          : null;
      if (Number.isFinite(mapWidthPx) && mapWidthPx > this.w + 8) {
        // Loop back to right edge after reaching left edge.
        this.x = mapWidthPx - this.w - 4;
      }
    }

    const chaseYOffset = Math.max(-6, Math.min(6, dyToPlayer * 0.04));
    const targetY =
      this.spawnY +
      Math.sin(this.hoverPhase) * JELLY_LOOP_VERTICAL_AMPLITUDE +
      chaseYOffset;
    this.hoverBaseY += (targetY - this.hoverBaseY) * 0.28;
  }

  updateForcedFlyRightToLeftState(dt, world, speedMul = 1) {
    this.hoverPhase += dt * JELLY_LOOP_VERTICAL_SPEED;
    this.state = "Patrol";
    this.facingLocked = false;
    this.facing = -1;
    this.vx = -Math.abs(this.cfg.speed * speedMul * JELLY_LOOP_LEFT_SPEED_SCALE);

    const arenaBounds =
      typeof world?.getArenaCollisionBounds === "function"
        ? world.getArenaCollisionBounds()
        : null;
    if (!arenaBounds && this.x <= 2) {
      const tileSize = Number(world?.map?.tileSize) || CONST.GAME.TILE;
      const mapWidthTiles = Number(world?.map?.width);
      const mapWidthPx =
        Number.isFinite(mapWidthTiles) && mapWidthTiles > 0
          ? mapWidthTiles * tileSize
          : null;
      if (Number.isFinite(mapWidthPx) && mapWidthPx > this.w + 8) {
        this.x = mapWidthPx - this.w - 4;
      }
    }

    const targetY =
      this.spawnY + Math.sin(this.hoverPhase) * JELLY_LOOP_VERTICAL_AMPLITUDE;
    this.hoverBaseY += (targetY - this.hoverBaseY) * 0.28;
  }

  trySkyAttack(world, player, dist, detectRange) {
    if (this.rangedCooldown > 0) return;
    if (dist > Math.min(SKY_ATTACK_RANGE, detectRange + 56)) return;
    if (typeof world.launchBossProjectile !== "function") return;

    const projectileSpeedMult = typeof world.getEnemyProjectileSpeedMultiplier === "function"
      ? world.getEnemyProjectileSpeedMultiplier()
      : 1;
    const cooldownMult = typeof world.getEnemyAttackCooldownMultiplier === "function"
      ? world.getEnemyAttackCooldownMultiplier()
      : 1;
    const projectileSpeed = 5.2 * projectileSpeedMult;
    const predictedTarget = predictTargetPosition(
      this.center,
      player.center,
      { x: player.vx || 0, y: player.vy || 0 },
      projectileSpeed,
      ENEMY_PROJECTILE_LEAD_FACTOR,
      ENEMY_PROJECTILE_MAX_LEAD_FRAMES,
    );
    const aim = directionToTarget(this.center, predictedTarget, this.facing);
    this.facing = resolveFacingWithDeadzone(
      this.facing,
      player.center.x - this.center.x,
      SKY_VERTICAL_DEADZONE,
    );
    let projectileColor = "#ff6a6a";
    if (SPIKED_SKULL_TYPES.has(this.type)) {
      const levelWorld = String(world?.levelData?.world || "")
        .trim()
        .toLowerCase();
      if (levelWorld === "beach") {
        projectileColor = "#ffd84a"; // yellow
      } else if (levelWorld === "ice") {
        projectileColor = "#ffffff"; // white
      } else if (levelWorld === "grave") {
        projectileColor = "#c28cff"; // purple
      } else {
        projectileColor = "#ffffff";
      }
    }

    world.launchBossProjectile(this, {
      speed: projectileSpeed,
      radius: 9,
      damage: Math.max(1, Math.round(this.cfg.damage * 0.9)),
      range: SKY_ATTACK_PROJECTILE_RANGE,
      color: projectileColor,
      dirX: aim.x,
      dirY: aim.y,
    });
    this.state = "Attack";
    this.facingLocked = true;
    this.attackTimer = 0.24;
    this.rangedCooldown = SKY_ATTACK_COOLDOWN_SEC * cooldownMult;
  }

  isIceRebirthChild() {
    return this.challengeTag === "ice_rebirth_child";
  }

  tryIceRebirthChildAttack(world, player, dist) {
    if (!this.isIceRebirthChild()) return;
    if (this.rangedCooldown > 0) return;
    if (this.attackTimer > 0) return;
    if (this.state === "Hurt" || this.state === "Death") return;
    const attackRange = this.forceAggroHero
      ? Math.max(ICE_REBIRTH_CHILD_ATTACK_RANGE, 2200)
      : ICE_REBIRTH_CHILD_ATTACK_RANGE;
    if (dist > attackRange) return;
    if (typeof world.launchBossProjectile !== "function") return;

    const projectileSpeedMult = typeof world.getEnemyProjectileSpeedMultiplier === "function"
      ? world.getEnemyProjectileSpeedMultiplier()
      : 1;
    const cooldownMult = typeof world.getEnemyAttackCooldownMultiplier === "function"
      ? world.getEnemyAttackCooldownMultiplier()
      : 1;
    const projectileSpeed = 6.1 * projectileSpeedMult;
    const predictedTarget = predictTargetPosition(
      this.center,
      player.center,
      { x: player.vx || 0, y: player.vy || 0 },
      projectileSpeed,
      ENEMY_PROJECTILE_LEAD_FACTOR,
      ENEMY_PROJECTILE_MAX_LEAD_FRAMES,
    );
    const aim = directionToTarget(this.center, predictedTarget, this.facing);
    this.facing = resolveFacingWithDeadzone(
      this.facing,
      player.center.x - this.center.x,
      ENEMY_FACING_DEADZONE,
    );

    world.launchBossProjectile(this, {
      speed: projectileSpeed,
      radius: 14,
      damage: Math.max(1, Math.round(this.cfg.damage * 0.95)),
      range: ICE_REBIRTH_CHILD_PROJECTILE_RANGE,
      color: "#ffffff",
      dirX: aim.x,
      dirY: aim.y,
      forceNoSprite: true,
      spinRate: 0,
      orientToVelocity: false,
    });

    this.state = "Attack";
    this.facingLocked = true;
    this.attackTimer = 0.26;
    this.attackDamageDone = true;
    this.rangedCooldown = ICE_REBIRTH_CHILD_ATTACK_COOLDOWN_SEC * cooldownMult;
  }

  isFlyingType() {
    return this.isForcedFlyRightToLeft() || FLYING_TYPES.has(this.type);
  }

  isSwimmingType() {
    return SWIM_TYPES.has(this.type);
  }

  isForcedFlyRightToLeft() {
    return this.forceFlyRightToLeft === true;
  }

  die(world) {
    if (this.state === "Death") return;
    this.facingLocked = false;
    this.state = "Death";
    const deathDuration = this.resolveDeathDurationSec();
    this.deathAnimDuration = deathDuration;
    this.deathTimer = deathDuration;
    world.onEnemyKilled(this);
  }

  resolveDeathDurationSec() {
    const fallback = Number(this.cfg?.removeAfterDeathSec) || 1;
    if (!this.isIceRebirthChild()) return fallback;
    const deathMeta =
      BOSS_SPRITE_META.iceTitan?.childDeath
      || BOSS_SPRITE_META.iceTitan?.death
      || null;
    const frameCount = Math.max(1, Number(deathMeta?.frameCount) || 1);
    const fps = Math.max(1, Number(deathMeta?.fps) || 5);
    const fullAnimSec = frameCount / fps;
    return Math.max(
      fallback,
      Math.max(ICE_REBIRTH_CHILD_DEATH_HOLD_SEC, Math.min(3.4, fullAnimSec + 0.05)),
    );
  }

  takeDamage(amount, world, effects = {}) {
    if (this.state === "Death") return false;

    this.hp -= amount;

    if (effects.freezeSec) {
      this.freezeTimer = Math.max(this.freezeTimer, effects.freezeSec);
    }
    if (effects.slowSec) {
      this.slowTimer = Math.max(this.slowTimer, effects.slowSec);
      this.slowFactor = effects.slowFactor || 0.75;
    }
    if (effects.burnSec) {
      this.burnTimer = Math.max(this.burnTimer, effects.burnSec);
      this.burnDps = effects.burnDps || 2;
    }
    if (effects.staggerSec) {
      this.staggerTimer = Math.max(this.staggerTimer, effects.staggerSec);
    }
    if (effects.pushbackX) {
      this.vx += effects.pushbackX;
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.die(world);
      return true;
    }

    this.state = "Hurt";
    this.facingLocked = false;
    this.hurtTimer = this.cfg.hurtRecoverySec;
    this.vx = -this.facing * CONST.COMBAT.KnockbackHeavy.pxPerFrame;
    return false;
  }

  draw(ctx, camera) {
    if (!this.active) return;
    const isRebirthChild = this.isIceRebirthChild();
    const showRebirthChildDeath = isRebirthChild && this.state === "Death";
    const showRebirthChildSpawn =
      isRebirthChild
      && !showRebirthChildDeath
      && this.spawnRebirthVisualTimer > 0;
    if (this.state === "Death" && !showRebirthChildDeath) return;
    const x = this.x - camera.x;
    const y = this.y - camera.y;
    const useRebirthVisual = isRebirthChild;
    const spriteKey = useRebirthVisual
      ? showRebirthChildDeath
        ? "childDeath"
        : showRebirthChildSpawn
          ? "rebirth"
          : this.state === "Attack"
            ? "childAttack"
            : this.state === "Hurt"
              ? "childHurt"
              : "childWalk"
      : this.state === "Attack"
        ? "attack"
        : "idle";
    const spriteSet = useRebirthVisual
      ? (BOSS_SPRITES.iceTitan || {})
      : (ENEMY_SPRITES[this.type] || {});
    let spritePath = spriteSet[spriteKey] || spriteSet.idle;
    if (!useRebirthVisual && spriteKey === "idle" && spriteSet.alt) {
      const phase = Math.floor(performance.now() / 210) % 2;
      if (phase === 1) spritePath = spriteSet.alt;
    }
    const sprite = spritePath ? getImage(spritePath) : null;
    const isSwimDraw = !useRebirthVisual && this.isSwimmingType();
    const sizeMult = useRebirthVisual
      ? 1
      : isSwimDraw
      ? 1
      : (this.cfg.miniBoss ? 1.06 : 1);
    const heightMult = useRebirthVisual
      ? 1
      : isSwimDraw
      ? 1
      : this.cfg.miniBoss
        ? 1.18
        : this.cfg.elite
          ? 1.14
          : 1.12;
    let drawW = Math.round(this.w * sizeMult);
    let drawH = Math.round(this.h * heightMult);
    let drawX = x - (drawW - this.w) * 0.5;
    let drawY = y - (drawH - this.h);

    if (sprite) {
      const spriteMeta = useRebirthVisual
        ? (BOSS_SPRITE_META.iceTitan || null)
        : spriteMetaForType(this.type);
      const frameInfo = useRebirthVisual && showRebirthChildDeath
        ? this.getOneShotFrameInfo(
          sprite,
          spriteMeta,
          spriteKey,
          this.deathTimer,
          this.deathAnimDuration || this.resolveDeathDurationSec(),
        )
        : useRebirthVisual && showRebirthChildSpawn
        ? this.getOneShotFrameInfo(
          sprite,
          spriteMeta,
          spriteKey,
          this.spawnRebirthVisualTimer,
          Math.max(0.001, this.spawnRebirthVisualDuration),
        )
        : useRebirthVisual
        ? this.getSpriteFrameInfo(sprite, spriteMeta, spriteKey)
        : this.getSpriteFrameInfo(sprite, spriteMeta, spriteKey);
      const frameW = Math.max(
        1,
        Math.floor(sprite.width / Math.max(1, frameInfo.frameCount)),
      );
      const sx = Math.max(
        0,
        Math.min(
          sprite.width - frameW,
          frameInfo.frameIndex * frameW,
        ),
      );
      // Preserve original sprite aspect ratio for all enemies (no stretch)
      if (!useRebirthVisual && sprite.height > 0) {
        const scale = Math.min(drawW / frameW, drawH / sprite.height);
        drawW = Math.round(frameW * scale);
        drawH = Math.round(sprite.height * scale);
        drawX = x - (drawW - this.w) * 0.5;
        drawY = y - (drawH - this.h);
      }
      ctx.save();
      const shouldMirror = useRebirthVisual
        ? this.facing < 0
        : this.type === "iceTitan"
          ? this.facing > 0
          : MIRROR_FACING_RIGHT_TYPES.has(this.type)
            ? this.facing > 0
            : this.facing < 0;
      if (shouldMirror) {
        ctx.translate(drawX + drawW, drawY);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, sx, 0, frameW, sprite.height, 0, 0, drawW, drawH);
      } else {
        ctx.drawImage(sprite, sx, 0, frameW, sprite.height, drawX, drawY, drawW, drawH);
      }
      ctx.restore();
    } else {
      ctx.fillStyle = this.cfg.elite ? "#bf8b24" : this.cfg.miniBoss ? "#8e2f9b" : "#8fb1ce";
      ctx.fillRect(x, y, this.w, this.h);
    }

  }

  getSpriteFrameInfo(sprite, spriteMeta, spriteKey) {
    const keyMeta = (spriteMeta && typeof spriteMeta === "object" && !Array.isArray(spriteMeta))
      ? spriteMeta[spriteKey]
      : null;
    const detectedFrameCount = Math.max(1, Math.round(sprite.width / Math.max(1, sprite.height)));
    const frameCount = Math.max(
      1,
      Number(keyMeta?.frameCount) || Number(spriteMeta?.frameCount) || detectedFrameCount
    );
    if (frameCount === 1) {
      return { frameCount: 1, frameIndex: 0 };
    }
    const movingState = spriteKey === "attack" || this.state === "Chase";
    const fps = Math.max(1, Number(keyMeta?.fps) || Number(spriteMeta?.fps) || (movingState ? 8 : 6));
    const frameIndex = Math.floor((performance.now() / 1000 * fps) % frameCount);
    return { frameCount, frameIndex };
  }

  getOneShotFrameInfo(sprite, spriteMeta, spriteKey, timerSec, durationSec) {
    const keyMeta = (spriteMeta && typeof spriteMeta === "object" && !Array.isArray(spriteMeta))
      ? spriteMeta[spriteKey]
      : null;
    const detectedFrameCount = Math.max(1, Math.round(sprite.width / Math.max(1, sprite.height)));
    const frameCount = Math.max(
      1,
      Number(keyMeta?.frameCount) || Number(spriteMeta?.frameCount) || detectedFrameCount
    );
    if (frameCount === 1) {
      return { frameCount: 1, frameIndex: 0 };
    }
    const duration = Math.max(0.001, Number(durationSec) || 0.001);
    const elapsed = Math.max(0, duration - (Number(timerSec) || 0));
    const progress = Math.max(0, Math.min(1, elapsed / duration));
    const frameIndex = Math.min(frameCount - 1, Math.floor(progress * frameCount));
    return { frameCount, frameIndex };
  }
}

function spriteMetaForType(type) {
  return ENEMY_SPRITE_META[type] || null;
}
