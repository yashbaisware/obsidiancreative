import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { HeroImage } from "@/lib/hero";
import heroBg from "@/assets/hero-bg.jpg";
import m1 from "@/assets/mockup-1.jpg";
import m2 from "@/assets/mockup-2.jpg";
import m3 from "@/assets/mockup-3.jpg";

const features = [
  { label: "Carousel Ads" },
  { label: "AI Visuals" },
  { label: "Premium Design" },
];

const FALLBACK = [m1, m2, m3];

/** Preload images and resolve when all are decoded/loaded */
function preloadImages(urls: string[]): Promise<void> {
  if (urls.length === 0) return Promise.resolve();
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // don't block on broken URLs
          img.src = url;
        })
    )
  ).then(() => undefined);
}

export function Hero() {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const goToExploreWork = () => {
    const target = document.getElementById("my-work");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
      return;
    }
    window.location.href = "/my-work";
  };

  // Fetch hero images — gcTime:0 prevents stale cache from flashing old images
  const { data: dbImages, isLoading: queryLoading } = useQuery({
    queryKey: ["hero_showcase", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_showcase" as never)
        .select("*")
        .eq("is_visible", true)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as HeroImage[];
    },
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("hero-showcase-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "hero_showcase" }, () => {
        qc.invalidateQueries({ queryKey: ["hero_showcase"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  // Determine final image list only after query resolves
  const images = useMemo(() => {
    if (!dbImages) return null; // still loading — don't resolve to fallback yet
    return dbImages.length > 0 ? dbImages.map((i) => i.image_url) : FALLBACK;
  }, [dbImages]);

  // Preload all carousel images before revealing
  const [imagesReady, setImagesReady] = useState(false);
  const preloadTriggered = useRef(false);

  useEffect(() => {
    if (!images || preloadTriggered.current) return;
    preloadTriggered.current = true;
    preloadImages(images).then(() => setImagesReady(true));
  }, [images]);

  // Auto-rotate front index — only start after images are ready
  const [front, setFront] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!imagesReady || !images || paused || images.length < 2) return;
    const id = window.setInterval(() => {
      setFront((f) => (f + 1) % images.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [paused, images, imagesReady]);

  // Build the visible 3-card stack starting at `front`
  const stack = useMemo(() => {
    if (!images || images.length === 0) return [];
    const n = images.length;
    return [0, 1, 2].map((offset) => images[(front + offset) % n]);
  }, [images, front]);

  // Carousel is ready to display only when data is fetched AND images are preloaded
  const carouselReady = imagesReady && images !== null;

  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden pt-20 md:pt-24 pb-10">
      <div className="absolute inset-0 -z-10">
        <img
          src={heroBg}
          alt=""
          width={1920}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-1/3 left-[10%] h-[500px] w-[600px] bg-glow animate-pulse-glow" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[600px] bg-glow opacity-60 animate-pulse-glow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 backdrop-blur px-4 py-1.5 text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-8"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            Premium Creative Studio
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05]"
          >
            <span className="text-silver">Visuals That</span>
            <br />
            <span className="text-silver">Build </span>
            <span
              className="italic font-light text-primary"
              style={{ textShadow: "0 0 40px oklch(0.7 0.22 245 / 0.6)" }}
            >
              Brands.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
           className="mt-5 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed"
          >
            Obsidian Creative designs premium carousel ads and AI-powered visuals
            for modern brands and digital campaigns.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 flex flex-wrap gap-4"
          >
            <button
              onClick={() => scrollTo("portfolio")}
              className="group inline-flex items-center gap-3 rounded-full bg-primary text-primary-foreground px-7 py-3.5 text-sm tracking-wide font-medium hover:glow-blue transition-all"
            >
              View Portfolio
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
            <button
              onClick={goToExploreWork}
              className="inline-flex items-center gap-3 rounded-full border border-border bg-card/40 backdrop-blur px-7 py-3.5 text-sm tracking-wide text-foreground hover:border-primary/60 hover:bg-card transition-all"
            >
              Explore Work
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-6 flex flex-wrap gap-3"
          >
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2.5 rounded-full border border-border bg-card/40 backdrop-blur px-4 py-2"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-xs tracking-[0.2em] uppercase text-silver">{f.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div
          className="lg:col-span-5 relative h-[480px] sm:h-[560px] lg:h-[640px] hidden md:block"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {carouselReady ? (
            <CarouselStack
              stack={stack}
              current={front}
              total={images!.length}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-glow opacity-40" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CarouselStack({
  stack,
  current,
  total,
}: {
  stack: string[];
  current: number;
  total: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-glow" />

      <AnimatePresence mode="popLayout">
        {stack[2] && (
          <Card
            key={`back-${stack[2]}`}
            src={stack[2]}
            className="-rotate-[10deg] -translate-x-24 translate-y-4 z-0 opacity-70"
          />
        )}
        {stack[1] && (
          <Card
            key={`mid-${stack[1]}`}
            src={stack[1]}
            className="rotate-[8deg] translate-x-24 -translate-y-2 z-10 opacity-90"
          />
        )}
        {stack[0] && (
          <Card
            key={`front-${stack[0]}`}
            src={stack[0]}
            className="rotate-0 z-20"
            featured
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute top-4 right-2 glass rounded-xl px-3 py-2 z-30"
      >
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
            Slide {String(current + 1).padStart(2, "0")} / {String(Math.max(total, 1)).padStart(2, "0")}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2 flex items-center gap-2 z-30"
      >
        {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
          <span
            key={i}
            className={
              i === current
                ? "h-1.5 w-6 rounded-full bg-primary transition-all"
                : "h-1.5 w-1.5 rounded-full bg-muted-foreground/50 transition-all"
            }
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

function Card({
  src,
  className,
  featured,
}: {
  src: string;
  className: string;
  featured?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.6 } }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute ${className}`}
    >
      <div
        className={`animate-float w-[200px] sm:w-[230px] aspect-[9/16] rounded-3xl overflow-hidden border border-border bg-card shadow-elegant ${
          featured ? "glow-blue" : ""
        }`}
      >
        <img
          src={src}
          alt=""
          loading={featured ? "eager" : "lazy"}
          decoding={featured ? "sync" : "async"}
          className="block h-full w-full object-cover"
        />
      </div>
    </motion.div>
  );
}
