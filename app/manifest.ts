import type { MetadataRoute } from "next";
import { siteName } from "@/lib/seo/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: siteName,
    description:
      "Bulk SMS platform and SMS API for 190+ countries — campaigns, OTP, webhooks, and pay-as-you-go pricing.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#FF6A00",
    lang: "en",
    scope: "/",
    id: "/",
    categories: ["business", "productivity"],
    shortcuts: [
      {
        name: "Send SMS",
        short_name: "Send",
        url: "/dashboard/send",
        description: "Compose and send SMS",
      },
      {
        name: "Contacts",
        short_name: "Contacts",
        url: "/dashboard/contacts",
        description: "Manage contacts",
      },
    ],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
