//#region node_modules/.nitro/vite/services/ssr/assets/crcl.server-Cp3Cgwwh.js
var EMPTY = {
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
	arcFees30d: null
};
function blank() {
	return {
		...EMPTY,
		priceHistory: [],
		supplyHistory: [],
		leaders: []
	};
}
var UA = "Mozilla/5.0 (compatible; CRCLDesk/1.0)";
async function getJson(url, ms = 18e3) {
	const res = await fetch(url, {
		headers: {
			"User-Agent": UA,
			Accept: "application/json"
		},
		signal: AbortSignal.timeout(ms)
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return await res.json();
}
function yahooCloses(raw) {
	const result = raw.chart?.result?.[0];
	if (!result) throw new Error("empty chart");
	const ts = result.timestamp ?? [];
	const closes = result.indicators?.quote?.[0]?.close ?? [];
	const history = [];
	for (let i = 0; i < ts.length; i++) {
		const v = closes[i];
		if (typeof v === "number" && Number.isFinite(v)) history.push({
			t: ts[i] * 1e3,
			v
		});
	}
	return {
		meta: result.meta ?? {},
		history
	};
}
function agoChange(series, days) {
	if (series.length < 2) return null;
	const last = series[series.length - 1];
	const target = last.t - days * 864e5;
	let prev = series[0];
	for (const p of series) if (p.t <= target) prev = p;
	else break;
	if (!(prev.v > 0) || prev.t === last.t) return null;
	return (last.v - prev.v) / prev.v;
}
var cache = null;
var TTL = 45e3;
async function loadSnapshot() {
	if (cache && Date.now() - cache.at < TTL) return cache.data;
	const snap = blank();
	snap.fetchedAt = Date.now();
	const problems = [];
	const [priceR, billR, stablesR, histR, chainsR, dexR, cctpR, gatewayR, arcFeeR] = await Promise.allSettled([
		getJson("https://query1.finance.yahoo.com/v8/finance/chart/CRCL?interval=1d&range=6mo"),
		getJson("https://query1.finance.yahoo.com/v8/finance/chart/%5EIRX?interval=1d&range=5d"),
		getJson("https://stablecoins.llama.fi/stablecoins?includePrices=true"),
		getJson("https://stablecoins.llama.fi/stablecoincharts/all?stablecoin=2"),
		getJson("https://api.llama.fi/v2/chains"),
		getJson("https://api.llama.fi/overview/dexs/Arc?excludeTotalDataChart=true"),
		getJson("https://api.llama.fi/summary/fees/circle-cctp"),
		getJson("https://api.llama.fi/summary/fees/circle-gateway"),
		getJson("https://api.llama.fi/overview/fees/Arc?excludeTotalDataChart=true")
	]);
	if (priceR.status === "fulfilled") try {
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
	else problems.push(`股价暂不可用：${msg(priceR.reason)}`);
	if (billR.status === "fulfilled") try {
		const { meta, history } = yahooCloses(billR.value);
		snap.billPct = history.at(-1)?.v ?? num(meta.regularMarketPrice);
		snap.billTime = num(meta.regularMarketTime);
	} catch (err) {
		problems.push(`国债收益率解析失败：${msg(err)}`);
	}
	else problems.push(`国债收益率暂不可用：${msg(billR.reason)}`);
	if (stablesR.status === "fulfilled") {
		const assets = stablesR.value.peggedAssets ?? [];
		let total = 0;
		const ranked = [];
		for (const a of assets) {
			const usd = a.circulating?.peggedUSD ?? 0;
			if (!(usd > 0)) continue;
			total += usd;
			ranked.push({
				symbol: a.symbol ?? "?",
				name: a.name ?? a.symbol ?? "?",
				usd
			});
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
		const series = [];
		for (const row of histR.value) {
			const sec = Number(row.date);
			const v = row.totalCirculatingUSD?.peggedUSD;
			if (Number.isFinite(sec) && typeof v === "number" && v > 0) series.push({
				t: sec * 1e3,
				v
			});
		}
		series.sort((a, b) => a.t - b.t);
		const tail = series.slice(-180);
		snap.supplyHistory = tail;
		if (snap.usdc == null && tail.length) snap.usdc = tail[tail.length - 1].v;
		snap.usdcChg1 = agoChange(tail, 1);
		snap.usdcChg7 = agoChange(tail, 7);
		snap.usdcChg30 = agoChange(tail, 30);
	} else if (histR.status === "rejected") problems.push(`USDC 历史暂不可用：${msg(histR.reason)}`);
	if (chainsR.status === "fulfilled") snap.arcTvl = num(chainsR.value.find((row) => row.name === "Arc")?.tvl);
	if (dexR.status === "fulfilled") {
		snap.arcDex24h = num(dexR.value.total24h);
		snap.arcDex30d = num(dexR.value.total30d);
	}
	if (cctpR.status === "fulfilled") {
		snap.cctpFees24h = num(cctpR.value.total24h);
		snap.cctpFees30d = num(cctpR.value.total30d);
	}
	if (gatewayR.status === "fulfilled") snap.gatewayFees30d = num(gatewayR.value.total30d);
	if (arcFeeR.status === "fulfilled") snap.arcFees30d = num(arcFeeR.value.total30d);
	snap.ok = snap.price != null || snap.usdc != null;
	snap.error = problems.length ? problems.join(" ") : null;
	cache = {
		at: Date.now(),
		data: snap
	};
	return snap;
}
function num(v) {
	return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function msg(err) {
	return err instanceof Error ? err.message : "未知错误";
}
//#endregion
export { loadSnapshot };
