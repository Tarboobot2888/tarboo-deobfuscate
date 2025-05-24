// lib/webcrack-wrapper.ts
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

import deobfuscate from "./webcrack/index"; // default import
import { createNodeSandbox } from './webcrack/deobfuscate/vm';

interface TransformState {
  changes: number;
}

export async function deobfuscateLocal(code: string): Promise<string> {
  try {
    const ast = parse(code, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript']
    });

    const state: TransformState = { changes: 0 };
    const sandbox = createNodeSandbox();

    await deobfuscate.run(ast, state, sandbox);

    const output = generate(ast, { comments: false }).code;
    return output;
  } catch (error) {
    console.error("WebCrack Error:", error);
    return "حدث خطأ أثناء فك التشفير باستخدام WebCrack المحلي.";
  }
}
