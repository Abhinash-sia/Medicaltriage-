'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function TriageConstellation() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.z = 85;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Node Count & Positions
    const particleCount = 75;
    const positions = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];
    const colors = new Float32Array(particleCount * 3);

    // Palette: Deep Teal (#0F6F73), Ice Cyan (#38D9C8), Soft White (#E6EEF0), Accent Amber (#E8A33A)
    const colorTeal = new THREE.Color(0x0f6f73);
    const colorIce = new THREE.Color(0x38d9c8);
    const colorWhite = new THREE.Color(0xd9e3e6);
    const colorAmber = new THREE.Color(0xe8a33a);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 110;
      positions[i3 + 1] = (Math.random() - 0.5) * 70;
      positions[i3 + 2] = (Math.random() - 0.5) * 45;

      velocities.push({
        x: (Math.random() - 0.5) * 0.04,
        y: (Math.random() - 0.5) * 0.04,
        z: (Math.random() - 0.5) * 0.02,
      });

      // Assign palette color based on cluster
      const rand = Math.random();
      const chosenColor = rand < 0.55 ? colorIce : rand < 0.85 ? colorTeal : rand < 0.95 ? colorWhite : colorAmber;
      colors[i3] = chosenColor.r;
      colors[i3 + 1] = chosenColor.g;
      colors[i3 + 2] = chosenColor.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle sprite using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(56, 217, 200, 0.8)');
      grad.addColorStop(0.7, 'rgba(15, 111, 115, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const pointsMaterial = new THREE.PointsMaterial({
      size: 3.2,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, pointsMaterial);
    scene.add(points);

    // Dynamic Connections (Lines)
    const maxLineConnections = 300;
    const linePositions = new Float32Array(maxLineConnections * 6);
    const lineColors = new Float32Array(maxLineConnections * 6);
    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    linesGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const linesMaterial = new THREE.LineSegments(
      linesGeometry,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    scene.add(linesMaterial);

    // Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouseX = (clientX / rect.width - 0.5) * 2;
      mouseY = -(clientY / rect.height - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      // Drift particles
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        posArray[i3] += velocities[i].x;
        posArray[i3 + 1] += velocities[i].y;
        posArray[i3 + 2] += velocities[i].z;

        // Bounce back within bounding box
        if (Math.abs(posArray[i3]) > 55) velocities[i].x *= -1;
        if (Math.abs(posArray[i3 + 1]) > 38) velocities[i].y *= -1;
        if (Math.abs(posArray[i3 + 2]) > 25) velocities[i].z *= -1;
      }
      posAttr.needsUpdate = true;

      // Update Connections
      let lineIndex = 0;
      const connectionDist = 18;

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

            // Color gradient along edge
            lineColors[li] = 0.22 * alpha;
            lineColors[li + 1] = 0.85 * alpha;
            lineColors[li + 2] = 0.78 * alpha;

            lineColors[li + 3] = 0.06 * alpha;
            lineColors[li + 4] = 0.43 * alpha;
            lineColors[li + 5] = 0.45 * alpha;

            lineIndex++;
          }
        }
      }

      // Fill remaining lines with zero
      for (let k = lineIndex * 6; k < maxLineConnections * 6; k++) {
        linePositions[k] = 0;
        lineColors[k] = 0;
      }

      linesGeometry.attributes.position.needsUpdate = true;
      linesGeometry.attributes.color.needsUpdate = true;
      linesGeometry.setDrawRange(0, lineIndex * 2);

      // Smooth camera parallax
      targetX += (mouseX * 12 - targetX) * 0.04;
      targetY += (mouseY * 8 - targetY) * 0.04;

      camera.position.x = targetX;
      camera.position.y = targetY;
      camera.lookAt(0, 0, 0);

      // Slow gentle rotation
      scene.rotation.y += delta * 0.03;
      scene.rotation.x += delta * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    // Teardown
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      pointsMaterial.dispose();
      linesGeometry.dispose();
      linesMaterial.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-80 mix-blend-screen overflow-hidden"
      aria-hidden="true"
    />
  );
}
