export type Point = { t: number; v: number };

export type Leader = { symbol: string; name: string; usd: number };

export type Snapshot = {
  ok: boolean;
  error: string | null;
  fetchedAt: number;
  price: number | null;
  prevClose: number | null;
  change: number | null;
  changePct: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  high52: number | null;
  low52: number | null;
  marketTime: number | null;
  priceHistory: Point[];
  usdc: number | null;
  usdt: number | null;
  stableTotal: number | null;
  usdcChg1: number | null;
  usdcChg7: number | null;
  usdcChg30: number | null;
  supplyHistory: Point[];
  leaders: Leader[];
  billPct: number | null;
  billTime: number | null;
  arcUsdc: number | null;
  arcUsdcWeek: number | null;
  arcUsdcMonth: number | null;
  arcTvl: number | null;
  arcDex24h: number | null;
  arcDex30d: number | null;
  cctpFees24h: number | null;
  cctpFees30d: number | null;
  gatewayFees30d: number | null;
  arcFees30d: number | null;
};

const EMPTY: Snapshot = {
  ok: false,
  error: null,
  fetchedAt: 0,
  price: null,
  prevClose: null,
  change: null,
  changePct: null,
  dayHigh: null,
  dayLow: null,
  volume: null,
  high52: null,
  low52: null,
  marketTime: null,
  priceHistory: [],
  usdc: null,
  usdt: null,
  stableTotal: null,
  usdcChg1: null,
  usdcChg7: null,
  usdcChg30: null,
  supplyHistory: [],
  leaders: [],
  billPct: null,
  billTime: null,
  arcUsdc: null,
  arcUsdcWeek: null,
  arcUsdcMonth: null,
  arcTvl: null,
  arcDex24h: null,
  arcDex30d: null,
  cctpFees24h: null,
  cctpFees30d: null,
  gatewayFees30d: null,
  arcFees30d: null,
};

function blank(): Snapshot {
  return {
    ...EMPTY,
    priceHistory: [],
    supplyHistory: [],
    leaders: [],
  };
}

const UA = "Mozilla/5.0 (compatible; CRCLDesk/1.0)";

async function getJson<T>(url: string, ms = 18000): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(ms),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: Record<string, number | string | undefined>;
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
  };
};

function yahooCloses(raw: YahooChart): { meta: Record<string, number | string | undefined>; history: Point[] } {
  const result = raw.chart?.result?.[0];
  if (!result) throw new Error("empty chart");
  const ts = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const history: Point[] = [];
  for (let i = 0; i < ts.length; i++) {
    const v = closes[i];
    if (typeof v === "number" && Number.isFinite(v)) history.push({ t: ts[i] * 1000, v });
  }
  return { meta: result.meta ?? {}, history };
}

type LlamaAsset = {
  symbol?: string;
  name?: string;
  circulating?: { peggedUSD?: number };
  chainCirculating?: Record<
    string,
    {
      current?: { peggedUSD?: number };
      circulatingPrevWeek?: { peggedUSD?: number };
      circulatingPrevMonth?: { peggedUSD?: number };
    }
  >;
};

type FeeSummary = { total24h?: number; total30d?: number };
type ChainRow = { name?: string; tvl?: number };
type DexOverview = { total24h?: number; total30d?: number };

type LlamaChartPoint = {
  date?: string | number;
  totalCirculatingUSD?: { peggedUSD?: number };
};

function agoChange(series: Point[], days: number): number | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1];
  const target = last.t - days * 86_400_000;
  let prev = series[0];
  for (const p of series) {
    if (p.t <= target) prev = p;
    else break;
  }
  if (!(prev.v > 0) || prev.t === last.t) return null;
  return (last.v - prev.v) / prev.v;
}

let cache: { at: number; data: Snapshot } | null = null;
const TTL = 45_000;

export async function loadSnapshot(): Promise<Snapshot> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;

  const snap = blank();
  snap.fetchedAt = Date.now();
  const problems: string[] = [];

  const [priceR, billR, stablesR, histR, chainsR, dexR, cctpR, gatewayR, arcFeeR] = await Promise.allSettled([
    getJson<YahooChart>("https://query1.finance.yahoo.com/v8/finance/chart/CRCL?interval=1d&range=6mo"),
    getJson<YahooChart>("https://query1.finance.yahoo.com/v8/finance/chart/%5EIRX?interval=1d&range=5d"),
    getJson<{ peggedAssets?: LlamaAsset[] }>("https://stablecoins.llama.fi/stablecoins?includePrices=true"),
    getJson<LlamaChartPoint[]>("https://stablecoins.llama.fi/stablecoincharts/all?stablecoin=2"),
    getJson<ChainRow[]>("https://api.llama.fi/v2/chains"),
    getJson<DexOverview>("https://api.llama.fi/overview/dexs/Arc?excludeTotalDataChart=true"),
    getJson<FeeSummary>("https://api.llama.fi/summary/fees/circle-cctp"),
    getJson<FeeSummary>("https://api.llama.fi/summary/fees/circle-gateway"),
    getJson<FeeSummary>("https://api.llama.fi/overview/fees/Arc?excludeTotalDataChart=true"),
  ]);

  if (priceR.status === "fulfilled") {
    try {
      const { meta, history } = yahooCloses(priceR.value);
      snap.priceHistory = history;
      const last = history.at(-1)?.v ?? num(meta.regularMarketPrice);
      const prev = history.length >= 2 ? history[history.length - 2].v : null;
      snap.price = last;
      snap.prevClose = prev;
      if (last != null && prev != null) {
        snap.change = last - prev;
        snap.changePct = prev !== 0 ? (last - prev) / prev : null;
      } else if (typeof meta.regularMarketChangePercent === "number" && last != null) {
        snap.changePct = meta.regularMarketChangePercent / 100;
        snap.change = last - last / (1 + meta.regularMarketChangePercent / 100);
      }
      snap.dayHigh = num(meta.regularMarketDayHigh);
      snap.dayLow = num(meta.regularMarketDayLow);
      snap.volume = num(meta.regularMarketVolume);
      snap.high52 = num(meta.fiftyTwoWeekHigh);
      snap.low52 = num(meta.fiftyTwoWeekLow);
      snap.marketTime = num(meta.regularMarketTime);
    } catch (err) {
      problems.push(`股价解析失败：${msg(err)}`);
    }
  } else problems.push(`股价暂不可用：${msg(priceR.reason)}`);

  if (billR.status === "fulfilled") {
    try {
      const { meta, history } = yahooCloses(billR.value);
      snap.billPct = history.at(-1)?.v ?? num(meta.regularMarketPrice);
      snap.billTime = num(meta.regularMarketTime);
    } catch (err) {
      problems.push(`国债收益率解析失败：${msg(err)}`);
    }
  } else problems.push(`国债收益率暂不可用：${msg(billR.reason)}`);

  if (stablesR.status === "fulfilled") {
    const assets = stablesR.value.peggedAssets ?? [];
    let total = 0;
    const ranked: Leader[] = [];
    for (const a of assets) {
      const usd = a.circulating?.peggedUSD ?? 0;
      if (!(usd > 0)) continue;
      total += usd;
      ranked.push({ symbol: a.symbol ?? "?", name: a.name ?? a.symbol ?? "?", usd });
    }
    ranked.sort((x, y) => y.usd - x.usd);
    snap.stableTotal = total || null;
    snap.leaders = ranked.slice(0, 6);
    snap.usdc = ranked.find((x) => x.symbol === "USDC")?.usd ?? null;
    snap.usdt = ranked.find((x) => x.symbol === "USDT")?.usd ?? null;
    const arc = assets.find((a) => a.symbol === "USDC")?.chainCirculating?.Arc;
    snap.arcUsdc = num(arc?.current?.peggedUSD);
    snap.arcUsdcWeek = num(arc?.circulatingPrevWeek?.peggedUSD);
    snap.arcUsdcMonth = num(arc?.circulatingPrevMonth?.peggedUSD);
  } else problems.push(`稳定币供应量暂不可用：${msg(stablesR.reason)}`);

  if (histR.status === "fulfilled" && Array.isArray(histR.value)) {
    const series: Point[] = [];
    for (const row of histR.value) {
      const sec = Number(row.date);
      const v = row.totalCirculatingUSD?.peggedUSD;
      if (Number.isFinite(sec) && typeof v === "number" && v > 0) series.push({ t: sec * 1000, v });
    }
    series.sort((a, b) => a.t - b.t);
    const tail = series.slice(-180);
    snap.supplyHistory = tail;
    if (snap.usdc == null && tail.length) snap.usdc = tail[tail.length - 1].v;
    snap.usdcChg1 = agoChange(tail, 1);
    snap.usdcChg7 = agoChange(tail, 7);
    snap.usdcChg30 = agoChange(tail, 30);
  } else if (histR.status === "rejected") {
    problems.push(`USDC 历史暂不可用：${msg(histR.reason)}`);
  }

  if (chainsR.status === "fulfilled") {
    snap.arcTvl = num(chainsR.value.find((row) => row.name === "Arc")?.tvl);
  }
  if (dexR.status === "fulfilled") {
    snap.arcDex24h = num(dexR.value.total24h);
    snap.arcDex30d = num(dexR.value.total30d);
  }
  if (cctpR.status === "fulfilled") {
    snap.cctpFees24h = num(cctpR.value.total24h);
    snap.cctpFees30d = num(cctpR.value.total30d);
  }
  if (gatewayR.status === "fulfilled") {
    snap.gatewayFees30d = num(gatewayR.value.total30d);
  }
  if (arcFeeR.status === "fulfilled") {
    snap.arcFees30d = num(arcFeeR.value.total30d);
  }

  snap.ok = snap.price != null || snap.usdc != null;
  snap.error = problems.length ? problems.join(" ") : null;
  cache = { at: Date.now(), data: snap };
  return snap;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function msg(err: unknown): string {
  return err instanceof Error ? err.message : "未知错误";
}
