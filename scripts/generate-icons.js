import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const createPNG = (size) => {
  const png = Buffer.alloc(8 + 25 + 12 + size * size * 4 + 12 + 16);
  let offset = 0;

  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  signature.copy(png, offset);
  offset += 8;

  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(size, 8);
  ihdr.writeUInt32BE(size, 12);
  ihdr.writeUInt8(8, 16);
  ihdr.writeUInt8(6, 17);
  ihdr.writeUInt8(0, 18);
  ihdr.writeUInt8(0, 19);
  ihdr.writeUInt8(0, 20);

  const ihdrData = ihdr.slice(4, 21);
  const ihdrCrc = crc32(ihdrData);
  ihdr.writeUInt32BE(ihdrCrc, 21);
  ihdr.copy(png, offset);
  offset += 25;

  const rawData = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    rawData[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const idx = y * (size * 4 + 1) + 1 + x * 4;
      const cx = size / 2, cy = size / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const maxDist = size / 2 - 2;
      if (dist <= maxDist) {
        rawData[idx] = 37;
        rawData[idx + 1] = 99;
        rawData[idx + 2] = 235;
        rawData[idx + 3] = 255;
      } else {
        rawData[idx] = 255;
        rawData[idx + 1] = 255;
        rawData[idx + 2] = 255;
        rawData[idx + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = Buffer.alloc(12 + compressed.length);
  idat.writeUInt32BE(compressed.length, 0);
  idat.write('IDAT', 4);
  compressed.copy(idat, 8);
  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), compressed]));
  idat.writeUInt32BE(idatCrc, 8 + compressed.length);
  idat.copy(png, offset);
  offset += 12 + compressed.length;

  const iend = Buffer.from([0, 0, 0, 0, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
  iend.copy(png, offset);

  return png.slice(0, offset + 12);
};

const crc32Table = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crc32Table[n] = c;
}

const crc32 = (buf) => {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crc32Table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

console.log('Generating PWA icons...');
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), createPNG(192));
console.log('Created: icon-192x192.png');
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), createPNG(512));
console.log('Created: icon-512x512.png');
console.log('Done!');