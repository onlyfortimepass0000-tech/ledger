import { useState } from "react";
import { AlertTriangle, Pencil, Plus } from "lucide-react";
import { useAdjustInventory, useInventory } from "../lib/hooks";
import type { InventoryRow } from "../../shared/types";
import { formatQty, toNumber } from "../lib/format";
import { toast } from "../lib/toast";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Spinner } from "../components/Spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/Modal";
import styles from "./Inventory.module.css";

const FRESH_SECONDS = 600;

function agoLabel(seconds: number): string {
  if (seconds < 45) return "just now";
  return `${Math.max(1, Math.round(seconds / 60))} min ago`;
}

export function InventoryPage() {
  const { data, isLoading, isError, error, refetch } = useInventory();
  const adjust = useAdjustInventory();

  const [onlyLow, setOnlyLow] = useState(false);
  const [selected, setSelected] = useState<InventoryRow | null>(null);
  const [mode, setMode] = useState<"add" | "set">("add");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const all = data?.ingredients ?? [];
  const lowCount = all.filter((i) => i.isLow).length;
  const rows = onlyLow ? all.filter((i) => i.isLow) : all;

  const openAdjust = (row: InventoryRow) => {
    setSelected(row);
    setMode("add");
    setAmount("");
    setNote("");
  };
  const closeDialog = () => setSelected(null);

  const submit = () => {
    if (!selected) return;
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt)) {
      toast.error("Enter a valid number");
      return;
    }
    adjust.mutate(
      { ingredientId: selected.id, mode, amount: amt, note: note.trim() || undefined },
      {
        onSuccess: (res) => {
          toast.success(`${res.ingredient.name} updated`, {
            description: `Now ${formatQty(res.ingredient.currentStock, res.ingredient.unit)} in stock`,
          });
          closeDialog();
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update stock"),
      },
    );
  };

  return (
    <div className={styles.page}>
      <title>Inventory | Baithak Counter Ledger</title>

      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>
            स्टॉक बही <span className={styles.titleLatin}>Stock Register</span>
          </h1>
          <p className={styles.subtitle}>Every order cuts its ingredients from here automatically.</p>
        </div>
        <div className={styles.counts}>
          <div className={styles.count}>
            <span className={styles.countVal}>{all.length}</span>
            <span className={styles.countLabel}>items</span>
          </div>
          <div className={`${styles.count} ${lowCount > 0 ? styles.countLow : ""}`}>
            <span className={styles.countVal}>{lowCount}</span>
            <span className={styles.countLabel}>low</span>
          </div>
        </div>
      </div>

      <div className={styles.filters} role="tablist" aria-label="Filter stock">
        <button
          role="tab"
          aria-selected={!onlyLow}
          className={`${styles.filter} ${!onlyLow ? styles.filterActive : ""}`}
          onClick={() => setOnlyLow(false)}
        >
          All items
        </button>
        <button
          role="tab"
          aria-selected={onlyLow}
          className={`${styles.filter} ${onlyLow ? styles.filterActive : ""}`}
          onClick={() => setOnlyLow(true)}
        >
          Low stock {lowCount > 0 ? `(${lowCount})` : ""}
        </button>
      </div>

      {isLoading ? (
        <div className={styles.center}>
          <Spinner />
        </div>
      ) : isError ? (
        <div className={styles.errorBox}>
          <p>{error instanceof Error ? error.message : "Could not load stock."}</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className={styles.emptyBox}>
          <p className={styles.emptyHi}>सब ठीक है</p>
          <p className={styles.emptyLo}>Nothing is running low right now.</p>
        </div>
      ) : (
        <div className={styles.register}>
          {rows.map((row) => {
            const fresh =
              row.changedSecondsAgo !== null &&
              row.changedSecondsAgo < FRESH_SECONDS &&
              row.lastChange !== null;
            const change = toNumber(row.lastChange);
            return (
              <div
                key={row.id}
                className={`${styles.row} ${row.isLow ? styles.rowLow : ""} ${fresh ? styles.rowFresh : ""}`}
              >
                <div className={styles.main}>
                  <span className={styles.name}>
                    {row.name}
                    {row.isLow && (
                      <span className={styles.lowTag}>
                        <AlertTriangle size={12} /> LOW
                      </span>
                    )}
                  </span>
                  <span className={styles.meta}>low mark {formatQty(row.lowStockThreshold, row.unit)}</span>
                </div>

                <div className={styles.stock}>
                  <span className={styles.stockVal}>{formatQty(row.currentStock, row.unit)}</span>
                  {fresh && (
                    <span className={`${styles.delta} ${change < 0 ? styles.deltaDown : styles.deltaUp}`}>
                      {change < 0 ? "▼" : "▲"} {formatQty(Math.abs(change), row.unit)} ·{" "}
                      {agoLabel(row.changedSecondsAgo ?? 0)}
                    </span>
                  )}
                </div>

                <Button
                  variant="outline"
                  className={styles.adjBtn}
                  onClick={() => openAdjust(row)}
                  aria-label={`Adjust ${row.name}`}
                >
                  <Pencil size={16} />
                  <span className={styles.adjText}>Adjust</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={selected !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Adjust {selected.name}</DialogTitle>
                <DialogDescription>
                  Current stock: {formatQty(selected.currentStock, selected.unit)}
                </DialogDescription>
              </DialogHeader>

              <div className={styles.form}>
                <div className={styles.modeRow}>
                  <button
                    className={`${styles.modeBtn} ${mode === "add" ? styles.modeActive : ""}`}
                    onClick={() => setMode("add")}
                  >
                    <Plus size={16} /> Add stock
                  </button>
                  <button
                    className={`${styles.modeBtn} ${mode === "set" ? styles.modeActive : ""}`}
                    onClick={() => setMode("set")}
                  >
                    <Pencil size={16} /> Set exact
                  </button>
                </div>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>
                    {mode === "add" ? "Amount to add" : "New stock level"} ({selected.unit})
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={mode === "add" ? "e.g. 5000" : "e.g. 12000"}
                    autoFocus
                  />
                  {mode === "add" && (
                    <span className={styles.hint}>
                      New total:{" "}
                      {Number.isFinite(parseFloat(amount))
                        ? formatQty(toNumber(selected.currentStock) + parseFloat(amount), selected.unit)
                        : "—"}
                    </span>
                  )}
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Note (optional)</span>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Morning milk delivery"
                  />
                </label>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={closeDialog} disabled={adjust.isPending}>
                  Cancel
                </Button>
                <Button onClick={submit} disabled={adjust.isPending}>
                  {adjust.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
