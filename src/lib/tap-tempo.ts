export class TapTempo {
  private tapTimes: number[] = [];

  tap(time = Date.now()): number | null {
    const previousTap = this.tapTimes.at(-1);
    if (previousTap !== undefined && time - previousTap >= 3000) {
      this.tapTimes = [];
    }

    this.tapTimes.push(time);
    if (this.tapTimes.length > 16) this.tapTimes.shift();
    if (this.tapTimes.length < 3) return null;

    const interval = this.tapTimes[this.tapTimes.length - 1] - this.tapTimes[0];
    if (interval <= 0) return null;
    return Math.round((60000 * (this.tapTimes.length - 1)) / interval);
  }
}
