import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Lightbox, { Item } from "@/components/Lightbox";
import { CATEGORIES, type Category, type Project } from "@/lib/projects";

export function MyWork() {
  const qc = useQueryClient();
  const [active, setActive] = useState<Category>("Carousel");
  const [open, setOpen] = useState<Project | null>(null);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("projects-mywork")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => qc.invalidateQueries({ queryKey: ["projects"] })
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const counts = useMemo(() => {
    const c: Record<Category, number> = {
      Carousel: 0,
      "Product Image Ads": 0,
      "Product Video Ads": 0,
    };
    for (const p of projects) {
      if ((CATEGORIES as readonly string[]).includes(p.category)) {
        c[p.category as Category] += 1;
      }
    }
    return c;
  }, [projects]);

  const filtered = projects.filter((p) => p.category === active);

  return (
    <section id="my-work" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-bg opacity-20 pointer-events-none" />
      <div className="absolute top-1/3 -left-40 h-[500px] w-[500px] bg-glow opacity-30 pointer-events-none -z-10" />

      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-primary mb-3">— Archive</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-silver font-semibold">My Work</h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            The full archive — every campaign organized by craft.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-28 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {CATEGORIES.map((c) => {
                const isActive = c === active;
                return (
                  <button
                    key={c}
                    onClick={() => setActive(c)}
                    className={`relative flex-shrink-0 lg:w-full text-left rounded-xl px-4 py-3 border transition-all text-sm ${
                      isActive
                        ? "border-primary/50 bg-primary/10 text-silver-bright"
                        : "border-border/60 bg-card/30 text-muted-foreground hover:text-foreground hover:border-primary/30"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="mywork-indicator"
                        className="absolute left-0 top-2.5 bottom-2.5 w-[2px] rounded-full bg-primary"
                      />
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <span className="tracking-wide">{c}</span>
                      <span className="text-[10px] tracking-[0.2em] text-primary/70">
                        {String(counts[c]).padStart(2, "0")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {filtered.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center text-muted-foreground text-xs tracking-wider">
                    Nothing here yet — new {active.toLowerCase()} drops soon.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((p, i) => (
                      <ProjectCard key={p.id} project={p} index={i} onOpen={() => setOpen(p)} />
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && <ProjectModal project={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </section>
  );
}

function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: () => void;
}) {
  const thumb =
    project.cover_url || project.image_url || project.gallery_urls?.[0];
  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group relative text-left rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-background/50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        <div className="absolute top-3 left-3 glass rounded-full px-2.5 py-0.5 text-[9px] tracking-[0.25em] uppercase text-silver">
          {project.category}
        </div>
        {project.video_url && (
          <div className="absolute bottom-3 right-3 glass rounded-full px-2.5 py-0.5 text-[9px] tracking-[0.2em] uppercase text-primary">
            ▶ Video
          </div>
        )}
        {project.pdf_url && (
          <div className="absolute bottom-3 right-3 glass rounded-full px-2.5 py-0.5 text-[9px] tracking-[0.2em] uppercase text-primary">
            PDF
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-display text-silver-bright truncate">{project.title}</h3>
        {project.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}
      </div>
    </motion.button>
  );
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [showPreview, setShowPreview] = useState(false);
  const [index, setIndex] = useState(0);
  const cover = project.cover_url || project.image_url || project.gallery_urls?.[0] || "";
  const isCarousel = project.category === "Carousel";
  const isVideoAd = project.category === "Product Video Ads" || project.category === "Video";
  const isImageAd = project.category === "Product Image Ads";
  const previewLabel = isImageAd ? "Preview Product" : isCarousel ? "Preview PDF" : isVideoAd ? "Preview Ad" : "Preview";
  const previewCardTitle = isCarousel ? "PDF Preview" : isImageAd ? "Product Preview" : isVideoAd ? "Video Preview" : "Preview";
  const previewCardDescription = isCarousel
    ? "Open the full carousel presentation in fullscreen for a premium preview experience."
    : isImageAd
    ? "Open the product image gallery in fullscreen for a sharper view."
    : isVideoAd
    ? "Play the video ad in fullscreen with zoom-enabled controls."
    : "Open the preview in fullscreen for the best viewing experience.";
  const viewFullUrl = isCarousel
    ? project.pdf_url ?? cover
    : isVideoAd
    ? project.video_url ?? cover
    : cover;

  const mediaItems: Item[] = (() => {
    const items: Item[] = [];
    const add = (item: Item) => {
      if (!item.src) return;
      if (items.some((existing) => existing.src === item.src)) return;
      items.push(item);
    };

    add({ id: "cover", type: "image", src: cover, thumb: cover, label: "Cover image" });

    if (isCarousel && project.pdf_url) {
      add({
        id: "pdf",
        type: "pdf",
        src: project.pdf_url,
        thumb: cover,
        label: "Carousel PDF",
      });
    }

    if (isVideoAd && project.video_url) {
      add({
        id: "video",
        type: "video",
        src: project.video_url,
        thumb: cover,
        label: "Video",
      });
    }

    if (isImageAd && project.gallery_urls?.length) {
      project.gallery_urls.forEach((url, idx) => {
        add({ id: `gallery-${idx}`, type: "image", src: url, thumb: url, label: `Gallery image ${idx + 1}` });
      });
    }

    return items;
  })();

  useEffect(() => {
    setIndex(0);
    setShowPreview(false);
  }, [project.id]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 cursor-zoom-out overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-6xl w-full my-auto rounded-3xl overflow-hidden border border-border bg-card shadow-elegant cursor-default"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full glass flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
            aria-label="Close"
          >
            ✕
          </button>

          <div className="grid md:grid-cols-2 min-h-[60vh]">
            {/* LEFT — cover hero */}
            <div className="relative bg-background/60 flex flex-col items-center justify-center p-6 md:p-10 md:sticky md:top-0 md:self-start md:h-screen md:max-h-[90vh]">
              <div className="absolute inset-0 bg-glow opacity-40 pointer-events-none" />
              <div className="relative w-full max-w-[420px] max-h-[720px] aspect-[9/16] overflow-hidden rounded-[32px] border border-white/10 bg-black/80 shadow-[0_40px_100px_rgba(28,87,255,0.22)]">
                <img src={cover} alt={project.title} className="h-full w-full object-cover" />
              </div>

              <div className="mt-5 w-full max-w-[420px]">
                <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
                  <button
                    type="button"
                    onClick={() => {
                      setIndex(0);
                      setShowPreview(true);
                    }}
                    className="relative h-20 min-w-[90px] overflow-hidden rounded-3xl border border-white/10 bg-black/60 transition hover:border-primary"
                  >
                    <img src={cover} alt="Cover thumbnail" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/80 to-transparent px-3 pt-2 text-[10px] uppercase tracking-[0.25em] text-silver">
                      Cover
                    </div>
                  </button>

                  {project.pdf_url ? (
                    <button
                      type="button"
                      onClick={() => {
                        const pdfIndex = mediaItems.findIndex((item) => item.type === "pdf");
                        setIndex(pdfIndex >= 0 ? pdfIndex : 0);
                        setShowPreview(true);
                      }}
                      className="relative h-20 min-w-[90px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 transition hover:border-primary"
                    >
                      <img src={cover} alt="PDF thumbnail" className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/80 to-transparent px-3 pt-2 text-[10px] uppercase tracking-[0.25em] text-primary">
                        PDF
                      </div>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* RIGHT — details */}
            <div className="p-8 md:p-12 flex flex-col justify-center gap-8">
              <div className="space-y-6">
                <div className="text-[10px] tracking-[0.3em] uppercase text-primary">{project.category}</div>
                <h3 className="text-3xl md:text-4xl font-display text-silver leading-tight">{project.title}</h3>
                {project.description && (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm md:text-base">
                    {project.description}
                  </p>
                )}
              </div>

              <div className="rounded-[36px] border border-white/10 bg-white/5 p-6 shadow-[0_28px_80px_rgba(18,68,174,0.18)] backdrop-blur-xl">
                <div className="mb-6 space-y-3">
                  <div className="text-sm uppercase tracking-[0.3em] text-primary/80">{previewCardTitle}</div>
                  <p className="text-sm text-silver/80 leading-relaxed">{previewCardDescription}</p>
                </div>
                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_14px_40px_rgba(56,121,255,0.28)] transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.01]"
                  >
                    Open Preview
                  </button>
                  {viewFullUrl ? (
                    <a
                      href={viewFullUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-black/70 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-silver transition hover:border-primary hover:bg-white/10"
                    >
                      View Full Size
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      <Lightbox
        items={mediaItems}
        initialIndex={index}
        open={showPreview}
        previewLabel={previewLabel}
        onClose={() => setShowPreview(false)}
        onIndexChange={(i) => setIndex(i)}
      />
    </>
  );
}

function Gallery({ urls, title }: { urls: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const safe = (n: number) => (n + urls.length) % urls.length;
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="relative aspect-square w-full bg-black rounded-xl overflow-hidden border border-border">
        <AnimatePresence mode="wait">
          <motion.img
            key={urls[idx]}
            src={urls[idx]}
            alt={`${title} ${idx + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 w-full h-full object-contain"
          />
        </AnimatePresence>
        {urls.length > 1 && (
          <>
            <button
              onClick={() => setIdx(safe(idx - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full glass text-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground"
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              onClick={() => setIdx(safe(idx + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full glass text-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground"
              aria-label="Next"
            >
              ›
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 glass rounded-full px-3 py-1 text-[10px] tracking-[0.2em] text-silver">
              {idx + 1} / {urls.length}
            </div>
          </>
        )}
      </div>
      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
          {urls.map((u, i) => (
            <button
              key={u}
              onClick={() => setIdx(i)}
              className={`h-14 w-14 flex-shrink-0 snap-start rounded-lg overflow-hidden border transition ${
                i === idx ? "border-primary" : "border-border opacity-60 hover:opacity-100"
              }`}
            >
              <img src={u} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
