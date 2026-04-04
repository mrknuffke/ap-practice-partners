import fs from 'fs';
import path from 'path';

const cedDir = path.resolve('src/constants/extracted-ceds');
const outFile = path.resolve('src/constants/unitCounts.json');

const unitCounts = {};

const files = fs.readdirSync(cedDir);

for (const file of files) {
  if (file.endsWith('.json')) {
    const stem = file.replace('.json', '');
    try {
      const data = JSON.parse(fs.readFileSync(path.join(cedDir, file), 'utf8'));
      unitCounts[stem] = data.units ? data.units.length : null;
    } catch (err) {
      console.error(`Failed to parse ${file}`, err);
    }
  }
}

fs.writeFileSync(outFile, JSON.stringify(unitCounts, null, 2));
console.log('✅ Generated unitCounts.json');
