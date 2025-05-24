import { parse } from '@babel/parser';
import generate from '@babel/generator';
import type { TransformState } from './webcrack/types';
import deobfuscate from './webcrack';
import { createNodeSandbox } from './webcrack/deobfuscate/vm';

export async function deobfuscateLocal(code: string): Promise<string> {
  try {
    const ast = parse(code, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });

    const state: TransformState = { changes: 0 };
    const sandbox = createNodeSandbox();

    await deobfuscate.run(ast, state, sandbox);

    return generate(ast, { comments: false }).code;
  } catch (error) {
    console.error("WebCrack Error:", error);
    return "حدث خطأ أثناء فك التشفير باستخدام WebCrack المحلي.";
  }
}
