"use client";
import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
};

export function ChatPreview() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div variants={cardVariants} initial="hidden" animate="show" transition={{ duration: 0.35 }} className="card-glass p-4 hover:shadow-glow transition-shadow">
          <div className="text-sm text-white/70">Total Revenue</div>
          <div className="mt-1 text-2xl font-semibold text-[#A3FF12]">$47,230</div>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="show" transition={{ duration: 0.35, delay: 0.05 }} className="card-glass p-4 hover:shadow-glow transition-shadow">
          <div className="text-sm text-white/70">Total Impressions</div>
          <div className="mt-1 text-2xl font-semibold text-[#3BE1FF]">2.4M</div>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="show" transition={{ duration: 0.35, delay: 0.1 }} className="card-glass p-4 hover:shadow-glow transition-shadow">
          <div className="text-sm text-white/70">Total Clicks</div>
          <div className="mt-1 text-2xl font-semibold text-[#B085FF]">156K</div>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="show" transition={{ duration: 0.35, delay: 0.15 }} className="card-glass p-4 hover:shadow-glow transition-shadow">
          <div className="text-sm text-white/70">Total Conversions</div>
          <div className="mt-1 text-2xl font-semibold text-[#FF3366]">4,320</div>
        </motion.div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={cardVariants} initial="hidden" animate="show" transition={{ duration: 0.4 }} className="card-glass p-6 min-h-[280px] lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Performance Trends</h3>
            <div className="text-sm text-white/60">Last 30 days</div>
          </div>
          <div className="mt-8 grid place-items-center text-center text-white/60">
            <div className="text-4xl">📈</div>
            <p className="mt-2">Interactive chart visualization</p>
            <p className="text-xs">Showing revenue trends over 30d</p>
          </div>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="show" transition={{ duration: 0.4, delay: 0.08 }} className="card-glass p-6 min-h-[280px]">
          <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
          <ul className="space-y-3">
            <li className="flex items-center justify-between"><span className="text-white/80">Highest CTR</span><span className="text-[#3BE1FF]">7.2%</span></li>
            <li className="flex items-center justify-between"><span className="text-white/80">Best ROI</span><span className="text-[#A3FF12]">340%</span></li>
            <li className="flex items-center justify-between"><span className="text-white/80">Most Conversions</span><span className="text-[#B085FF]">1,240</span></li>
            <li className="flex items-center justify-between"><span className="text-white/80">Lowest CPC</span><span className="text-[#FF3366]">$1.92</span></li>
          </ul>
        </motion.div>
      </section>
    </div>
  );
}


