async function runQualification() {
  const fixturePath = new URL(location.href).searchParams.get('fixture');
  if (!fixturePath) throw new Error('fixture query parameter must name a declared qualification JSON file');
  const fixtureUrl = new URL(fixturePath, location.href);
  if (fixtureUrl.origin !== location.origin) throw new Error('qualification fixture must share the test origin');
  const fixtureResponse = await fetch(fixtureUrl, { cache: 'no-store', redirect: 'error' });
  if (!fixtureResponse.ok) throw new Error(`read fixture ${fixtureUrl}: HTTP ${fixtureResponse.status}`);
  const fixture = await fixtureResponse.json();
  const gameUrl = new URL('../../web/index.html', location.href);
  const gameResponse = await fetch(gameUrl, { cache: 'no-store', redirect: 'error' });
  if (!gameResponse.ok) throw new Error(`read game import map ${gameUrl}: HTTP ${gameResponse.status}`);
  const game = new DOMParser().parseFromString(await gameResponse.text(), 'text/html');
  const originalMap = game.querySelector('script[type="importmap"]');
  if (!originalMap) throw new Error(`game ${gameUrl} has no declared import map`);
  const declaration = JSON.parse(originalMap.textContent);
  for (const [name, address] of Object.entries(declaration.imports)) {
    declaration.imports[name] = new URL(address, gameUrl).href;
  }
  const importMap = document.createElement('script');
  importMap.type = 'importmap';
  importMap.textContent = JSON.stringify(declaration);
  document.head.append(importMap);
  const { qualify } = await import('./projectiles.mjs');
  return qualify(fixture, document.getElementById('render'));
}

runQualification().then(report => {
  window.qualification = { status: 'passed', ...report };
  document.getElementById('result').textContent = JSON.stringify(window.qualification, null, '\t');
}).catch(error => {
  window.qualification = { status: 'failed', cause: String(error), stack: error.stack };
  document.getElementById('result').textContent = JSON.stringify(window.qualification, null, '\t');
});
