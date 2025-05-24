// lib/webcrack.ts
import deobfuscate from "./webcrack"; // default export from index.ts

export async function deobfuscateLocal(code: string): Promise<string> {
  try {
    const result = await deobfuscate(code, {
      sandbox: undefined,
      mangleRegex: null,
      onProgress: () => {}
    });
    return result.code;
  } catch (error) {
    console.error("WebCrack Error:", error);
    return "حدث خطأ أثناء فك التشفير باستخدام WebCrack المحلي.";
  }
}
