import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";
import TrackPage from "@/pages_routes/TrackPage";

export const metadata: Metadata = { title: "Track Order", robots: NO_INDEX };

export default function Track() {
  return <TrackPage />;
}
