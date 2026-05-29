import { motion } from "framer-motion";
import logo from "@/assets/obsidian-logo.png";

const stats = [
  { label: "YEARS CREATIVE EXPERIENCE", value: "2+", desc: "Building cinematic visuals and premium digital campaigns." },
  { label: "PREMIUM VISUAL PROJECTS", value: "50+", desc: "Luxury-focused carousel ads and AI-powered creative design." },
  { label: "AI CREATIVE WORKFLOW", value: "MODERN", desc: "Advanced AI-assisted visual systems for modern brands." },
];

export function About() {
  return (
    <section id="about" className="relative py-32 overflow-hidden">
      <div className="absolute -top-20 -right-20 h-[500px] w-[500px] bg-glow opacity-50" />
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="relative aspect-square max-w-md mx-auto">
            <div className="absolute inset-0 bg-glow animate-pulse-glow" />
            <img src={logo} alt="Obsidian Creative emblem" width={600} height={600} className="relative w-full h-full object-contain animate-float" />
          </div>
        </motion.div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="text-[10px] tracking-[0.3em] uppercase text-primary mb-4">— About</div>
            <h2 className="text-4xl sm:text-5xl text-silver font-semibold leading-[1.1]">
              A studio for visuals that <span className="italic font-light text-primary">move markets.</span>
            </h2>
            <p className="mt-8 text-muted-foreground leading-relaxed text-lg">
              Obsidian Creative focuses on high-end visual storytelling through
              modern carousel ads, AI-generated creatives, and premium social
              media design — built to make brands unmistakable.
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group aspect-square rounded-[24px] border border-white/10 bg-card/60 backdrop-blur-lg p-5 sm:p-6 flex flex-col items-center justify-center text-center gap-4 transition-all duration-300 hover:border-primary/40 hover:bg-white/[0.04] hover:shadow-[0_0_40px_-12px_rgba(var(--primary-rgb,200,170,110),0.15)]"
              >
                <div className="text-2xl sm:text-3xl font-display text-silver-bright leading-none tracking-tight">{s.value}</div>
                <div className="text-[8px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.28em] uppercase text-primary leading-normal px-1">{s.label}</div>
                <p className="text-[11px] sm:text-xs leading-relaxed text-muted-foreground px-1">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
