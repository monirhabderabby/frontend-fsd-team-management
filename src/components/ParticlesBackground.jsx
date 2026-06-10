import { useState, useEffect, memo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const PARTICLES_OPTIONS = {
  fullScreen: false,
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  interactivity: {
    detectsOn: "window",
    events: {
      onHover: { enable: true, mode: "repulse" },
      onClick: { enable: true, mode: "push" },
      resize: { enable: true },
    },
    modes: {
      repulse: { distance: 120, duration: 0.4, speed: 1 },
      push: { quantity: 6 },
    },
  },
  particles: {
    color: { value: ["#01A22A", "#2FBD53", "#FFC300", "#FFF0AD"] },
    links: {
      color: "#01A22A",
      distance: 130,
      enable: true,
      opacity: 0.22,
      width: 1,
    },
    move: {
      enable: true,
      speed: 1.2,
      direction: "none",
      random: true,
      straight: false,
      outModes: { default: "bounce" },
      attract: { enable: false },
    },
    number: { density: { enable: true, area: 350 }, value: 300 },
    opacity: { value: { min: 0.3, max: 0.7 } },
    shape: { type: "circle" },
    size: { value: { min: 1, max: 3 } },
  },
  detectRetina: true,
};

const ParticlesBackground = memo(({ id = "particles-bg" }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <Particles
      id={id}
      className="absolute inset-0 z-10"
      style={{ width: "100%", height: "100%" }}
      options={PARTICLES_OPTIONS}
    />
  );
});

export default ParticlesBackground;
