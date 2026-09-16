export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  links: {
    github?: string;
    docs?: string;
  };
}

export const siteConfig: SiteConfig = {
  name: "NEXORA",
  description: "AI-powered project intelligence and collaboration platform.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  links: {},
};
