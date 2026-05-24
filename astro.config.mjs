import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || "https://xuanart.com",
  base: process.env.PUBLIC_BASE_PATH || "/",
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith("/exhibition/"),
    }),
  ],
});
