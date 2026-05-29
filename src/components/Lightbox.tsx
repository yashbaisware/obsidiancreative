import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type Item = { id: string; type: "image" | "video" | "pdf"; src: string; thumb: string; label: string };

export default function Lightbox({
  items,
  initialIndex = 0,
  open,
  previewLabel = "Preview",
  onClose,
  onIndexChange,
}: {
  items: Item[];
  initialIndex?: number;
  open: boolean;
  previewLabel?: string;
  onClose: () => void;
  onIndexChange?: (i: number) => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIndex(initialIndex);
    resetView();
  }, [initialIndex, open]);

  useEffect(() => onIndexChange?.(index), [index]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (open) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "+" || e.key === "=") zoomBy(0.25);
      if (e.key === "-") zoomBy(-0.25);
      if (e.key.toLowerCase() === "r") resetView();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, scale]);

  const clamp = (v: number, min = 1, max = 3) => Math.max(min, Math.min(max, v));

  function resetView() {
    setScale(1);
    setTx(0);
    setTy(0);
    setIsDragging(false);
  }

  function zoomTo(next: number, cx?: number, cy?: number) {
    const nextScale = clamp(next);
    if (!containerRef.current || cx == null || cy == null) {
      setScale(nextScale);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = cx - rect.left - rect.width / 2;
    const offsetY = cy - rect.top - rect.height / 2;
    const scaleFactor = nextScale / scale;

    setTx((current) => current - offsetX * (scaleFactor - 1));
    setTy((current) => current - offsetY * (scaleFactor - 1));
    setScale(nextScale);
  }

  function zoomBy(delta: number, cx?: number, cy?: number) {
    zoomTo(scale + delta, cx, cy);
  }

  function prev() {
    setIndex((current) => (current - 1 + items.length) % items.length);
    resetView();
  }

  function next() {
    setIndex((current) => (current + 1) % items.length);
    resetView();
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * 0.12;
    zoomBy(delta, e.clientX, e.clientY);
  }

  const panState = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    if (items[index]?.type !== "image" || scale <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    panState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: tx,
      originY: ty,
    };
    setIsDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    const state = panState.current;
    if (!state?.active) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    setTx(state.originX + dx);
    setTy(state.originY + dy);
  }

  function onPointerUp(e: React.PointerEvent) {
    const state = panState.current;
    if (!state?.active) return;
    state.active = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  function onDoubleClick(e: React.MouseEvent) {
    zoomTo(scale > 1.5 ? 1 : 2.5, e.clientX, e.clientY);
  }

  const cursorStyle = isDragging ? "grabbing" : "default";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            ref={containerRef}
            className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[32px] border border-white/10 bg-[#070a10] shadow-[0_45px_120px_rgba(0,0,0,0.7)]"
            onWheel={onWheel}
          >
            <div className="absolute inset-x-0 top-0 z-20 flex flex-col gap-3 border-b border-white/10 bg-black/50 px-4 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[11px] uppercase tracking-[0.35em] text-primary">{previewLabel}</div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-black/70 px-4 text-sm text-silver transition-all hover:border-primary hover:text-primary"
                  aria-label="Close"
                >
                  Close
                </button>
                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-silver/80 sm:flex">
                  {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    zoomBy(0.25, e.clientX, e.clientY);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-black/70 px-4 text-sm text-silver transition-all hover:border-primary hover:text-primary"
                  aria-label="Zoom In"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    zoomBy(-0.25, e.clientX, e.clientY);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-black/70 px-4 text-sm text-silver transition-all hover:border-primary hover:text-primary"
                  aria-label="Zoom Out"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetView();
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-black/70 px-4 text-sm text-silver transition-all hover:border-primary hover:text-primary"
                  aria-label="Reset Zoom"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="relative flex h-[calc(90vh-6.5rem)] items-center justify-center overflow-hidden px-4 py-6 sm:px-6">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-2xl text-silver transition-all hover:bg-primary/20"
                aria-label="Previous"
              >
                ‹
              </button>

              <motion.div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onDoubleClick={onDoubleClick}
                style={{ x: tx, y: ty, scale, cursor: cursorStyle }}
                transition={{ type: "spring", stiffness: 220, damping: 26 }}
                className="relative max-h-full max-w-full flex items-center justify-center"
              >
                {items[index].type === "pdf" ? (
                  <iframe
                    src={items[index].src}
                    title={items[index].label}
                    className="h-[85vh] w-full rounded-[28px] border border-white/10 bg-black"
                    frameBorder="0"
                  />
                ) : items[index].type === "video" ? (
                  <video
                    src={items[index].src}
                    poster={items[index].thumb}
                    controls
                    className="max-h-[80vh] max-w-full rounded-[28px] bg-black"
                  />
                ) : (
                  <img
                    src={items[index].src}
                    alt={items[index].label}
                    className="max-h-[80vh] max-w-full rounded-[28px] object-contain"
                    draggable={false}
                  />
                )}
              </motion.div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-2xl text-silver transition-all hover:bg-primary/20"
                aria-label="Next"
              >
                ›
              </button>
            </div>

            <div className="border-t border-white/10 bg-black/60 px-4 py-4 backdrop-blur-xl">
              <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
                {items.map((it, i) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => {
                      setIndex(i);
                      resetView();
                    }}
                    className={`h-16 w-28 flex-shrink-0 overflow-hidden rounded-2xl border transition duration-200 ${
                      i === index ? "border-primary ring-2 ring-primary/30" : "border-white/10 hover:border-primary"
                    }`}
                  >
                    {it.type === "video" ? (
                      <div className="relative h-full w-full bg-slate-950/10 flex items-center justify-center">
                        {it.thumb ? <img src={it.thumb} alt={it.label} className="h-full w-full object-cover" /> : null}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-lg">▶</div>
                      </div>
                    ) : it.type === "pdf" ? (
                      <div className="relative h-full w-full bg-slate-950/10 flex items-center justify-center">
                        {it.thumb ? <img src={it.thumb} alt={it.label} className="h-full w-full object-cover" /> : null}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs uppercase tracking-[0.2em] text-white">PDF</div>
                      </div>
                    ) : (
                      <img src={it.thumb} alt={it.label} className="h-full w-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
