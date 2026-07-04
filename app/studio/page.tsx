import { notFound } from "next/navigation";
import StudioLoader from "@/components/studio/StudioLoader";

// The studio is a local authoring tool. It is disabled on the deployed site so
// the public build stays a clean static blog.
export const dynamic = "force-static";

export const metadata = { title: "studio", robots: { index: false } };

export default function StudioPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <StudioLoader />;
}
