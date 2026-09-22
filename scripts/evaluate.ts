import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';
import { generateKit } from '../apps/api/src/pipeline';
import { validateKit } from '@prep/kit-core';

type Case = { id: string; jd: string; company_url: string; days: number };
const args = process.argv.slice(2);
const inputFlagIndex = args.indexOf('--input');
const outputFlagIndex = args.indexOf('--output');
const inputPath = inputFlagIndex >= 0 ? args[inputFlagIndex + 1] : args[0];
const outputPath = outputFlagIndex >= 0 ? args[outputFlagIndex + 1] : args[1];
if (!inputPath || !outputPath) throw new Error('Usage: npm run evaluate -- --input <cases.json> --output <kits.json>');
async function main() {
  const cases = JSON.parse(await readFile(inputPath, 'utf8')) as Case[];
  if (!Array.isArray(cases)) throw new Error('Input must be an array of cases');
  const kits = [];
  for (const item of cases) {
    try {
      const kit = await generateKit({ jd: item.jd, company_url: item.company_url, days: item.days });
      const validation = validateKit(kit, item.days);
      if (!validation.success) throw new Error(validation.error.message);
      kits.push({ id: item.id, status: 'ok', kit, error: null });
    } catch (error) {
      kits.push({ id: item.id, status: 'failed', kit: null, error: { code: error instanceof Error ? error.message : 'GENERATION_FAILED', message: error instanceof Error ? error.message : 'Generation failed.' } });
    }
  }
  await writeFile(outputPath, JSON.stringify({ version: '1.0', generated_at: new Date().toISOString(), kits }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
