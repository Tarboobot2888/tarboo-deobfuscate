import { Buffer } from 'buffer';
import * as acorn from 'acorn';
import { simple as walkSimple } from 'acorn-walk';
import * as escodegen from 'escodegen';

// خوارزمية Base64 فك الترميز
function decodeBase64(code) {
  try {
    return Buffer.from(code, 'base64').toString('utf-8');
  } catch {
    return code;
  }
}

// خوارزمية إزالة أسماء المتغيرات المشوشة مثل _0x1234...
function deobfuscateNames(code) {
  // استبدال أسماء المتغيرات المشفرة بأسماء عامة
  return code.replace(/_0x[a-f0-9]{4,}/g, (match, idx) => `var_${idx}`);
}

// استخدام AST لفك التمويه (مستوحى من jslinux-deobfuscated)
function simplifyAST(code) {
  let ast;
  try {
    ast = acorn.parse(code, { ecmaVersion: 'latest' });
  } catch {
    return code; // إذا لم يمكن التحليل، نرجع الكود كما هو
  }

  // مثال: إزالة تعبيرات لا تؤثر على التنفيذ (dead code)
  // لنفترض أن remove dead code بسيط هنا
  // لكن بشكل متقدم يمكن إضافة المزيد
  // هذا مثال مبدئي فقط
  walkSimple(ast, {
    Literal(node) {
      if (typeof node.value === 'string' && node.value.match(/^\\x[a-f0-9]{2}$/)) {
        // لا نفعل شيء هنا لكن يمكن التوسع
      }
    }
  });

  // إعادة توليد الكود من AST بعد التعديلات
  return escodegen.generate(ast);
}

// تنسيق الكود (unminify) بإضافة فواصل الأسطر والمسافات
function unminify(code) {
  // بديل أفضل من التعويض النصي البسيط
  try {
    let ast = acorn.parse(code, { ecmaVersion: 'latest' });
    return escodegen.generate(ast, { format: { indent: { style: '  ' }, newline: '\n' } });
  } catch {
    // لو فشل التحليل، استخدم بديل بسيط
    return code
      .replace(/;/g, ';\n')
      .replace(/{/g, '{\n')
      .replace(/}/g, '\n}');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  // 1. فك ترميز Base64 إذا كان ممكناً
  let base64Decoded = decodeBase64(code);

  // 2. فك التمويه بإزالة أسماء المتغيرات المشوشة
  let deobfuscated = deobfuscateNames(base64Decoded);

  // 3. استخدام AST لتحسين الكود وإزالة التشويش
  deobfuscated = simplifyAST(deobfuscated);

  // 4. تنسيق الكود ليكون مقروءاً
  let unminified = unminify(deobfuscated);

  return res.status(200).json({
    base64Decoded,
    deobfuscated,
    unminified
  });
}
