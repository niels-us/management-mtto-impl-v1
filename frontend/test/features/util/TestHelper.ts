import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function getMockData<T = any>(fromFileUrl: string, name: string): T {
  const stepsDir = path.dirname(fileURLToPath(fromFileUrl));
  const dir = path.join(stepsDir, '..', 'mockData');
  const file = path.join(dir, `${name}.json`);
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

export function getFeatureFile(fromFileUrl: string, name: string): string {
  return fileURLToPath(new URL(`../${name}.feature`, fromFileUrl));
}
