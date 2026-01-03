/// <reference types="vite/client" />
/// <reference types="react-scripts" />

import '@react-three/fiber';
import '@react-three/drei';

declare module 'three' {
  export class Mesh {}
  export class Group {}
}

declare namespace JSX {
  interface IntrinsicElements {
    mesh: any;
    group: any;
    icosahedronGeometry: any;
    torusGeometry: any;
    meshStandardMaterial: any;
    meshBasicMaterial: any;
    ambientLight: any;
    pointLight: any;
  }
}
