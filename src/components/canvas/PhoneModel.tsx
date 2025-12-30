'use client';

import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import * as THREE from 'three';

export default function PhoneModel() {
    const meshRef = useRef<THREE.Group>(null);

    useGSAP(() => {
        if (!meshRef.current) return;

        // Initial State (Off screen or hidden)
        gsap.set(meshRef.current.position, { y: -25, x: 0, z: 0 });
        gsap.set(meshRef.current.rotation, { x: 0, y: 0, z: 0 });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: document.body,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1, // Inertia for the "phone thing" scroll feel
            },
        });

        // Sequence for the phone
        // 1. Appears in the "Overview" section
        tl.to(meshRef.current.position, { y: 2, x: 3, z: 2, duration: 0.2, ease: 'power2.out' }, 0.15)
            .to(meshRef.current.rotation, { y: -0.5, x: 0.2, duration: 0.2 }, 0.15)

            // 2. Rotates to show screen more clearly
            .to(meshRef.current.position, { y: -1, x: 2, z: 4, duration: 0.2 }, 0.35)
            .to(meshRef.current.rotation, { y: -0.2, x: 0, duration: 0.2 }, 0.35)

            // 3. Exits or moves to side
            .to(meshRef.current.position, { y: -15, x: 6, z: -5, duration: 0.2 }, 0.6);

    }, { scope: meshRef });

    return (
        <group ref={meshRef}>
            {/* Phone Body */}
            <RoundedBox args={[2.5, 5, 0.3]} radius={0.15} smoothness={4}>
                <meshPhysicalMaterial
                    color="#1a1a1a"
                    roughness={0.2}
                    metalness={0.8}
                    clearcoat={0.5}
                />
            </RoundedBox>

            {/* Screen */}
            <mesh position={[0, 0, 0.16]}>
                <planeGeometry args={[2.3, 4.8]} />
                <meshBasicMaterial color="#000" />
            </mesh>

            {/* Screen Content (Voice Recorder UI) */}
            <mesh position={[0, 1, 0.17]}>
                {/* Waveform Area */}
                <planeGeometry args={[1.8, 2]} />
                <meshBasicMaterial color="#222" />
            </mesh>

            {/* Simulated Waveform Bars */}
            <mesh position={[-0.5, 1, 0.18]}>
                <planeGeometry args={[0.1, 0.8]} />
                <meshBasicMaterial color="#ff4d4d" />
            </mesh>
            <mesh position={[-0.2, 1, 0.18]}>
                <planeGeometry args={[0.1, 1.2]} />
                <meshBasicMaterial color="#ff4d4d" />
            </mesh>
            <mesh position={[0.1, 1, 0.18]}>
                <planeGeometry args={[0.1, 0.6]} />
                <meshBasicMaterial color="#ff4d4d" />
            </mesh>
            <mesh position={[0.4, 1, 0.18]}>
                <planeGeometry args={[0.1, 1.4]} />
                <meshBasicMaterial color="#ff4d4d" />
            </mesh>

            {/* Record Button */}
            <mesh position={[0, -1.5, 0.17]}>
                <circleGeometry args={[0.4, 32]} />
                <meshBasicMaterial color="#ff4d4d" />
            </mesh>
            <mesh position={[0, -1.5, 0.165]}>
                <circleGeometry args={[0.5, 32]} />
                <meshBasicMaterial color="#333" />
            </mesh>

            {/* Side Buttons (Decor) */}
            <mesh position={[1.26, 1, 0]}>
                <boxGeometry args={[0.02, 0.6, 0.1]} />
                <meshStandardMaterial color="#333" />
            </mesh>
        </group>
    );
}
