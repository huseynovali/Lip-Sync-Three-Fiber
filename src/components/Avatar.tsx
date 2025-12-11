import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

import { useControls } from "leva";

type GLTFResult = {
  nodes: {
    Wolf3D_Hands: THREE.SkinnedMesh;
    Wolf3D_Hair: THREE.SkinnedMesh;
    Wolf3D_Glasses: THREE.SkinnedMesh;
    Wolf3D_Shirt: THREE.SkinnedMesh;
    EyeLeft: THREE.SkinnedMesh;
    EyeRight: THREE.SkinnedMesh;
    Wolf3D_Head: THREE.SkinnedMesh;
    Wolf3D_Teeth: THREE.SkinnedMesh;
    Hips: THREE.Bone;
  };
  materials: {
    Wolf3D_Skin: THREE.MeshStandardMaterial;
    Wolf3D_Hair: THREE.MeshStandardMaterial;
    Wolf3D_Glasses: THREE.MeshStandardMaterial;
    Wolf3D_Shirt: THREE.MeshStandardMaterial;
    Wolf3D_Eye: THREE.MeshStandardMaterial;
    Wolf3D_Teeth: THREE.MeshStandardMaterial;
  };
};

/**
 * METHOD 1: Oculus Visemes (CURRENTLY ACTIVE)
 * Maps Rhubarb phoneme values to Oculus Viseme morph targets
 * Note: Model URL must include morphTargets=Oculus%20Visemes parameter
 * Example: https://models.readyplayer.me/693a8de2e9398372fc35094f.glb?morphTargets=Oculus%20Visemes
 */
const phonemeToMouthOpen: { [key: string]: string } = {
  A: "viseme_PP", // ah - open mouth
  B: "viseme_kk", // m, b, p - closed lips
  C: "viseme_I", // ch, sh
  D: "viseme_AA", // th, d, t
  E: "viseme_O", // eh - medium opening
  F: "viseme_U", // f, v
  G: "viseme_FF", // g, k
  H: "viseme_TH", // h
  X: "viseme_PP", // silence
};

/**
 * METHOD 2: Simple mouthOpen Morph Target (ALTERNATIVE)
 * Use this when morphTargets=Oculus%20Visemes parameter is not available
 * Uses only a single "mouthOpen" morph target
 * Less detailed but simpler approach
 */
// const phonemeToMouthOpen: { [key: string]: number } = {
//   A: 0.8, // ah - wide open
//   B: 0.2, // m, b, p - closed
//   C: 0.4, // ch, sh
//   D: 0.5, // th, d, t
//   E: 0.6, // eh - medium
//   F: 0.3, // f, v
//   G: 0.5, // g, k
//   H: 0.4, // h
//   X: 0.1, // silence - slightly open
// };

interface LipSyncData {
  mouthCues: Array<{
    start: number;
    end: number;
    value: string;
  }>;
}

interface AvatarProps {
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
}

export function Avatar(props: AvatarProps) {
  const group = useRef<THREE.Group>(null);
  const { nodes, materials } = useGLTF(
    "/models/693a8de2e9398372fc35094f.glb"
  ) as unknown as GLTFResult;
  const { playAudio, script, smoothMorphTarget, morphTargetSmoothing } =
    useControls({
      playAudio: false,
      smoothMorphTarget: true,
      morphTargetSmoothing: { value: 0.5, min: 0.1, max: 1, step: 0.1 },
      script: {
        value: "hello",
        options: ["hello"],
      },
    });

  const audio = useMemo(() => new Audio(`/audio/${script}.mp3`), [script]);
  const jsonFile = useLoader(THREE.FileLoader, `/audio/${script}.json`);
  const lipsync: LipSyncData = useMemo(
    () => JSON.parse(jsonFile as string),
    [jsonFile]
  );

  // Audio playback control
  useEffect(() => {
    if (playAudio) {
      audio.currentTime = 0;
      audio.play();
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [playAudio, audio]);

  /**
   * METHOD 1: Lip Sync with Oculus Visemes (CURRENTLY ACTIVE)
   */
  useFrame(() => {
    const currentAudioTime = audio.currentTime;

    // Reset all viseme values to zero
    Object.values(phonemeToMouthOpen).forEach((value) => {
      const headDict = nodes.Wolf3D_Head.morphTargetDictionary;
      const headInfluences = nodes.Wolf3D_Head.morphTargetInfluences;
      const teethDict = nodes.Wolf3D_Teeth.morphTargetDictionary;
      const teethInfluences = nodes.Wolf3D_Teeth.morphTargetInfluences;

      if (headDict && headInfluences && headDict[value] !== undefined) {
        const index = headDict[value];
        if (!smoothMorphTarget) {
          headInfluences[index] = 0;
        } else {
          headInfluences[index] = THREE.MathUtils.lerp(
            headInfluences[index],
            0,
            morphTargetSmoothing
          );
        }
      }

      if (teethDict && teethInfluences && teethDict[value] !== undefined) {
        const index = teethDict[value];
        if (!smoothMorphTarget) {
          teethInfluences[index] = 0;
        } else {
          teethInfluences[index] = THREE.MathUtils.lerp(
            teethInfluences[index],
            0,
            morphTargetSmoothing
          );
        }
      }
    });

    // Activate morph target for current phoneme
    for (let i = 0; i < lipsync.mouthCues.length; i++) {
      const mouthCue = lipsync.mouthCues[i];
      if (
        currentAudioTime >= mouthCue.start &&
        currentAudioTime <= mouthCue.end
      ) {
        const targetViseme = phonemeToMouthOpen[mouthCue.value];
        const headDict = nodes.Wolf3D_Head.morphTargetDictionary;
        const headInfluences = nodes.Wolf3D_Head.morphTargetInfluences;
        const teethDict = nodes.Wolf3D_Teeth.morphTargetDictionary;
        const teethInfluences = nodes.Wolf3D_Teeth.morphTargetInfluences;

        if (
          headDict &&
          headInfluences &&
          headDict[targetViseme] !== undefined
        ) {
          const index = headDict[targetViseme];
          if (!smoothMorphTarget) {
            headInfluences[index] = 1;
          } else {
            headInfluences[index] = THREE.MathUtils.lerp(
              headInfluences[index],
              1,
              morphTargetSmoothing
            );
          }
        }

        if (
          teethDict &&
          teethInfluences &&
          teethDict[targetViseme] !== undefined
        ) {
          const index = teethDict[targetViseme];
          if (!smoothMorphTarget) {
            teethInfluences[index] = 1;
          } else {
            teethInfluences[index] = THREE.MathUtils.lerp(
              teethInfluences[index],
              1,
              morphTargetSmoothing
            );
          }
        }

        break;
      }
    }
  });

  /**
   * METHOD 2: Lip Sync with Simple mouthOpen Morph Target (ALTERNATIVE)
   * Use this code when morphTargets=Oculus%20Visemes is not available
   * Don't forget to change phonemeToMouthOpen to number type above
   */
  // useFrame(() => {
  //   const head = nodes.Wolf3D_Head;
  //   const teeth = nodes.Wolf3D_Teeth;
  //
  //   if (!playAudio || !lipsync?.mouthCues) {
  //     // Close mouth when audio is not playing
  //     if (head?.morphTargetDictionary && head?.morphTargetInfluences) {
  //       const index = head.morphTargetDictionary["mouthOpen"];
  //       if (index !== undefined) {
  //         if (!smoothMorphTarget) {
  //           head.morphTargetInfluences[index] = 0;
  //         } else {
  //           head.morphTargetInfluences[index] = THREE.MathUtils.lerp(
  //             head.morphTargetInfluences[index],
  //             0,
  //             0.1
  //           );
  //         }
  //       }
  //     }
  //
  //     if (teeth?.morphTargetDictionary && teeth?.morphTargetInfluences) {
  //       const index = teeth.morphTargetDictionary["mouthOpen"];
  //       if (index !== undefined) {
  //         if (!smoothMorphTarget) {
  //           teeth.morphTargetInfluences[index] = 0;
  //         } else {
  //           teeth.morphTargetInfluences[index] = THREE.MathUtils.lerp(
  //             teeth.morphTargetInfluences[index],
  //             0,
  //             0.1
  //           );
  //         }
  //       }
  //     }
  //     return;
  //   }
  //
  //   const currentAudioTime = audio.currentTime;
  //   let targetMouthOpen = 0;
  //
  //   // Find current phoneme value
  //   for (let i = 0; i < lipsync.mouthCues.length; i++) {
  //     const mouthCue = lipsync.mouthCues[i];
  //     if (
  //       currentAudioTime >= mouthCue.start &&
  //       currentAudioTime <= mouthCue.end
  //     ) {
  //       targetMouthOpen = phonemeToMouthOpen[mouthCue.value] || 0;
  //       break;
  //     }
  //   }
  //
  //   // Apply mouthOpen morph target to head
  //   if (head?.morphTargetDictionary && head?.morphTargetInfluences) {
  //     const index = head.morphTargetDictionary["mouthOpen"];
  //     if (index !== undefined) {
  //       if (!smoothMorphTarget) {
  //         head.morphTargetInfluences[index] = targetMouthOpen;
  //       } else {
  //         head.morphTargetInfluences[index] = THREE.MathUtils.lerp(
  //           head.morphTargetInfluences[index],
  //           targetMouthOpen,
  //           morphTargetSmoothing
  //         );
  //       }
  //     }
  //   }
  //
  //   // Apply mouthOpen morph target to teeth
  //   if (teeth?.morphTargetDictionary && teeth?.morphTargetInfluences) {
  //     const index = teeth.morphTargetDictionary["mouthOpen"];
  //     if (index !== undefined) {
  //       if (!smoothMorphTarget) {
  //         teeth.morphTargetInfluences[index] = targetMouthOpen;
  //       } else {
  //         teeth.morphTargetInfluences[index] = THREE.MathUtils.lerp(
  //           teeth.morphTargetInfluences[index],
  //           targetMouthOpen,
  //           morphTargetSmoothing
  //         );
  //       }
  //     }
  //   }
  //
  //   // Optional: Adjust head rotation based on mouth opening
  //   if (nodes.Hips) {
  //     const neck = nodes.Hips.getObjectByName("Head") as THREE.Bone;
  //     if (neck) {
  //       neck.rotation.x = THREE.MathUtils.lerp(
  //         neck.rotation.x,
  //         targetMouthOpen * 0.1,
  //         0.1
  //       );
  //     }
  //   }
  // });

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="AvatarRoot">
          <primitive object={nodes.Hips} />
          <skinnedMesh
            name="Wolf3D_Hair"
            geometry={nodes.Wolf3D_Hair.geometry}
            material={materials.Wolf3D_Hair}
            skeleton={nodes.Wolf3D_Hair.skeleton}
          />
          <skinnedMesh
            name="Wolf3D_Glasses"
            geometry={nodes.Wolf3D_Glasses.geometry}
            material={materials.Wolf3D_Glasses}
            skeleton={nodes.Wolf3D_Glasses.skeleton}
          />
          <skinnedMesh
            name="Wolf3D_Shirt"
            geometry={nodes.Wolf3D_Shirt.geometry}
            material={materials.Wolf3D_Shirt}
            skeleton={nodes.Wolf3D_Shirt.skeleton}
          />
          <skinnedMesh
            name="EyeLeft"
            geometry={nodes.EyeLeft.geometry}
            material={materials.Wolf3D_Eye}
            skeleton={nodes.EyeLeft.skeleton}
            morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
            morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
          />
          <skinnedMesh
            name="EyeRight"
            geometry={nodes.EyeRight.geometry}
            material={materials.Wolf3D_Eye}
            skeleton={nodes.EyeRight.skeleton}
            morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
            morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
          />
          <skinnedMesh
            name="Wolf3D_Head"
            geometry={nodes.Wolf3D_Head.geometry}
            material={materials.Wolf3D_Skin}
            skeleton={nodes.Wolf3D_Head.skeleton}
            morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
            morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
          />
          <skinnedMesh
            name="Wolf3D_Teeth"
            geometry={nodes.Wolf3D_Teeth.geometry}
            material={materials.Wolf3D_Teeth}
            skeleton={nodes.Wolf3D_Teeth.skeleton}
            morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
            morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
          />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/models/693a8de2e9398372fc35094f.glb");
