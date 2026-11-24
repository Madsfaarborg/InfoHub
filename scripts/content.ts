import { pathToFileURL } from 'node:url';
import { dataDirectory, initialize, publishCatalog, publishNews, rollback, validateFile } from '../src/lib/publish';

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const [command, ...args] = argv;
  const dir = dataDirectory();
  if (command === 'init' && args.length === 0) { const bundle = await initialize(dir); console.log(`Ready: ${bundle.revision} (${dir})`); return; }
  if (command === 'validate' && args.length === 1) { console.log(`Valid ${await validateFile(args[0])} file`); return; }
  if ((command === 'publish-news' || command === 'publish-catalog') && args.length >= 1 && args.length <= 2 && (args.length === 1 || args[1] === '--reviewed')) {
    const bundle = await (command === 'publish-news' ? publishNews : publishCatalog)(args[0], args[1] === '--reviewed', dir);
    console.log(`Published: ${bundle.revision}`); return;
  }
  if (command === 'rollback' && args.length === 1) { console.log(`Restored: ${(await rollback(args[0], dir)).revision}`); return; }
  throw new Error('Usage: npm run content -- init | validate FILE | publish-news FILE --reviewed | publish-catalog FILE --reviewed | rollback REVISION');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
