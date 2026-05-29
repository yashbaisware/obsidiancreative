import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Portfolio } from "@/components/Portfolio";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Obsidian Creative — Visuals That Build Brands" },
      {
        name: "description",
        content:
          "Obsidian Creative designs premium carousel ads and AI-powered visuals for modern brands and digital campaigns.",
      },
      { property: "og:title", content: "Obsidian Creative — Visuals That Build Brands" },
      {
        property: "og:description",
        content:
          "Premium carousel ads, AI creatives and high-end social media design for ambitious modern brands.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Portfolio />
      <About />
      <Contact />
      <Footer />
    </main>
  );
}
