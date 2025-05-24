import { VM } from 'vm2';

export async function executeInSandbox(code: string): Promise<string> {
  try {
    const vm = new VM({
      timeout: 1000,
      sandbox: {},
    });

    const result = vm.run(code);
    return result?.toString?.() || '';
  } catch (err) {
    return `Error: ${(err as Error).message}`;
  }
}