import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import logo from "@/assets/obsidian-logo.png";

type NavLink =
  | { label: string; type: "section"; hash: string }
  | { label: string; type: "route"; to: string };

const links: NavLink[] = [
  { label: "Home", type: "section", hash: "" },
  { label: "Portfolio", type: "section", hash: "portfolio" },
  { label: "My Work", type: "route", to: "/my-work" },
  { label: "About", type: "section", hash: "about" },
  { label: "Contact", type: "section", hash: "contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goSection = (id: string) => {
    setOpen(false);
    const scroll = () => {
      if (!id) return window.scrollTo({ top: 0, behavior: "smooth" });
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    if (location.pathname !== "/") {
      void navigate({ to: "/" }).then(() => {
        // wait for homepage sections to mount
        setTimeout(scroll, 80);
      });
    } else {
      scroll();
    }
  };

  const goRoute = (to: string) => {
    setOpen(false);
    void navigate({ to });
  };

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "py-3" : "py-5"}`}
    >
      <div className="mx-auto max-w-7xl px-8">
        <nav
          className={`flex items-center justify-between rounded-2xl pl-3 pr-3 py-1.5 transition-all duration-500 ${
            scrolled ? "glass shadow-elegant" : "bg-transparent"
          }`}
        >
          <Link to="/" className="flex items-center gap-4 group pr-4">
            <img
              src={logo}
              alt="Obsidian Creative"
              width={95}
              height={95}
              className="h-20 w-20 object-contain transition-transform group-hover:scale-105"
            />
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-display text-2xl tracking-[0.28em] text-silver">OBSIDIAN</span>
              <span className="text-sm tracking-[0.45em] text-primary mt-1 uppercase">CREATIVE</span>
            </div>
          </Link>

          <ul className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <li key={l.label}>
                <button
                  onClick={() => (l.type === "route" ? goRoute(l.to) : goSection(l.hash))}
                  className="px-6 py-3 text-base tracking-wide text-muted-foreground hover:text-foreground transition-colors relative group"
                >
                  {l.label}
                  <span className="absolute inset-x-5 bottom-1 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={() => goSection("contact")}
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-7 py-3 text-sm tracking-[0.2em] uppercase text-primary hover:bg-primary hover:text-primary-foreground hover:glow-blue transition-all"
          >
            Get in Touch
          </button>

          <button
            aria-label="Menu"
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-foreground"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
        </nav>

        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-2 glass rounded-2xl p-4 flex flex-col gap-1"
          >
            {links.map((l) => (
              <li key={l.label}>
                <button
                  onClick={() => (l.type === "route" ? goRoute(l.to) : goSection(l.hash))}
                  className="w-full text-left px-6 py-3 text-base text-muted-foreground hover:text-foreground"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </div>
    </motion.header>
  );
}
