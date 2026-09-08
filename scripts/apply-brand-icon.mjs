/**
 * Process given brand icon: transparent outside shield, white inside, gold lines.
 * Writes web + Expo assets.
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const APP_IMG = path.join(ROOT, "../Stylist-verify-app/assets/images");
const BRAND_DIR = path.join(ROOT, "public/brand");
const PUBLIC = path.join(ROOT, "public");

const SOURCE =
  process.argv[2] ||
  "C:/Users/salon/.cursor/projects/f-Project/assets/c__Users_salon_AppData_Roaming_Cursor_User_workspaceStorage_5daf58fc2c86b332876289f8b56f75e6_images_Gemini_Generated_Image_ju56x3ju56x3ju56__1_-2926e432-a9d3-49b8-8f7b-a14705ecc2b1.png";

const TEAL = { r: 0x0f, g: 0x6b, b: 0x5f, alpha: 1 };

async function knockOutExterior(size) {
  const { data, info } = await sharp(SOURCE)
    .resize(size, size, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const buf = Buffer.from(data);

  const isNearWhite = (i, thr = 230) =>
    buf[i + 3] > 10 &&
    buf[i] > thr &&
    buf[i + 1] > thr &&
    buf[i + 2] > thr;

  // Gold / ink walls
  const wall = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) {
    if (!isNearWhite(p * 4, 220) && buf[p * 4 + 3] > 20) wall[p] = 1;
  }

  const dilate = Math.max(4, Math.round(size / 180));
  const wall2 = new Uint8Array(wall);
  for (let y = dilate; y < h - dilate; y++) {
    for (let x = dilate; x < w - dilate; x++) {
      if (!wall[y * w + x]) continue;
      for (let dy = -dilate; dy <= dilate; dy++) {
        for (let dx = -dilate; dx <= dilate; dx++) {
          wall2[(y + dy) * w + (x + dx)] = 1;
        }
      }
    }
  }

  const visited = new Uint8Array(w * h);
  const queue = [];
  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (visited[p] || wall2[p]) return;
    if (!isNearWhite(p * 4, 220)) return;
    visited[p] = 1;
    queue.push(p);
  };
  for (let x = 0; x < w; x++) {
    enqueue(x, 0);
    enqueue(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    enqueue(0, y);
    enqueue(w - 1, y);
  }
  while (queue.length) {
    const p = queue.pop();
    const x = p % w;
    const y = (p / w) | 0;
    buf[p * 4 + 3] = 0;
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  // Clear white halo trapped in dilation ring (outside real ink)
  for (let p = 0; p < w * h; p++) {
    if (wall2[p] && !wall[p] && isNearWhite(p * 4, 220)) buf[p * 4 + 3] = 0;
  }

  for (let pass = 0; pass < 3; pass++) {
    const clear = [];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x;
        const i = p * 4;
        if (buf[i + 3] < 10 || wall[p]) continue;
        const nearT =
          buf[((y - 1) * w + x) * 4 + 3] < 10 ||
          buf[((y + 1) * w + x) * 4 + 3] < 10 ||
          buf[(y * w + (x - 1)) * 4 + 3] < 10 ||
          buf[(y * w + (x + 1)) * 4 + 3] < 10;
        if (!nearT) continue;
        if (isNearWhite(i, 180)) clear.push(i);
      }
    }
    for (const i of clear) buf[i + 3] = 0;
  }

  // Pure white interior
  for (let i = 0; i < buf.length; i += 4) {
    if (buf[i + 3] < 10) continue;
    if (isNearWhite(i, 210)) {
      buf[i] = 255;
      buf[i + 1] = 255;
      buf[i + 2] = 255;
      buf[i + 3] = 255;
    }
  }

  // Tight crop
  let minX = w,
    minY = h,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (buf[(y * w + x) * 4 + 3] > 10) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  const pad = Math.round(size * 0.04);
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const right = Math.min(w - 1, maxX + pad);
  const bottom = Math.min(h - 1, maxY + pad);
  const cw = right - left + 1;
  const ch = bottom - top + 1;
  const cropped = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = ((top + y) * w + (left + x)) * 4;
      const di = (y * cw + x) * 4;
      cropped[di] = buf[si];
      cropped[di + 1] = buf[si + 1];
      cropped[di + 2] = buf[si + 2];
      cropped[di + 3] = buf[si + 3];
    }
  }
  const side = Math.max(cw, ch);
  const square = Buffer.alloc(side * side * 4);
  const ox = Math.floor((side - cw) / 2);
  const oy = Math.floor((side - ch) / 2);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = (y * cw + x) * 4;
      const di = ((y + oy) * side + (x + ox)) * 4;
      square[di] = cropped[si];
      square[di + 1] = cropped[si + 1];
      square[di + 2] = cropped[si + 2];
      square[di + 3] = cropped[si + 3];
    }
  }

  return { buf: square, w: side, h: side };
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error("Source missing:", SOURCE);
    process.exit(1);
  }
  fs.mkdirSync(BRAND_DIR, { recursive: true });
  fs.mkdirSync(APP_IMG, { recursive: true });
  fs.copyFileSync(SOURCE, path.join(BRAND_DIR, "stylist-verify-mark-source.png"));

  const { buf, w, h } = await knockOutExterior(1024);

  const toPng = (size) =>
    sharp(buf, { raw: { width: w, height: h, channels: 4 } })
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png();

  // Web: transparent around shield
  await toPng(512).toFile(path.join(BRAND_DIR, "stylist-verify-mark.png"));
  await toPng(256).toFile(path.join(PUBLIC, "icon.png"));
  await toPng(180).toFile(path.join(PUBLIC, "apple-icon.png"));
  await toPng(32).toFile(path.join(PUBLIC, "favicon.png"));

  // App: login + splash (transparent)
  await toPng(512).toFile(path.join(APP_IMG, "brand-mark.png"));
  await toPng(512).toFile(path.join(APP_IMG, "splash-icon.png"));
  await toPng(48).toFile(path.join(APP_IMG, "favicon.png"));

  // Android adaptive foreground (safe zone)
  const fg = await toPng(660).toBuffer();
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fg, gravity: "centre" }])
    .png()
    .toFile(path.join(APP_IMG, "android-icon-foreground.png"));

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 3,
      background: { r: 15, g: 107, b: 95 },
    },
  })
    .png()
    .toFile(path.join(APP_IMG, "android-icon-background.png"));

  // iOS / Expo icon needs opaque plate
  const iconLogo = await toPng(780).toBuffer();
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: TEAL },
  })
    .composite([{ input: iconLogo, gravity: "centre" }])
    .png()
    .toFile(path.join(APP_IMG, "icon.png"));

  // Monochrome
  const monoBuf = Buffer.from(buf);
  for (let i = 0; i < monoBuf.length; i += 4) {
    if (monoBuf[i + 3] < 10) continue;
    const a = monoBuf[i + 3];
    monoBuf[i] = 255;
    monoBuf[i + 1] = 255;
    monoBuf[i + 2] = 255;
    monoBuf[i + 3] = a;
  }
  const monoLogo = await sharp(monoBuf, {
    raw: { width: w, height: h, channels: 4 },
  })
    .resize(660, 660, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: monoLogo, gravity: "centre" }])
    .png()
    .toFile(path.join(APP_IMG, "android-icon-monochrome.png"));

  console.log("Brand icons written (transparent around shield)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
