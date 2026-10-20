import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Panier Recettes",
    short_name: "Panier",
    description: "Recettes, garde-manger et prix d'épicerie au Québec",
    start_url: "/",
    display: "standalone",
    background_color: "#efe4d2",
    theme_color: "#1c4536",
    lang: "fr-CA",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
