import { Queue } from "bullmq";
const url = process.env.REDIS_URL || "redis://localhost:6379";
(async () => {
  try {
    const q = new Queue("smoke", { connection: { url }});
    await q.add("hello", { t: Date.now() });
    const count = await q.count();
    console.log("redis_ok:true jobs:", count);
    await q.close();
  } catch (error) {
    console.error("redis_ok:false error:", error.message);
    process.exit(1);
  }
})();