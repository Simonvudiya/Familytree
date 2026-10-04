import type { Metadata } from "next";
import { MediaLibrary } from "@/components/media/MediaLibrary";

export const metadata: Metadata = {
  title: "Family Photos | Our Family History",
};

export default function PhotosPage() {
  return <MediaLibrary kind="image" />;
}