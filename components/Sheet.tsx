"use client";

import { useEffect } from "react";
import { IconClose } from "./Icons";

// Панель, що виїжджає знизу (меню, коментарі, скачування)
export default function Sheet({
  open,
  onClose,
  title,
  children,
  tall,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  tall?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet-root" role="dialog" aria-modal="true" aria-label={title}>
      <button className="sheet-backdrop" aria-label="Закрити" onClick={onClose} />
      <div className={`sheet ${tall ? "sheet-tall" : ""}`}>
        <div className="sheet-grip" aria-hidden="true" />
        <div className="sheet-head">
          <strong>{title}</strong>
          <button className="icon-btn" style={{ width: 40, height: 40 }} aria-label="Закрити" onClick={onClose}>
            <IconClose size={18} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
