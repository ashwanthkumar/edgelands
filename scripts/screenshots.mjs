import { chromium } from '@playwright/test';
import { execSync, spawn } from 'child_process';

const PORT = 5199;
const URL = `http://localhost:${PORT}`;
const DIR = 'screenshots';

// Start dev server
const server = spawn('npx', ['vite', '--port', String(PORT)], {
  cwd: process.cwd(),
  stdio: 'pipe',
});

// Wait for server to be ready
await new Promise((resolve) => {
  server.stdout.on('data', (data) => {
    if (data.toString().includes('Local:')) resolve();
  });
});

// Use headed Chrome with GPU for WebGL rendering
const browser = await chromium.launch({
  headless: false,
  channel: 'chrome',
  args: ['--use-gl=angle', '--use-angle=metal'],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

// Clear any saved state so we get a fresh title screen
await page.goto(URL);
await page.evaluate(() => {
  localStorage.clear();
});

await page.goto(URL);
await page.waitForTimeout(1000);

// 1. Title screen
console.log('Capturing title screen...');
await page.screenshot({ path: `${DIR}/title-screen.png` });

// 2. Start game (Easy difficulty, press Enter)
await page.keyboard.press('e');
await page.waitForTimeout(200);
await page.keyboard.press('Enter');
await page.waitForTimeout(1500);

// 3. Gameplay — move around and fight
console.log('Capturing gameplay...');

// Move into enemy zone
await page.keyboard.down('d');
await page.keyboard.down('s');
await page.waitForTimeout(2000);
await page.keyboard.up('d');
await page.keyboard.up('s');
await page.waitForTimeout(500);

// Attack a few times for action shot
for (let i = 0; i < 3; i++) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
}
await page.waitForTimeout(300);
await page.screenshot({ path: `${DIR}/gameplay.png` });

// Move more to get a different angle with enemies
await page.keyboard.down('w');
await page.keyboard.down('d');
await page.waitForTimeout(1500);
await page.keyboard.up('w');
await page.keyboard.up('d');

// Attack for another action shot
for (let i = 0; i < 2; i++) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
}
await page.waitForTimeout(300);

console.log('Capturing combat...');
await page.screenshot({ path: `${DIR}/combat.png` });

// 4. Credits overlay
console.log('Capturing credits...');
await page.keyboard.press('c');
await page.waitForTimeout(500);
await page.screenshot({ path: `${DIR}/credits.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// 5. Help overlay
console.log('Capturing help...');
await page.keyboard.press('?');
await page.waitForTimeout(500);
await page.screenshot({ path: `${DIR}/help.png` });

console.log('Done! Screenshots saved to screenshots/');

await browser.close();
server.kill();
process.exit(0);
