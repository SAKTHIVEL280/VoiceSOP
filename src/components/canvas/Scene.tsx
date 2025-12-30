'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger, useGSAP);


function ResponsiveShapes() {
    const { viewport } = useThree(); // Access viewport dimensions
    const isMobile = viewport.width < 5;

    const groupRef = useRef<THREE.Group>(null);
    const torusRef = useRef<THREE.Mesh>(null);
    const coneRef = useRef<THREE.Mesh>(null);
    const sphereRef = useRef<THREE.Mesh>(null);
    const icosaRef = useRef<THREE.Mesh>(null);

    useGSAP(() => {
        if (!groupRef.current) return;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: document.body,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1.5,
            },
        });

        // UTILS for Responsive positioning
        const w = viewport.width;
        const h = viewport.height;
        const rw = (factor: number) => w * factor; // Relative Width
        const rh = (factor: number) => h * factor; // Relative Height

        // STRATEGY: "Unique Choreography"
        // Swapped Positions per User Request:
        // Torus -> Bottom Left (Below Text)
        // Sphere -> Top Left (Above Text)

        // --- OBJECT 1: TORUS (Red Ring) ---
        // Zone: Bottom Left (Below "VoiceSOP")
        if (torusRef.current) {
            // Start: Bottom Left
            torusRef.current.position.set(-rw(0.35), -rh(0.25), 0);

            // Motion: Gentle float upwards and right, then settle back
            tl.to(torusRef.current.position, {
                x: -rw(0.2), // Move inward
                y: -rh(0.1), // Float up slightly
                ease: "sine.inOut",
                duration: 5
            }, 0)
                .to(torusRef.current.position, {
                    x: -rw(0.4), // Return wide
                    y: -rh(0.3),  // Return low
                    ease: "sine.inOut",
                    duration: 5
                }, 5);

            tl.to(torusRef.current.rotation, { x: Math.PI, y: Math.PI * 2, duration: 10 }, 0);
        }

        // --- OBJECT 2: CONE (Red Donut) ---
        // Zone: Right Side (Vertical Patroller) -> Unchanged
        if (coneRef.current) {
            // Start: Bottom Right
            coneRef.current.position.set(rw(0.4), -rh(0.35), 0);

            // Motion: Sweep Up to Top Right
            tl.to(coneRef.current.position, {
                y: rh(0.35), // Go High
                x: rw(0.35), // Slight drift Left
                ease: "power1.inOut",
                duration: 10
            }, 0);

            tl.to(coneRef.current.rotation, { z: Math.PI * 2, x: Math.PI, duration: 10 }, 0);
        }

        // --- OBJECT 3: SPHERE (White Glass) ---
        // Zone: Top Left (Above "VoiceSOP")
        if (sphereRef.current) {
            // Start: Top Left
            sphereRef.current.position.set(-rw(0.35), rh(0.3), 2);

            // Motion: Float down towards center, then back up
            tl.to(sphereRef.current.position, {
                x: -rw(0.15), // Move to Center-Left
                y: rh(0.1),   // Drop down near text
                z: 0,         // Normalize depth
                ease: "power2.inOut",
                duration: 10
            }, 0);

            tl.to(sphereRef.current.scale, { x: 0.8, y: 0.8, z: 0.8, duration: 10 }, 0);
        }

        // --- OBJECT 4: ICOSAHEDRON (Black Glass) ---
        // Zone: Top Right / Mid Right
        if (icosaRef.current) {
            // Start: Top Right (Near Cone's end, but different timing)
            icosaRef.current.position.set(rw(0.15), rh(0.2), -1);

            // Motion: Drift to Mid Right
            tl.to(icosaRef.current.position, {
                x: rw(0.25),
                y: -rh(0.1),
                z: 3, // Come wildly close to camera
                ease: "expo.inOut", // Slow start, fast middle, slow end
                duration: 10
            }, 0);

            tl.to(icosaRef.current.rotation, { y: Math.PI * 4, z: Math.PI, duration: 10 }, 0);
        }


    }, { scope: groupRef, dependencies: [viewport.width, viewport.height] });

    // Scale down slightly on mobile
    const scale = isMobile ? 0.6 : 1;

    return (
        <group ref={groupRef} scale={[scale, scale, scale]}>
            <Float speed={2} rotationIntensity={isMobile ? 0.5 : 1} floatIntensity={isMobile ? 0.5 : 1}>
                {/* Torus: Red Ring */}
                <mesh ref={torusRef}>
                    <torusGeometry args={[1.2, 0.4, 16, 50]} />
                    <meshPhysicalMaterial color="#ff4d4d" roughness={0.2} metalness={0.1} clearcoat={0.8} />
                </mesh>
            </Float>

            <Float speed={1.5} rotationIntensity={isMobile ? 0.5 : 1.5} floatIntensity={0.5}>
                {/* Donut - Now White Glass (Same props as Sphere) */}
                <mesh ref={coneRef}>
                    <torusGeometry args={[0.8, 0.25, 16, 50]} />
                    <meshPhysicalMaterial color="#ffffff" roughness={0.1} transmission={0.9} thickness={1} transparent opacity={0.8} />
                </mesh>
            </Float>

            <Float speed={3} rotationIntensity={0.5} floatIntensity={1.5}>
                {/* White Glass Sphere */}
                <mesh ref={sphereRef}>
                    <sphereGeometry args={[0.8, 32, 32]} />
                    <meshPhysicalMaterial color="#ffffff" roughness={0.1} transmission={0.9} thickness={1} transparent opacity={0.8} />
                </mesh>
            </Float>

            <Float speed={2.5} rotationIntensity={1} floatIntensity={1}>
                {/* Black Glass Icosahedron */}
                <mesh ref={icosaRef}>
                    <icosahedronGeometry args={[1.0, 0]} />
                    <meshPhysicalMaterial color="#000000" roughness={0.0} metalness={1} transmission={0.8} thickness={2.5} transparent opacity={0.9} clearcoat={1} />
                </mesh>
            </Float>
        </group>
    );
}

function SceneContent() {
    return <ResponsiveShapes />
}

export default function Scene() {
    return (
        <Canvas
            className="w-full h-full"
            dpr={[1, 2]}
            camera={{ position: [0, 0, 10], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
        >
            <Suspense fallback={null}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={5} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={2} color="#ff4d4d" />

                <Environment preset="city" />

                <ResponsiveShapes />
            </Suspense>
        </Canvas>
    );
}
