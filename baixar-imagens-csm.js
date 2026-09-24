const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const HTML = fs.readFileSync('produtos.html', 'utf8');
const DIR = 'imagens/csm';
const SERVER_IP = '177.136.241.37';

// Extrai todas as URLs únicas do wsite
const urls = [...new Set(
  [...HTML.matchAll(/https?:\/\/wsite\.csmdecor\.com\.br\/wsite\/(wp-content\/uploads\/[^\s"']+)/g)]
    .map(m => ({ full: m[0], path: m[1] }))
)];

// Fallback: URLs originais www ainda no HTML
const urlsWww = [...new Set(
  [...HTML.matchAll(/https?:\/\/www\.csmdecor\.com\.br\/wsite\/(wp-content\/uploads\/[^\s"']+)/g)]
    .map(m => ({ full: m[0], path: m[1] }))
)];

const allUrls = [...urls, ...urlsWww];
console.log(`${allUrls.length} imagens encontradas`);
fs.mkdirSync(DIR, { recursive: true });

function download(wpPath, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) { resolve('skip'); return; }
    const file = fs.createWriteStream(dest);
    const options = {
      hostname: SERVER_IP,
      port: 80,
      path: `/wsite/${wpPath}`,
      method: 'GET',
      headers: { 'Host': 'csmdecor.com.br' }
    };
    http.get(options, res => {
      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        reject(new Error(`${res.statusCode} /wsite/${wpPath}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      try { fs.unlinkSync(dest); } catch {}
      reject(err);
    });
  });
}

(async () => {
  let ok = 0, skip = 0, err = 0;
  const seen = new Set();
  for (const { path: wpPath } of allUrls) {
    const filename = path.basename(wpPath);
    if (seen.has(filename)) continue;
    seen.add(filename);
    const dest = path.join(DIR, filename);
    try {
      const r = await download(wpPath, dest);
      if (r === 'skip') { skip++; process.stdout.write('s'); }
      else { ok++; process.stdout.write('.'); }
    } catch (e) {
      err++;
      console.error(`\nERRO: ${e.message}`);
    }
  }
  console.log(`\n\nBaixadas: ${ok} | Já existiam: ${skip} | Erros: ${err}`);
})();
