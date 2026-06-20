import { Entity } from "./entity.js";
import { randomRange } from "../utils/math.js";

export class Particle extends Entity {
  constructor() {
    super();
    this.w = 4;
    this.h = 4;
    this.life = 0;
    this.maxLife = 0;
    this.color = "#fff";
  }

  reset(x, y, color = "#fff") {
    this.x = x;
    this.y = y;
    this.vx = randomRange(-2.2, 2.2);
    this.vy = randomRange(-2.6, -0.5);
    this.life = randomRange(0.25, 0.6);
    this.maxLife = this.life;
    this.color = color;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.vy += 0.15;
  }

  draw(ctx, camera) {
    if (!this.active) return;
    const alpha = this.life / this.maxLife;
    ctx.fillStyle = this.color.replace("ALPHA", alpha.toFixed(3));
    ctx.fillRect(this.x - camera.x, this.y - camera.y, this.w, this.h);
  }
}
