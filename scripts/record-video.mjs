import { chromium, devices } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

// === Configuration via CLI args ===
const profile = process.argv[2] || 'desktop'; // 'desktop' or 'mobile'

const PROFILES = {
  desktop: {
    viewport: { width: 1280, height: 720 },
    videoSize: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
    outputName: 'edgelands-gameplay.mp4',
  },
  mobile: {
    // iPhone 16: 393x852 logical, 3x scale — use 394 (even) to avoid Playwright rounding
    viewport: { width: 394, height: 852 },
    videoSize: { width: 394, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    outputName: 'edgelands-gameplay-mobile.mp4',
  },
};

const cfg = PROFILES[profile];
if (!cfg) {
  console.error(`Unknown profile: ${profile}. Use 'desktop' or 'mobile'.`);
  process.exit(1);
}

console.log(`Recording ${profile} (${cfg.viewport.width}x${cfg.viewport.height})`);

const PORT = 5199;
const URL = `http://localhost:${PORT}`;
const VIDEO_DIR = 'videos';

if (!existsSync(VIDEO_DIR)) mkdirSync(VIDEO_DIR);

const server = spawn('npx', ['vite', '--port', String(PORT)], {
  cwd: process.cwd(),
  stdio: 'pipe',
});

await new Promise((resolve) => {
  server.stdout.on('data', (data) => {
    if (data.toString().includes('Local:')) resolve();
  });
});

console.log('Server ready');

const browser = await chromium.launch({
  headless: false,
  channel: 'chrome',
  args: [
    '--use-gl=angle',
    '--use-angle=metal',
    '--autoplay-policy=no-user-gesture-required',
  ],
});

const contextOpts = {
  viewport: cfg.viewport,
  deviceScaleFactor: cfg.deviceScaleFactor,
  isMobile: cfg.isMobile,
  hasTouch: cfg.hasTouch,
  recordVideo: { dir: VIDEO_DIR, size: cfg.videoSize },
};
if (cfg.userAgent) contextOpts.userAgent = cfg.userAgent;

const context = await browser.newContext(contextOpts);
const page = await context.newPage();

// === Helpers ===

async function holdKeys(keys, ms) {
  for (const k of keys) await page.keyboard.down(k);
  await page.waitForTimeout(ms);
  for (const k of keys) await page.keyboard.up(k);
}

async function attackN(n, gap = 520) {
  for (let i = 0; i < n; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(gap);
  }
}

async function getState() {
  return page.evaluate(() => {
    const g = window.__game;
    if (!g?.player) return null;
    const p = g.player;
    const px = p.mesh.position.x;
    const pz = p.mesh.position.z;
    const dist = Math.sqrt(px * px + pz * pz);

    let nearest = null;
    let nearestDist = Infinity;
    for (const e of g.enemyManager?.enemies || []) {
      if (!e.alive) continue;
      const dx = e.mesh.position.x - px;
      const dz = e.mesh.position.z - pz;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = { x: e.mesh.position.x, z: e.mesh.position.z, dist: d };
      }
    }

    return {
      px, pz, dist,
      hp: p.hp, maxHp: p.maxHp,
      defeated: g.enemyManager?.zoneKills?.[1] || 0,
      zoneTarget: 20,
      nearest,
      alive: p.hp > 0,
    };
  });
}

function keysToward(px, pz, tx, tz) {
  let wx = tx - px;
  let wz = tz - pz;
  const len = Math.sqrt(wx * wx + wz * wz);
  if (len < 0.01) return ['d'];
  wx /= len; wz /= len;

  const cos45 = Math.SQRT1_2;
  const inputX = wx * cos45 - wz * cos45;
  const inputZ = wx * cos45 + wz * cos45;

  const keys = [];
  if (inputX > 0.3) keys.push('d');
  if (inputX < -0.3) keys.push('a');
  if (inputZ > 0.3) keys.push('s');
  if (inputZ < -0.3) keys.push('w');
  return keys.length > 0 ? keys : ['d'];
}

function isDead() {
  return page.evaluate(() => {
    const ds = document.getElementById('death-screen');
    return ds && ds.classList.contains('active');
  });
}

// === Audio recording ===

async function startAudioRecording() {
  await page.evaluate(() => {
    const audioCtx = window.__game?.audioManager?.ctx;
    if (!audioCtx) { window.__audioRecordingDone = true; return; }

    const dest = audioCtx.createMediaStreamDestination();
    const origConnect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function(target, ...args) {
      const result = origConnect.call(this, target, ...args);
      if (target === audioCtx.destination) {
        try { origConnect.call(this, dest, ...args); } catch(e) {}
      }
      return result;
    };

    if (window.__game.audioManager._musicNodes?.masterGain) {
      try {
        origConnect.call(
          window.__game.audioManager._musicNodes.masterGain, dest
        );
      } catch(e) {}
    }

    const recorder = new MediaRecorder(dest.stream, {
      mimeType: 'audio/webm;codecs=opus',
    });
    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onload = () => {
        window.__audioBase64 = reader.result.split(',')[1];
        window.__audioRecordingDone = true;
      };
      reader.readAsDataURL(blob);
    };

    window.__audioRecorder = recorder;
    window.__audioRecordingDone = false;
    recorder.start(1000);
  });
}

async function stopAudioRecording() {
  await page.evaluate(() => {
    if (window.__audioRecorder?.state === 'recording') {
      window.__audioRecorder.stop();
    }
  });
  await page.waitForFunction(() => window.__audioRecordingDone === true, {
    timeout: 30000,
  });
}

async function saveAudioRecording(outputPath) {
  const base64 = await page.evaluate(() => window.__audioBase64);
  if (!base64) { console.log('No audio captured'); return false; }
  const buffer = Buffer.from(base64, 'base64');
  writeFileSync(outputPath, buffer);
  console.log(`Audio saved: ${outputPath} (${(buffer.length / 1024).toFixed(0)}KB)`);
  return true;
}

// === Recording ===

const videoStartTime = Date.now();

await page.goto(URL);
await page.evaluate(() => localStorage.clear());
await page.goto(URL);
await page.waitForTimeout(1500);

// Scene 1: Title screen
console.log('Scene 1: Title screen');
await page.waitForTimeout(3000);

// Scene 2: Start game
console.log('Scene 2: Start game');
if (cfg.isMobile) {
  // Tap "Easy" button then "Start Game" button
  await page.click('.difficulty-btn:first-child');
  await page.waitForTimeout(300);
  await page.click('.title-start-btn');
} else {
  await page.keyboard.press('e');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
}
await page.waitForTimeout(1500);

// Start audio recording
const audioStartTime = Date.now();
await startAudioRecording();
console.log('Audio recording started');
await page.waitForTimeout(2000);

// Scene 3: Brief sanctuary
console.log('Scene 3: Sanctuary');
await holdKeys(['d'], 500);
await holdKeys(['s'], 500);
await page.waitForTimeout(800);

// Scene 4: Combat AI
console.log('Scene 4: Combat');
const RETREAT_HP = 5;
const MAX_LOOPS = 400;
let retreating = false;
let prevDefeated = 0;

for (let i = 0; i < MAX_LOOPS; i++) {
  if (await isDead()) {
    console.log('  Player died! Restarting...');
    await page.waitForTimeout(2000);
    if (cfg.isMobile) {
      await page.click('.death-play-btn');
      await page.waitForTimeout(2000);
      await page.click('.difficulty-btn:first-child');
      await page.waitForTimeout(200);
      await page.click('.title-start-btn');
    } else {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      await page.keyboard.press('e');
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(2000);
    retreating = false;
    continue;
  }

  const s = await getState();
  if (!s || !s.alive) { await page.waitForTimeout(300); continue; }

  if (s.defeated >= s.zoneTarget) {
    console.log(`Zone cleared! ${s.defeated}/${s.zoneTarget}`);
    console.log('  Moving back to sanctuary...');
    for (let r = 0; r < 30; r++) {
      const rs = await getState();
      if (!rs || rs.dist < 10) break;
      await holdKeys(keysToward(rs.px, rs.pz, 0, 0), 300);
    }
    await page.waitForTimeout(2000);
    break;
  }

  if (s.defeated > prevDefeated) {
    prevDefeated = s.defeated;
    console.log(`  Kill ${prevDefeated}/${s.zoneTarget}  HP: ${s.hp}/${s.maxHp}`);
  }

  if (s.hp <= RETREAT_HP && !retreating) {
    console.log(`  HP low (${s.hp}), retreating`);
    retreating = true;
  }

  if (retreating) {
    if (s.dist < 10) {
      const missing = s.maxHp - s.hp;
      if (missing <= 1) {
        retreating = false;
        console.log(`  Healed to ${s.hp}/${s.maxHp}, heading out`);
      } else {
        await page.waitForTimeout(1200);
        continue;
      }
    } else {
      await holdKeys(keysToward(s.px, s.pz, 0, 0), 300);
      continue;
    }
  }

  if (s.nearest) {
    const keys = keysToward(s.px, s.pz, s.nearest.x, s.nearest.z);
    if (s.nearest.dist > 3.5) {
      await holdKeys(keys, 250);
    } else {
      await holdKeys(keys, 100);
      await attackN(3, 520);
    }
  } else {
    await holdKeys(['d', 's'], 400);
  }

  await page.waitForTimeout(30);
}

await page.waitForTimeout(2000);

// Scene 5: Credits
console.log('Scene 5: Credits');
await page.keyboard.press('c');
await page.waitForTimeout(3000);
await page.keyboard.press('Escape');
await page.waitForTimeout(1000);

// Stop audio and save
console.log('Stopping audio recording...');
await stopAudioRecording();
const audioPath = `${VIDEO_DIR}/audio-${profile}.webm`;
const hasAudio = await saveAudioRecording(audioPath);

const videoPath = await page.video().path();
await context.close();
await browser.close();

console.log(`Playwright video: ${videoPath}`);

const audioOffsetSec = ((audioStartTime - videoStartTime) / 1000).toFixed(3);
console.log(`Audio offset: ${audioOffsetSec}s`);

const outputPath = `${VIDEO_DIR}/${cfg.outputName}`;
console.log(`Merging to ${outputPath}...`);

if (hasAudio) {
  execSync(
    `ffmpeg -y -i "${videoPath}" -itsoffset ${audioOffsetSec} -i "${audioPath}" ` +
    `-c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p ` +
    `-c:a aac -b:a 128k ` +
    `-map 0:v:0 -map 1:a:0 -shortest ` +
    `-movflags +faststart "${outputPath}"`,
    { stdio: 'inherit' }
  );
} else {
  execSync(
    `ffmpeg -y -i "${videoPath}" ` +
    `-c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p ` +
    `-movflags +faststart "${outputPath}"`,
    { stdio: 'inherit' }
  );
}

console.log(`Done! ${outputPath}`);
server.kill();
process.exit(0);
