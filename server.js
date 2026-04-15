import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const distPath = path.resolve(__dirname, 'dist');

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Serve static files
app.use(express.static(distPath));

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error(`Error: index.html not found at ${indexPath}`);
    res.status(404).send('Application files not found. Please check the build process.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving files from ${distPath}`);
  if (fs.existsSync(distPath)) {
    console.log('Dist directory exists.');
    console.log('Contents:', fs.readdirSync(distPath));
  } else {
    console.error('Dist directory DOES NOT exist!');
  }
});
