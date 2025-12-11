import { createRoot } from "react-dom/client";
import "./index.css";
import Experience from "./components/Experience";
import { Canvas } from "@react-three/fiber";

createRoot(document.getElementById("root")!).render(
  <Canvas
    shadows
    camera={{ position: [0, 0, 1.5], fov: 50 }}
    style={{ width: '100vw', height: '100vh' }}
  >
    <color attach="background" args={["#ececec"]} />
    <Experience />
  </Canvas>
);
