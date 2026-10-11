import * as THREE from 'three';
// The projectile buffer holds every segment in flight: it is reallocated to
// the size a frame needs whenever that frame has more segments than it holds,
// so no shot is dropped past a fixed pool.
const projGeom = new THREE.BufferGeometry();
projGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
const projMat = new THREE.LineBasicMaterial({ color: 0xfff5d6, transparent: true, opacity: 0.85 });
export const projLines = new THREE.LineSegments(projGeom, projMat);
projLines.frustumCulled = false;
projGeom.setDrawRange(0, 0);
export function setProjectiles(segs) {
  const needed = segs.length * 6;
  if (projGeom.attributes.position.array.length < needed) {
    // Release the uploaded old attribute before replacing its owner.
    // Three registers the same geometry again on the next render.
    projGeom.dispose();
    projGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(needed), 3));
  }
  const pos = projGeom.attributes.position.array;
  const n = segs.length;
  for (let i = 0; i < n; i++) {
    const s = segs[i];
    pos[i * 6 + 0] = s[0]; pos[i * 6 + 1] = s[1]; pos[i * 6 + 2] = s[2];
    pos[i * 6 + 3] = s[3]; pos[i * 6 + 4] = s[4]; pos[i * 6 + 5] = s[5];
  }
  projGeom.attributes.position.needsUpdate = true;
  projGeom.setDrawRange(0, n * 2);
}
