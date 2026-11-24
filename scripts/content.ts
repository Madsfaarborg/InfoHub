import { pathToFileURL } from 'node:url';
import { dataDirectory, initialize, publishCatalog, publishNews, rollback, upgradeStarterGuidance, validateFile } from '../src/lib/publish';
import { syncArtificialAnalysis } from '../src/lib/aa-sync';

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const [command, ...args] = argv;
  const dir = dataDirectory();
  if (command === 'init' && args.length === 0) { const bundle = await initialize(dir); console.log(`Ready: ${bundle.revision} (${dir})`); return; }
  if (command === 'validate' && args.length === 1) { console.log(`Valid ${await validateFile(args[0])} file`); return; }
  if (command === 'sync-artificial-analysis' && (args.length === 0 || (args.length === 1 && args[0] === '--authorized'))) {
    if (args[0] !== '--authorized') throw new Error('Confirm that your Artificial Analysis plan or agreement permits this internal display, then pass --authorized.');
    const apiKey = process.env.ARTIFICIAL_ANALYSIS_API_KEY?.trim();
    if (!apiKey) throw new Error('Set ARTIFICIAL_ANALYSIS_API_KEY on the host running this command.');
    const snapshot = await syncArtificialAnalysis({ apiKey, directory: dir });
    console.log(`Artificial Analysis directory updated: ${snapshot.entries.length} model entries.`);
    return;
  }
  if (command === 'add-starter-guidance' && (args.length === 0 || (args.length === 1 && args[0] === '--reviewed'))) {
    const bundle = await upgradeStarterGuidance(args[0] === '--reviewed', dir);
    console.log(`Ready: ${bundle.revision}`);
    return;
  }
  if ((command === 'publish-news' || command === 'publish-catalog') && args.length >= 1 && args.length <= 2 && (args.length === 1 || args[1] === '--reviewed')) {
    const bundle = await (command === 'publish-news' ? publishNews : publishCatalog)(args[0], args[1] === '--reviewed', dir);
    console.log(`Published: ${bundle.revision}`); return;
  }
  if (command === 'rollback' && args.length === 1) { console.log(`Restored: ${(await rollback(args[0], dir)).revision}`); return; }
  throw new Error('Usage: npm run content -- init | validate FILE | add-starter-guidance --reviewed | publish-news FILE --reviewed | publish-catalog FILE --reviewed | sync-artificial-analysis --authorized | rollback REVISION');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
