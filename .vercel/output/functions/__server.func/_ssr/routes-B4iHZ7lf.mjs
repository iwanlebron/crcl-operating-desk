import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as RefreshCw } from "../_libs/lucide-react.mjs";
import { n as Route, r as getSnapshot } from "./router-CkxBqisP.mjs";
import { a as ResponsiveContainer, i as Area, n as YAxis, o as Tooltip, r as XAxis, t as AreaChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B4iHZ7lf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Circle Q2 2026 (quarter ended 2026-06-30), from the earnings release. */
var Q2 = {
	period: "2026 Q2",
	ended: "2026-06-30",
	usdcEop: 733e8,
	usdcAvg: 765e8,
	reserveReturn: .035,
	usdcOnPlatform: 124e8,
	platformWavg: .195,
	revenue: 7013e5,
	reserveIncome: 6677e5,
	otherRevenue: 336e5,
	distribution: 4125e5,
	rldc: 2888e5,
	rldcMargin: .412,
	netReserveMargin: .39,
	adjEbitda: 1435e5,
	netIncome: 482e5,
	onchainVolume: 0xd75e4be2000,
	walletsM: 7,
	minted: 83e9,
	redeemed: 87e9,
	share: .27
};
/** Trailing aggregates compiled from public market data around 2026-10-30. Not a live feed. */
var TTM = {
	revenue: 291e7,
	netIncome: 45128e4,
	eps: 1.8,
	fcf: 76152e4
};
var DEFAULT_ASSUMPTIONS = {
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
	sharesM: 255.1
};
function reserveYieldPct(billPct, a) {
	if (a.yieldMode === "reported") return 3.5;
	if (a.yieldMode === "custom") return a.customYieldPct;
	return Math.max(0, (billPct ?? 3.5) - a.cashDragBps / 100);
}
/** CPN is a payments network. The figure is a trailing-30-day run-rate, not a quarter total. */
var CPN = {
	asOf: "2026-06-30",
	annualized: 147e8,
	qoq: .76,
	institutions: 175
};
/** DefiLlama bridge page, 2026-10-31. Their bridge API is blocked, so volume does not tick. */
var CCTP_VOLUME = {
	asOf: "2026-10-31",
	d1: 72232e4,
	d7: 4481e6,
	d30: 16373e6
};
function businessLines(fees, a) {
	const cctp = ((fees.cctp30 ?? 0) + (fees.gateway30 ?? 0)) * 12;
	const arc = (fees.arc30 ?? 0) * 12 * (a.arcSharePct / 100);
	const cpn = CPN.annualized * a.cpnTakeBps / 1e4;
	return {
		cctp,
		arc,
		cpn,
		total: cctp + arc + cpn
	};
}
function runModel(usdc, billPct, price, a, fees) {
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
	const px = (mult) => ebitda * mult / shares;
	const revenueBase = a.revenueBasis === "ttm" ? TTM.revenue : modelRevenue;
	const psPx = a.targetPs * revenueBase / shares;
	const pePx = a.targetPe * a.forwardEps;
	const cap = price != null ? price * shares : null;
	return {
		yieldPct,
		reserveIncome,
		rldc,
		ebitda,
		modelRevenue,
		lowPx: px(22),
		highPx: px(30),
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
		businessIncome: lines.total
	};
}
function yi(n, digits = 1) {
	if (!Number.isFinite(n)) return "—";
	const sign = n < 0 ? "-" : "";
	const v = Math.abs(n) / 1e8;
	const d = v >= 100 ? 0 : v < 10 ? Math.max(digits, 2) : digits;
	return `${sign}${v.toFixed(d)} 亿美元`;
}
function usd(n, digits = 2) {
	if (!Number.isFinite(n)) return "—";
	const sign = n < 0 ? "-" : "";
	const [whole, frac] = Math.abs(n).toFixed(digits).split(".");
	const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return frac != null ? `${sign}$${grouped}.${frac}` : `${sign}$${grouped}`;
}
function pct(n, digits = 1) {
	if (!Number.isFinite(n)) return "—";
	return `${n > 0 ? "+" : ""}${(n * 100).toFixed(digits)}%`;
}
function plainPct(n, digits = 1) {
	if (!Number.isFinite(n)) return "—";
	return `${n.toFixed(digits)}%`;
}
function stance(price, low, high) {
	if (price == null) return "没有现价";
	if (price > high * 1.02) return "高于经营区间";
	if (price < low * .98) return "低于经营区间";
	return "落在经营区间里";
}
var STORE = "crcl-desk-assumptions-v2";
function Desk({ initial }) {
	const [snap, setSnap] = (0, import_react.useState)(initial);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [assumptions, setAssumptions] = (0, import_react.useState)(DEFAULT_ASSUMPTIONS);
	const [stored, setStored] = (0, import_react.useState)(false);
	const [charts, setCharts] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setCharts(true);
		try {
			const raw = localStorage.getItem(STORE);
			if (raw) {
				const parsed = JSON.parse(raw);
				setAssumptions({
					...DEFAULT_ASSUMPTIONS,
					...parsed
				});
			}
		} catch {}
		setStored(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!stored) return;
		localStorage.setItem(STORE, JSON.stringify(assumptions));
	}, [assumptions, stored]);
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => {
			refresh();
		}, 6e4);
		return () => window.clearInterval(id);
	}, []);
	async function refresh() {
		setBusy(true);
		try {
			setSnap(await getSnapshot());
		} catch (err) {
			setSnap((prev) => ({
				...prev,
				error: err instanceof Error ? err.message : "刷新失败"
			}));
		} finally {
			setBusy(false);
		}
	}
	const model = (0, import_react.useMemo)(() => runModel(snap.usdc, snap.billPct, snap.price, assumptions, {
		cctp30: snap.cctpFees30d,
		gateway30: snap.gatewayFees30d,
		arc30: snap.arcFees30d
	}), [
		snap.usdc,
		snap.billPct,
		snap.price,
		snap.cctpFees30d,
		snap.gatewayFees30d,
		snap.arcFees30d,
		assumptions
	]);
	const cap = snap.price != null ? snap.price * assumptions.sharesM * 1e6 : null;
	const share = snap.usdc != null && snap.stableTotal ? snap.usdc / snap.stableTotal : null;
	function patch(partial) {
		setAssumptions((prev) => ({
			...prev,
			...partial
		}));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto min-h-screen max-w-5xl px-4 pt-5 pb-20",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-widest text-muted uppercase",
						children: "NYSE · Circle Internet Group"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-4xl leading-none text-fg",
						children: "CRCL 经营台"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						suppressHydrationWarning: true,
						children: marketStatus(snap.marketTime)
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => void refresh(),
					disabled: busy,
					className: "inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm text-fg disabled:opacity-60",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: busy ? "size-4 animate-spin" : "size-4" }), "刷新"]
				})]
			}),
			snap.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 rounded-card border border-line bg-surface px-4 py-3 text-sm text-down",
				children: snap.error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-card border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "最新价"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-6xl leading-none tabular-nums text-fg",
							children: snap.price != null ? usd(snap.price) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: `mt-2 text-base tabular-nums ${tone(snap.change)}`,
							children: [snap.change != null ? usd(snap.change) : "—", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-2",
								children: snap.changePct != null ? pct(snap.changePct) : ""
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
									k: "市值",
									v: cap != null ? yi(cap, 0) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
									k: "成交量",
									v: snap.volume != null ? vol(snap.volume) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
									k: "日内",
									v: range(snap.dayLow, snap.dayHigh)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
									k: "52 周",
									v: range(snap.low52, snap.high52)
								})
							]
						}),
						snap.low52 != null && snap.high52 != null && snap.price != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
							low: snap.low52,
							high: snap.high52,
							value: snap.price
						}) : null
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-card border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "相对现价"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display mt-1 text-3xl text-accent",
							children: model && snap.price != null ? stance(snap.price, model.lowPx, model.highPx) : "等待数据"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-4 space-y-3 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: `22–30× EBITDA`,
									v: model ? `${usd(model.lowPx, 0)} – ${usd(model.highPx, 0)}` : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "我的倍数",
									v: model ? usd(model.myPx) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "市销 + 市盈中位",
									v: model ? usd(model.relativeMid) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "现价隐含倍数",
									v: model?.impliedMultiple != null ? `${model.impliedMultiple.toFixed(1)}×` : "—"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-4 text-xs leading-relaxed text-muted",
							children: [
								"经营区间按年化调整后 EBITDA 的 ",
								22,
								" 倍到 ",
								30,
								" 倍。分销费已经从收入里扣掉，再扣经营费用，才拿去乘倍数。"
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4 grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-card border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl",
							children: "储备收入模型"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "流通量、利率，以及 Arc、CCTP、CPN 的手续费，都会算进下面的股价。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-4 grid grid-cols-2 gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
									k: "储备收益率",
									v: model ? plainPct(model.yieldPct, 2) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
									k: "年化储备收入",
									v: model ? yi(model.reserveIncome) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
									k: "三条业务收入",
									v: model ? yi(model.businessIncome) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
									k: "年化 EBITDA",
									v: model ? yi(model.ebitda) : "—"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid grid-cols-3 gap-2 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									label: `22×`,
									value: model ? usd(model.lowPx, 0) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									label: `${assumptions.myMultiple.toFixed(0)}× 我的`,
									value: model ? usd(model.myPx, 0) : "—",
									hot: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									label: `30×`,
									value: model ? usd(model.highPx, 0) : "—"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Seg, {
									value: assumptions.yieldMode,
									onChange: (yieldMode) => patch({ yieldMode }),
									options: [
										["bill", "国债减拖累"],
										["reported", "季报 3.5%"],
										["custom", "自定义"]
									]
								}),
								assumptions.yieldMode === "bill" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
									label: "现金拖累",
									hint: snap.billPct != null ? `13 周国债现在 ${plainPct(snap.billPct, 2)}` : "国债收益率缺失，暂用 3.5%",
									min: 0,
									max: 120,
									step: 5,
									value: assumptions.cashDragBps,
									format: (v) => `${v.toFixed(0)} bp`,
									onChange: (cashDragBps) => patch({ cashDragBps })
								}) : null,
								assumptions.yieldMode === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
									label: "储备收益率",
									min: .5,
									max: 6,
									step: .05,
									value: assumptions.customYieldPct,
									format: (v) => plainPct(v, 2),
									onChange: (customYieldPct) => patch({ customYieldPct })
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
									label: "净储备利润率",
									hint: "Q2 约 39%。伙伴分销大约拿走储备收入的六成。",
									min: 20,
									max: 70,
									step: 1,
									value: assumptions.netReserveMarginPct,
									format: (v) => plainPct(v, 0),
									onChange: (netReserveMarginPct) => patch({ netReserveMarginPct })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
									label: "EBITDA 转化率",
									hint: "年化 EBITDA = 年化 RLDC × 转化率。Q2 调整后 EBITDA / RLDC ≈ 50%。",
									min: 25,
									max: 80,
									step: 1,
									value: assumptions.ebitdaConversionPct,
									format: (v) => plainPct(v, 0),
									onChange: (ebitdaConversionPct) => patch({ ebitdaConversionPct })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
									label: "其他收入，年化",
									hint: "Q2 非储备收入 3360 万美元，按四季计约 1.34 亿美元。",
									min: 0,
									max: 400,
									step: 2,
									value: assumptions.otherRevenueM,
									format: (v) => `${v.toFixed(0)} 百万美元`,
									onChange: (otherRevenueM) => patch({ otherRevenueM })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
									label: "我的 EBITDA 倍数",
									min: 10,
									max: 40,
									step: 1,
									value: assumptions.myMultiple,
									format: (v) => `${v.toFixed(0)}×`,
									onChange: (myMultiple) => patch({ myMultiple })
								})
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-card border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl",
							children: "相对估值"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "市销率和远期市盈率各算一个价，再取中位。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "目标 P/S 股价",
								v: model ? usd(model.psPx) : "—"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "目标 P/E 股价",
								v: model ? usd(model.pePx) : "—"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display mt-4 text-4xl tabular-nums text-fg",
							children: model ? usd(model.relativeMid) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "两套相对估值的中位"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Seg, {
							value: assumptions.revenueBasis,
							onChange: (revenueBasis) => patch({ revenueBasis }),
							options: [["ttm", "财报 TTM 收入"], ["model", "模型年化收入"]]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
							label: "目标市销率",
							hint: `收入基数 ${model ? yi(model.revenueBase) : "—"}。近期远期 P/S 大约 5.4 倍。`,
							min: 2,
							max: 15,
							step: .1,
							value: assumptions.targetPs,
							format: (v) => `${v.toFixed(1)}×`,
							onChange: (targetPs) => patch({ targetPs })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
							label: "远期 EPS",
							hint: "不随流通量自动改。TTM EPS 约 $1.80，部分卖方远期低于这个数。",
							min: .4,
							max: 4,
							step: .05,
							value: assumptions.forwardEps,
							format: (v) => usd(v),
							onChange: (forwardEps) => patch({ forwardEps })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
							label: "目标远期市盈率",
							hint: "现价对应的远期市盈率大约 50 倍以上，这里默认用更保守的 35 倍。",
							min: 12,
							max: 80,
							step: 1,
							value: assumptions.targetPe,
							format: (v) => `${v.toFixed(0)}×`,
							onChange: (targetPe) => patch({ targetPe })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
							label: "股数",
							hint: "约 2.551 亿股，对应 10 月底大约 185 亿美元市值。含未单列的稀释口径，不是实时股本。",
							min: 220,
							max: 300,
							step: .1,
							value: assumptions.sharesM,
							format: (v) => `${v.toFixed(1)} 百万股`,
							onChange: (sharesM) => patch({ sharesM })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "mt-2 min-h-11 text-sm text-accent",
							onClick: () => setAssumptions(DEFAULT_ASSUMPTIONS),
							children: "恢复默认假设"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "实时驱动"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "链上供应量和国债大约每分钟拉一次。季报数字不会在这里变。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "USDC 流通",
								v: snap.usdc != null ? yi(snap.usdc, 0) : "—",
								sub: snap.usdcChg30 != null ? `30 日 ${pct(snap.usdcChg30)}` : void 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "稳定币份额",
								v: share != null ? plainPct(share * 100, 1) : "—",
								sub: snap.usdt != null ? `USDT ${yi(snap.usdt, 0)}` : void 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "13 周国债",
								v: snap.billPct != null ? plainPct(snap.billPct, 2) : "—",
								sub: "贴现收益率，代理储备利率"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "7 日流通变化",
								v: snap.usdcChg7 != null ? pct(snap.usdcChg7) : "—",
								sub: snap.usdcChg1 != null ? `1 日 ${pct(snap.usdcChg1)}` : void 0
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-3 lg:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "rounded-card border border-line bg-surface p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs tracking-widest text-muted uppercase",
										children: "Arc"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-display mt-1 text-2xl",
										children: "自有链"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm text-muted",
										children: "2026-09-16 主网。Gas 用 USDC 付。停在这里的美元已经算进上面的流通量，不能再计一次利息。"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
										className: "mt-4 space-y-3 text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "链上 USDC",
												v: snap.arcUsdc != null ? yi(snap.arcUsdc) : "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "7 日",
												v: pct(rel(snap.arcUsdc, snap.arcUsdcWeek) ?? NaN)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "30 日",
												v: pct(rel(snap.arcUsdc, snap.arcUsdcMonth) ?? NaN)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "链上锁仓",
												v: snap.arcTvl != null ? yi(snap.arcTvl) : "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "DEX 30 日",
												v: snap.arcDex30d != null ? yi(snap.arcDex30d) : "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Gas 30 日",
												v: snap.arcFees30d != null ? usd(snap.arcFees30d, 0) : "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "计入估值",
												v: model ? yi(model.arcIncome) : "—"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
										label: "Circle 分成",
										hint: "Gas 归出块的验证者。创世大约 12 家，默认按 Circle 一家，也就是 8%。",
										min: 0,
										max: 100,
										step: 1,
										value: assumptions.arcSharePct,
										format: (v) => `${v.toFixed(0)}%`,
										onChange: (arcSharePct) => patch({ arcSharePct })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs leading-relaxed text-muted",
										children: "链上 USDC 的利息已经在储备收入里。这里加的只是 Gas。DEX 量含对倒，不算收入。"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "rounded-card border border-line bg-surface p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs tracking-widest text-muted uppercase",
										children: "CCTP"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-display mt-1 text-2xl",
										children: "跨链协议"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm text-muted",
										children: "烧掉再铸造，用来把 USDC 搬到另一条链。普通转账不收费，快转大约 0 到 14 个基点。"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
										className: "mt-4 space-y-3 text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "30 日跨链量",
												v: yi(CCTP_VOLUME.d30, 0)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "7 日 / 24 小时",
												v: `${yi(CCTP_VOLUME.d7, 0)} / ${yi(CCTP_VOLUME.d1)}`
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "手续费 24 小时",
												v: snap.cctpFees24h != null ? usd(snap.cctpFees24h, 0) : "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "手续费 30 日",
												v: snap.cctpFees30d != null ? usd(snap.cctpFees30d, 0) : "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Gateway 30 日",
												v: snap.gatewayFees30d != null ? usd(snap.gatewayFees30d, 0) : "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "计入估值",
												v: model ? yi(model.cctpIncome) : "—"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-3 text-xs leading-relaxed text-muted",
										children: [
											"手续费按近 30 日乘 12，全额加进 EBITDA。跨链量是 ",
											CCTP_VOLUME.asOf,
											" 的快照，本身不是收入。"
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "rounded-card border border-line bg-surface p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs tracking-widest text-muted uppercase",
										children: "CPN"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-display mt-1 text-2xl",
										children: "支付网络"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm text-muted",
										children: "机构用 USDC 做跨境结算，再在当地付款。报出来的是流水，不是 Circle 留下的收入。"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
										className: "mt-4 space-y-3 text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "年化流水",
												v: yi(CPN.annualized, 0)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "季末环比",
												v: pct(CPN.qoq)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "接入机构",
												v: `${CPN.institutions}+`
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "口径日期",
												v: CPN.asOf
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "计入估值",
												v: model ? yi(model.cpnIncome) : "—"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
										label: "假设净抽成",
										hint: "公司没公布费率。默认 5 bp。季报其他收入里可能已经含了一部分，拨高会有重复。",
										min: 0,
										max: 100,
										step: 1,
										value: assumptions.cpnTakeBps,
										format: (v) => `${v.toFixed(0)} bp`,
										onChange: (cpnTakeBps) => patch({ cpnTakeBps })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs leading-relaxed text-muted",
										children: "流水乘抽成，全额加进 EBITDA，不再打储备利润率和转化率。拨回 0 就只留 Arc 和 CCTP 的实测手续费。"
									})
								]
							})
						]
					}),
					snap.leaders.length > 0 && snap.stableTotal ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-card border border-line bg-surface p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "稳定币供应"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 space-y-2",
							children: snap.leaders.map((row) => {
								const width = Math.max(2, row.usd / snap.stableTotal * 100);
								const mine = row.symbol === "USDC";
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: mine ? "text-accent" : "text-fg",
											children: row.symbol
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "h-2 overflow-hidden rounded-full bg-raised",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: mine ? "block h-2 rounded-full bg-accent" : "block h-2 rounded-full bg-muted",
												style: { width: `${width}%` }
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular-nums text-muted",
											children: yi(row.usd, 0)
										})
									]
								}, row.symbol);
							})
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-4 lg:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
							title: "股价 · 近 6 个月",
							empty: snap.priceHistory.length < 2,
							children: charts ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
								width: "100%",
								height: "100%",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
									data: snap.priceHistory,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
											dataKey: "t",
											tickFormatter: dayLabel,
											tick,
											axisLine: false,
											tickLine: false,
											minTickGap: 32
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
											domain: ["auto", "auto"],
											tick,
											axisLine: false,
											tickLine: false,
											width: 42
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { content: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tip, { money: true }) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
											dataKey: "v",
											stroke: "#e4c27a",
											fill: "#e4c27a",
											fillOpacity: .16,
											strokeWidth: 2
										})
									]
								})
							}) : null
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
							title: "USDC 流通 · 近 180 天",
							empty: snap.supplyHistory.length < 2,
							children: charts ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
								width: "100%",
								height: "100%",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
									data: snap.supplyHistory,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
											dataKey: "t",
											tickFormatter: dayLabel,
											tick,
											axisLine: false,
											tickLine: false,
											minTickGap: 32
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
											domain: ["auto", "auto"],
											tick,
											axisLine: false,
											tickLine: false,
											width: 48,
											tickFormatter: (v) => `${Math.round(v / 1e9)}B`
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { content: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tip, {}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
											dataKey: "v",
											stroke: "#6dceb0",
											fill: "#6dceb0",
											fillOpacity: .14,
											strokeWidth: 2
										})
									]
								})
							}) : null
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "font-display text-2xl",
						children: ["季报锚点 · ", Q2.period]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							"截至 ",
							Q2.ended,
							"。这组数用来校准滑杆，不参与每分钟刷新。"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "期末流通",
								v: yi(Q2.usdcEop, 0),
								sub: `日均 ${yi(Q2.usdcAvg, 0)}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "储备回报率",
								v: plainPct(Q2.reserveReturn * 100, 1)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "收入",
								v: yi(Q2.revenue),
								sub: `储备 ${yi(Q2.reserveIncome)}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "RLDC",
								v: yi(Q2.rldc),
								sub: `利润率 ${plainPct(Q2.rldcMargin * 100, 1)}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "调整后 EBITDA",
								v: yi(Q2.adjEbitda)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "持续经营净利润",
								v: yi(Q2.netIncome)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "平台上的 USDC",
								v: yi(Q2.usdcOnPlatform, 0),
								sub: `加权 ${plainPct(Q2.platformWavg * 100, 1)}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "有意义钱包",
								v: `${Q2.walletsM.toFixed(1)} 百万`,
								sub: `市占 ${plainPct(Q2.share * 100, 0)}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "铸造 / 赎回",
								v: `${(Q2.minted / 1e9).toFixed(0)} / ${(Q2.redeemed / 1e9).toFixed(0)}`,
								sub: "十亿美元"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "链上成交量",
								v: `${(Q2.onchainVolume / 0xe8d4a51000).toFixed(1)} 万亿美元`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "TTM 收入",
								v: yi(TTM.revenue),
								sub: "公开汇总"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								k: "TTM 自由现金流",
								v: yi(TTM.fcf),
								sub: `EPS ${usd(TTM.eps)}`
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "mt-8 space-y-3 text-xs leading-relaxed text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "股价来自交易所行情，USDC 与稳定币供应来自链上汇总，13 周国债用 ^IRX。Arc 上的 USDC、CCTP 手续费同样来自链上汇总。CPN 流水停在二季报，10 月只确认了机构家数，没有新的成交额。" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "合理区间是假设，不是目标价，也不构成买卖建议。利率、Coinbase 分成和流通量任何一个变了，结论都会变。" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						suppressHydrationWarning: true,
						children: [
							"更新于 ",
							clock(snap.fetchedAt),
							" · 每分钟自动刷新"
						]
					})
				]
			})
		]
	});
}
var tick = {
	fill: "#93a399",
	fontSize: 11
};
function Fact({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-muted",
		children: k
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "mt-0.5 tabular-nums text-fg",
		children: v
	})] });
}
function Row({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-baseline justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-muted",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "tabular-nums text-fg",
			children: v
		})]
	});
}
function Mini({ k, v, sub }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-card border border-line bg-bg px-3 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: k
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-lg tabular-nums text-fg",
				children: v
			}),
			sub ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted",
				children: sub
			}) : null
		]
	});
}
function Pill({ label, value, hot }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: hot ? "rounded-2xl bg-accent px-2 py-3 text-ink" : "rounded-2xl bg-raised px-2 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm tabular-nums",
			children: value
		})]
	});
}
function Slider({ label, hint, min, max, step, value, format, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "mt-3 block",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex items-baseline justify-between gap-3 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-muted",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tabular-nums text-fg",
					children: format(value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "range",
				min,
				max,
				step,
				value,
				onChange: (event) => onChange(Number(event.target.value)),
				className: "w-full",
				suppressHydrationWarning: true
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-xs leading-relaxed text-muted",
				children: hint
			}) : null
		]
	});
}
function Seg({ value, onChange, options }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `mt-4 grid gap-1 rounded-full bg-bg p-1 ${options.length > 2 ? "grid-cols-3" : "grid-cols-2"}`,
		children: options.map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onChange(id),
			className: value === id ? "min-h-11 rounded-full bg-accent px-2 text-sm text-ink" : "min-h-11 rounded-full px-2 text-sm text-muted",
			children: label
		}, id))
	});
}
function Meter({ low, high, value }) {
	const span = high - low;
	const pos = span > 0 ? Math.min(100, Math.max(0, (value - low) / span * 100)) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative h-1 rounded-full bg-raised",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-accent",
				style: { left: `calc(${pos}% - 6px)` }
			})
		})
	});
}
function ChartCard({ title, empty, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-card border border-line bg-surface p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 h-52",
			children: empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pt-16 text-center text-sm text-muted",
				children: "这张图还没有数据"
			}) : children
		})]
	});
}
function Tip({ active, payload, label, money }) {
	if (!active || !payload?.length || label == null) return null;
	const value = payload[0]?.value;
	if (value == null) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-line bg-bg px-3 py-2 text-xs",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted",
			children: dayLabel(label)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 tabular-nums text-fg",
			children: money ? usd(value) : yi(value, 1)
		})]
	});
}
function rel(now, prev) {
	if (now == null || prev == null || prev === 0) return null;
	return (now - prev) / prev;
}
function tone(n) {
	if (n == null || n === 0) return "text-muted";
	return n > 0 ? "text-up" : "text-down";
}
function range(low, high) {
	if (low == null || high == null) return "—";
	return `${usd(low, 2)} – ${usd(high, 2)}`;
}
function vol(n) {
	if (n >= 1e6) return `${(n / 1e6).toFixed(1)} 百万股`;
	return `${Math.round(n).toLocaleString("en-US")} 股`;
}
function dayLabel(t) {
	return stamp(t, "America/New_York");
}
function clock(t) {
	if (!t) return "—";
	return stamp(t, "Asia/Hong_Kong");
}
function marketStatus(marketTime) {
	if (!marketTime) return "行情时间未知 · 每分钟刷新";
	const ageH = (Date.now() / 1e3 - marketTime) / 3600;
	const when = stamp(marketTime * 1e3, "America/New_York");
	return ageH < 1 ? `交易中 · 美东 ${when}` : `休市 · 最近成交 美东 ${when}`;
}
function stamp(ms, timeZone) {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone,
		day: "2-digit",
		month: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23"
	}).formatToParts(ms);
	const pick = (type) => parts.find((part) => part.type === type)?.value ?? "";
	return `${pick("day")}/${pick("month")} ${pick("hour")}:${pick("minute")}`;
}
function Home() {
	const data = Route.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, { initial: data });
}
//#endregion
export { Home as component };
