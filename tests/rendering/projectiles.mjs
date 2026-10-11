import * as THREE from 'three';
import { projLines, setProjectiles } from '../../web/render/projectiles.js';

export async function qualify(fixture, canvas) {
  if (!fixture.revision || !fixture.sourceHashes) throw new Error('fixture revision and sourceHashes are required');
  const source = {};
  for (const path of ['../../web/render/projectiles.js', '../../web/render/viewport.js']) {
    const url = new URL(path, import.meta.url);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`read ${url}: HTTP ${response.status}`);
    const bytes = await response.arrayBuffer();
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)).toHex();
    if (digest !== fixture.sourceHashes[path]) throw new Error(`source digest differs for ${path}: ${digest}`);
    source[path] = digest;
  }
  if (!Number.isFinite(fixture.width) || !Number.isFinite(fixture.height) || !fixture.width || !fixture.height) {
    throw new Error('fixture width and height must declare the canvas dimensions');
  }
  if (!Array.isArray(fixture.frames) || !fixture.frames.length) throw new Error('fixture frames are required');
  const camera = new THREE.OrthographicCamera(...fixture.camera);
  camera.position.fromArray(fixture.cameraPosition);
  camera.lookAt(new THREE.Vector3(...fixture.cameraTarget));
  const scene = new THREE.Scene();
  scene.add(projLines);
  const renderer = new THREE.WebGLRenderer({ canvas, preserveDrawingBuffer: true });
  renderer.setSize(fixture.width, fixture.height, false);
  const gl = renderer.getContext();
  const bufferData = gl.bufferData;
  let uploaded;
  // Observe real driver allocations; every call still executes on the real context.
  gl.bufferData = function(target, data, ...rest) {
    const result = bufferData.call(this, target, data, ...rest);
    if (target === gl.ARRAY_BUFFER && data === projLines.geometry.attributes.position.array) {
      uploaded = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    }
    return result;
  };
  const frames = [];
  let measuredGrowth = false;
  let measuredShrink = false;
  let measuredEmpty = false;
  let previousSegments;
  try {
    for (const segments of fixture.frames) {
      if (!Array.isArray(segments)) throw new Error('every frame must contain segment tuples');
      if (!segments.length) measuredEmpty = true;
      if (previousSegments !== undefined && segments.length < previousSegments) measuredShrink = true;
      previousSegments = segments.length;
      for (const segment of segments) {
        const [x1, y1, z1, x2, y2, z2, ...extra] = segment;
        if (extra.length || ![x1, y1, z1, x2, y2, z2].every(Number.isFinite)) {
          throw new Error('a projectile must declare its two finite three-dimensional endpoints');
        }
      }
      const oldBuffer = uploaded;
      const previousCapacity = projLines.geometry.attributes.position.array.length;
      const coordinates = new Float32Array(segments.flat());
      setProjectiles(segments);
      const grew = coordinates.length > previousCapacity;
      if (grew && oldBuffer) {
        measuredGrowth = true;
        if (gl.isBuffer(oldBuffer)) throw new Error('growing projectile capacity retained the previous GPU buffer');
      }
      renderer.render(scene, camera);
      if (gl.getError() !== gl.NO_ERROR) throw new Error('the real WebGL driver refused projectile rendering');
      const attribute = projLines.geometry.attributes.position;
      if (projLines.geometry.drawRange.count !== coordinates.length / attribute.itemSize) {
        throw new Error('draw range omitted or added projectile vertices');
      }
      if (!coordinates.every((coordinate, index) => attribute.array[index] === coordinate)) {
        throw new Error('projectile vertex upload differs from the submitted endpoints');
      }
      if (coordinates.length && (!uploaded || !gl.isBuffer(uploaded))) throw new Error('projectile vertices have no live GPU buffer');
      frames.push({ segments: segments.length, vertices: projLines.geometry.drawRange.count,
        capacity: attribute.array.length, grew, image: canvas.toDataURL('image/png') });
    }
    if (!measuredGrowth) throw new Error('fixture must grow a previously rendered nonempty projectile frame');
    if (!measuredShrink || !measuredEmpty) throw new Error('fixture must shrink and then clear the projectile draw range');
    return { revision: fixture.revision, source, frames, renderer: gl.getParameter(gl.RENDERER) };
  } finally {
    gl.bufferData = bufferData;
    projLines.geometry.dispose();
    projLines.material.dispose();
    renderer.dispose();
  }
}
