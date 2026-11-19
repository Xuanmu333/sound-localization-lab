import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(import.meta.url);
async function fontCSS(packageName,file,family,weight){
  const packageRoot=path.dirname(require.resolve(`${packageName}/package.json`));
  const bytes=await readFile(path.join(packageRoot,'files',file));
  return `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${bytes.toString('base64')}) format('woff2');}`;
}
const fonts=await Promise.all([
  ...[400,600,700].map(w=>fontCSS('@fontsource/jetbrains-mono',`jetbrains-mono-latin-${w}-normal.woff2`,'JetBrains Mono',w)),
  fontCSS('@fontsource-variable/inter','inter-latin-wght-normal.woff2','Inter','100 900')
]);
const result=await build({entryPoints:[path.join(root,'src/main.js')],bundle:true,format:'esm',minify:true,write:false,target:'es2022',legalComments:'none'});
const script=result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const css=await readFile(path.join(root,'src/style.css'),'utf8');
const html=`<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="description" content="用四个麦克风的接收时间差定位声源，交互探索声音传播、距离差曲线与定位交点。"><title>听见位置 · 声源定位实验室</title><style>*{box-sizing:border-box}${fonts.join('\n')}\n${css}</style></head><body><div id="app"></div><script type="module">${script}</script></body></html>`;
await writeFile(path.join(root,'index.html'),html);
console.log(`Built index.html (${Math.round(Buffer.byteLength(html)/1024)} KB, fully offline).`);
