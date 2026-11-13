import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const out=resolve('dist');
await rm(out,{recursive:true,force:true}); await mkdir(out,{recursive:true});
await cp('src',resolve(out,'src'),{recursive:true});
await cp('public',out,{recursive:true});
const html=await readFile('index.html','utf8');
await writeFile(resolve(out,'index.html'),html);
console.log('✓ Build terminado: dist/ (aplicación estática sin dependencias externas)');
