import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const GPUSpatial3D = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const frameRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewMode, setViewMode] = useState('globe'); // 'globe' or 'grid'
  const [isRotating, setIsRotating] = useState(true);

  // Sample data for distributed GPU deployments
  const deploymentData = [
    // North America
    { id: 'na-west-1', region: 'US West', lat: 37.7749, lng: -122.4194, model: 'GPT-4', gpu: 'H100', latency: 45, drift: 0.12, status: 'healthy', utilization: 0.78 },
    { id: 'na-east-1', region: 'US East', lat: 40.7128, lng: -74.0060, model: 'Claude-3', gpu: 'A100', latency: 32, drift: 0.08, status: 'healthy', utilization: 0.85 },
    { id: 'na-central-1', region: 'US Central', lat: 41.8781, lng: -87.6298, model: 'Llama-2', gpu: 'V100', latency: 67, drift: 0.23, status: 'warning', utilization: 0.92 },
    
    // Europe
    { id: 'eu-west-1', region: 'London', lat: 51.5074, lng: -0.1278, model: 'GPT-4', gpu: 'H100', latency: 28, drift: 0.06, status: 'healthy', utilization: 0.72 },
    { id: 'eu-central-1', region: 'Frankfurt', lat: 50.1109, lng: 8.6821, model: 'PaLM-2', gpu: 'A100', latency: 41, drift: 0.15, status: 'warning', utilization: 0.88 },
    { id: 'eu-north-1', region: 'Stockholm', lat: 59.3293, lng: 18.0686, model: 'Claude-3', gpu: 'H100', latency: 38, drift: 0.09, status: 'healthy', utilization: 0.76 },
    
    // Asia Pacific
    { id: 'ap-southeast-1', region: 'Singapore', lat: 1.3521, lng: 103.8198, model: 'GPT-4', gpu: 'H100', latency: 52, drift: 0.11, status: 'healthy', utilization: 0.83 },
    { id: 'ap-northeast-1', region: 'Tokyo', lat: 35.6762, lng: 139.6503, model: 'Gemini', gpu: 'A100', latency: 73, drift: 0.28, status: 'critical', utilization: 0.95 },
    { id: 'ap-south-1', region: 'Mumbai', lat: 19.0760, lng: 72.8777, model: 'Llama-2', gpu: 'V100', latency: 89, drift: 0.34, status: 'critical', utilization: 0.97 },
    
    // Edge Deployments
    { id: 'edge-hospital-1', region: 'Mayo Clinic', lat: 44.0225, lng: -92.4699, model: 'MedLM', gpu: 'RTX 4090', latency: 12, drift: 0.05, status: 'healthy', utilization: 0.45 },
    { id: 'edge-satellite-1', region: 'LEO Satellite', lat: 0, lng: 0, model: 'EdgeAI', gpu: 'Jetson AGX', latency: 156, drift: 0.45, status: 'critical', utilization: 0.89 },
    { id: 'edge-warehouse-1', region: 'Amazon FC', lat: 47.6062, lng: -122.3321, model: 'LogisticsAI', gpu: 'RTX 3080', latency: 18, drift: 0.07, status: 'healthy', utilization: 0.67 }
  ];

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.z = viewMode === 'globe' ? 8 : 12;
    camera.position.y = viewMode === 'globe' ? 0 : 6;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Clear previous content and add new renderer
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create base structure
    let baseGeometry, baseMaterial, base;
    
    if (viewMode === 'globe') {
      // Globe mode - create Earth-like sphere
      baseGeometry = new THREE.SphereGeometry(3, 32, 32);
      baseMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a4f63,
        transparent: true,
        opacity: 0.7,
        wireframe: false
      });
      base = new THREE.Mesh(baseGeometry, baseMaterial);
      
      // Add wireframe overlay for globe lines
      const wireframeGeometry = new THREE.SphereGeometry(3.01, 16, 16);
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
      scene.add(wireframe);
    } else {
      // Grid mode - create platform grid
      baseGeometry = new THREE.PlaneGeometry(20, 20, 10, 10);
      baseMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a4f63,
        transparent: true,
        opacity: 0.5,
        wireframe: true
      });
      base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.rotation.x = -Math.PI / 2;
      base.position.y = -2;
    }
    
    scene.add(base);

    // Create deployment nodes
    const nodes = [];
    deploymentData.forEach((deployment, index) => {
      let x, y, z;
      
      if (viewMode === 'globe') {
        // Convert lat/lng to 3D coordinates on sphere
        const phi = (90 - deployment.lat) * (Math.PI / 180);
        const theta = (deployment.lng + 180) * (Math.PI / 180);
        const radius = 3.2;
        
        x = radius * Math.sin(phi) * Math.cos(theta);
        y = radius * Math.cos(phi);
        z = radius * Math.sin(phi) * Math.sin(theta);
      } else {
        // Grid mode - distribute across 2D plane
        const gridSize = 4;
        const cols = 4;
        x = (index % cols - 1.5) * gridSize;
        z = (Math.floor(index / cols) - 1.5) * gridSize;
        y = deployment.latency / 20; // Height based on latency
      }

      // Node geometry - size based on utilization
      const nodeSize = 0.1 + (deployment.utilization * 0.3);
      const nodeGeometry = new THREE.SphereGeometry(nodeSize, 8, 8);
      
      // Color based on status
      let nodeColor;
      switch (deployment.status) {
        case 'healthy': nodeColor = 0x00ff88; break;
        case 'warning': nodeColor = 0xffaa00; break;
        case 'critical': nodeColor = 0xff4444; break;
        default: nodeColor = 0x888888;
      }
      
      const nodeMaterial = new THREE.MeshPhongMaterial({ 
        color: nodeColor,
        emissive: nodeColor,
        emissiveIntensity: 0.2
      });
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      
      node.position.set(x, y, z);
      node.userData = deployment;
      nodes.push(node);
      scene.add(node);

      // Add performance indicator rings
      const ringGeometry = new THREE.RingGeometry(nodeSize + 0.05, nodeSize + 0.1, 8);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: nodeColor,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(node.position);
      ring.lookAt(camera.position);
      scene.add(ring);

      // Add drift indicator (vertical bar)
      if (deployment.drift > 0.2) {
        const driftHeight = deployment.drift * 2;
        const driftGeometry = new THREE.CylinderGeometry(0.02, 0.02, driftHeight, 8);
        const driftMaterial = new THREE.MeshPhongMaterial({ color: 0xff6666 });
        const driftBar = new THREE.Mesh(driftGeometry, driftMaterial);
        driftBar.position.set(x, y + driftHeight/2 + nodeSize, z);
        scene.add(driftBar);
      }
    });

    // Add connection lines between nearby nodes
    const connections = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = nodes[i].position.distanceTo(nodes[j].position);
        if (distance < 6 && Math.random() > 0.6) { // Random connections for demo
          const points = [nodes[i].position, nodes[j].position];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.3
          });
          const line = new THREE.Line(geometry, material);
          connections.push(line);
          scene.add(line);
        }
      }
    }

    // Mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodes);
      
      if (intersects.length > 0) {
        setSelectedNode(intersects[0].object.userData);
      } else {
        setSelectedNode(null);
      }
    };
    
    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      if (isRotating && viewMode === 'globe') {
        scene.rotation.y += 0.005;
      }
      
      // Animate node pulses
      nodes.forEach((node, index) => {
        const time = Date.now() * 0.001;
        const pulse = Math.sin(time * 2 + index) * 0.1 + 1;
        node.scale.setScalar(pulse);
      });
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Cleanup
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('click', handleClick);
      }
    };
  }, [viewMode, isRotating]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-center">
          3D GPU Model Deployment Dashboard
        </h2>
        
        {/* Controls */}
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setViewMode('globe')}
            className={`px-4 py-2 rounded ${viewMode === 'globe' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            Globe View
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded ${viewMode === 'grid' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            Grid View
          </button>
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`px-4 py-2 rounded ${isRotating ? 'bg-green-600' : 'bg-gray-700'}`}
          >
            {isRotating ? 'Stop Rotation' : 'Start Rotation'}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* 3D Visualization */}
        <div className="flex-1">
          <div 
            ref={mountRef}
            className="border border-gray-700 rounded-lg overflow-hidden"
            style={{ width: '800px', height: '600px' }}
          />
          
          {/* Legend */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-800 p-3 rounded">
              <h4 className="font-semibold mb-2">Status Colors</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span>Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <span>Warning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <span>Critical</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-3 rounded">
              <h4 className="font-semibold mb-2">Node Size</h4>
              <p>Represents GPU utilization</p>
              <p className="text-xs text-gray-400">Larger = Higher utilization</p>
            </div>
            
            <div className="bg-gray-800 p-3 rounded">
              <h4 className="font-semibold mb-2">Red Bars</h4>
              <p>Model drift indicators</p>
              <p className="text-xs text-gray-400">Height = Drift severity</p>
            </div>
          </div>
        </div>

        {/* Node Details Panel */}
        <div className="w-80 bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-4">
            {selectedNode ? 'Node Details' : 'Click a node for details'}
          </h3>
          
          {selectedNode ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Region</label>
                <p className="font-medium">{selectedNode.region}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Model</label>
                <p className="font-medium">{selectedNode.model}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">GPU</label>
                <p className="font-medium">{selectedNode.gpu}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Status</label>
                <p className={`font-medium ${getStatusColor(selectedNode.status)}`}>
                  {selectedNode.status.charAt(0).toUpperCase() + selectedNode.status.slice(1)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Latency</label>
                  <p className="font-medium">{selectedNode.latency}ms</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Drift</label>
                  <p className={`font-medium ${selectedNode.drift > 0.2 ? 'text-red-400' : 'text-green-400'}`}>
                    {(selectedNode.drift * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">GPU Utilization</label>
                <div className="mt-1">
                  <div className="bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${selectedNode.utilization * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm mt-1">{(selectedNode.utilization * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-700 p-3 rounded">
                <h4 className="font-medium mb-2">Overview</h4>
                <p className="text-sm text-gray-300">
                  Monitoring {deploymentData.length} GPU deployments across regions and edge devices.
                </p>
              </div>
              
              <div className="bg-gray-700 p-3 rounded">
                <h4 className="font-medium mb-2">Key Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Healthy Nodes:</span>
                    <span className="text-green-400">
                      {deploymentData.filter(d => d.status === 'healthy').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Warning Nodes:</span>
                    <span className="text-yellow-400">
                      {deploymentData.filter(d => d.status === 'warning').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Critical Nodes:</span>
                    <span className="text-red-400">
                      {deploymentData.filter(d => d.status === 'critical').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GPUSpatial3D;