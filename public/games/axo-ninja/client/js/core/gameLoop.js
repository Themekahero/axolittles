import { CONST } from "../config/constants.js";

export class GameLoop {
  constructor(updateFn, drawFn) {
    this.updateFn = updateFn;
    this.drawFn = drawFn;
    this.last = 0;
    this.accumulator = 0;
    this.fixedDt = 1 / CONST.GAME.FPS;
    this.running = false;
    this.rafId = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  tick = (now) => {
    if (!this.running) return;

    const deltaSec = Math.min(1 / 30, (now - this.last) / 1000);
    this.last = now;
    this.accumulator += deltaSec;

    while (this.accumulator >= this.fixedDt) {
      this.updateFn(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }

    this.drawFn();
    this.rafId = requestAnimationFrame(this.tick);
  };
}
