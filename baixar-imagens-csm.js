const fs = require('fs');
const https = require('https');
const path = require('path');

const HTML = fs.readFileSync('produtos.html', 'utf8');
const DIR = 'imagens/csm';

const urls = [...new Set(
  [...HTML.matchAll(/https:\/\/wsite\.csmdecor\.com\.br\/wsite\/wp-content\/uploads\/[^\s"']+/g)]
    .map(m => m[0])
)];

console.log(`${urls.length} imagens encontradas`);
fs.mkdirSync(DIR, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) { resolve('skip'); return; }
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) { file.close(); fs.unlinkSync(dest); reject(new Error(`${res.statusCode} ${url}`)); return; }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => { fs.unlinkSync(dest); reject(err); });
  });
}

(async () => {
  let ok = 0, skip = 0, err = 0;
  for (const url of urls) {
    const filename = path.basename(url);
    const dest = path.join(DIR, filename);
    try {
      const r = await download(url, dest);
      if (r === 'skip') { skip++; process.stdout.write('s'); }
      else { ok++; process.stdout.write('.'); }
    } catch (e) {
      err++;
      console.error(`\nERRO: ${e.message}`);
    }
  }
  console.log(`\n\nBaixadas: ${ok} | Já existiam: ${skip} | Erros: ${err}`);
})();
