// lib/webcrack.ts
import { transform } from "./webcrack/index"; // مسار النسخة المحلية

export async function deobfuscateLocal(code: string): Promise<string> {
  try {
    const result = await transform(code); // استخدم الدالة الرئيسية
    return result.code;
  } catch (error) {
    console.error("WebCrack Error:", error);
    return "فشل فك التشفير باستخدام WebCrack المحلي.";
  }
}
