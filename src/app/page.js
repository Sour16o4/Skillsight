import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import SiteGrid from "@/components/SiteGrid";
import Footer from "@/components/Footer";
import { ShelfFiltersProvider } from "@/components/ShelfFilters";
import { getPublicSites } from "@/lib/sites";
import { getSession } from "@/lib/require-admin";

export default async function Home() {
  const [sites, session] = await Promise.all([getPublicSites(), getSession()]);

  return (
    <ShelfFiltersProvider>
      <SiteHeader session={session} />
      <main className="flex-1">
        <Hero count={sites.length} />
        <SiteGrid sites={sites} />
      </main>
      <Footer />
    </ShelfFiltersProvider>
  );
}
