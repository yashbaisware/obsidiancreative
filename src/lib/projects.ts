export type Project = {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  cover_url: string | null;
  pdf_url: string | null;
  video_url: string | null;
  gallery_urls: string[];
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export const CATEGORIES = ["Carousel", "Product Image Ads", "Product Video Ads"] as const;
export type Category = (typeof CATEGORIES)[number];
