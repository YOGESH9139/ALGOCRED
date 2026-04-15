import { Compiler } from '@algorandfoundation/tealscript';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const contractPath = path.join(__dirname, '../contracts/AlgocredBountyManager.algo.ts');
  const outDir = path.join(__dirname, '../contracts/artifacts');

  console.log(`Compiling ${contractPath}...`);
  const content = fs.readFileSync(contractPath, 'utf8');

  // Create compiler instance
  const compiler = new Compiler({
    className: 'AlgocredBountyManager',
    src: content,
    filename: contractPath,
    disableWarnings: true
  });

  try {
    await compiler.compile();
    await compiler.generateAlgorithms();
    
    // Save ARC32
    const output = compiler.appSpec();
    
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outDir, 'AlgocredBountyManager.arc32.json'),
      JSON.stringify(output, null, 2)
    );
    
    console.log(`Success! Saved ARC32 to ${outDir}/AlgocredBountyManager.arc32.json`);
  } catch (e) {
    console.error("Compilation failed:", e);
    process.exit(1);
  }
}

main();
