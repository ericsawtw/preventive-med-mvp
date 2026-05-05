import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const dataDir = process.env.DATA_DIR || path.join(root, 'data');
const membersFile = path.join(dataDir, 'members.json');
const kbFile = path.join(dataDir, 'knowledge.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(membersFile)) fs.writeFileSync(membersFile, '[]');
if (!fs.existsSync(kbFile)) {
  fs.writeFileSync(kbFile, JSON.stringify([
    { id: 1, title: '30天代營運方案', content: '每月12支短影音腳本、20篇貼文、1份諮詢話術包、1套SOP。' },
    { id: 2, title: '客戶成果指標', content: '諮詢到店率、初診成交率、回診率、單客終身價值。' },
    { id: 3, title: '建議售價', content: '入門 38000/月，標準 68000/月，進階 98000/月。' }
  ], null, 2));
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(root, 'public')));

const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJson = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.get('/api/members', (_, res) => res.json(readJson(membersFile)));

app.post('/api/members', (req, res) => {
  const members = readJson(membersFile);
  const item = {
    id: Date.now().toString(),
    name: req.body.name || '未命名',
    phone: req.body.phone || '',
    plan: req.body.plan || '入門',
    status: req.body.status || '潛在客戶',
    notes: req.body.notes || '',
    createdAt: new Date().toISOString()
  };
  members.unshift(item);
  writeJson(membersFile, members);
  res.json(item);
});

app.get('/api/knowledge', (_, res) => res.json(readJson(kbFile)));

function retrieve(query, docs) {
  const q = query.toLowerCase();
  return docs
    .map(d => ({ ...d, score: (d.title + d.content).toLowerCase().includes(q) ? 1 : 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

app.post('/api/ask', async (req, res) => {
  const question = req.body.question || '';
  const docs = readJson(kbFile);
  const ctx = retrieve(question, docs);

  if (!process.env.OPENAI_API_KEY) {
    return res.json({
      answer: `（Demo模式）\n你問：${question}\n\n建議回覆：\n${ctx.map(c => `- ${c.title}：${c.content}`).join('\n')}\n\n下一步：我可以把這段自動轉成客戶提案。`,
      citations: ctx
    });
  }

  try {
    const prompt = `你是預防醫學診所營運顧問。請用繁中、條列、可執行。\n\n知識庫：\n${ctx.map(c => `${c.title}: ${c.content}`).join('\n')}\n\n使用者問題：${question}`;
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        input: prompt
      })
    });
    const j = await r.json();
    const answer = j.output_text || '目前無法產生回覆';
    res.json({ answer, citations: ctx });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`MVP running on http://localhost:${port}`);
});
