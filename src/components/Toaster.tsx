import { useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { dismissToast, getToasts, subscribeToasts } from "../lib/toast";
import styles from "./Toaster.module.css";

export function Toaster() {
  const items = useSyncExternalStore(subscribeToasts, getToasts, getToasts);
  return (
    <div className={styles.region} role="region" aria-label="Notifications" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`${styles.toast} ${t.tone === "error" ? styles.error : styles.success}`}>
          <div className={styles.text}>
            <span className={styles.title}>{t.title}</span>
            {t.description && <span className={styles.desc}>{t.description}</span>}
          </div>
          <button className={styles.close} onClick={() => dismissToast(t.id)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
