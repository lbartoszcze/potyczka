import * as THREE from 'three';

// Both stage layout and display scale can change without a page reload.
export function observeViewport(renderer, camera, sun, stage) {
  const buffer = new THREE.Vector2();
  let size;
  let scaleQuery;
  function resize() {
    if (!size?.width || !size.height) return;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(size.width, size.height, false);
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.getDrawingBufferSize(buffer);
    const texels = Math.min(Math.max(buffer.x, buffer.y), renderer.capabilities.maxTextureSize);
    if (sun.shadow.mapSize.x !== texels) {
      sun.shadow.mapSize.setScalar(texels);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    }
  }
  function displayChanged() {
    scaleQuery?.removeEventListener('change', displayChanged);
    resize();
    scaleQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    scaleQuery.addEventListener('change', displayChanged);
  }
  const observer = new ResizeObserver(([entry]) => {
    size = entry.contentRect;
    resize();
  });
  observer.observe(stage);
  displayChanged();
  return () => {
    observer.disconnect();
    scaleQuery.removeEventListener('change', displayChanged);
  };
}
