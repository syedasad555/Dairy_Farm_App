/**
 * Runs Firebase CLI with emulator binaries + temp files on D: project folder.
 * Fixes ENOSPC when C: drive is nearly full (Firestore JAR is 139MB).
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');

const root = path.join(__dirname, '..');
const cachePath = path.join(root, '.emulator-cache');
const tempPath = path.join(root, '.emulator-temp');

for (const dir of [cachePath, tempPath]) {
  fs.mkdirSync(dir, { recursive: true });
}

const env = {
  ...process.env,
  FIREBASE_EMULATORS_PATH: cachePath,
  TEMP: tempPath,
  TMP: tempPath,
  TMPDIR: tempPath,
};

const EMULATORS = [
  {
    name: 'cloud-firestore-emulator-v1.21.0.jar',
    url: 'https://storage.googleapis.com/firebase-preview-drop/emulator/cloud-firestore-emulator-v1.21.0.jar',
  },
  {
    name: 'cloud-storage-rules-runtime-v1.1.3.jar',
    url: 'https://storage.googleapis.com/firebase-preview-drop/emulator/cloud-storage-rules-runtime-v1.1.3.jar',
  },
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1_000_000) {
      console.log('Already cached:', path.basename(dest));
      resolve();
      return;
    }

    console.log('Downloading', path.basename(dest), '...');
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          file.close();
          fs.unlinkSync(dest);
          downloadFile(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('Saved:', dest);
          resolve();
        });
      })
      .on('error', reject);
  });
}

async function ensureEmulatorJars() {
  for (const emu of EMULATORS) {
    await downloadFile(emu.url, path.join(cachePath, emu.name));
  }
}

function runFirebase(command) {
  console.log('FIREBASE_EMULATORS_PATH =', cachePath);
  console.log('TEMP/TMP =', tempPath);
  execSync(`npx -y firebase-tools@latest ${command}`, {
    stdio: 'inherit',
    cwd: root,
    env,
  });
}

async function main() {
  const cmd = process.argv[2];
  try {
    await ensureEmulatorJars();
    switch (cmd) {
      case 'start':
        // Host binding is configured per-emulator in firebase.json (0.0.0.0 for LAN/phone access).
        runFirebase(
          'emulators:start --import=./emulator-data --export-on-exit=./emulator-data'
        );
        break;
      case 'seed':
        runFirebase(
          'emulators:exec --only auth,firestore,storage "node scripts/seedEmulator.js"'
        );
        break;
      default:
        console.error('Usage: node scripts/emulator-cli.js <start|seed>');
        process.exit(1);
    }
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

main();
