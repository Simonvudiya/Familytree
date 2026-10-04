import type { Metadata } from "next";
import { MediaLibrary } from "@/components/media/MediaLibrary";

export const metadata: Metadata = {
  title: "Family Documents | Our Family History",
};

export default function DocumentsPage() {
  return <MediaLibrary kind="document" />;
}