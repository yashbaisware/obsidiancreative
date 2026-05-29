import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lightbox, { Item } from "@/components/Lightbox";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Project } from "@/lib/projects";
import m1 from "@/assets/mockup-1.jpg";
import m2 from "@/assets/mockup-2.jpg";
import m3 from "@/assets/mockup-3.jpg";

const FALLBACKS = [m1, m2, m3];

export function Portfolio() {
  const [open, setOpen] = useState<Project | null>(null);

  const { data: allProjects = [] } = useQuery({
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
  const featured = allProjects.filter((p) => p.featured);
  const projects = featured.length > 0 ? featured : allProjects.slice(0, 3);

  return (
    <section id="portfolio" className="relative pt-16 md:pt-20 pb-16 md:pb-20 overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-bg opacity-30 pointer-events-none" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-primary mb-4">— Selected Work</div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl text-silver font-semibold">Featured Portfolio</h2>
          </div>
          <p className="max-w-md text-muted-foreground">
            A curated selection of carousel campaigns, product image ads and
            video creatives built for ambitious modern brands.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm tracking-wider">
            No projects yet — check back soon.
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {projects.map((p, i) => {
              const thumb = p.cover_url || p.image_url || p.gallery_urls?.[0] || FALLBACKS[i % FALLBACKS.length];
              return (
                <motion.button
                  key={p.id}
                  onClick={() => setOpen(p)}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative text-left rounded-3xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img src={thumb} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-glow pointer-events-none" />
                    <div className="absolute top-4 left-4 glass rounded-full px-3 py-1 text-[10px] tracking-[0.25em] uppercase text-silver">
                      {p.category}
                    </div>
                    {p.video_url && (
                      <div className="absolute bottom-4 right-4 glass rounded-full px-3 py-1 text-[10px] tracking-[0.2em] uppercase text-primary">
                        ▶ Video
                      </div>
                    )}
                    {p.pdf_url && (
                      <div className="absolute bottom-4 right-4 glass rounded-full px-3 py-1 text-[10px] tracking-[0.2em] uppercase text-primary">
                        PDF
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-display text-silver-bright">{p.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && <ProjectModal project={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </section>
  );
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [showPreview, setShowPreview] = useState(false);
  const [index, setIndex] = useState(0);

  const isCarousel = project.category === "Carousel";
  const isVideoAd = project.category === "Product Video Ads" || project.category === "Video";
  const isImageAd = project.category === "Product Image Ads";
  const previewLabel = isImageAd ? "Preview Product" : isCarousel ? "Preview PDF" : isVideoAd ? "Preview Ad" : "Preview";
  const previewCardTitle = isCarousel ? "PDF Preview" : isImageAd ? "Product Preview" : isVideoAd ? "Video Preview" : "Preview";
  const previewCardDescription = isCarousel
    ? "Open the full carousel presentation in fullscreen for a premium preview experience."
    : isImageAd
    ? "Explore the product image ad gallery in immersive fullscreen."
    : isVideoAd
    ? "Watch the video ad in fullscreen for an elevated review experience."
    : "Open the preview in fullscreen for the best viewing experience.";

  const mediaItems: Item[] = (() => {
    const items: Item[] = [];
    const add = (item: Item) => {
      if (!item.src) return;
      if (items.some((existing) => existing.src === item.src)) return;
      items.push(item);
    };

    if (project.cover_url) {
      add({ id: "cover", type: "image", src: project.cover_url, thumb: project.cover_url, label: "Cover image" });
    }

    if (isImageAd) {
      project.gallery_urls?.forEach((url, idx) => {
        add({ id: `gallery-${idx}`, type: "image", src: url, thumb: url, label: "Gallery image" });
      });
    }

    if (isCarousel && project.pdf_url) {
      add({
        id: "pdf",
        type: "pdf",
        src: project.pdf_url,
        thumb: project.cover_url || project.image_url || "",
        label: "Carousel PDF",
      });
    }

    if (isVideoAd && project.video_url) {
      add({
        id: "video",
        type: "video",
        src: project.video_url,
        thumb: project.cover_url || project.image_url || "",
        label: "Video",
      });
    }

    if (!project.cover_url && project.image_url) {
      add({ id: "fallback", type: "image", src: project.image_url, thumb: project.image_url, label: "Primary image" });
    }

    return items.length > 0
      ? items
      : [{ id: "empty", type: "image", src: project.cover_url ?? project.image_url ?? "", thumb: project.cover_url ?? project.image_url ?? "", label: "Fallback" }];
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
        className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-10 cursor-zoom-out overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-6xl w-full my-auto rounded-3xl overflow-hidden border border-border bg-card shadow-elegant cursor-default"
        >
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/70 px-5 py-4 backdrop-blur-xl">
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-primary">{project.category}</div>
              <div className="mt-2 text-lg font-semibold text-silver-bright">Project Preview</div>
            </div>
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-silver transition-all duration-300 hover:border-primary/60 hover:shadow-[0_0_0_4px_rgba(56,121,255,0.12)]"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="grid md:grid-cols-[0.95fr_1.05fr] gap-8 pt-20 px-6 pb-10 md:px-10 md:pb-12">
            <div className="flex items-center justify-center py-6 md:py-10">
              <div className="relative aspect-[9/16] w-full max-w-[420px] max-h-[720px] overflow-hidden rounded-[36px] border border-white/10 bg-black/80 shadow-[0_40px_90px_rgba(28,87,255,0.22)]">
                <div className="absolute -inset-8 bg-blue-500/15 blur-3xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
                <img
                  src={project.cover_url ?? project.image_url ?? mediaItems[0]?.src ?? ""}
                  alt={`${project.title} cover`}
                  className="relative h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col justify-center gap-8 py-6 md:py-10">
              <div className="space-y-6">
                <div className="text-[10px] tracking-[0.3em] uppercase text-primary">{project.category}</div>
                <h3 className="text-3xl md:text-4xl font-display text-silver leading-tight">{project.title}</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line max-w-xl">{project.description}</p>
              </div>

              <div className="relative overflow-hidden rounded-[36px] border border-blue-400/20 bg-white/5 p-6 shadow-[0_28px_80px_rgba(18,68,174,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_34px_100px_rgba(18,68,174,0.28)]">
                <div className="pointer-events-none absolute -inset-1 rounded-[36px] border border-transparent bg-gradient-to-br from-blue-400/20 via-transparent to-sky-400/10 opacity-90" />
                <div className="relative flex flex-col gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.35em] text-primary/80">{previewCardTitle}</div>
                    <p className="mt-2 text-sm text-silver/80 leading-relaxed">
                      {previewCardDescription}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="relative inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_15px_40px_rgba(56,121,255,0.28)] transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                  >
                    Open Preview
                  </button>
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

function ProjectMedia({ project }: { project: Project }) {
  if (project.category === "Product Video Ads" && project.video_url) {
    return (
      <video
        src={project.video_url}
        poster={project.cover_url ?? undefined}
        controls
        className="w-full h-full max-h-[80vh] object-contain bg-black"
      />
    );
  }

  if (project.category === "Product Image Ads" && project.gallery_urls?.length > 0) {
    return <Gallery urls={project.gallery_urls} title={project.title} />;
  }

  if (project.category === "Carousel" && project.pdf_url) {
    return (
      <object data={`${project.pdf_url}#view=FitH`} type="application/pdf" className="w-full h-[80vh]">
        <img src={project.cover_url ?? project.image_url} alt={project.title} className="w-full h-full object-cover" />
      </object>
    );
  }

  return (
    <img
      src={project.cover_url ?? project.image_url}
      alt={project.title}
      className="w-full h-full max-h-[80vh] object-cover"
    />
  );
}

function Gallery({ urls, title }: { urls: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const safe = (n: number) => (n + urls.length) % urls.length;
  return (
    <div className="w-full flex flex-col gap-3 p-4">
          <div className="relative aspect-square w-full bg-black rounded-xl overflow-hidden cursor-grab active:cursor-grabbing">
        <AnimatePresence mode="wait">
          <motion.img
            key={urls[idx]}
            src={urls[idx]}
            alt={`${title} ${idx + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
                className="absolute inset-0 w-full h-full object-contain cursor-zoom-in transition-all duration-500 ease-out hover:scale-[1.02]"
          />
        </AnimatePresence>
        {urls.length > 1 && (
          <>
            <button
              onClick={() => setIdx(safe(idx - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full glass text-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground"
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              onClick={() => setIdx(safe(idx + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full glass text-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground"
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
              className={`h-16 w-16 flex-shrink-0 snap-start rounded-lg overflow-hidden border transition ${
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
