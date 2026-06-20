export class Entity {
  constructor() {
    this.active = true;
    this.x = 0;
    this.y = 0;
    this.w = 32;
    this.h = 32;
    this.vx = 0;
    this.vy = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.onGround = false;
    this.stepHeight = 0;
  }

  get center() {
    return { x: this.x + this.w * 0.5, y: this.y + this.h * 0.5 };
  }

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}
