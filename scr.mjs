import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.goto("http://localhost:3000/test-404", { waitUntil: "networkidle", timeout: 15000 });
await p.screenshot({ path: "404-screenshot.png", fullPage: true });
await b.close();
console.log("OK");
