# 預防醫學營運系統 MVP

已完成可執行 MVP（手機優先）：
- 會員管理（新增/列表）
- AI 問答（接知識庫檢索）
- 可用 API（/api/members, /api/ask）

## 啟動
```bash
cd preventive-med-mvp
npm install
npm start
```

開啟：`http://localhost:8787`

## AI 模式
- 未設定 `OPENAI_API_KEY`：Demo 回答（仍會做知識庫檢索）
- 已設定 `OPENAI_API_KEY`：呼叫 OpenAI Responses API

可選環境變數：
- `OPENAI_API_KEY=...`
- `OPENAI_MODEL=gpt-4.1-mini`
- `PORT=8787`
- `DATA_DIR=...`（預設 `./data`；雲端建議掛載持久磁碟）

## 目錄
- `public/index.html` 手機版前端
- `server/index.js` API 與 AI 邏輯
- `data/members.json` 會員資料
- `data/knowledge.json` 知識庫

## 正式上雲（Render）
已提供 `render.yaml`，可直接 Blueprint 部署。

步驟：
1. 把此專案推到 GitHub（repo 內含 `preventive-med-mvp/` 目錄）
2. Render 後台 → New + → Blueprint
3. 選你的 GitHub repo，Render 會讀取 `render.yaml`
4. 首次部署後，於 Environment 補上 `OPENAI_API_KEY`（可選）

部署完成後會得到 `https://<your-app>.onrender.com`
