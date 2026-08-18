import * as THREE from "three";

const canvas = document.getElementById("bg");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100);
camera.position.z = 14;

// Particles
const PARTICLE_COUNT = 130;
const SPREAD = 12; // how far particles are scattered from center
const LINK_DISTANCE = 3.2; // max distance to draw a connecting line

const positions = new Float32Array(PARTICLE_COUNT * 3);
const velocities = [];

// randomly place particles
for (let i = 0; i < PARTICLE_COUNT; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * SPREAD * 2;
  positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD * 1.2;
  positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;

  velocities.push(
    new THREE.Vector3(
      (Math.random() - 0.5) * 0.004,
      (Math.random() - 0.5) * 0.004,
      (Math.random() - 0.5) * 0.004
    )
  );
}

// Create and add points
const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const particleMaterial = new THREE.PointsMaterial({
  color: 0xe8a33d,
  size: 0.06,
  transparent: true,
  opacity: 0.85,
});

const points = new THREE.Points(particleGeometry, particleMaterial);
scene.add(points);

// Connecting lines
const lineMaterial = new THREE.LineBasicMaterial({
  color: 0x3e8e8a,
  transparent: true,
  opacity: 0.25,
});
let lines = new THREE.LineSegments(new THREE.BufferGeometry(), lineMaterial);
scene.add(lines);

// Connect the points with lines
function rebuildLines() {
  const linePositions = [];
  const posAttr = particleGeometry.attributes.position;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    for (let j = i + 1; j < PARTICLE_COUNT; j++) {
      const dx = posAttr.getX(i) - posAttr.getX(j);
      const dy = posAttr.getY(i) - posAttr.getY(j);
      const dz = posAttr.getZ(i) - posAttr.getZ(j);
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < LINK_DISTANCE) {
        linePositions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        linePositions.push(posAttr.getX(j), posAttr.getY(j), posAttr.getZ(j));
      }
    }
  }

  lines.geometry.dispose();
  lines.geometry = new THREE.BufferGeometry();
  lines.geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(linePositions, 3)
  );
}

// Interaction for mouse movement
const mouse = { x: 0, y: 0 };
window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 5;
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 5;
});

// --- Resize handling ---
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Loop animation
let frame = 0;
function animate() {
  requestAnimationFrame(animate);
  frame++;

  const posAttr = particleGeometry.attributes.position;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    posAttr.setX(i, posAttr.getX(i) + velocities[i].x);
    posAttr.setY(i, posAttr.getY(i) + velocities[i].y);
    posAttr.setZ(i, posAttr.getZ(i) + velocities[i].z);

    // Bounds for points
    if (Math.abs(posAttr.getX(i)) > SPREAD) velocities[i].x *= -1;
    if (Math.abs(posAttr.getY(i)) > SPREAD * 0.6) velocities[i].y *= -1;
    if (Math.abs(posAttr.getZ(i)) > SPREAD * 0.5) velocities[i].z *= -1;
  }
  posAttr.needsUpdate = true;

  // Recompute connecting lines every few frames 
  if (frame % 4 === 0) rebuildLines();

  // Gentle overall rotation + mouse parallax
  points.rotation.y += 0.0006;
  lines.rotation.y += 0.0006;

  camera.position.x += (mouse.x * 1.5 - camera.position.x) * 0.02;
  camera.position.y += (-mouse.y * 1.5 - camera.position.y) * 0.02;
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}
animate();

// Scrolling 
const sections = document.querySelectorAll(".section");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target); // only animate once
      }
    });
  },
  { threshold: 0.15 }
);
sections.forEach((section) => revealObserver.observe(section));

// Navigation
const navLinks = document.querySelectorAll("[data-nav]");
const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const link = document.querySelector(`[data-nav][href="#${entry.target.id}"]`);
      if (!link) return;
      if (entry.isIntersecting) {
        navLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
      }
    });
  },
  { threshold: 0.5 }
);
document
  .querySelectorAll("#about, #projects, #contact")
  .forEach((section) => navObserver.observe(section));