/*
  Звукът на сайта е тиктакането на механизма — синтезирано, без файлове.
  Всеки удар идва от сцената (анкерът се обръща), затова звукът е точно
  колкото балансът: забавеното време тиктака по-рядко и по-ниско, с повече
  ехо — като в катедрала. Отдолу — едва чуто „стайно“ бучене вътре.
*/
export class Tick {
  private ctx: AudioContext | null = null;
  private out!: GainNode;
  private wet!: GainNode;
  private room!: GainNode;
  private roomFilter!: BiquadFilterNode;
  on = false;

  private ensure() {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(ctx.destination);

    // Ехо: синтезиран импулсен отговор (шум с експоненциално затихване).
    const conv = ctx.createConvolver();
    const len = ctx.sampleRate * 3.2;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    conv.buffer = ir;
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.15;
    this.wet.connect(conv).connect(this.out);

    // Стайният тон: кафяв шум през нискочестотен филтър.
    const nb = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    let last = 0;
    for (let i = 0; i < nd.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      nd[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = nb;
    src.loop = true;
    this.roomFilter = ctx.createBiquadFilter();
    this.roomFilter.type = "lowpass";
    this.roomFilter.frequency.value = 180;
    this.room = ctx.createGain();
    this.room.gain.value = 0;
    src.connect(this.roomFilter).connect(this.room).connect(this.out);
    src.start();
    return ctx;
  }

  async enable(on: boolean) {
    this.on = on;
    if (!on && !this.ctx) return;
    const ctx = this.ensure();
    if (on && ctx.state !== "running") await ctx.resume();
    this.out.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.25);
  }

  /** Обстановката: колко сме „вътре“ (0–1) и колко е забавено времето. */
  ambience(inside: number, rate: number) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime;
    this.wet.gain.setTargetAtTime(0.12 + 0.75 * inside * (1 - rate * 0.5), t, 0.3);
    this.room.gain.setTargetAtTime(0.18 * inside, t, 0.5);
  }

  /** Един удар. side: ±1 — „тик“ и „так“ звучат различно, както на анкера. */
  tick(side: number, rate: number, inside: number) {
    if (!this.ctx || !this.on) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.005;
    const pitch = (side > 0 ? 1 : 0.86) * (0.45 + 0.55 * Math.min(1, rate * 1.6)) * (1 - 0.25 * inside);
    const dry = ctx.createGain();
    dry.connect(this.out);
    dry.connect(this.wet);

    // Щракване: кратък шум през лентов филтър.
    const len = Math.floor(ctx.sampleRate * 0.02);
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const n = ctx.createBufferSource();
    n.buffer = b;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 3800 * pitch;
    bp.Q.value = 2.2;
    const ng = ctx.createGain();
    ng.gain.value = 0.55;
    n.connect(bp).connect(ng).connect(dry);
    n.start(t);

    // Метален резонанс — два парциала на месинга.
    for (const [f, a, dec] of [
      [2350, 0.07, 0.05],
      [5230, 0.035, 0.03],
      [880, 0.05 * inside, 0.12],
    ] as const) {
      if (a <= 0.001) continue;
      const o = ctx.createOscillator();
      o.frequency.value = f * pitch;
      const g = ctx.createGain();
      g.gain.setValueAtTime(a, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dec * (1 + 2 * inside));
      o.connect(g).connect(dry);
      o.start(t);
      o.stop(t + 0.5);
    }
  }
}
