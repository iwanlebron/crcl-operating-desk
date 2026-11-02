import { useEffect, useMemo, useState, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Snapshot } from "@/lib/crcl.server";
import { getSnapshot } from "@/lib/crcl.functions";
import {
  BAND_HIGH,
  BAND_LOW,
  CCTP_VOLUME,
  CPN,
  DEFAULT_ASSUMPTIONS,
  Q2,
  TTM,
  plainPct,
  pct,
  runModel,
  stance,
  usd,
  yi,
  type Assumptions,
} from "@/lib/valuation";

const STORE = "crcl-desk-assumptions-v2";

export function Desk({ initial }: { initial: Snapshot }) {
  const [snap, setSnap] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [stored, setStored] = useState(false);
  const [charts, setCharts] = useState(false);

  useEffect(() => {
    setCharts(true);
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Assumptions>;
        setAssumptions({ ...DEFAULT_ASSUMPTIONS, ...parsed });
      }
    } catch {
      /* ignore broken local prefs */
    }
    setStored(true);
  }, []);

  useEffect(() => {
    if (!stored) return;
    localStorage.setItem(STORE, JSON.stringify(assumptions));
  }, [assumptions, stored]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh();
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  async function refresh() {
    setBusy(true);
    try {
      setSnap(await getSnapshot());
    } catch (err) {
      setSnap((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "刷新失败",
      }));
    } finally {
      setBusy(false);
    }
  }

  const model = useMemo(
    () =>
      runModel(snap.usdc, snap.billPct, snap.price, assumptions, {
        cctp30: snap.cctpFees30d,
        gateway30: snap.gatewayFees30d,
        arc30: snap.arcFees30d,
      }),
    [snap.usdc, snap.billPct, snap.price, snap.cctpFees30d, snap.gatewayFees30d, snap.arcFees30d, assumptions],
  );

  const cap = snap.price != null ? snap.price * assumptions.sharesM * 1e6 : null;
  const share = snap.usdc != null && snap.stableTotal ? snap.usdc / snap.stableTotal : null;

  function patch(partial: Partial<Assumptions>) {
    setAssumptions((prev) => ({ ...prev, ...partial }));
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 pt-5 pb-20">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-widest text-muted uppercase">NYSE · Circle Internet Group</p>
          <h1 className="font-display text-4xl leading-none text-fg">CRCL 经营台</h1>
          <p className="mt-2 text-sm text-muted" suppressHydrationWarning>
            {marketStatus(snap.marketTime)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm text-fg disabled:opacity-60"
        >
          <RefreshCw className={busy ? "size-4 animate-spin" : "size-4"} />
          刷新
        </button>
      </header>

      {snap.error ? (
        <p className="mt-4 rounded-card border border-line bg-surface px-4 py-3 text-sm text-down">
          {snap.error}
        </p>
      ) : null}

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-card border border-line bg-surface p-5">
          <p className="text-sm text-muted">最新价</p>
          <p className="font-display text-6xl leading-none tabular-nums text-fg">
            {snap.price != null ? usd(snap.price) : "—"}
          </p>
          <p className={`mt-2 text-base tabular-nums ${tone(snap.change)}`}>
            {snap.change != null ? usd(snap.change) : "—"}
            <span className="ml-2">{snap.changePct != null ? pct(snap.changePct) : ""}</span>
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Fact k="市值" v={cap != null ? yi(cap, 0) : "—"} />
            <Fact k="成交量" v={snap.volume != null ? vol(snap.volume) : "—"} />
            <Fact k="日内" v={range(snap.dayLow, snap.dayHigh)} />
            <Fact k="52 周" v={range(snap.low52, snap.high52)} />
          </dl>
          {snap.low52 != null && snap.high52 != null && snap.price != null ? (
            <Meter low={snap.low52} high={snap.high52} value={snap.price} />
          ) : null}
        </div>

        <div className="rounded-card border border-line bg-surface p-5">
          <p className="text-sm text-muted">相对现价</p>
          <p className="font-display mt-1 text-3xl text-accent">
            {model && snap.price != null ? stance(snap.price, model.lowPx, model.highPx) : "等待数据"}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <Row k={`${BAND_LOW}–${BAND_HIGH}× EBITDA`} v={model ? `${usd(model.lowPx, 0)} – ${usd(model.highPx, 0)}` : "—"} />
            <Row k="我的倍数" v={model ? usd(model.myPx) : "—"} />
            <Row k="市销 + 市盈中位" v={model ? usd(model.relativeMid) : "—"} />
            <Row
              k="现价隐含倍数"
              v={model?.impliedMultiple != null ? `${model.impliedMultiple.toFixed(1)}×` : "—"}
            />
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            经营区间按年化调整后 EBITDA 的 {BAND_LOW} 倍到 {BAND_HIGH} 倍。分销费已经从收入里扣掉，再扣经营费用，才拿去乘倍数。
          </p>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-2xl">储备收入模型</h2>
          <p className="mt-1 text-sm text-muted">流通量、利率，以及 Arc、CCTP、CPN 的手续费，都会算进下面的股价。</p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <Mini k="储备收益率" v={model ? plainPct(model.yieldPct, 2) : "—"} />
            <Mini k="年化储备收入" v={model ? yi(model.reserveIncome) : "—"} />
            <Mini k="三条业务收入" v={model ? yi(model.businessIncome) : "—"} />
            <Mini k="年化 EBITDA" v={model ? yi(model.ebitda) : "—"} />
          </dl>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Pill label={`${BAND_LOW}×`} value={model ? usd(model.lowPx, 0) : "—"} />
            <Pill label={`${assumptions.myMultiple.toFixed(0)}× 我的`} value={model ? usd(model.myPx, 0) : "—"} hot />
            <Pill label={`${BAND_HIGH}×`} value={model ? usd(model.highPx, 0) : "—"} />
          </div>
          <div className="mt-2">
            <Seg
              value={assumptions.yieldMode}
              onChange={(yieldMode) => patch({ yieldMode })}
              options={[
                ["bill", "国债减拖累"],
                ["reported", "季报 3.5%"],
                ["custom", "自定义"],
              ]}
            />
            {assumptions.yieldMode === "bill" ? (
              <Slider
                label="现金拖累"
                hint={snap.billPct != null ? `13 周国债现在 ${plainPct(snap.billPct, 2)}` : "国债收益率缺失，暂用 3.5%"}
                min={0}
                max={120}
                step={5}
                value={assumptions.cashDragBps}
                format={(v) => `${v.toFixed(0)} bp`}
                onChange={(cashDragBps) => patch({ cashDragBps })}
              />
            ) : null}
            {assumptions.yieldMode === "custom" ? (
              <Slider
                label="储备收益率"
                min={0.5}
                max={6}
                step={0.05}
                value={assumptions.customYieldPct}
                format={(v) => plainPct(v, 2)}
                onChange={(customYieldPct) => patch({ customYieldPct })}
              />
            ) : null}
            <Slider
              label="净储备利润率"
              hint="Q2 约 39%。伙伴分销大约拿走储备收入的六成。"
              min={20}
              max={70}
              step={1}
              value={assumptions.netReserveMarginPct}
              format={(v) => plainPct(v, 0)}
              onChange={(netReserveMarginPct) => patch({ netReserveMarginPct })}
            />
            <Slider
              label="EBITDA 转化率"
              hint="年化 EBITDA = 年化 RLDC × 转化率。Q2 调整后 EBITDA / RLDC ≈ 50%。"
              min={25}
              max={80}
              step={1}
              value={assumptions.ebitdaConversionPct}
              format={(v) => plainPct(v, 0)}
              onChange={(ebitdaConversionPct) => patch({ ebitdaConversionPct })}
            />
            <Slider
              label="其他收入，年化"
              hint="Q2 非储备收入 3360 万美元，按四季计约 1.34 亿美元。"
              min={0}
              max={400}
              step={2}
              value={assumptions.otherRevenueM}
              format={(v) => `${v.toFixed(0)} 百万美元`}
              onChange={(otherRevenueM) => patch({ otherRevenueM })}
            />
            <Slider
              label="我的 EBITDA 倍数"
              min={10}
              max={40}
              step={1}
              value={assumptions.myMultiple}
              format={(v) => `${v.toFixed(0)}×`}
              onChange={(myMultiple) => patch({ myMultiple })}
            />
          </div>
        </article>

        <article className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-2xl">相对估值</h2>
          <p className="mt-1 text-sm text-muted">市销率和远期市盈率各算一个价，再取中位。</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Mini k="目标 P/S 股价" v={model ? usd(model.psPx) : "—"} />
            <Mini k="目标 P/E 股价" v={model ? usd(model.pePx) : "—"} />
          </div>
          <p className="font-display mt-4 text-4xl tabular-nums text-fg">
            {model ? usd(model.relativeMid) : "—"}
          </p>
          <p className="text-sm text-muted">两套相对估值的中位</p>
          <Seg
            value={assumptions.revenueBasis}
            onChange={(revenueBasis) => patch({ revenueBasis })}
            options={[
              ["ttm", "财报 TTM 收入"],
              ["model", "模型年化收入"],
            ]}
          />
          <Slider
            label="目标市销率"
            hint={`收入基数 ${model ? yi(model.revenueBase) : "—"}。近期远期 P/S 大约 5.4 倍。`}
            min={2}
            max={15}
            step={0.1}
            value={assumptions.targetPs}
            format={(v) => `${v.toFixed(1)}×`}
            onChange={(targetPs) => patch({ targetPs })}
          />
          <Slider
            label="远期 EPS"
            hint="不随流通量自动改。TTM EPS 约 $1.80，部分卖方远期低于这个数。"
            min={0.4}
            max={4}
            step={0.05}
            value={assumptions.forwardEps}
            format={(v) => usd(v)}
            onChange={(forwardEps) => patch({ forwardEps })}
          />
          <Slider
            label="目标远期市盈率"
            hint="现价对应的远期市盈率大约 50 倍以上，这里默认用更保守的 35 倍。"
            min={12}
            max={80}
            step={1}
            value={assumptions.targetPe}
            format={(v) => `${v.toFixed(0)}×`}
            onChange={(targetPe) => patch({ targetPe })}
          />
          <Slider
            label="股数"
            hint="约 2.551 亿股，对应 10 月底大约 185 亿美元市值。含未单列的稀释口径，不是实时股本。"
            min={220}
            max={300}
            step={0.1}
            value={assumptions.sharesM}
            format={(v) => `${v.toFixed(1)} 百万股`}
            onChange={(sharesM) => patch({ sharesM })}
          />
          <button
            type="button"
            className="mt-2 min-h-11 text-sm text-accent"
            onClick={() => setAssumptions(DEFAULT_ASSUMPTIONS)}
          >
            恢复默认假设
          </button>
        </article>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl">实时驱动</h2>
        <p className="mt-1 text-sm text-muted">链上供应量和国债大约每分钟拉一次。季报数字不会在这里变。</p>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Mini
            k="USDC 流通"
            v={snap.usdc != null ? yi(snap.usdc, 0) : "—"}
            sub={snap.usdcChg30 != null ? `30 日 ${pct(snap.usdcChg30)}` : undefined}
          />
          <Mini
            k="稳定币份额"
            v={share != null ? plainPct(share * 100, 1) : "—"}
            sub={snap.usdt != null ? `USDT ${yi(snap.usdt, 0)}` : undefined}
          />
          <Mini
            k="13 周国债"
            v={snap.billPct != null ? plainPct(snap.billPct, 2) : "—"}
            sub="贴现收益率，代理储备利率"
          />
          <Mini
            k="7 日流通变化"
            v={snap.usdcChg7 != null ? pct(snap.usdcChg7) : "—"}
            sub={snap.usdcChg1 != null ? `1 日 ${pct(snap.usdcChg1)}` : undefined}
          />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <article className="rounded-card border border-line bg-surface p-4">
            <p className="text-xs tracking-widest text-muted uppercase">Arc</p>
            <h3 className="font-display mt-1 text-2xl">自有链</h3>
            <p className="mt-2 text-sm text-muted">2026-09-16 主网。Gas 用 USDC 付。停在这里的美元已经算进上面的流通量，不能再计一次利息。</p>
            <dl className="mt-4 space-y-3 text-sm">
              <Row k="链上 USDC" v={snap.arcUsdc != null ? yi(snap.arcUsdc) : "—"} />
              <Row k="7 日" v={pct(rel(snap.arcUsdc, snap.arcUsdcWeek) ?? NaN)} />
              <Row k="30 日" v={pct(rel(snap.arcUsdc, snap.arcUsdcMonth) ?? NaN)} />
              <Row k="链上锁仓" v={snap.arcTvl != null ? yi(snap.arcTvl) : "—"} />
              <Row k="DEX 30 日" v={snap.arcDex30d != null ? yi(snap.arcDex30d) : "—"} />
              <Row k="Gas 30 日" v={snap.arcFees30d != null ? usd(snap.arcFees30d, 0) : "—"} />
              <Row k="计入估值" v={model ? yi(model.arcIncome) : "—"} />
            </dl>
            <Slider
              label="Circle 分成"
              hint="Gas 归出块的验证者。创世大约 12 家，默认按 Circle 一家，也就是 8%。"
              min={0}
              max={100}
              step={1}
              value={assumptions.arcSharePct}
              format={(v) => `${v.toFixed(0)}%`}
              onChange={(arcSharePct) => patch({ arcSharePct })}
            />
            <p className="mt-1 text-xs leading-relaxed text-muted">
              链上 USDC 的利息已经在储备收入里。这里加的只是 Gas。DEX 量含对倒，不算收入。
            </p>
          </article>

          <article className="rounded-card border border-line bg-surface p-4">
            <p className="text-xs tracking-widest text-muted uppercase">CCTP</p>
            <h3 className="font-display mt-1 text-2xl">跨链协议</h3>
            <p className="mt-2 text-sm text-muted">烧掉再铸造，用来把 USDC 搬到另一条链。普通转账不收费，快转大约 0 到 14 个基点。</p>
            <dl className="mt-4 space-y-3 text-sm">
              <Row k="30 日跨链量" v={yi(CCTP_VOLUME.d30, 0)} />
              <Row k="7 日 / 24 小时" v={`${yi(CCTP_VOLUME.d7, 0)} / ${yi(CCTP_VOLUME.d1)}`} />
              <Row k="手续费 24 小时" v={snap.cctpFees24h != null ? usd(snap.cctpFees24h, 0) : "—"} />
              <Row k="手续费 30 日" v={snap.cctpFees30d != null ? usd(snap.cctpFees30d, 0) : "—"} />
              <Row k="Gateway 30 日" v={snap.gatewayFees30d != null ? usd(snap.gatewayFees30d, 0) : "—"} />
              <Row k="计入估值" v={model ? yi(model.cctpIncome) : "—"} />
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              手续费按近 30 日乘 12，全额加进 EBITDA。跨链量是 {CCTP_VOLUME.asOf} 的快照，本身不是收入。
            </p>
          </article>

          <article className="rounded-card border border-line bg-surface p-4">
            <p className="text-xs tracking-widest text-muted uppercase">CPN</p>
            <h3 className="font-display mt-1 text-2xl">支付网络</h3>
            <p className="mt-2 text-sm text-muted">机构用 USDC 做跨境结算，再在当地付款。报出来的是流水，不是 Circle 留下的收入。</p>
            <dl className="mt-4 space-y-3 text-sm">
              <Row k="年化流水" v={yi(CPN.annualized, 0)} />
              <Row k="季末环比" v={pct(CPN.qoq)} />
              <Row k="接入机构" v={`${CPN.institutions}+`} />
              <Row k="口径日期" v={CPN.asOf} />
              <Row k="计入估值" v={model ? yi(model.cpnIncome) : "—"} />
            </dl>
            <Slider
              label="假设净抽成"
              hint="公司没公布费率。默认 5 bp。季报其他收入里可能已经含了一部分，拨高会有重复。"
              min={0}
              max={100}
              step={1}
              value={assumptions.cpnTakeBps}
              format={(v) => `${v.toFixed(0)} bp`}
              onChange={(cpnTakeBps) => patch({ cpnTakeBps })}
            />
            <p className="mt-1 text-xs leading-relaxed text-muted">
              流水乘抽成，全额加进 EBITDA，不再打储备利润率和转化率。拨回 0 就只留 Arc 和 CCTP 的实测手续费。
            </p>
          </article>
        </div>

        {snap.leaders.length > 0 && snap.stableTotal ? (
          <div className="mt-4 rounded-card border border-line bg-surface p-4">
            <p className="text-sm text-muted">稳定币供应</p>
            <ul className="mt-3 space-y-2">
              {snap.leaders.map((row) => {
                const width = Math.max(2, (row.usd / snap.stableTotal!) * 100);
                const mine = row.symbol === "USDC";
                return (
                  <li key={row.symbol} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-sm">
                    <span className={mine ? "text-accent" : "text-fg"}>{row.symbol}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-raised">
                      <span
                        className={mine ? "block h-2 rounded-full bg-accent" : "block h-2 rounded-full bg-muted"}
                        style={{ width: `${width}%` }}
                      />
                    </span>
                    <span className="tabular-nums text-muted">{yi(row.usd, 0)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChartCard title="股价 · 近 6 个月" empty={snap.priceHistory.length < 2}>
            {charts ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={snap.priceHistory}>
                  <XAxis dataKey="t" tickFormatter={dayLabel} tick={tick} axisLine={false} tickLine={false} minTickGap={32} />
                  <YAxis domain={["auto", "auto"]} tick={tick} axisLine={false} tickLine={false} width={42} />
                  <Tooltip content={<Tip money />} />
                  <Area dataKey="v" stroke="#e4c27a" fill="#e4c27a" fillOpacity={0.16} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </ChartCard>
          <ChartCard title="USDC 流通 · 近 180 天" empty={snap.supplyHistory.length < 2}>
            {charts ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={snap.supplyHistory}>
                  <XAxis dataKey="t" tickFormatter={dayLabel} tick={tick} axisLine={false} tickLine={false} minTickGap={32} />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={tick}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(v: number) => `${Math.round(v / 1e9)}B`}
                  />
                  <Tooltip content={<Tip />} />
                  <Area dataKey="v" stroke="#6dceb0" fill="#6dceb0" fillOpacity={0.14} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </ChartCard>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl">季报锚点 · {Q2.period}</h2>
        <p className="mt-1 text-sm text-muted">截至 {Q2.ended}。这组数用来校准滑杆，不参与每分钟刷新。</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Mini k="期末流通" v={yi(Q2.usdcEop, 0)} sub={`日均 ${yi(Q2.usdcAvg, 0)}`} />
          <Mini k="储备回报率" v={plainPct(Q2.reserveReturn * 100, 1)} />
          <Mini k="收入" v={yi(Q2.revenue)} sub={`储备 ${yi(Q2.reserveIncome)}`} />
          <Mini k="RLDC" v={yi(Q2.rldc)} sub={`利润率 ${plainPct(Q2.rldcMargin * 100, 1)}`} />
          <Mini k="调整后 EBITDA" v={yi(Q2.adjEbitda)} />
          <Mini k="持续经营净利润" v={yi(Q2.netIncome)} />
          <Mini k="平台上的 USDC" v={yi(Q2.usdcOnPlatform, 0)} sub={`加权 ${plainPct(Q2.platformWavg * 100, 1)}`} />
          <Mini k="有意义钱包" v={`${Q2.walletsM.toFixed(1)} 百万`} sub={`市占 ${plainPct(Q2.share * 100, 0)}`} />
          <Mini k="铸造 / 赎回" v={`${(Q2.minted / 1e9).toFixed(0)} / ${(Q2.redeemed / 1e9).toFixed(0)}`} sub="十亿美元" />
          <Mini k="链上成交量" v={`${(Q2.onchainVolume / 1e12).toFixed(1)} 万亿美元`} />
          <Mini k="TTM 收入" v={yi(TTM.revenue)} sub="公开汇总" />
          <Mini k="TTM 自由现金流" v={yi(TTM.fcf)} sub={`EPS ${usd(TTM.eps)}`} />
        </dl>
      </section>

      <footer className="mt-8 space-y-3 text-xs leading-relaxed text-muted">
        <p>
          股价来自交易所行情，USDC 与稳定币供应来自链上汇总，13 周国债用 ^IRX。Arc 上的 USDC、CCTP 手续费同样来自链上汇总。CPN 流水停在二季报，10 月只确认了机构家数，没有新的成交额。
        </p>
        <p>
          合理区间是假设，不是目标价，也不构成买卖建议。利率、Coinbase 分成和流通量任何一个变了，结论都会变。
        </p>
        <p suppressHydrationWarning>更新于 {clock(snap.fetchedAt)} · 每分钟自动刷新</p>
      </footer>
    </main>
  );
}

const tick = { fill: "#93a399", fontSize: 11 };

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-muted">{k}</dt>
      <dd className="mt-0.5 tabular-nums text-fg">{v}</dd>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="tabular-nums text-fg">{v}</dd>
    </div>
  );
}

function Mini({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div className="rounded-card border border-line bg-bg px-3 py-3">
      <p className="text-xs text-muted">{k}</p>
      <p className="mt-1 text-lg tabular-nums text-fg">{v}</p>
      {sub ? <p className="mt-1 text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

function Pill({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className={hot ? "rounded-2xl bg-accent px-2 py-3 text-ink" : "rounded-2xl bg-raised px-2 py-3"}>
      <p className="text-xs">{label}</p>
      <p className="mt-1 text-sm tabular-nums">{value}</p>
    </div>
  );
}

function Slider({
  label,
  hint,
  min,
  max,
  step,
  value,
  format,
  onChange,
}: {
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mt-3 block">
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-fg">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
        suppressHydrationWarning
      />
      {hint ? <span className="block text-xs leading-relaxed text-muted">{hint}</span> : null}
    </label>
  );
}

function Seg<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<[T, string]>;
}) {
  return (
    <div className={`mt-4 grid gap-1 rounded-full bg-bg p-1 ${options.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={
            value === id
              ? "min-h-11 rounded-full bg-accent px-2 text-sm text-ink"
              : "min-h-11 rounded-full px-2 text-sm text-muted"
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Meter({ low, high, value }: { low: number; high: number; value: number }) {
  const span = high - low;
  const pos = span > 0 ? Math.min(100, Math.max(0, ((value - low) / span) * 100)) : 0;
  return (
    <div className="mt-4">
      <div className="relative h-1 rounded-full bg-raised">
        <span
          className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: `calc(${pos}% - 6px)` }}
        />
      </div>
    </div>
  );
}

function ChartCard({ title, empty, children }: { title: string; empty: boolean; children: ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <p className="text-sm text-muted">{title}</p>
      <div className="mt-2 h-52">
        {empty ? <p className="pt-16 text-center text-sm text-muted">这张图还没有数据</p> : children}
      </div>
    </div>
  );
}

function Tip({
  active,
  payload,
  label,
  money,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: number;
  money?: boolean;
}) {
  if (!active || !payload?.length || label == null) return null;
  const value = payload[0]?.value;
  if (value == null) return null;
  return (
    <div className="rounded-lg border border-line bg-bg px-3 py-2 text-xs">
      <p className="text-muted">{dayLabel(label)}</p>
      <p className="mt-1 tabular-nums text-fg">{money ? usd(value) : yi(value, 1)}</p>
    </div>
  );
}

function rel(now: number | null, prev: number | null): number | null {
  if (now == null || prev == null || prev === 0) return null;
  return (now - prev) / prev;
}

function tone(n: number | null): string {
  if (n == null || n === 0) return "text-muted";
  return n > 0 ? "text-up" : "text-down";
}

function range(low: number | null, high: number | null): string {
  if (low == null || high == null) return "—";
  return `${usd(low, 2)} – ${usd(high, 2)}`;
}

function vol(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} 百万股`;
  return `${Math.round(n).toLocaleString("en-US")} 股`;
}

function dayLabel(t: number): string {
  return stamp(t, "America/New_York");
}

function clock(t: number): string {
  if (!t) return "—";
  return stamp(t, "Asia/Hong_Kong");
}

function marketStatus(marketTime: number | null): string {
  if (!marketTime) return "行情时间未知 · 每分钟刷新";
  const ageH = (Date.now() / 1000 - marketTime) / 3600;
  const when = stamp(marketTime * 1000, "America/New_York");
  return ageH < 1 ? `交易中 · 美东 ${when}` : `休市 · 最近成交 美东 ${when}`;
}

function stamp(ms: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(ms);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("day")}/${pick("month")} ${pick("hour")}:${pick("minute")}`;
}

