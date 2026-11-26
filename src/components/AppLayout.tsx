import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart3, ClipboardList, Package } from "lucide-react";
import styles from "./AppLayout.module.css";

const NAV = [
  { to: "/", label: "Orders", icon: ClipboardList },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className={styles.shell}>
      <span className={styles.margin} aria-hidden="true" />

      <header className={styles.cover}>
        <div className={styles.coverInner}>
          <Link to="/" className={styles.brand}>
            <span className={styles.seal} aria-hidden="true">
              <span className={styles.sealText}>बैठक</span>
            </span>
            <span className={styles.brandText}>
              <span className={styles.brandName}>Baithak</span>
              <span className={styles.brandSub}>काउंटर बही · Counter Ledger</span>
            </span>
          </Link>

          <nav className={styles.tabs} aria-label="Sections">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`${styles.tab} ${isActive(to) ? styles.tabActive : ""}`}
                aria-current={isActive(to) ? "page" : undefined}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className={styles.page}>{children}</main>

      <nav className={styles.bottomNav} aria-label="Sections">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`${styles.bnItem} ${isActive(to) ? styles.bnActive : ""}`}
            aria-current={isActive(to) ? "page" : undefined}
          >
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
