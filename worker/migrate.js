const fs = require('fs');
const path = require('path');

const indexFile = path.join(__dirname, 'src', 'index.ts');
const content = fs.readFileSync(indexFile, 'utf8');

const lines = content.split('\n');

function extractLines(startMarker, endMarker) {
    let startIdx = lines.findIndex(l => l.includes(startMarker));
    let endIdx = endMarker ? lines.findIndex((l, i) => i > startIdx && l.includes(endMarker)) : lines.length;
    if (startIdx === -1) return '';
    return lines.slice(startIdx, endIdx).join('\n');
}

// Ensure dirs
['src/controllers', 'src/services'].forEach(d => {
    const dir = path.join(__dirname, d);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const defaultImports = `import { Env, UserData, NoteData, TransactionData, WalletData, NotificationData, PendingNotification, BudgetData } from '../types'\nimport { errorResponse, jsonResponse } from '../utils/response'\nimport { generateId, hashPassword } from '../utils/crypto'\nimport { createJWT } from '../utils/jwt'\nimport { getJSON, putJSON } from '../services/kv.service'\n\n`;

// 1. note.controller.ts
const noteCode = extractLines('// ====== Note Handlers ======', '// ====== Finance Handlers ======');
fs.writeFileSync(path.join(__dirname, 'src/controllers/note.controller.ts'), defaultImports + noteCode);

// 2. finance.controller.ts
const financeCode = extractLines('// ====== Finance Handlers ======', '// ====== Telegram Webhook (OpenClaw) ======');
fs.writeFileSync(path.join(__dirname, 'src/controllers/finance.controller.ts'), defaultImports + financeCode);

// 3. webhook.controller.ts
const webhookCode = extractLines('// ====== Telegram Webhook (OpenClaw) ======', '// ====== Notification Handlers ======');
fs.writeFileSync(path.join(__dirname, 'src/controllers/webhook.controller.ts'), defaultImports + webhookCode);

// 4. notification.controller.ts
const notiCode = extractLines('// ====== Notification Handlers ======', '// ====== PIN System ======');
fs.writeFileSync(path.join(__dirname, 'src/controllers/notification.controller.ts'), defaultImports + notiCode);

// 5. pin.controller.ts
const pinCode = extractLines('// ====== PIN System ======', '// ====== Live Debug / Logs ======');
fs.writeFileSync(path.join(__dirname, 'src/controllers/pin.controller.ts'), defaultImports + pinCode);

// 6. ai.controller.ts
const aiCode = extractLines('// ====== Cloudflare Workers AI ======', '// ====== Bug Report ======');
fs.writeFileSync(path.join(__dirname, 'src/controllers/ai.controller.ts'), defaultImports + aiCode);

// 7. push.controller.ts
const pushCode = extractLines('// ====== Push Notification Handlers ======', '// ====== Main Router ======');
fs.writeFileSync(path.join(__dirname, 'src/controllers/push.controller.ts'), defaultImports + pushCode);

// 8. debug.controller.ts and bug.controller.ts (Combine into misc)
const debugCode = extractLines('// ====== Live Debug / Logs ======', '// ====== Cloudflare Workers AI ======');
const bugCode = extractLines('// ====== Bug Report ======', '// ====== Push Notification Handlers ======');
fs.writeFileSync(path.join(__dirname, 'src/controllers/misc.controller.ts'), defaultImports + debugCode + '\n' + bugCode);

console.log('Successfully extracted controllers!');
