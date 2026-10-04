// Mount Dew dither library. MIT License. Made by Dan with Grok.
//
// Unit dither tables. The live output scales them from the parameters below.
// Nothing here truncates the signal to an integer word.

export type DitherShape = "off" | "rpdf" | "tpdf" | "floyd";
export type DitherBits = 16 | 24 | 32;

export type DitherParams = {
  enabled: boolean;
  shape: DitherShape;
  bits: DitherBits;
  amount: number;
  shaping: number;
};

export const DITHER_DEFAULTS: DitherParams = {
  enabled: true,
  shape: "tpdf",
  bits: 24,
  amount: 1,
  shaping: 0,
};

let params: DitherParams = { ...DITHER_DEFAULTS };

export function setDitherParams(next: Partial<DitherParams>): DitherParams {
  const bits = next.bits === 16 || next.bits === 32 ? next.bits : next.bits === 24 ? 24 : params.bits;
  const shape = next.shape === "off" || next.shape === "rpdf" || next.shape === "tpdf" || next.shape === "floyd" ? next.shape : params.shape;
  params = {
    enabled: next.enabled ?? params.enabled,
    shape,
    bits,
    amount: Math.max(0, Math.min(2, next.amount ?? params.amount)),
    shaping: Math.max(0, Math.min(0.98, next.shaping ?? params.shaping)),
  };
  return params;
}

export function ditherParams() {
  return params;
}

export function ditherStep(p: DitherParams = params) {
  return p.bits === 16 ? 1 / 32768 : p.bits === 32 ? 1 / 2147483648 : 1 / 8388608;
}

export function ditherScale(p: DitherParams = params) {
  if (!p.enabled || p.shape === "off" || p.amount <= 0) return 0;
  return ditherStep(p) * p.amount;
}

function uniform(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildTable(n: number, seed: number, triangular: boolean) {
  const next = uniform(seed);
  const table = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = next();
    table[i] = triangular ? a + next() - 1 : a * 2 - 1;
  }
  return table;
}

/** Unit rectangular dither, range ±1 before the bit-depth scale. */
export const DITHER_RPDF = buildTable(4096, 0x51ed270b, false);

/** Unit triangular dither, range ±1 before the bit-depth scale. */
export const DITHER_TPDF = buildTable(4096, 0x6d2b79f5, true);

let cursor = 0;

export function nextDither() {
  const table = params.shape === "rpdf" ? DITHER_RPDF : DITHER_TPDF;
  const v = table[cursor & 4095]! * ditherScale();
  cursor = (cursor + 1) & 4095;
  return v;
}

export function ditherInto(data: Float32Array, gain: number) {
  let peak = 0;
  for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]!));
  if (peak < 1e-5) return data;
  const g = gain / peak;
  if (params.shape === "floyd" && params.enabled) {
    const step = ditherStep();
    const err = [0, 0, 0, 0];
    for (let i = 0; i < data.length; i++) {
      const fb = (7 * err[0]! + 5 * err[1]! + 3 * err[2]! + err[3]!) / 16;
      const acc = data[i]! * g + fb;
      const q = Math.max(-1, Math.min(1, Math.round(acc / step) * step));
      const e = acc - q;
      err[3] = err[2]!;
      err[2] = err[1]!;
      err[1] = err[0]!;
      err[0] = e;
      data[i] = q;
    }
    return data;
  }
  const scale = ditherScale();
  for (let i = 0; i < data.length; i++) data[i] = data[i]! * g + (scale ? nextDither() : 0);
  return data;
}
