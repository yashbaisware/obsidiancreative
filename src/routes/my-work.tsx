import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { MyWork } from "@/components/MyWork";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/my-work")({
  head: () => ({
    meta: [
      { title: "My Work — Obsidian Creative" },
      {
        name: "description",
        content:
          "The full archive of Obsidian Creative — carousel ads, product image ads and product video ads, organized by craft.",
      },
      { property: "og:title", content: "My Work — Obsidian Creative" },
      {
        property: "og:description",
        content:
          "Browse the complete Obsidian Creative archive by format — carousels, product image ads, and product video ads.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: MyWorkPage,
});

function MyWorkPage() {
  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-32">
        <MyWork />
      </div>
      <Footer />
    </main>
  );
}
