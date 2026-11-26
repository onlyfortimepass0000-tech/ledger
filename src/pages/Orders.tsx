import { useEffect, useMemo, useState } from "react";
import { ChevronUp, Loader2 } from "lucide-react";
import { useCreateOrder, useMenu, useOrderMeta } from "../lib/hooks";
import { formatINR } from "../lib/format";
import { formatTable } from "../../shared/cafe";
import { toast } from "../lib/toast";
import type { OrderResult } from "../../shared/types";
import { OrderCart, type CartLine } from "../components/OrderCart";
import { RecordedStrip } from "../components/RecordedStrip";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import { HiddenDescription, HiddenTitle, Sheet, SheetContent } from "../components/Modal";
import styles from "./Orders.module.css";

const CATEGORY_ORDER = ["Chai", "Coffee", "Snacks", "Cold"];
const CATEGORY_HI: Record<string, string> = {
  Chai: "चाय",
  Coffee: "कॉफ़ी",
  Snacks: "नाश्ता",
  Cold: "ठंडा",
};

export function OrdersPage() {
  const { data, isLoading, isError, error, refetch } = useMenu();
  const createOrder = useCreateOrder();
  const { data: meta } = useOrderMeta();

  const [cart, setCart] = useState<Record<number, number>>({});
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [recorded, setRecorded] = useState<OrderResult | null>(null);

  const items = useMemo(() => data?.items ?? [], [data]);
  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const quickItems = useMemo(
    () =>
      items
        .filter((i) => i.isQuickTab)
        .sort((a, b) => (a.quickTabOrder ?? 999) - (b.quickTabOrder ?? 999)),
    [items],
  );

  const categories = useMemo(() => {
    const present = Array.from(new Set(items.map((i) => i.category)));
    return present.sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [items]);

  const activeCategory = category || categories[0] || "";

  // Auto-dismiss the "recorded" stamp.
  useEffect(() => {
    if (!recorded) return;
    const t = setTimeout(() => setRecorded(null), 20000);
    return () => clearTimeout(t);
  }, [recorded]);

  const addItem = (id: number) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const decItem = (id: number) =>
    setCart((c) => {
      const next = (c[id] ?? 0) - 1;
      const copy = { ...c };
      if (next <= 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  const clearCart = () => {
    setCart({});
    setTableNumber(null);
    setSheetOpen(false);
  };

  const lines: CartLine[] = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const it = itemById.get(Number(id));
          if (!it) return null;
          return { id: it.id, name: it.name, qty, unitPrice: it.price, lineTotal: it.price * qty };
        })
        .filter((x): x is CartLine => x !== null),
    [cart, itemById],
  );

  const total = lines.reduce((s, l) => s + l.lineTotal, 0);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);

  const save = () => {
    if (lines.length === 0 || createOrder.isPending) return;
    createOrder.mutate(
      { items: lines.map((l) => ({ menuItemId: l.id, quantity: l.qty })), tableNumber },
      {
        onSuccess: (res) => {
          setRecorded(res);
          setCart({});
          setTableNumber(null);
          setSheetOpen(false);
          if (window.innerWidth < 768) window.scrollTo({ top: 0, behavior: "smooth" });
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save the entry"),
      },
    );
  };

  const cartProps = {
    lines,
    total,
    itemCount,
    saving: createOrder.isPending,
    serialNo: meta?.nextSerialNo ?? null,
    dateLabel: meta?.dateLabel ?? null,
    tableNumber,
    onTableChange: setTableNumber,
    onInc: addItem,
    onDec: decItem,
    onClear: clearCart,
    onSave: save,
  };

  return (
    <div className={styles.page}>
      <title>Orders | Baithak Counter Ledger</title>

      <div className={styles.menuCol}>
        {recorded && <RecordedStrip result={recorded} onDismiss={() => setRecorded(null)} />}

        {isLoading ? (
          <div className={styles.center}>
            <Spinner />
          </div>
        ) : isError ? (
          <div className={styles.errorBox}>
            <p>{error instanceof Error ? error.message : "Could not load the menu."}</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <section aria-labelledby="quick-h">
              <div className={styles.secHead}>
                <h2 id="quick-h" className={styles.secTitle}>
                  झटपट <span className={styles.secLatin}>Quick Tab</span>
                </h2>
                <span className={styles.secHint}>tap once to add</span>
              </div>
              <div className={styles.quickGrid}>
                {quickItems.map((it) => (
                  <button key={it.id} className={styles.quickTag} onClick={() => addItem(it.id)}>
                    <span className={styles.quickName}>{it.name}</span>
                    <span className={styles.quickPrice}>{formatINR(it.price)}</span>
                    {cart[it.id] ? <span className={styles.stampCount}>{cart[it.id]}</span> : null}
                  </button>
                ))}
              </div>
            </section>

            <section aria-labelledby="menu-h">
              <div className={styles.secHead}>
                <h2 id="menu-h" className={styles.secTitle}>
                  मेन्यू <span className={styles.secLatin}>Menu</span>
                </h2>
              </div>

              <div className={styles.chips} role="tablist" aria-label="Menu categories">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={cat === activeCategory}
                    className={`${styles.chip} ${cat === activeCategory ? styles.chipActive : ""}`}
                    onClick={() => setCategory(cat)}
                  >
                    {CATEGORY_HI[cat] && <span className={styles.chipHi}>{CATEGORY_HI[cat]}</span>}
                    <span>{cat}</span>
                  </button>
                ))}
              </div>

              <div className={styles.menuGrid}>
                {items
                  .filter((i) => i.category === activeCategory)
                  .map((it) => (
                    <button key={it.id} className={styles.tag} onClick={() => addItem(it.id)}>
                      <span className={styles.tagName}>{it.name}</span>
                      <span className={styles.tagPrice}>{formatINR(it.price)}</span>
                      {cart[it.id] ? <span className={styles.stampCount}>{cart[it.id]}</span> : null}
                    </button>
                  ))}
              </div>
            </section>
          </>
        )}
      </div>

      {/* laptop + tablet: ledger page beside the menu */}
      <aside className={styles.ledgerCol}>
        <OrderCart {...cartProps} />
      </aside>

      {/* phone: sticky one-tap bar + order sheet */}
      {itemCount > 0 && (
        <div className={styles.mobileBar}>
          <button className={styles.barInfo} onClick={() => setSheetOpen(true)} aria-label="Review order">
            <ChevronUp size={18} />
            <span className={styles.barCount}>
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
            <span className={styles.barTotal}>{formatINR(total)}</span>
          </button>
          <button
            className={`${styles.barTableBtn} ${tableNumber !== null ? styles.barTableBtnOn : ""}`}
            onClick={() => setSheetOpen(true)}
            aria-label={`Table: ${formatTable(tableNumber)}. Tap to change`}
          >
            <span className={styles.barTableLabel}>Table</span>
            <span className={styles.barTableVal}>{tableNumber ?? "—"}</span>
          </button>
          <Button
            variant="primary"
            className={styles.barSave}
            onClick={save}
            disabled={createOrder.isPending}
          >
            {createOrder.isPending ? (
              <>
                <Loader2 size={18} className={styles.spin} /> Saving
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <HiddenTitle>Current entry</HiddenTitle>
          <HiddenDescription>Review and edit the items before saving.</HiddenDescription>
          <OrderCart {...cartProps} inSheet />
        </SheetContent>
      </Sheet>
    </div>
  );
}
