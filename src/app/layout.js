import { Figtree, Bricolage_Grotesque } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/Providers";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export const metadata = {
  title: "Skillsight — a curated shelf of websites",
  description:
    "Browse a curated shelf of websites, open them inside Skillsight, and get back to what you were doing.",
};

export const viewport = {
  themeColor: "#14152b",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${bricolage.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-text antialiased">
        {/* Runs before hydration so the page paints in the right mode from
            the first frame instead of flashing dark-then-light (or vice
            versa) while React boots up. next/script's beforeInteractive
            strategy is the App Router's supported way to inject this — a
            raw <script> tag rendered directly in the tree is a no-op on
            the client and Next.js warns loudly about it. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('skillsight-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
