import logo from "@/assets/obsidian-logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border py-14">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Obsidian Creative" width={36} height={36} className="h-9 w-9 object-contain" />
          <div>
            <div className="font-display tracking-[0.25em] text-silver text-sm">OBSIDIAN</div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-primary">Creative</div>
          </div>
        </div>

        <nav className="flex gap-6 text-xs tracking-[0.2em] uppercase text-muted-foreground">
          <a href="https://instagram.com/obsidiancreative.ai" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Instagram</a>
          <a href="https://wa.me/918605847453" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">WhatsApp</a>
        </nav>

        <p className="text-xs text-muted-foreground tracking-wide">
          © {new Date().getFullYear()} Obsidian Creative. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
