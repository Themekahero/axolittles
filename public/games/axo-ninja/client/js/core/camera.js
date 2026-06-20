import { clamp, lerp } from "../utils/math.js";

export class Camera {
  constructor(viewWidth, viewHeight) {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.x = 0;
    this.y = 0;
    this.bounds = { x: 0, y: 0, w: viewWidth, h: viewHeight };
  }

  setWorldBounds(x, y, w, h) {
    this.bounds = { x, y, w, h };
  }

  follow(target, smooth = 0.12, lookAheadX = 0, lookAheadY = 0) {
    const desiredX = target.x + target.w * 0.5 - this.viewWidth * 0.5 + lookAheadX;
    const desiredY = target.y + target.h * 0.5 - this.viewHeight * 0.5 + lookAheadY;

    this.x = lerp(this.x, desiredX, smooth);
    this.y = lerp(this.y, desiredY, smooth);

    this.x = clamp(this.x, this.bounds.x, this.bounds.x + this.bounds.w - this.viewWidth);
    this.y = clamp(this.y, this.bounds.y, this.bounds.y + this.bounds.h - this.viewHeight);
  }
}
