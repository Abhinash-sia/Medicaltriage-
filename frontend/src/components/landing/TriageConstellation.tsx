'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function TriageConstellation() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let isVisible = true;
    const observerIntersection = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? false;
      },
      { threshold: 0.05 }
    );
    observerIntersection.observe(container);

    // Dimensions
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.z = 75;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false, // Turn off heavy antialias on low-power devices
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1); // Lock to 1x to avoid 4K GPU fill-rate throttling
    container.appendChild(renderer.domElement);

    // Ultra-optimized particle count
    const particleCount = 30;
    const positions = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];
    const colors = new Float32Array(particleCount * 3);

    const updateColorsForTheme = (isDark: boolean) => {
      const color1 = isDark ? new THREE.Color(0xc9b27c) : new THREE.Color(0x1b2e5e);
      const color2 = isDark ? new THREE.Color(0x2f4b8f) : new THREE.Color(0x8f7a45);
      const color3 = isDark ? new THREE.Color(0xedeff5) : new THREE.Color(0x5e667a);
      const color4 = isDark ? new THREE.Color(0xe8a33a) : new THREE.Color(0xd97706);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const rand = Math.random();
        const chosen = rand < 0.55 ? color1 : rand < 0.85 ? color2 : rand < 0.95 ? color3 : color4;
        colors[i3] = chosen.r;
        colors[i3 + 1] = chosen.g;
        colors[i3 + 2] = chosen.b;
      }
    };

    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    updateColorsForTheme(isCurrentlyDark);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 95;
      positions[i3 + 1] = (Math.random() - 0.5) * 60;
      positions[i3 + 2] = (Math.random() - 0.5) * 35;

      velocities.push({
        x: (Math.random() - 0.5) * 0.025,
        y: (Math.random() - 0.5) * 0.025,
        z: (Math.random() - 0.5) * 0.015,
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Simple particle sprite
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.4, 'rgba(56, 217, 200, 0.8)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const pointsMaterial = new THREE.PointsMaterial({
      size: 3.5,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: isCurrentlyDark ? 0.8 : 0.6,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, pointsMaterial);
    scene.add(points);

    // Connections (Lines)
    const maxLineConnections = 80;
    const linePositions = new Float32Array(maxLineConnections * 6);
    const lineColors = new Float32Array(maxLineConnections * 6);
    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    linesGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: isCurrentlyDark ? 0.3 : 0.2,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(linesGeometry, lineMat);
    scene.add(lines);

    // Theme Change Observer
    const themeObserver = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark');
      updateColorsForTheme(dark);
      if (geometry.attributes.color) {
        geometry.attributes.color.needsUpdate = true;
      }
      pointsMaterial.opacity = dark ? 0.8 : 0.6;
      lineMat.opacity = dark ? 0.3 : 0.2;
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Animation Loop (Throttled to 30 FPS to preserve GPU frame budget)
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let frameCount = 0;
    let lastRenderTime = 0;
    const targetFpsInterval = 1000 / 30; // 33.3ms

    const animate = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible || document.hidden) return; // Skip compute when offscreen or tab hidden

      const elapsed = timestamp - lastRenderTime;
      if (elapsed < targetFpsInterval) return; // Limit to 30 FPS
      lastRenderTime = timestamp - (elapsed % targetFpsInterval);

      frameCount++;
      const delta = clock.getDelta();
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      // Drift particles
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        posArray[i3] += velocities[i].x;
        posArray[i3 + 1] += velocities[i].y;
        posArray[i3 + 2] += velocities[i].z;

        if (Math.abs(posArray[i3]) > 48) velocities[i].x *= -1;
        if (Math.abs(posArray[i3 + 1]) > 30) velocities[i].y *= -1;
        if (Math.abs(posArray[i3 + 2]) > 18) velocities[i].z *= -1;
      }
      posAttr.needsUpdate = true;

      // Update Connections every 2nd frame (15 FPS updates for line connections)
      if (frameCount % 2 === 0) {
        let lineIndex = 0;
        const connectionDist = 20;
        const darkNow = document.documentElement.classList.contains('dark');

        for (let i = 0; i < particleCount; i++) {
          for (let j = i + 1; j < particleCount; j++) {
            if (lineIndex >= maxLineConnections) break;

            const dx = posArray[i * 3] - posArray[j * 3];
            const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
            const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < connectionDist) {
              const alpha = 1.0 - dist / connectionDist;
              const li = lineIndex * 6;

              linePositions[li] = posArray[i * 3];
              linePositions[li + 1] = posArray[i * 3 + 1];
              linePositions[li + 2] = posArray[i * 3 + 2];

              linePositions[li + 3] = posArray[j * 3];
              linePositions[li + 4] = posArray[j * 3 + 1];
              linePositions[li + 5] = posArray[j * 3 + 2];

              if (darkNow) {
                lineColors[li] = 0.79 * alpha;
                lineColors[li + 1] = 0.70 * alpha;
                lineColors[li + 2] = 0.49 * alpha;

                lineColors[li + 3] = 0.18 * alpha;
                lineColors[li + 4] = 0.29 * alpha;
                lineColors[li + 5] = 0.56 * alpha;
              } else {
                lineColors[li] = 0.11 * alpha;
                lineColors[li + 1] = 0.18 * alpha;
                lineColors[li + 2] = 0.37 * alpha;

                lineColors[li + 3] = 0.56 * alpha;
                lineColors[li + 4] = 0.48 * alpha;
                lineColors[li + 5] = 0.27 * alpha;
              }

              lineIndex++;
            }
          }
        }

        for (let k = lineIndex * 6; k < maxLineConnections * 6; k++) {
          linePositions[k] = 0;
          lineColors[k] = 0;
        }

        linesGeometry.attributes.position.needsUpdate = true;
        linesGeometry.attributes.color.needsUpdate = true;
        linesGeometry.setDrawRange(0, lineIndex * 2);
      }

      scene.rotation.y += delta * 0.015;
      scene.rotation.x += delta * 0.008;

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      observerIntersection.disconnect();
      themeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      pointsMaterial.dispose();
      linesGeometry.dispose();
      lineMat.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none -z-10 opacity-25 dark:opacity-40 overflow-hidden"
      aria-hidden="true"
    />
  );
}
