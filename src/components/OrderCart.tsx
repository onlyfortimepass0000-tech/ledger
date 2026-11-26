import { Loader2, Minus, Plus } from "lucide-react";
import { Button } from "./Button";
import { formatINR } from "../lib/format";
import { TABLE_COUNT } from "../../shared/cafe";
import styles from "./OrderCart.module.css";

export type CartLine = {
  id: number;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

interface Props {
  lines: CartLine[];
  total: number;
  itemCount: number;
  saving: boolean;
  /** The Sr. No. this entry will get, as written in the first column of the paper page. */
  serialNo: number | null;
  dateLabel: string | null;
  tableNumber: number | null;
  onTableChange: (n: number | null) => void;
  onInc: (id: number) => void;
  onDec: (id: number) => void;
  onClear: () => void;
  onSave: () => void;
  /** Rendered inside the phone bottom sheet (leaves room for its close button). */
  inSheet?: boolean;
  className?: string;
}

const TABLES = Array.from({ length: TABLE_COUNT }, (_, i) => i + 1);

export function OrderCart({
  lines,
  total,
  itemCount,
  saving,
  serialNo,
  dateLabel,
  tableNumber,
  onTableChange,
  onInc,
  onDec,
  onClear,
  onSave,
  inSheet,
  className,
}: Props) {
  const empty = lines.length === 0;
  return (
    <div className={`${styles.cart} ${inSheet ? styles.sheet : ""} ${className || ""}`}>
      <div className={styles.head}>
        <h2 className={styles.title}>नई एंट्री</h2>
        {dateLabel && <span className={styles.date}>{dateLabel}</span>}
      </div>

      <div className={styles.meta}>
        <div className={styles.serialRow}>
          <span className={styles.serialNo} aria-label={`Serial number ${serialNo ?? ""}`}>
            {serialNo ?? "–"}
          </span>
          <span className={styles.serialLabel}>Sr. No.</span>
        </div>

        <div className={styles.tableRow}>
          <span className={styles.tableLabel}>Table</span>
          <div className={styles.tables} role="radiogroup" aria-label="Table number">
            <button
              role="radio"
              aria-checked={tableNumber === null}
              aria-label="No table"
              className={`${styles.tableChip} ${tableNumber === null ? styles.tableChipOn : ""}`}
              onClick={() => onTableChange(null)}
            >
              —
            </button>
            {TABLES.map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={tableNumber === n}
                aria-label={`Table ${n}`}
                className={`${styles.tableChip} ${tableNumber === n ? styles.tableChipOn : ""}`}
                onClick={() => onTableChange(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.cols} aria-hidden="true">
        <span>Item</span>
        <span className={styles.colMid}>Q</span>
        <span className={styles.colEnd}>Price</span>
        <span className={styles.colEnd}>Total</span>
      </div>

      <div className={styles.rows}>
        {empty ? (
          <div className={styles.empty}>
            <p className={styles.emptyHi}>अभी कोई एंट्री नहीं</p>
            <p className={styles.emptyLo}>Tap an item to start entry no. {serialNo ?? ""}</p>
          </div>
        ) : (
          lines.map((l) => (
            <div key={l.id} className={styles.row}>
              <span className={styles.itemName}>{l.name}</span>
              <div className={styles.stepper}>
                <button
                  className={styles.stepBtn}
                  onClick={() => onDec(l.id)}
                  aria-label={`Reduce ${l.name}`}
                >
                  <Minus size={16} />
                </button>
                <span className={styles.qty}>{l.qty}</span>
                <button className={styles.stepBtn} onClick={() => onInc(l.id)} aria-label={`Add ${l.name}`}>
                  <Plus size={16} />
                </button>
              </div>
              <span className={styles.price}>
                {formatINR(l.unitPrice)}
                <span className={styles.each}> each</span>
              </span>
              <span className={styles.lineTotal}>{formatINR(l.lineTotal)}</span>
            </div>
          ))
        )}
      </div>

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>
          TOTAL
          {itemCount > 0 && (
            <span className={styles.totalCount}>
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
          )}
        </span>
        <span className={styles.totalCircle}>{formatINR(total)}</span>
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" className={styles.clearBtn} disabled={empty || saving} onClick={onClear}>
          Clear
        </Button>
        <Button variant="primary" className={styles.saveBtn} disabled={empty || saving} onClick={onSave}>
          {saving ? (
            <>
              <Loader2 size={18} className={styles.spin} /> Saving…
            </>
          ) : (
            <>Save entry · {formatINR(total)}</>
          )}
        </Button>
      </div>
    </div>
  );
}
