/** Circle Q2 2026 (quarter ended 2026-06-30), from the earnings release. */
export const Q2 = {
  period: "2026 Q2",
  ended: "2026-06-30",
  usdcEop: 73.3e9,
  usdcAvg: 76.5e9,
  reserveReturn: 0.035,
  usdcOnPlatform: 12.4e9,
  platformWavg: 0.195,
  revenue: 701.3e6,
  reserveIncome: 667.7e6,
  otherRevenue: 33.6e6,
  distribution: 412.5e6,
  rldc: 288.8e6,
  rldcMargin: 0.412,
  netReserveMargin: 0.39,
  adjEbitda: 143.5e6,
  netIncome: 48.2e6,
  onchainVolume: 14.8e12,
  walletsM: 7.0,
  minted: 83e9,
  redeemed: 87e9,
  share: 0.27,
} as const;

/** Trailing aggregates compiled from public market data around 2026-10-30. Not a live feed. */
export const TTM = {
  revenue: 2.91e9,
  netIncome: 451.28e6,
  eps: 1.8,
  fcf: 761.52e6,
} as const;

export const BAND_LOW = 22;
export const BAND_HIGH = 30;

export type YieldMode = "bill" | "reported" | "custom";
export type RevenueBasis = "ttm" | "model";

export type Assumptions = {
  yieldMode: YieldMode;
  customYieldPct: number;
  cashDragBps: number;
  netReserveMarginPct: number;
  ebitdaConversionPct: number;
  otherRevenueM: number;
  cpnTakeBps: number;
  arcSharePct: number;
  myMultiple: number;
  targetPs: number;
  revenueBasis: RevenueBasis;
  forwardEps: number;
  targetPe: number;
  sharesM: number;
};

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  yieldMode: "bill",
  customYieldPct: 3.5,
  cashDragBps: 40,
  netReserveMarginPct: 39,
  ebitdaConversionPct: 50,
  otherRevenueM: 134,
  cpnTakeBps: 5,
  arcSharePct: 8,
  myMultiple: 26,
  targetPs: 5.5,
  revenueBasis: "ttm",
  forwardEps: 1.6,
  targetPe: 35,
  sharesM: 255.1,
};

export type ModelResult = {
  yieldPct: number;
  reserveIncome: number;
  rldc: number;
  ebitda: number;
  modelRevenue: number;
  lowPx: number;
  highPx: number;
  myPx: number;
  psPx: number;
  pePx: number;
  relativeMid: number;
  revenueBase: number;
  shares: number;
  impliedMultiple: number | null;
  arcIncome: number;
  cctpIncome: number;
  cpnIncome: number;
  businessIncome: number;
};

export function reserveYieldPct(billPct: number | null, a: Assumptions): number {
  if (a.yieldMode === "reported") return 3.5;
  if (a.yieldMode === "custom") return a.customYieldPct;
  const bill = billPct ?? 3.5;
  return Math.max(0, bill - a.cashDragBps / 100);
}

/** CPN is a payments network. The figure is a trailing-30-day run-rate, not a quarter total. */
export const CPN = {
  asOf: "2026-06-30",
  annualized: 14.7e9,
  qoq: 0.76,
  institutions: 175,
} as const;

/** DefiLlama bridge page, 2026-10-31. Their bridge API is blocked, so volume does not tick. */
export const CCTP_VOLUME = {
  asOf: "2026-10-31",
  d1: 722.32e6,
  d7: 4.481e9,
  d30: 16.373e9,
} as const;

export type FeeRun = {
  cctp30: number | null;
  gateway30: number | null;
  arc30: number | null;
};

export function businessLines(fees: FeeRun, a: Assumptions) {
  const cctp = ((fees.cctp30 ?? 0) + (fees.gateway30 ?? 0)) * 12;
  const arc = (fees.arc30 ?? 0) * 12 * (a.arcSharePct / 100);
  const cpn = (CPN.annualized * a.cpnTakeBps) / 10_000;
  return { cctp, arc, cpn, total: cctp + arc + cpn };
}

export function runModel(
  usdc: number | null,
  billPct: number | null,
  price: number | null,
  a: Assumptions,
  fees: FeeRun,
): ModelResult | null {
  if (!usdc || usdc <= 0 || !(a.sharesM > 0)) return null;
  const yieldPct = reserveYieldPct(billPct, a);
  const reserveIncome = usdc * (yieldPct / 100);
  const lines = businessLines(fees, a);
  const other = a.otherRevenueM * 1e6;
  const rldcCore = reserveIncome * (a.netReserveMarginPct / 100) + other;
  const rldc = rldcCore + lines.total;
  const ebitda = rldcCore * (a.ebitdaConversionPct / 100) + lines.total;
  const modelRevenue = reserveIncome + other + lines.total;
  const shares = a.sharesM * 1e6;
  const px = (mult: number) => (ebitda * mult) / shares;
  const revenueBase = a.revenueBasis === "ttm" ? TTM.revenue : modelRevenue;
  const psPx = (a.targetPs * revenueBase) / shares;
  const pePx = a.targetPe * a.forwardEps;
  const cap = price != null ? price * shares : null;
  return {
    yieldPct,
    reserveIncome,
    rldc,
    ebitda,
    modelRevenue,
    lowPx: px(BAND_LOW),
    highPx: px(BAND_HIGH),
    myPx: px(a.myMultiple),
    psPx,
    pePx,
    relativeMid: (psPx + pePx) / 2,
    revenueBase,
    shares,
    impliedMultiple: cap != null && ebitda > 0 ? cap / ebitda : null,
    arcIncome: lines.arc,
    cctpIncome: lines.cctp,
    cpnIncome: lines.cpn,
    businessIncome: lines.total,
  };
}

export function yi(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(n) / 1e8;
  const d = v >= 100 ? 0 : v < 10 ? Math.max(digits, 2) : digits;
  return `${sign}${v.toFixed(d)} 亿美元`;
}

export function usd(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const [whole, frac] = Math.abs(n).toFixed(digits).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac != null ? `${sign}$${grouped}.${frac}` : `${sign}$${grouped}`;
}

export function pct(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${(n * 100).toFixed(digits)}%`;
}

export function plainPct(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function stance(price: number | null, low: number, high: number): string {
  if (price == null) return "没有现价";
  if (price > high * 1.02) return "高于经营区间";
  if (price < low * 0.98) return "低于经营区间";
  return "落在经营区间里";
}
