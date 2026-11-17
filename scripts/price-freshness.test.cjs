const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { priceFreshness } = require('../price-freshness');

test('old, missing and future update times cannot establish current prices', () => {
  const now = Date.parse('2026-10-19T01:00:00Z');
  assert.equal(priceFreshness({lastUpdatedAt:'2026-10-18T01:00:01Z'}, now).state, 'recent');
  assert.equal(priceFreshness({lastUpdatedAt:'2026-10-18T01:00:00Z'}, now).state, 'stale');
  for (const value of [undefined, 'invalid', '2026-10-20T01:00:00Z']) {
    assert.equal(priceFreshness({lastUpdatedAt:value, updatedLabel:'Updated today'}, now).state, 'unknown');
  }
});

test('real English/French pages disclose old or unknown prices without changing source data', async () => {
  const root = path.resolve(__dirname, '..');
  const tempRoot = path.resolve(os.tmpdir());
  const dataDir = await fs.mkdtemp(path.join(tempRoot, 'lnm-price-check-'));
  await fs.writeFile(path.join(dataDir, 'admin-users.json'), JSON.stringify([{ id:'disabled-fixture', username:'disabled-fixture', isActive:false, role:'viewer', passwordHash:'not-an-authentication-credential' }]));
  const source = { regular:'123.4', premium:'145.6', dyedDiesel:'111.1', diesel:'134.5', updatedLabel:'Updated today', lastUpdatedAt:'2026-10-06T01:30:00Z' };
  const priceFile = path.join(dataDir, 'gas-prices.json');
  const writePrices = async data => fs.writeFile(priceFile, JSON.stringify(data));
  await writePrices(source);
  const env = Object.fromEntries(['PATH','SystemRoot','WINDIR','TEMP','TMP'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
  Object.assign(env, { PORT:'0', HOST:'127.0.0.1', DATA_DIR:dataDir, COOKIE_SECRET:'synthetic-local-price-check', NODE_ENV:'test' });
  const child = spawn(process.execPath, ['server.js'], { cwd:root, windowsHide:true, env, stdio:['ignore','pipe','pipe'] });
  const exited = new Promise(resolve => child.once('exit', resolve));
  let output = '';
  child.stdout.on('data', bytes=>{ output = (output + bytes).slice(-20000); });
  child.stderr.on('data', bytes=>{ output = (output + bytes).slice(-20000); });
  try {
    const port = await new Promise((resolve,reject)=>{
      const timeout = setTimeout(()=>reject(new Error('Fixture server did not start: '+output)), 15000);
      const inspect = bytes=>{ const match=String(bytes).match(/listening on (\d+)/); if(match){clearTimeout(timeout);resolve(Number(match[1]));} };
      child.stdout.on('data', inspect);
      child.once('error', error=>{clearTimeout(timeout);reject(error);});
      child.once('exit', ()=>{clearTimeout(timeout);reject(new Error('Fixture server exited before readiness'));});
    });
    assert.ok(port > 0);
    const get = async route=>{
      const response=await fetch(`http://127.0.0.1:${port}${route}`,{signal:AbortSignal.timeout(15000)});
      assert.equal(response.status,200,route);
      return response.text();
    };
    for (const route of ['/', '/?lang=fr', '/gas-station-deseronto']) {
      const html=await get(route);
      assert.ok(html.includes(route==='/?lang=fr' ? 'au moins 24 heures' : 'at least 24 hours ago'),route);
      assert.ok(html.includes('tel:+16133962224'));
      assert.doesNotMatch(html, /Today(?:'|&#39;|&#x27;)s Gas Prices|Prix de l'essence aujourd'hui|Updated today/);
      assert.ok(html.includes('123.4'), 'posted value remains visible');
    }
    assert.deepEqual(JSON.parse(await fs.readFile(priceFile,'utf8')),source,'public reads preserve the recorded prices and timestamp');
    const unknown = {...source,lastUpdatedAt:null};
    await writePrices(unknown);
    const unknownHtml=await get('/');
    assert.ok(unknownHtml.includes('Update time unconfirmed') && unknownHtml.includes('Call for current prices'));
    assert.ok(!unknownHtml.includes('Updated today'));
    await writePrices({...source,lastUpdatedAt:new Date(Date.now()+86400000).toISOString()});
    assert.ok((await get('/?lang=fr')).includes('Date de mise à jour non confirmée'));
    await writePrices({...source,lastUpdatedAt:new Date().toISOString()});
    const recent=await get('/');
    const blogHtml=await get('/blog/cheapest-gas-prices-deseronto-tyendinaga-near-401');
    assert.ok(blogHtml.includes('Check Posted Fuel Prices'));
    assert.ok(blogHtml.includes('Cheapest Gas Prices in Deseronto &amp; Tyendinaga (Hwy 401)'));
    assert.ok(recent.includes('Prices can change') && !recent.includes('at least 24 hours ago'));

    const decode = s =>
      s
        .replaceAll('&amp;', '&')
        .replaceAll('&#39;', "'")
        .replaceAll('&quot;', '"')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>');
    const extractMeta = html => {
      const title = decode((html.match(/<title>([^<]+)<\/title>/) || [])[1] || '');
      const desc = decode((html.match(/<meta name="description" content="([^"]+)"/) || [])[1] || '');
      const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      const jsonLd = ldMatch ? JSON.parse(ldMatch[1]) : null;
      return { title, desc, jsonLd };
    };

    const homeEn = extractMeta(recent);
    assert.ok(homeEn.title.length >= 50 && homeEn.title.length <= 60, `home title length: ${homeEn.title.length}`);
    assert.ok(homeEn.title.includes('Tyendinaga & Deseronto Gas Prices'));
    assert.ok(homeEn.desc.length <= 156, `home desc length: ${homeEn.desc.length}`);
    assert.ok(homeEn.desc.toLowerCase().includes('view posted gas and diesel prices and their update date'));

    const stationEn = extractMeta(await get('/gas-station-deseronto'));
    assert.ok(stationEn.title.length >= 45 && stationEn.title.length <= 60, `station title length: ${stationEn.title.length}`);
    assert.ok(stationEn.title.startsWith('Deseronto & Tyendinaga Gas Prices'));
    assert.ok(!stationEn.title.startsWith('Tyendinaga & Deseronto Gas Prices'));
    assert.ok(stationEn.desc.length <= 156, `station desc length: ${stationEn.desc.length}`);
    assert.ok(stationEn.desc.includes('39–43 Dundas St') && stationEn.desc.includes('6am–10pm'));

    const cheapGasMeta = extractMeta(blogHtml);
    assert.ok(cheapGasMeta.title.length <= 60, `cheap-gas blog title length: ${cheapGasMeta.title.length}`);
    assert.ok(cheapGasMeta.desc.length <= 156, `cheap-gas blog desc length: ${cheapGasMeta.desc.length}`);
    assert.ok(Array.isArray(cheapGasMeta.jsonLd), 'blog post jsonLd should be an array');
    const cheapGasFaqLd = cheapGasMeta.jsonLd.find(entry => entry && entry['@type'] === 'FAQPage');
    assert.ok(cheapGasFaqLd && Array.isArray(cheapGasFaqLd.mainEntity) && cheapGasFaqLd.mainEntity.length >= 3);
    for (const q of cheapGasFaqLd.mainEntity) {
      assert.ok(decode(blogHtml).includes(q.name), `visible FAQ missing question: ${q.name}`);
    }

    const sitemapXml = await get('/sitemap.xml');
    const sitemapPaths = [...sitemapXml.matchAll(/<loc>https:\/\/www\.lnmenterprises\.ca([^<]*)<\/loc>/g)].map(m => m[1] || '/');
    assert.ok(sitemapPaths.length >= 19, `expected >= 19 sitemap URLs, got ${sitemapPaths.length}`);
    for (const route of sitemapPaths) {
      const html = await get(route);
      const meta = extractMeta(html);
      assert.ok(meta.title.length > 0 && meta.title.length <= 60, `${route} title length ${meta.title.length}: ${meta.title}`);
      assert.ok(meta.desc.length > 0 && meta.desc.length <= 156, `${route} desc length ${meta.desc.length}: ${meta.desc}`);
      assert.ok(meta.jsonLd, `${route} missing JSON-LD`);
      if (route.startsWith('/blog/')) {
        const ldList = Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd];
        const faqNode = ldList.find(entry => entry && entry['@type'] === 'FAQPage');
        assert.ok(faqNode && faqNode.mainEntity.length >= 3, `${route} missing FAQPage JSON-LD`);
      }
    }

    const llmsTxt = await get('/llms.txt');
    assert.ok(llmsTxt.includes('/gas-station-deseronto'));
    assert.ok(llmsTxt.includes('/blog/cheapest-gas-prices-deseronto-tyendinaga-near-401'));

    const homeFr = extractMeta(await get('/?lang=fr'));
    assert.ok(homeFr.title.length <= 60, `home FR title length: ${homeFr.title.length}`);
    assert.ok(homeFr.desc.length <= 156, `home FR desc length: ${homeFr.desc.length}`);

    const stationFr = extractMeta(await get('/gas-station-deseronto?lang=fr'));
    assert.ok(stationFr.title.length <= 60, `station FR title length: ${stationFr.title.length}`);
    assert.ok(stationFr.desc.length <= 156, `station FR desc length: ${stationFr.desc.length}`);

    const blogFr = extractMeta(await get('/blog/cheapest-gas-prices-deseronto-tyendinaga-near-401?lang=fr'));
    assert.ok(blogFr.title.length <= 60, `blog FR title length: ${blogFr.title.length}`);
    assert.ok(blogFr.desc.length <= 156, `blog FR desc length: ${blogFr.desc.length}`);
  } finally {
    child.kill();
    await exited;
    const relative = path.relative(tempRoot,path.resolve(dataDir));
    if (relative.startsWith('..') || path.isAbsolute(relative) || !relative.startsWith('lnm-price-check-')) throw new Error('Refusing unexpected cleanup path');
    await fs.rm(dataDir,{recursive:true,force:true});
  }
});
