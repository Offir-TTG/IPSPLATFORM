import { Font } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';

// Get absolute path to fonts directory
const fontsDir = path.join(process.cwd(), 'public', 'fonts');

// Font paths
const heeboRegularPath = path.join(fontsDir, 'Heebo-Regular.ttf');
const heeboBoldPath = path.join(fontsDir, 'Heebo-Bold.ttf');
const robotoRegularPath = path.join(fontsDir, 'Roboto-Regular.ttf');
const robotoBoldPath = path.join(fontsDir, 'Roboto-Bold.ttf');

// Convert font files to base64 data URLs
function fontToDataUrl(fontPath: string): string {
  try {
    const fontBuffer = fs.readFileSync(fontPath);
    const base64Font = fontBuffer.toString('base64');
    return `data:font/truetype;base64,${base64Font}`;
  } catch (error) {
    console.error(`Error loading font ${fontPath}:`, error);
    throw error;
  }
}

// Convert all fonts to data URLs
const heeboRegularData = fontToDataUrl(heeboRegularPath);
const heeboBoldData = fontToDataUrl(heeboBoldPath);
const robotoRegularData = fontToDataUrl(robotoRegularPath);
const robotoBoldData = fontToDataUrl(robotoBoldPath);

console.log('Fonts loaded and converted to data URLs');

// Register Hebrew font (Heebo)
Font.register({
  family: 'Heebo',
  fonts: [
    { src: heeboRegularData, fontWeight: 400 },
    { src: heeboBoldData, fontWeight: 700 },
  ],
  hyphenationCallback: (word) => [word],
});

// Register English font (Roboto)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: robotoRegularData, fontWeight: 400 },
    { src: robotoBoldData, fontWeight: 700 },
  ],
  hyphenationCallback: (word) => [word],
});

// Register Helvetica as fallback (using Roboto)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: robotoRegularData, fontWeight: 400 },
    { src: robotoBoldData, fontWeight: 700 },
  ],
  hyphenationCallback: (word) => [word],
});

console.log('Fonts registered successfully with data URLs');
