// Exercise the generated worker with real build files and an in-memory Cache API.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const build = path.join(__dirname, '..', 'build');
const origin = 'https://neidx.test';
function harness(missing = '') {
  const handlers = {};
  const stores = new Map([['unrelated-cache', new Map()], ['neidx-offline-old', new Map()]]);
  let online = true;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async put(key, response) { store.set(key, response.clone()); },
        async match(key) { return store.get(key)?.clone(); },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  const context = {
    self: { location: { origin }, clients: { claim: async () => {} },
      addEventListener: (type, handler) => { handlers[type] = handler; } },
    caches, URL, Set, Promise,
    Request: class extends Request { constructor(url, options) { super(new URL(url, origin), options); } },
    fetch: async request => {
      if (!online) throw new Error('Network disconnected');
      const url = new URL(request.url);
      if (url.pathname === missing) return new Response('<html>Fallback</html>', { headers: { 'content-type': 'text/html' } });
      return new Response(fs.readFileSync(path.join(build, url.pathname)), {
        headers: { 'content-type': url.pathname.endsWith('.html') ? 'text/html' : 'application/octet-stream' },
      });
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(build, 'service-worker.js'), 'utf8'), context);
  return {
    stores,
    offline() { online = false; },
    async dispatch(type, fields = {}) {
      let promise;
      handlers[type]({ ...fields, waitUntil(value) { promise = value; }, respondWith(value) { promise = value; } });
      return promise;
    },
  };
}
async function main() {
  const app = harness();
  await app.dispatch('install');
  assert(app.stores.has('neidx-offline-old'), 'Installing update must preserve active version');
  await app.dispatch('activate');
  assert(!app.stores.has('neidx-offline-old'));
  assert(app.stores.has('unrelated-cache'));
  app.offline();
  const page = await app.dispatch('fetch', { request: { method: 'GET', url: origin + '/?review=1', mode: 'navigate' } });
  assert((await page.text()).includes('<title>NEIDx</title>'));
  const manifest = JSON.parse(fs.readFileSync(path.join(build, 'asset-manifest.json')));
  const urls = [manifest.files['main.js'], manifest.files['main.css']];
  for (const folder of ['model', 'yolov8_model']) {
    const spec = JSON.parse(fs.readFileSync(path.join(build, folder, 'model.json')));
    urls.push(`/${folder}/model.json`);
    for (const group of spec.weightsManifest) for (const shard of group.paths) urls.push(`/${folder}/${shard}`);
  }
  for (const url of urls) {
    const response = await app.dispatch('fetch', { request: { method: 'GET', url: origin + url, mode: 'cors' } });
    assert(response && response.ok, url);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), fs.readFileSync(path.join(build, url)));
  }
  let ready;
  await app.dispatch('message', { data: { type: 'OFFLINE_STATUS' }, ports: [{ postMessage(value) { ready = value.ready; } }] });
  assert.equal(ready, true);
  console.log('PASS: offline navigation, JS/CSS, both models and all seven shards; ready confirmation and scoped cache cleanup');
  const failed = harness('/model/model.json');
  await assert.rejects(failed.dispatch('install'), /Offline download failed/);
  assert.deepEqual([...failed.stores.keys()], ['unrelated-cache', 'neidx-offline-old']);
  console.log('PASS: missing model/HTML fallback rejects installation, removes partial cache and retains previous release');
  const disconnected = harness();
  disconnected.offline();
  await assert.rejects(disconnected.dispatch('install'), /Network disconnected/);
  assert.deepEqual([...disconnected.stores.keys()], ['unrelated-cache', 'neidx-offline-old']);
  console.log('PASS: interrupted installation does not leave a partial offline release');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
