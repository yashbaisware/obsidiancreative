import { motion } from "framer-motion";

const channels = [
  { label: "Instagram", value: "@obsidiancreative.ai", href: "https://instagram.com/obsidiancreative.ai", icon: "instagram" },
  { label: "WhatsApp", value: "+91 8605847453", href: "https://wa.me/918605847453", icon: "whatsapp" },
] as const;

function Icon({ name }: { name: string }) {
  const common = { width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: 1.5 };
  if (name === "whatsapp")
    return <svg {...common} viewBox="0 0 24 24"><path d="M3 21l1.7-5A8 8 0 1 1 8 19.3L3 21z" strokeLinejoin="round" /><path d="M8.5 9.5c.5 2 2 3.5 4 4l1-1.2 2 .8c0 1.5-1.5 2-2.5 2-3 0-5.5-2.5-5.5-5.5 0-1 .5-2.5 2-2.5l.8 2-1 1z" /></svg>;
  return <svg {...common} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".5" fill="currentColor" /></svg>;
}

export function Contact() {
  return (
    <section id="contact" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-bg opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[900px] bg-glow opacity-60" />

      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="text-[10px] tracking-[0.3em] uppercase text-primary mb-4">— Contact</div>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl text-silver font-semibold leading-[1.05]">
            Let's create visuals
            <br />
            that make brands
            <span className="italic font-light text-primary"> stand out.</span>
          </h2>
          <p className="mt-8 text-muted-foreground max-w-xl mx-auto">
            Booking a limited number of brand collaborations this quarter. Reach
            out and let's design the campaign your audience won't forget.
          </p>
        </motion.div>

        <div className="mt-14 grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {channels.map((c, i) => (
            <motion.a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * i }}
              className="group rounded-2xl border border-border bg-card/60 backdrop-blur-lg p-8 text-left hover:border-primary/50 hover:bg-card/80 hover:shadow-[0_0_50px_-12px_rgba(var(--primary-rgb,200,170,110),0.12)] transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-full glass flex items-center justify-center text-primary">
                  <Icon name={c.icon} />
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary text-lg">→</span>
              </div>
              <div className="mt-6 text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{c.label}</div>
              <div className="mt-2 text-lg text-silver-bright font-medium">{c.value}</div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
