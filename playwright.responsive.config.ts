import { defineConfig } from "@playwright/test";

const chrome = { launchOptions: { executablePath: "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe" } };

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/responsive.spec.ts",
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    storageState: "playwright/.auth/user.json",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 }, ...chrome } },
    { name: "laptop", use: { viewport: { width: 1024, height: 768 }, ...chrome } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 }, ...chrome } },
    { name: "mobile", use: { viewport: { width: 320, height: 800 }, ...chrome } },
  ],
  webServer: { command: "npm run dev", url: "http://localhost:3000/login", reuseExistingServer: true, timeout: 120_000 },
});
