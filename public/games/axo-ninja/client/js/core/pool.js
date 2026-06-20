export class ObjectPool {
  constructor(factory, size = 32) {
    this.factory = factory;
    this.items = [];
    this.cursor = 0;
    for (let i = 0; i < size; i += 1) {
      this.items.push(factory());
    }
  }

  acquire() {
    const items = this.items;
    const n = items.length;
    // Rotating cursor: the next free slot is usually right after the last
    // one handed out, so this stays O(1) amortized instead of scanning
    // from index 0 every time.
    for (let i = 0; i < n; i += 1) {
      const idx = (this.cursor + i) % n;
      const item = items[idx];
      if (!item.active) {
        this.cursor = (idx + 1) % n;
        return item;
      }
    }
    const extra = this.factory();
    items.push(extra);
    this.cursor = 0;
    return extra;
  }

  release(item) {
    if (!item) return;
    item.active = false;
  }

  countActive() {
    let count = 0;
    const items = this.items;
    for (let i = 0; i < items.length; i += 1) {
      if (items[i].active) count += 1;
    }
    return count;
  }

  activeItems() {
    return this.items.filter((i) => i.active);
  }
}
