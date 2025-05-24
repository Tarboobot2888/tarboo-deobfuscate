import { deobfuscate as webDeob } from 'webcrack';
import { humanifyDecode, humanifyUnwrap } from 'humanify';
import ivm from 'isolated-vm';
import LRU from 'lru-cache';
import { Buffer } from 'buffer';
import crypto from 'crypto';

const cache = new LRU({ max: 300, ttl: 1000 * 60 * 15 });

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function decodeBase64(code) {
  try {
    return Buffer.from(code, 'base64').toString('utf-8');
  } catch {
    return code;
  }
}

async function runSandboxEval(code) {
  const isolate = new ivm.Isolate({ memoryLimit: 128 });
  const context = await isolate.createContext();
  const jail = context.global;
  await jail.set('global', jail.derefInto());
  const script = await isolate.compileScript(`
    let __result;
    try {
      __result = (function(){ return eval(\`\${code}\`); })();
    } catch(e) { __result = null; }
    __result;
  `);
  const result = await script.run(context, { timeout: 100, memoryLimit: 32 });
  return result ? result.toString() : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });
  if (code.length > 2000000)
    return res.status(413).json({ error: 'Code too large' });

  const base64Decoded = decodeBase64(code);
  const key = sha256(base64Decoded);
  if (cache.has(key)) {
    const val = cache.get(key);
    return res.status(200).json({ ...val, cached: true });
  }

  let webRes, humRes, sbRes;
  try {
    webRes = await webDeob(base64Decoded);
  } catch (e) {
    webRes = { code: base64Decoded, error: e.message };
  }

  try {
    humRes = humanifyUnwrap(await humanifyDecode(base64Decoded));
  } catch (e) {
    humRes = { code: webRes.code, error: e.message };
  }

  try {
    sbRes = await runSandboxEval(humRes.code);
  } catch (e) {
    sbRes = null;
  }

  const deobfuscated = humRes.code || webRes.code;
  const unminified = deobfuscated;
  const smartAnalysis = {
    webcrack: webRes,
    humanify: humRes,
    sandboxEval: sbRes,
  };

  const response = { base64Decoded, deobfuscated, unminified, smartAnalysis };
  cache.set(key, response);
  res.status(200).json(response);
}
