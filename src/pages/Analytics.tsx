import { useState } from "react";
import { Droplet } from "lucide-react";
import { useAnalytics } from "../lib/hooks";
import type { AnalyticsPeriod } from "../../shared/types";
import { formatINR, formatQty } from "../lib/format";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import styles from "./Analytics.module.css";

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "7 days" },
  { value: "month", label: "30 days" },
];

const SEGMENT_COLORS = ["#8E2220", "#B3862A", "#5C3A21", "#4B6B2C", "#B5603A"];

export function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("week");
  const { data, isLoading, isError, error, refetch } = useAnalytics(period);

  const topItems = data?.topItems ?? [];
  const ingredients = data?.ingredients ?? [];
  const top = ingredients[0];
  const maxQty = Math.max(1, ...topItems.map((t) => t.quantity));
  const hasSales = (data?.sales.orderCount ?? 0) > 0;

  return (
    <div className={styles.page}>
      <title>Analytics | Baithak Counter Ledger</title>

      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>
            रिपोर्ट <span className={styles.titleLatin}>Analytics</span>
          </h1>
          <p className={styles.subtitle}>Sales, and where the ingredients are going.</p>
        </div>
        <div className={styles.periods} role="tablist" aria-label="Period">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              role="tab"
              aria-selected={period === p.value}
              className={`${styles.period} ${period === p.value ? styles.periodActive : ""}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className={styles.center}>
          <Spinner />
        </div>
      ) : isError ? (
        <div className={styles.errorBox}>
          <p>{error instanceof Error ? error.message : "Could not load the report."}</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <div className={styles.totals}>
            <div className={styles.total}>
              <span className={styles.totalLabel}>आय · Revenue</span>
              <span className={styles.totalVal}>{formatINR(data?.sales.revenue ?? 0)}</span>
            </div>
            <div className={styles.total}>
              <span className={styles.totalLabel}>एंट्री · Orders</span>
              <span className={styles.totalVal}>{data?.sales.orderCount ?? 0}</span>
            </div>
            <div className={styles.total}>
              <span className={styles.totalLabel}>आइटम · Items</span>
              <span className={styles.totalVal}>{data?.sales.itemsSold ?? 0}</span>
            </div>
          </div>

          {!hasSales ? (
            <div className={styles.emptyBox}>
              <p className={styles.emptyHi}>इस अवधि में कोई एंट्री नहीं</p>
              <p className={styles.emptyLo}>
                No entries in this period yet. Save an order and the breakdown appears here.
              </p>
            </div>
          ) : (
            <>
              {top && (
                <div className={styles.headline}>
                  <span className={styles.headlineIcon}>
                    <Droplet size={22} />
                  </span>
                  <div className={styles.headlineText}>
                    <span className={styles.headlineLabel}>सबसे ज़्यादा खपत · Most used ingredient</span>
                    <span className={styles.headlineMain}>
                      {top.name} <em>{formatQty(top.consumed, top.unit)}</em>
                    </span>
                    {top.drivers[0] && (
                      <span className={styles.headlineDriver}>
                        mostly <strong>{top.drivers[0].name}</strong> (
                        {Math.round((top.drivers[0].consumed / top.consumed) * 100)}%)
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.columns}>
                <section className={styles.panel} aria-labelledby="top-h">
                  <h2 id="top-h" className={styles.panelTitle}>
                    सबसे ज़्यादा बिका <span>Top sellers</span>
                  </h2>
                  <ol className={styles.rank}>
                    {topItems.map((t, i) => (
                      <li key={`${t.menuItemId}-${t.name}`} className={styles.rankRow}>
                        <span className={styles.rankNo}>{i + 1}</span>
                        <div className={styles.rankBody}>
                          <div className={styles.rankTop}>
                            <span className={styles.rankName}>{t.name}</span>
                            <span className={styles.rankQty}>×{t.quantity}</span>
                          </div>
                          <div className={styles.bar}>
                            <div className={styles.barFill} style={{ width: `${(t.quantity / maxQty) * 100}%` }} />
                          </div>
                        </div>
                        <span className={styles.rankAmt}>{formatINR(t.revenue)}</span>
                      </li>
                    ))}
                  </ol>
                </section>

                <section className={styles.panel} aria-labelledby="ing-h">
                  <h2 id="ing-h" className={styles.panelTitle}>
                    कच्चा माल <span>Ingredient use</span>
                  </h2>
                  <p className={styles.panelHint}>Coloured segments show which items used it.</p>
                  <div className={styles.ings}>
                    {ingredients.map((ing) => (
                      <div key={ing.ingredientId} className={styles.ing}>
                        <div className={styles.ingHead}>
                          <span className={styles.ingName}>{ing.name}</span>
                          <span className={styles.ingQty}>{formatQty(ing.consumed, ing.unit)}</span>
                        </div>
                        <div className={styles.seg}>
                          {ing.drivers.map((d, i) => {
                            const pct = ing.consumed > 0 ? (d.consumed / ing.consumed) * 100 : 0;
                            if (pct <= 0) return null;
                            return (
                              <span
                                key={`${d.menuItemId}-${i}`}
                                className={styles.segPart}
                                style={{ width: `${pct}%`, background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
                                title={`${d.name}: ${formatQty(d.consumed, ing.unit)}`}
                              />
                            );
                          })}
                        </div>
                        <div className={styles.legend}>
                          {ing.drivers.slice(0, 3).map((d, i) => (
                            <span key={`${d.menuItemId}-${i}`} className={styles.legendItem}>
                              <i
                                className={styles.dot}
                                style={{ background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
                              />
                              {d.name} {Math.round((d.consumed / ing.consumed) * 100)}%
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
