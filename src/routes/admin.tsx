import { createFileRoute, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORIES, type Category, type Project } from "@/lib/projects";
import type { HeroImage } from "@/lib/hero";
import logo from "@/assets/obsidian-logo.png";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Obsidian Creative" }] }),
  component: AdminPage,
});

const IDLE_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

const baseSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(120),
  description: z.string().trim().max(600).default(""),
  category: z.enum(CATEGORIES),
  featured: z.boolean(),
});

const DRAFT_KEY = "obsidian.admin.draft.v2";

type DraftState = {
  title: string;
  description: string;
  category: Category;
  featured: boolean;
};

const uploadOne = async (file: File, prefix: string) => {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${prefix}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("project-images")
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("project-images").getPublicUrl(path).data.publicUrl;
};

function AdminPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const qc = useQueryClient();

  const performSignOut = async (silent = false) => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    // Hard purge any persisted Supabase auth tokens
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("sb-") && k.endsWith("-auth-token")) localStorage.removeItem(k);
      });
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith("sb-") && k.endsWith("-auth-token")) sessionStorage.removeItem(k);
      });
    } catch {
      /* ignore */
    }
    if (!silent) toast.success("Signed out");
  };

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) navigate({ to: "/login" });
  }, [user, isAdmin, loading, navigate]);

  // Auto sign-out: tab close / refresh / hard navigation away
  useEffect(() => {
    const onBeforeUnload = () => {
      try {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith("sb-") && k.endsWith("-auth-token")) localStorage.removeItem(k);
        });
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // Auto sign-out on inactivity (20 min)
  useEffect(() => {
    if (!user || !isAdmin) return;
    let timer: number | null = null;
    const reset = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        await performSignOut(true);
        toast.error("Session expired due to inactivity");
        navigate({ to: "/login" });
      }, IDLE_TIMEOUT_MS);
    };
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      if (timer) window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user, isAdmin, navigate]);

  // Sign out when navigating away from /admin (not to /login)
  useEffect(() => {
    return () => {
      const path = router.state.location.pathname;
      if (!path.startsWith("/admin") && path !== "/login") {
        void performSignOut(true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", "admin"],
    enabled: !loading && !!user && isAdmin,
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

  const refresh = () => qc.invalidateQueries({ queryKey: ["projects"] });

  const signOut = async () => {
    await performSignOut();
    navigate({ to: "/login" });
  };

  if (loading || !user || !isAdmin) {
    return (
      <main className="dark min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-muted-foreground text-sm tracking-widest">
          {loading ? "Loading…" : "Unauthorized — redirecting…"}
        </div>
      </main>
    );
  }

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <header className="border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="" width={36} height={36} className="h-9 w-9 object-contain" />
            <div>
              <div className="font-display tracking-[0.25em] text-silver text-sm">OBSIDIAN</div>
              <div className="text-[10px] tracking-[0.4em] text-primary">ADMIN</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground">
              View Site
            </Link>
            <button
              onClick={signOut}
              className="rounded-full border border-border bg-card/60 px-4 py-2 text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground hover:border-primary/40"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12 grid lg:grid-cols-12 gap-10">
        <section className="lg:col-span-5">
          <div className="text-[10px] tracking-[0.3em] uppercase text-primary mb-3">— New Project</div>
          <h2 className="text-2xl text-silver font-semibold mb-6">Add to portfolio</h2>
          <ProjectForm onSaved={refresh} />
        </section>

        <section className="lg:col-span-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-primary mb-3">— Projects</div>
              <h2 className="text-2xl text-silver font-semibold">{projects.length} total</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : projects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground text-sm">
              No projects yet. Add your first one on the left.
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <ProjectRow key={p.id} project={p} onChange={refresh} />
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-12 mt-6 pt-10 border-t border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-primary mb-3">— Hero Showcase</div>
              <h2 className="text-2xl text-silver font-semibold">Homepage hero images</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Position 1 = front · Position 2 = mid · Position 3+ = back. Auto-rotation runs every 5s.
              </p>
            </div>
          </div>
          <HeroShowcaseManager />
        </section>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: oklch(0.12 0.005 260 / 0.6);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0.7rem 0.9rem;
          font-size: 0.875rem;
          color: var(--foreground);
        }
        .input:focus { outline: none; border-color: oklch(0.7 0.18 245 / 0.6); box-shadow: 0 0 0 3px oklch(0.7 0.18 245 / 0.15); }
        .drop {
          border: 1.5px dashed oklch(0.4 0.02 260 / 0.6);
          border-radius: 16px;
          padding: 1.25rem;
          background: oklch(0.12 0.005 260 / 0.4);
          transition: all .2s;
          cursor: pointer;
        }
        .drop:hover, .drop.is-drag { border-color: oklch(0.7 0.18 245 / 0.7); background: oklch(0.7 0.18 245 / 0.05); }
      `}</style>
    </main>
  );
}

function loadDraft(): Partial<DraftState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as DraftState) : {};
  } catch {
    return {};
  }
}

function ProjectForm({ onSaved }: { onSaved: () => void }) {
  const draft = loadDraft();
  const [title, setTitle] = useState(draft.title ?? "");
  const [description, setDescription] = useState(draft.description ?? "");
  const [category, setCategory] = useState<Category>((draft.category as Category) ?? "Carousel");
  const [featured, setFeatured] = useState(draft.featured ?? false);

  // Per-category file state (not persisted — files can't be JSON-serialized safely)
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [savedHint, setSavedHint] = useState(false);
  const saveTimer = useRef<number | null>(null);

  // Auto-save text fields to localStorage with debounce
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ title, description, category, featured })
        );
        setSavedHint(true);
        window.setTimeout(() => setSavedHint(false), 1200);
      } catch {
        /* ignore quota */
      }
    }, 400);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [title, description, category, featured]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setFeatured(false);
    setCoverFile(null);
    setPdfFile(null);
    setVideoFile(null);
    localStorage.removeItem(DRAFT_KEY);
  };

  const submit = async () => {
    const parsed = baseSchema.safeParse({ title, description, category, featured });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    // Per-category requirements
    if (category === "Carousel" && (!coverFile || !pdfFile)) {
      toast.error("Upload both a cover image and a PDF");
      return;
    }
    if (category === "Product Image Ads" && !coverFile) {
      toast.error("Upload a cover image");
      return;
    }
    if (category === "Product Video Ads" && (!coverFile || !videoFile)) {
      toast.error("Upload both a cover image and a video");
      return;
    }

    setBusy(true);
    setProgress(5);
    try {
      let cover_url: string | null = null;
      let pdf_url: string | null = null;
      let video_url: string | null = null;
      let gallery_urls: string[] = [];
      let image_url = "";

      if (category === "Carousel") {
        cover_url = await uploadOne(coverFile!, "covers");
        setProgress(50);
        pdf_url = await uploadOne(pdfFile!, "pdfs");
        image_url = cover_url ?? "";
      } else if (category === "Product Image Ads") {
        cover_url = await uploadOne(coverFile!, "covers");
        image_url = cover_url ?? "";
      } else if (category === "Product Video Ads") {
        cover_url = await uploadOne(coverFile!, "covers");
        setProgress(40);
        video_url = await uploadOne(videoFile!, "videos");
        image_url = cover_url ?? "";
      }

      setProgress(95);
      const { error: insErr } = await supabase.from("projects").insert({
        ...parsed.data,
        image_url,
        cover_url,
        pdf_url,
        video_url,
        gallery_urls,
      });
      if (insErr) throw insErr;

      setProgress(100);
      toast.success("Project published");
      reset();
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
      window.setTimeout(() => setProgress(0), 600);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-border bg-card/60 p-6 space-y-5 relative"
    >
      <AnimatePresence>
        {savedHint && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute right-4 top-4 text-[10px] tracking-[0.25em] uppercase text-primary/80"
          >
            ● Draft saved
          </motion.div>
        )}
      </AnimatePresence>

      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="input" placeholder="Lumière Atelier" />
      </Field>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={600}
          rows={3}
          className="input resize-none"
          placeholder="Short cinematic description…"
        />
      </Field>

      <Field label="Category">
        <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="input">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      <AnimatePresence mode="wait">
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {category === "Carousel" && (
            <>
              <FileDrop label="Cover Image" accept="image/*" file={coverFile} onFile={setCoverFile} preview="image" />
              <FileDrop label="PDF File" accept="application/pdf" file={pdfFile} onFile={setPdfFile} preview="pdf" />
            </>
          )}

          {category === "Product Image Ads" && (
            <FileDrop label="Cover Image" accept="image/*" file={coverFile} onFile={setCoverFile} preview="image" />
          )}

          {category === "Product Video Ads" && (
            <>
              <FileDrop label="Cover Image" accept="image/*" file={coverFile} onFile={setCoverFile} preview="image" />
              <FileDrop label="Video File" accept="video/*" file={videoFile} onFile={setVideoFile} preview="video" />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          className="h-4 w-4 accent-[oklch(0.7_0.18_245)]"
        />
        Featured project
      </label>

      {progress > 0 && (
        <div className="h-1 w-full rounded-full bg-border overflow-hidden">
          <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={busy}
          className="flex-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm tracking-wide font-medium hover:glow-blue transition-all disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Add Project"}
        </button>
        <button
          onClick={reset}
          disabled={busy}
          className="rounded-full border border-border bg-card/60 px-4 py-3 text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function FileDrop({
  label,
  accept,
  file,
  onFile,
  preview,
  previewUrl,
}: {
  label: string;
  accept: string;
  file: File | null;
  onFile: (f: File | null) => void;
  preview: "image" | "pdf" | "video";
  previewUrl?: string | null;
}) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrl = file ? URL.createObjectURL(file) : null;
  const url = objectUrl || previewUrl || null;

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const handle = (f: File | null) => {
    if (!f) return;
    onFile(f);
  };

  return (
    <Field label={label}>
      <div
        className={`drop ${drag ? "is-drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0] ?? null)}
        />
        {!file ? (
          <div className="text-center text-xs text-muted-foreground py-3">
            <div className="text-silver mb-1">Drop file or click to upload</div>
            <div className="opacity-60">{accept.replace("/*", "")} files only</div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {preview === "image" && url && <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover border border-border" />}
            {preview === "pdf" && (
              <div className="h-16 w-16 rounded-lg border border-border bg-background/60 flex items-center justify-center text-primary text-[10px] tracking-[0.2em]">PDF</div>
            )}
            {preview === "video" && url && (
              <video src={url} className="h-16 w-24 rounded-lg object-cover border border-border" muted />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-silver truncate">{file.name}</div>
              <div className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFile(null); }}
              className="text-xs text-destructive hover:underline"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </Field>
  );
}

function GalleryDrop({ files, onFiles }: { files: File[]; onFiles: (f: File[]) => void }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (list: FileList | null) => {
    if (!list) return;
    onFiles([...files, ...Array.from(list)]);
  };

  return (
    <Field label={`Product Images (${files.length})`}>
      <div
        className={`drop ${drag ? "is-drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} />
        <div className="text-center text-xs text-muted-foreground py-2">
          <div className="text-silver mb-1">Drop images or click to upload</div>
          <div className="opacity-60">Add as many as you like</div>
        </div>
      </div>
      {files.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 snap-x">
          {files.map((f, i) => {
            const url = URL.createObjectURL(f);
            return (
              <div key={i} className="relative h-24 w-24 flex-shrink-0 snap-start rounded-lg overflow-hidden border border-border group">
                <img src={url} alt="" className="h-full w-full object-cover" onLoad={() => URL.revokeObjectURL(url)} />
                <button
                  type="button"
                  onClick={() => onFiles(files.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 text-destructive text-xs opacity-0 group-hover:opacity-100 transition"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Field>
  );
}

function ProjectRow({ project, onChange }: { project: Project; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [category, setCategory] = useState<Category>(
    (CATEGORIES as readonly string[]).includes(project.category) ? (project.category as Category) : "Carousel"
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(project.cover_url || project.image_url || project.gallery_urls?.[0] || null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(project.pdf_url ?? null);
  const [videoUrl, setVideoUrl] = useState<string | null>(project.video_url ?? null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const toggleFeatured = async () => {
    setBusy(true);
    const { error } = await supabase.from("projects").update({ featured: !project.featured }).eq("id", project.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success(project.featured ? "Removed from featured" : "Marked as featured");
    onChange();
  };

  const save = async () => {
    setBusy(true);

    try {
      const updates: Partial<Project> = { title, description, category };

      if (category === "Carousel") {
        if (!coverUrl && !coverFile) {
          toast.error("Upload a cover image");
          setBusy(false);
          return;
        }

        if (!pdfUrl && !pdfFile) {
          toast.error("Upload a PDF file");
          setBusy(false);
          return;
        }

        let updatedCoverUrl = coverUrl;
        if (coverFile) {
          updatedCoverUrl = await uploadOne(coverFile, "covers");
        }

        let updatedPdfUrl = pdfUrl;
        if (pdfFile) {
          updatedPdfUrl = await uploadOne(pdfFile, "pdfs");
        }

        updates.cover_url = updatedCoverUrl;
        updates.image_url = updatedCoverUrl || project.image_url || "";
        updates.pdf_url = updatedPdfUrl;
      }

      if (category === "Product Image Ads") {
        if (!coverUrl && !coverFile) {
          toast.error("Upload a cover image");
          setBusy(false);
          return;
        }

        let updatedCoverUrl = coverUrl;
        if (coverFile) {
          updatedCoverUrl = await uploadOne(coverFile, "covers");
        }

        updates.cover_url = updatedCoverUrl;
        updates.image_url = updatedCoverUrl || project.image_url || "";
      }

      if (category === "Product Video Ads") {
        if (!coverUrl && !coverFile) {
          toast.error("Upload a cover image");
          setBusy(false);
          return;
        }

        if (!videoUrl && !videoFile) {
          toast.error("Upload a video");
          setBusy(false);
          return;
        }

        let updatedCoverUrl = coverUrl;
        if (coverFile) {
          updatedCoverUrl = await uploadOne(coverFile, "covers");
        }

        let updatedVideoUrl = videoUrl;
        if (videoFile) {
          updatedVideoUrl = await uploadOne(videoFile, "videos");
        }

        updates.cover_url = updatedCoverUrl;
        updates.image_url = updatedCoverUrl || project.image_url || "";
        updates.video_url = updatedVideoUrl;
      }

      const { error } = await supabase.from("projects").update(updates).eq("id", project.id);
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Project updated");
      setEditing(false);
      onChange();
    } catch (err) {
      setBusy(false);
      toast.error(err instanceof Error ? err.message : "Failed to update project");
    }
  };

  const remove = async () => {
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    setBusy(true);
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Project deleted");
    onChange();
  };

  const thumb = project.cover_url || project.image_url || project.gallery_urls?.[0];

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 flex gap-4 items-start">
      {thumb ? (
        <img src={thumb} alt={project.title} className="h-24 w-20 rounded-lg object-cover border border-border flex-shrink-0" />
      ) : (
        <div className="h-24 w-20 rounded-lg border border-border flex-shrink-0 bg-background/50" />
      )}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input resize-none" />
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="input">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <FileDrop
              label="Cover Image"
              accept="image/*"
              file={coverFile}
              onFile={setCoverFile}
              preview="image"
              previewUrl={coverUrl ?? undefined}
            />
            {category === "Carousel" && (
              <FileDrop
                label="PDF File"
                accept="application/pdf"
                file={pdfFile}
                onFile={setPdfFile}
                preview="pdf"
                previewUrl={pdfUrl ?? undefined}
              />
            )}
            {category === "Product Video Ads" && (
              <FileDrop
                label="Video File"
                accept="video/*"
                file={videoFile}
                onFile={setVideoFile}
                preview="video"
                previewUrl={videoUrl ?? undefined}
              />
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-silver-bright font-display">{project.title}</h3>
              {project.featured && (
                <span className="text-[9px] tracking-[0.25em] uppercase text-primary border border-primary/40 rounded-full px-2 py-0.5">
                  Featured
                </span>
              )}
            </div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mt-1">{project.category}</div>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{project.description}</p>
          </>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {editing ? (
            <>
              <Btn onClick={save} disabled={busy}>Save</Btn>
              <Btn variant="ghost" onClick={() => setEditing(false)}>Cancel</Btn>
            </>
          ) : (
            <>
              <Btn variant="ghost" onClick={() => setEditing(true)} disabled={busy}>Edit</Btn>
              <Btn variant="ghost" onClick={toggleFeatured} disabled={busy}>
                {project.featured ? "Unfeature" : "Feature"}
              </Btn>
              <Btn variant="danger" onClick={remove} disabled={busy}>Delete</Btn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
}) {
  const base = "rounded-full px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors disabled:opacity-50";
  const styles = {
    primary: "bg-primary text-primary-foreground hover:glow-blue",
    ghost: "border border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/40",
    danger: "border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground",
  } as const;
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  );
}

// ───────────────────────── Hero Showcase Manager ─────────────────────────

function HeroShowcaseManager() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["hero_showcase", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_showcase" as never)
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as HeroImage[];
    },
  });

  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["hero_showcase"] });

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      let nextPos = items.length;
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `hero/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("project-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const url = supabase.storage.from("project-images").getPublicUrl(path).data.publicUrl;
        const { error: insErr } = await supabase
          .from("hero_showcase" as never)
          .insert({ image_url: url, position: nextPos++, is_visible: true } as never);
        if (insErr) throw insErr;
      }
      toast.success("Hero image(s) uploaded");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === id);
    const swap = items[idx + dir];
    if (!swap) return;
    const a = items[idx];
    setBusy(true);
    const { error: e1 } = await supabase
      .from("hero_showcase" as never)
      .update({ position: swap.position } as never)
      .eq("id", a.id);
    const { error: e2 } = await supabase
      .from("hero_showcase" as never)
      .update({ position: a.position } as never)
      .eq("id", swap.id);
    setBusy(false);
    if (e1 || e2) toast.error("Reorder failed");
    else refresh();
  };

  const toggleVisible = async (item: HeroImage) => {
    const { error } = await supabase
      .from("hero_showcase" as never)
      .update({ is_visible: !item.is_visible } as never)
      .eq("id", item.id);
    if (error) toast.error(error.message);
    else refresh();
  };

  const remove = async (item: HeroImage) => {
    if (!confirm("Remove this hero image?")) return;
    const { error } = await supabase.from("hero_showcase" as never).delete().eq("id", item.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Removed");
      refresh();
    }
  };

  return (
    <div className="space-y-5">
      <div
        className="drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void upload(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void upload(e.target.files)}
        />
        <div className="text-center text-xs text-muted-foreground py-2">
          <div className="text-silver mb-1">Drop hero images or click to upload</div>
          <div className="opacity-60">Multiple selection supported</div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-muted-foreground text-sm">
          No hero images yet. Upload to start customizing the homepage hero.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`rounded-2xl border bg-card/60 overflow-hidden ${
                item.is_visible ? "border-border" : "border-border/40 opacity-60"
              }`}
            >
              <div className="relative aspect-[9/12] bg-background/40">
                <img src={item.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute top-2 left-2 glass rounded-full px-2.5 py-0.5 text-[10px] tracking-[0.2em] uppercase text-primary">
                  #{i + 1}
                  {i === 0 && " · Front"}
                </div>
              </div>
              <div className="p-3 flex flex-wrap gap-1.5 justify-between items-center">
                <div className="flex gap-1">
                  <button
                    onClick={() => move(item.id, -1)}
                    disabled={busy || i === 0}
                    className="px-2 py-1 text-[10px] rounded-md border border-border hover:border-primary/40 disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(item.id, 1)}
                    disabled={busy || i === items.length - 1}
                    className="px-2 py-1 text-[10px] rounded-md border border-border hover:border-primary/40 disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleVisible(item)}
                    className="px-2 py-1 text-[10px] tracking-wider uppercase rounded-md border border-border hover:border-primary/40"
                  >
                    {item.is_visible ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => remove(item)}
                    className="px-2 py-1 text-[10px] tracking-wider uppercase rounded-md border border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
