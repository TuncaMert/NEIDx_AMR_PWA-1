// Generate an offline cache from the exact production files, including weights.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const build = path.join(__dirname, '..', 'build');
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const assets = walk(build).filter(file => {
  const relative = path.relative(build, file).split(path.sep).join('/');
  return relative === 'index.html' || relative === 'manifest.json' ||
    /^(static|images|model|yolov8_model)\//.test(relative) && /\.(js|css|json|bin|png|ico|woff2?|ttf|svg)$/.test(relative);
}).sort();
const hash = crypto.createHash('sha256');
for (const file of assets) hash.update(path.relative(build, file)).update(fs.readFileSync(file));
const template = fs.readFileSync(path.join(__dirname, 'service-worker.template.js'), 'utf8');
hash.update(template);
const version = hash.digest('hex').slice(0, 20);
const urls = assets.map(file => '/' + path.relative(build, file).split(path.sep).join('/'));
fs.writeFileSync(path.join(build, 'service-worker.js'), template
  .replace('__CACHE_NAME__', JSON.stringify('neidx-offline-' + version))
  .replace('__ASSET_URLS__', JSON.stringify(urls)));
console.log(`Offline worker generated: ${urls.length} resources, ${(assets.reduce((sum, file) => sum + fs.statSync(file).size, 0) / 1024 / 1024).toFixed(1)} MB.`);
