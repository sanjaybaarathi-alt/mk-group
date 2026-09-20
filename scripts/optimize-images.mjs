import { readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceDirectory = path.resolve('assets/source-images');
const outputDirectory = path.resolve('public/images');
for (const name of (await readdir(sourceDirectory)).filter((file) => file.endsWith('.png'))) {
  const source = path.join(sourceDirectory, name);
  const output = path.join(outputDirectory, name.replace(/\.png$/, '.webp'));
  await sharp(source).webp({ quality: 88, effort: 6 }).toFile(output);
  console.log(`${name} -> ${path.basename(output)}`);
}
