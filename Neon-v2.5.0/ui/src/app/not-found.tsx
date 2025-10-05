import Link from "next/link";
import NeonCard from "@/components/neon-card";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <NeonCard className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-white/70">The page you’re looking for doesn’t exist.</p>
        <Link href="/dashboard" className="inline-flex items-center rounded-lg px-4 py-2 bg-white/10 hover:bg-white/20 transition">
          Back to Dashboard
        </Link>
      </NeonCard>
    </div>
  );
}


