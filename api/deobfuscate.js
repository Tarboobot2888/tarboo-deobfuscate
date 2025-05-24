import { deobfuscate as webDeob } from 'webcrack';
import { humanifyDecode, humanifyUnwrap } from 'humanify';
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
    return res.status(200).json({ ...cache.get(key), cached: true });
  }

  let webRes, humRes;
  try {
    webRes = await webDeob(base64Decoded, {
      transforms: [
        'string-array','array-rotator','decoder','inline-decoded-strings',
        'inline-decoder-wrappers','inline-object-props','merge-strings',
        'dead-code','control-flow-object','control-flow-switch','unminify'
      ]
    });
  } catch (e) {
    webRes = { code: base64Decoded, error: e.message };
  }

  try {
    humRes = humanifyUnwrap(await humanifyDecode(base64Decoded));
  } catch (e) {
    humRes = { code: webRes.code, error: e.message };
  }

  const deobfuscated = humRes.code || webRes.code;
  const unminified = deobfuscated;
  const smartAnalysis = { webcrack: webRes, humanify: humRes };

  const response = { base64Decoded, deobfuscated, unminified, smartAnalysis };
  cache.set(key, response);
  res.status(200).json(response);
}
