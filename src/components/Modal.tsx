// Phone bottom sheet and centred dialog, both built on Radix Dialog for focus
// trapping, Escape-to-close and screen-reader support.
import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from "react";
import * as RD from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import styles from "./Modal.module.css";

export const Sheet = RD.Root;
export const Dialog = RD.Root;

/** Bottom sheet: hugs its content (up to 92% of the screen) so the action buttons stay in view. */
export function SheetContent({ children }: { children: ReactNode }) {
  return (
    <RD.Portal>
      <RD.Overlay className={styles.overlay} />
      <RD.Content className={styles.sheet}>
        {children}
        <RD.Close className={styles.closeSheet} aria-label="Close">
          <X size={18} />
        </RD.Close>
      </RD.Content>
    </RD.Portal>
  );
}

export function DialogContent({ children }: { children: ReactNode }) {
  return (
    <RD.Portal>
      <RD.Overlay className={styles.overlay} />
      <RD.Content className={styles.dialog}>
        {children}
        <RD.Close className={styles.closeDialog} aria-label="Close">
          <X size={18} />
        </RD.Close>
      </RD.Content>
    </RD.Portal>
  );
}

export function HiddenTitle(props: ComponentPropsWithoutRef<typeof RD.Title>) {
  return <RD.Title className="sr-only" {...props} />;
}

export function HiddenDescription(props: ComponentPropsWithoutRef<typeof RD.Description>) {
  return <RD.Description className="sr-only" {...props} />;
}

export function DialogTitle(props: ComponentPropsWithoutRef<typeof RD.Title>) {
  return <RD.Title className={styles.title} {...props} />;
}

export function DialogDescription(props: ComponentPropsWithoutRef<typeof RD.Description>) {
  return <RD.Description className={styles.description} {...props} />;
}

export function DialogHeader(props: HTMLAttributes<HTMLDivElement>) {
  return <div className={styles.header} {...props} />;
}

export function DialogFooter(props: HTMLAttributes<HTMLDivElement>) {
  return <div className={styles.footer} {...props} />;
}
