import { Buffer } from 'buffer';
import * as acorn from 'acorn';
import { simple as walkSimple } from 'acorn-walk';
import * as escodegen from 'escodegen';

// محاولة فك Base64 مع ترميزات مختلفة وتنقية النص
function decodeBase64(code) {
  let decoded = code;
  try {
    // محاولة فك بـ UTF-8
    decoded = Buffer.from(code, 'base64').toString('utf-8');
    if (!isMostlyReadable(decoded)) {
      // لو النص غير مقروء بشكل كافي جرب UTF-16LE
      decoded = Buffer.from(code, 'base64').toString('utf16le');
    }
  } catch {
    // إذا فشل فك Base64 نرجع النص الأصلي
    decoded = code;
  }
  // تنظيف النص من الأحرف غير القابلة للطباعة
  return cleanNonPrintable(decoded);
}

// تحقق من نسبة الأحرف المقروءة (ASCII وطباعة)
function isMostlyReadable(text) {
  if (!text || text.length === 0) return false;
  const readableChars = text.match(/[\x20-\x7E]/g) || [];
  return (readableChars.length / text.length) > 0.7; // 70% مقروء
}

// إزالة أو استبدال الأحرف غير القابلة للطباعة في النص
function cleanNonPrintable(text) {
  return text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ''); // إزالة غير ASCII
}

// إزالة أسماء المتغيرات المشوشة مثل _0x1234...
function deobfuscateNames(code) {
  return code.replace(/_0x[a-f0-9]{4,}/g, (match, idx) => `var_${idx}`);
}

// استخدام AST لفك التمويه (مستوحى من jslinux-deobfuscated)
function simplifyAST(code) {
  let ast;
  try {
    ast = acorn.parse(code, { ecmaVersion: 'latest' });
  } catch {
    return code;
  }

  // مثال مبدئي: إزالة بعض التعبيرات، يمكن تطويرها لاحقًا
  walkSimple(ast, {
    Literal(node) {
      if (typeof node.value === 'string' && node.value.match(/^\\\\x[a-f0-9]{2}$/)) {
        // لا تعديل الآن لكن مجال للتطوير
      }
    }
  });

  return escodegen.generate(ast);
}

// تنسيق الكود ليكون مقروءاً
function unminify(code) {
  try {
    let ast = acorn.parse(code, { ecmaVersion: 'latest' });
    return escodegen.generate(ast, { format: { indent: { style: '  ' }, newline: '\\n' } });
  } catch {
    return code
      .replace(/;/g, ';\\n')
      .replace(/{/g, '{\\n')
      .replace(/}/g, '\\n}');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  let base64Decoded = decodeBase64(code);
  let deobfuscated = deobfuscateNames(base64Decoded);
  deobfuscated = simplifyAST(deobfuscated);
  let unminified = unminify(deobfuscated);

  return res.status(200).json({
    base64Decoded,
    deobfuscated,
    unminified
  });
}
