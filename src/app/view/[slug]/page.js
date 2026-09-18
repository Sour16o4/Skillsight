import { notFound } from "next/navigation";
import Viewer from "@/components/Viewer";
import { getSiteBySlug } from "@/lib/sites";

export default async function ViewPage({ params }) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);

  if (!site) {
    notFound();
  }

  return <Viewer key={site.slug} site={site} />;
}
