import type { Metadata } from "next";
import { SearchClient } from "./SearchClient";

export const metadata: Metadata = {
  title: "Search | Our Family History",
  description: "Search your family's stories, memories, people, and documents.",
};

export default function SearchPage() {
  return <SearchClient />;
}