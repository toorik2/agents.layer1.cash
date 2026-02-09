import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, readdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3006;

const CONTENT_DIR = path.join(__dirname, 'content');
const SKILLS_DIR = path.join(__dirname, 'skills');

// --- AI Agent Endpoints (before static/SPA) ---

// llms.txt at root
app.get('/llms.txt', (req, res) => {
  const filePath = path.join(CONTENT_DIR, 'llms.txt');
  if (!existsSync(filePath)) return res.status(404).type('text/plain').send('Not found');
  res.type('text/plain; charset=utf-8');
  res.sendFile(filePath);
});

// Raw markdown context files
app.get('/context/:name.md', (req, res) => {
  const name = req.params.name;
  const guidePath = path.join(CONTENT_DIR, 'guides', `${name}.md`);
  const rootPath = path.join(CONTENT_DIR, `${name}.md`);

  if (existsSync(guidePath)) {
    res.type('text/markdown; charset=utf-8');
    return res.sendFile(guidePath);
  }
  if (existsSync(rootPath)) {
    res.type('text/markdown; charset=utf-8');
    return res.sendFile(rootPath);
  }
  res.status(404).type('text/plain').send('Context file not found');
});

// Skill SKILL.md files
app.get('/skills/:name/SKILL.md', (req, res) => {
  const skillPath = path.join(SKILLS_DIR, req.params.name, 'SKILL.md');
  if (!existsSync(skillPath)) return res.status(404).type('text/plain').send('Skill not found');
  res.type('text/markdown; charset=utf-8');
  res.sendFile(skillPath);
});

// Skill reference/script files
app.get('/skills/:name/references/:file', (req, res) => {
  const filePath = path.join(SKILLS_DIR, req.params.name, 'references', req.params.file);
  if (!existsSync(filePath)) return res.status(404).type('text/plain').send('File not found');
  res.type('text/plain; charset=utf-8');
  res.sendFile(filePath);
});

app.get('/skills/:name/scripts/:file', (req, res) => {
  const filePath = path.join(SKILLS_DIR, req.params.name, 'scripts', req.params.file);
  if (!existsSync(filePath)) return res.status(404).type('text/plain').send('File not found');
  res.type('text/plain; charset=utf-8');
  res.sendFile(filePath);
});

// Canonical ordering (matches llms.txt and SPA)
const GUIDE_ORDER = [
  'wallet-setup',
  'accept-payment',
  'make-payment',
  'verify-transaction',
  'request-vendor-accept',
  'agent-escrow',
  'onchain-receipts',
];

const SKILL_ORDER = [
  'bch-pay',
  'bch-receive',
  'bch-verify',
  'bch-escrow',
  'bch-request-acceptance',
];

// JSON API: list all context files
app.get('/api/context', (req, res) => {
  const files = [
    { name: 'why-bch', url: '/context/why-bch.md', type: 'overview' },
  ];

  for (const name of GUIDE_ORDER) {
    const filePath = path.join(CONTENT_DIR, 'guides', `${name}.md`);
    if (existsSync(filePath)) {
      files.push({ name, url: `/context/${name}.md`, type: 'guide' });
    }
  }

  res.json({
    site: 'agents.layer1.cash',
    description: 'BCH context files for AI agents',
    llms_txt: '/llms.txt',
    context_files: files
  });
});

// JSON API: list all skills
app.get('/api/skills', (req, res) => {
  const skills = [];

  for (const id of SKILL_ORDER) {
    const skillPath = path.join(SKILLS_DIR, id, 'SKILL.md');
    if (!existsSync(skillPath)) continue;

    const skillMd = readFileSync(skillPath, 'utf-8');
    const nameMatch = skillMd.match(/^name:\s*(.+)$/m);
    const descMatch = skillMd.match(/^description:\s*(.+)$/m);

    skills.push({
      id,
      name: nameMatch ? nameMatch[1].trim() : id,
      description: descMatch ? descMatch[1].trim() : '',
      skill_md: `/skills/${id}/SKILL.md`
    });
  }

  res.json({
    site: 'agents.layer1.cash',
    description: 'Downloadable BCH skills for AI agents (Agent Skills standard)',
    skills
  });
});

// --- Static files (Vite build output) ---
app.use(express.static(path.join(__dirname, 'dist')));

// --- SPA fallback ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Agents server running on http://localhost:${PORT}`);
});
