/// <reference types="vite/client" />

import * as THREE from 'three'

// Extend JSX to include three/fiber elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: React.DetailedHTMLProps<any, any> & { ref?: React.Ref<THREE.Mesh> }
      group: React.DetailedHTMLProps<any, any> & { ref?: React.Ref<THREE.Group> }
      icosahedronGeometry: any
      torusGeometry: any
      meshStandardMaterial: any
      meshBasicMaterial: any
      ambientLight: any
      pointLight: any
    }
  }
}
