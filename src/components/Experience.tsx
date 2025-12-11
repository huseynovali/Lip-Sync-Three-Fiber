import { OrbitControls } from "@react-three/drei";
import { Avatar } from "./Avatar";

function Experience() {
  return (
    <>
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <Avatar position={[0, -1, 0]} scale={[2, 2, 2]} />
    </>
  );
}

export default Experience;
