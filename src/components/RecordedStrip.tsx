import { X } from "lucide-react";
import type { OrderResult } from "../../shared/types";
import { formatTable } from "../../shared/cafe";
import { formatINR, formatQty } from "../lib/format";
import styles from "./RecordedStrip.module.css";

interface Props {
  result: OrderResult;
  onDismiss: () => void;
  className?: string;
}

/** The "दर्ज ✓ recorded" stamp shown after an entry is saved, with what stock it used. */
export function RecordedStrip({ result, onDismiss, className }: Props) {
  const shown = result.deductions.slice(0, 6);
  const extra = result.deductions.length - shown.length;
  const lows = result.deductions.filter((d) => d.low);

  return (
    <div className={`${styles.strip} ${className || ""}`} role="status" aria-live="polite">
      <button className={styles.close} onClick={onDismiss} aria-label="Dismiss">
        <X size={16} />
      </button>

      <div className={styles.top}>
        <span className={styles.stamp}>दर्ज ✓</span>
        <div className={styles.topText}>
          <span className={styles.entry}>
            Sr. {result.serialNo}
            {result.tableNumber ? ` · ${formatTable(result.tableNumber)}` : ""} ·{" "}
            {formatINR(result.totalAmount)}
          </span>
          <span className={styles.sub}>
            {result.itemCount} item{result.itemCount === 1 ? "" : "s"} recorded · stock updated
          </span>
        </div>
      </div>

      <ul className={styles.list}>
        {shown.map((d) => (
          <li key={d.ingredientId} className={`${styles.li} ${d.low ? styles.liLow : ""}`}>
            <span className={styles.ing}>{d.name}</span>
            <span className={styles.used}>−{formatQty(d.amount, d.unit)}</span>
            <span className={styles.left}>{formatQty(d.remaining, d.unit)} left</span>
          </li>
        ))}
      </ul>

      {extra > 0 && (
        <p className={styles.more}>
          + {extra} more ingredient{extra === 1 ? "" : "s"} updated
        </p>
      )}
      {lows.length > 0 && <p className={styles.warn}>Running low: {lows.map((l) => l.name).join(", ")}</p>}
    </div>
  );
}
