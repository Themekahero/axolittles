import { Entity } from "./entity.js";
import { UI_IMAGES, getImage } from "../core/assets.js";

function hasRenderableImage(img) {
  return Boolean(img && img.width > 2 && img.height > 2);
}

function easeOutCubic(t) {
  const clamped = Math.max(0, Math.min(1, Number(t) || 0));
  return 1 - (1 - clamped) ** 3;
}

export class Coin extends Entity {
  constructor() {
    super();
    this.w = 32;
    this.h = 32;
    this.value = 1;
    this.kind = "axo";
    this.floatT = 0;
    this.life = 0;
    this.collectible = true;
    this.originX = 0;
    this.originY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.emergeElapsed = 0;
    this.emergeDuration = 0;
  }

  reset(x, y, value = 1, kind = "axo", life = 0, options = null) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.kind = String(kind || "axo");
    this.floatT = Math.random() * Math.PI * 2;
    this.life = life;
    this.collectible = true;
    this.originX = x;
    this.originY = y;
    this.targetX = x;
    this.targetY = y;
    this.emergeElapsed = 0;
    this.emergeDuration = 0;
    this.w = this.kind === "heart" ? 40 : 32;
    this.h = this.kind === "heart" ? 40 : 32;

    if (options && typeof options === "object") {
      const originX = Number(options.originX);
      const originY = Number(options.originY);
      const targetX = Number(options.targetX);
      const targetY = Number(options.targetY);
      const emergeDuration = Number(options.emergeDuration);
      if (Number.isFinite(originX)) this.originX = originX;
      if (Number.isFinite(originY)) this.originY = originY;
      if (Number.isFinite(targetX)) this.targetX = targetX;
      if (Number.isFinite(targetY)) this.targetY = targetY;
      if (Number.isFinite(emergeDuration) && emergeDuration > 0) {
        this.emergeDuration = emergeDuration;
        this.x = this.originX;
        this.y = this.originY;
        this.collectible = options.collectibleOnSpawn === true;
      }
      const width = Number(options.w);
      const height = Number(options.h);
      if (Number.isFinite(width) && width > 0) this.w = width;
      if (Number.isFinite(height) && height > 0) this.h = height;
    }

    this.active = true;
  }

  update(dt) {
    if (this.life > 0) {
      this.life = Math.max(0, this.life - dt);
      if (this.life <= 0) {
        this.active = false;
        return;
      }
    }
    this.floatT += dt;

    if (this.emergeDuration > 0 && this.emergeElapsed < this.emergeDuration) {
      this.emergeElapsed = Math.min(this.emergeDuration, this.emergeElapsed + dt);
      const t = easeOutCubic(this.emergeElapsed / this.emergeDuration);
      this.x = this.originX + (this.targetX - this.originX) * t;
      this.y = this.originY + (this.targetY - this.originY) * t;
      if (this.emergeElapsed >= this.emergeDuration) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.collectible = true;
      }
    }
  }

  drawHeart(ctx, x, y) {
    const heartImg = getImage(UI_IMAGES.hearts);
    const size = this.w;
    const cx = Math.round(x + size * 0.5);
    const cy = Math.round(y + size * 0.5);
    const auraRadius = size * 0.7;
    const pulse = 1 + Math.sin(this.floatT * 3.2) * 0.06;
    const aura = ctx.createRadialGradient(
      cx,
      cy,
      auraRadius * 0.2,
      cx,
      cy,
      auraRadius * pulse,
    );
    aura.addColorStop(0, "rgba(255, 168, 190, 0.22)");
    aura.addColorStop(0.55, "rgba(255, 118, 156, 0.12)");
    aura.addColorStop(1, "rgba(255, 118, 156, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, cy, auraRadius * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.translate(-size * 0.5, -size * 0.5);

    if (hasRenderableImage(heartImg)) {
      ctx.drawImage(heartImg, 0, 0, heartImg.width, heartImg.height, 0, 0, size, size);
      ctx.restore();
      return;
    }

    ctx.fillStyle = "#ff6f8e";
    ctx.font = `700 ${Math.round(size * 0.9)}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("\u2665", size * 0.5, size * 0.52);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  draw(ctx, camera) {
    if (!this.active) return;
    const bob = this.collectible ? Math.sin(this.floatT * 4.2) * 2.4 : 0;
    const x = this.x - camera.x;
    const y = this.y - camera.y + bob;

    if (this.kind === "heart") {
      this.drawHeart(ctx, x, y);
      return;
    }

    const size = this.value >= 15 ? this.w + 4 : this.w;
    const cx = Math.round(x + size / 2);
    const cy = Math.round(y + size / 2);
    const r = size * 0.48;
    const coinImg = getImage(UI_IMAGES.axocoin);
    const flipAngle = this.floatT * 2.2;
    const scaleX = Math.max(0.28, Math.abs(Math.cos(flipAngle)));

    const auraRadius = r + 4;
    const auraPulse = 1 + Math.sin(this.floatT * 3) * 0.08;
    const auraR = auraRadius * auraPulse;
    const aura = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, auraR);
    aura.addColorStop(0, "rgba(255, 230, 120, 0.18)");
    aura.addColorStop(0.5, "rgba(255, 210, 80, 0.08)");
    aura.addColorStop(1, "rgba(255, 200, 60, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, cy, auraR, 0, Math.PI * 2);
    ctx.fill();

    if (this.value >= 15) {
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#ffd96f";
      ctx.beginPath();
      ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const sizeInt = Math.round(size);
    const halfInt = sizeInt / 2;
    ctx.save();
    if (typeof ctx.imageSmoothingQuality !== "undefined") {
      ctx.imageSmoothingQuality = "high";
    }
    ctx.translate(cx, cy);
    ctx.scale(scaleX, 1);
    ctx.translate(-halfInt, -halfInt);
    const edgeAlpha = 0.72 + 0.28 * scaleX;
    ctx.globalAlpha *= edgeAlpha;

    if (hasRenderableImage(coinImg)) {
      ctx.drawImage(coinImg, 0, 0, coinImg.width, coinImg.height, 0, 0, sizeInt, sizeInt);
      ctx.restore();
      return;
    }

    const lcx = halfInt;
    const lcy = halfInt;
    const outer = ctx.createRadialGradient(lcx - r * 0.35, lcy - r * 0.35, r * 0.2, lcx, lcy, r);
    outer.addColorStop(0, "#ffe775");
    outer.addColorStop(1, "#d7a302");
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.arc(lcx, lcy, r, 0, Math.PI * 2);
    ctx.fill();

    const inner = ctx.createRadialGradient(lcx, lcy, r * 0.15, lcx, lcy, r * 0.75);
    inner.addColorStop(0, "#f6cb34");
    inner.addColorStop(1, "#b68000");
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.arc(lcx, lcy, r * 0.68, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,245,180,0.58)";
    ctx.beginPath();
    ctx.arc(lcx - r * 0.34, lcy - r * 0.36, r * 0.23, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#7e5300";
    ctx.font = `700 ${Math.round(size * 0.62)}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("A", lcx, lcy + 1);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    ctx.restore();
  }
}
