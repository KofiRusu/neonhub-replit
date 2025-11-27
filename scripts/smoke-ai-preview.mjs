#!/usr/bin/env node

const params = new URLSearchParams({
  objective: "Announce NeonHub beta",
  channel: "blog",
  tone: "modern",
  audience: "founders",
}).toString();

const origin = process.env.API_ORIGIN || "http://localhost:3001";
const url = `${origin}/api/ai/preview?${params}`;

console.log("GET", url);

fetch(url)
  .then((res) => res.text().then((text) => ({ status: res.status, text })))
  .then((payload) => {
    console.log(payload.status);
    console.log(payload.text);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
