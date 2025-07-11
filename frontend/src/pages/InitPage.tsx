import { useEffect, useState } from "react";
import type { Engine } from "@tsparticles/engine";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import styled from "styled-components";

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #0c0c24;
`;

export default function InitPage() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  return (
    <Wrapper>
      {init && (
        <Particles
          id="tsparticles"
          options={{
            fullScreen: { enable: true },
            background: { color: { value: "#0c0c24" } },
            particles: {
              number: { value: 120 },
              size: { value: 2 },
              move: { enable: true, speed: 0.7 },
              links: { enable: true, distance: 130 },
              color: { value: "#ffffff" }
            }
          }}
        />
      )}
    </Wrapper>
  );
}
