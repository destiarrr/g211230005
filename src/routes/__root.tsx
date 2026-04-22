import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-gradient-gold">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          Halaman tidak ditemukan
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-gold transition-all hover:brightness-110"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ENGGAL GROUP — Web3 Franchise Platform Kuliner UMKM" },
      {
        name: "description",
        content:
          "Platform Web3 franchise UMKM kuliner berbasis blockchain. Kelola Cimol Stick, Sosis Crispy, Tahu Crispy & jajanan street food secara transparan dan otomatis.",
      },
      { name: "author", content: "ENGGAL GROUP" },
      { property: "og:title", content: "ENGGAL GROUP — Web3 Franchise Platform Kuliner UMKM" },
      {
        property: "og:description",
        content:
          "Sistem franchise UMKM kuliner berbasis blockchain dengan smart contract, royalty otomatis, dan loyalty token.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ENGGAL GROUP — Web3 Franchise Platform Kuliner UMKM" },
      { name: "description", content: "ENGGAL GROUP is a Web3 platform for managing culinary street food franchises transparently and efficiently." },
      { property: "og:description", content: "ENGGAL GROUP is a Web3 platform for managing culinary street food franchises transparently and efficiently." },
      { name: "twitter:description", content: "ENGGAL GROUP is a Web3 platform for managing culinary street food franchises transparently and efficiently." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/KGX4gvepOSh5JN4RZSVFEbFAG082/social-images/social-1776850361180-Screenshot.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/KGX4gvepOSh5JN4RZSVFEbFAG082/social-images/social-1776850361180-Screenshot.webp" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800;900&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
