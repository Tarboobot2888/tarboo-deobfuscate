// lib/webcrack.ts
import { webcrack } from "webcrack";

export async function deobfuscateLocal(code: string): Promise<string> {
  try {
    const result = await webcrack(code, {
      mangleRegex: null,
      sandbox: undefined,
      onProgress: () => {}
    });
    return result.code;
  } catch (error) {
    throw new Error("Local deobfuscation failed: " + error);
  }
}
