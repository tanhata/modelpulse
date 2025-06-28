import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Globe, Grid3X3, Filter, Search, MapPin, Activity, Zap, Database, AlertTriangle, CheckCircle, Clock, Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import * as THREE from 'three';

// Enhanced deployment data with more realistic metrics
const deploymentData = [
  { 
    id: 1, 
    name: 'US-East-1', 
    region: 'North America',
    city: 'Virginia',
    lat: 39.0458, 
    lng: -76.6413, 
    status: 'healthy', 
    latency: 45, 
    throughput: 850, 
    modelType: 'LLM',
    uptime: 99.9,
    requests: 12450,
    errorRate: 0.1,
    cpuUsage: 68,
    memoryUsage: 72,
    lastUpdated: '2 min ago'
  },
  { 
    id: 2, 
    name: 'EU-West-1', 
    region: 'Europe',
    city: 'Dublin',
    lat: 53.3478, 
    lng: -6.2597, 
    status: 'warning', 
    latency: 72, 
    throughput: 420, 
    modelType: 'Vision',
    uptime: 98.5,
    requests: 8920,
    errorRate: 2.3,
    cpuUsage: 89,
    memoryUsage: 84,
    lastUpdated: '1 min ago'
  },
  { 
    id: 3, 
    name: 'Asia-Pacific', 
    region: 'Asia',
    city: 'Tokyo',
    lat: 35.6762, 
    lng: 139.6503, 
    status: 'healthy', 
    latency: 38, 
    throughput: 920, 
    modelType: 'LLM',
    uptime: 99.8,
    requests: 15680,
    errorRate: 0.2,
    cpuUsage: 45,
    memoryUsage: 52,
    lastUpdated: '30 sec ago'
  },
  { 
    id: 4, 
    name: 'US-West-2', 
    region: 'North America',
    city: 'Oregon',
    lat: 45.5152, 
    lng: -122.6784, 
    status: 'healthy', 
    latency: 52, 
    throughput: 680, 
    modelType: 'NLP',
    uptime: 99.7,
    requests: 9840,
    errorRate: 0.3,
    cpuUsage: 78,
    memoryUsage: 65,
    lastUpdated: '1 min ago'
  },
  { 
    id: 5, 
    name: 'EU-Central', 
    region: 'Europe',
    city: 'Frankfurt',
    lat: 50.1109, 
    lng: 8.6821, 
    status: 'error', 
    latency: 156, 
    throughput: 120, 
    modelType: 'Vision',
    uptime: 94.2,
    requests: 3240,
    errorRate: 8.7,
    cpuUsage: 95,
    memoryUsage: 91,
    lastUpdated: '5 min ago'
  },
  { 
    id: 6, 
    name: 'Singapore', 
    region: 'Asia',
    city: 'Singapore',
    lat: 1.3521, 
    lng: 103.8198, 
    status: 'healthy', 
    latency: 41, 
    throughput: 750, 
    modelType: 'Edge',
    uptime: 99.6,
    requests: 11230,
    errorRate: 0.4,
    cpuUsage: 63,
    memoryUsage: 58,
    lastUpdated: '45 sec ago'
  },
  { 
    id: 7, 
    name: 'Australia', 
    region: 'Oceania',
    city: 'Sydney',
    lat: -33.8688, 
    lng: 151.2093, 
    status: 'warning', 
    latency: 89, 
    throughput: 340, 
    modelType: 'NLP',
    uptime: 97.8,
    requests: 5670,
    errorRate: 3.1,
    cpuUsage: 87,
    memoryUsage: 79,
    lastUpdated: '3 min ago'
  }
];

// Enhanced 3D Spatial Interface Component
const EnhancedSpatialInterface = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);
  const cameraRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  
  const [viewMode, setViewMode] = useState('globe');
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    modelType: 'all',
    region: 'all'
  });
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Filter deployments based on current filters
  const filteredDeployments = deploymentData.filter(deployment => {
    return (filters.status === 'all' || deployment.status === filters.status) &&
           (filters.modelType === 'all' || deployment.modelType === filters.modelType) &&
           (filters.region === 'all' || deployment.region === filters.region);
  });

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 400 / 500, 0.1, 1000);
    camera.position.set(0, 0, viewMode === 'globe' ? 3.5 : 6);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(400, 500);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x0a0a0a, 1);
    rendererRef.current = renderer;

    // Clear previous content
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Add point light for better node visibility
    const pointLight = new THREE.PointLight(0x8b5cf6, 0.5, 10);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    if (viewMode === 'globe') {
      setupEnhancedGlobeView(scene);
    } else {
      setupEnhancedGridView(scene);
    }

    // Mouse interaction setup
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (event) => {
      isDragging = true;
      isDraggingRef.current = true;
      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const onMouseMove = (event) => {
      if (isDragging && viewMode === 'globe') {
        const deltaMove = {
          x: event.clientX - previousMousePosition.x,
          y: event.clientY - previousMousePosition.y
        };

        // Rotate the globe group
        const globe = scene.getObjectByName('globeGroup');
        if (globe) {
          globe.rotation.y += deltaMove.x * 0.01;
          globe.rotation.x += deltaMove.y * 0.01;
        }

        previousMousePosition = {
          x: event.clientX,
          y: event.clientY
        };
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      isDraggingRef.current = false;
    };

    // Add mouse event listeners
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mouseleave', onMouseUp);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Auto-rotate globe if enabled and not dragging
      if (viewMode === 'globe' && isAutoRotate && !isDraggingRef.current) {
        const globeGroup = scene.getObjectByName('globeGroup');
        if (globeGroup) {
          globeGroup.rotation.y += 0.002;
        }
      }

      // Animate deployment nodes
      scene.children.forEach(child => {
        if (child.userData.isDeployment) {
          // Pulse effect based on status and activity
          const time = Date.now() * 0.003;
          let pulseIntensity = 0.1;
          
          if (child.userData.status === 'error') {
            pulseIntensity = 0.3;
          } else if (child.userData.status === 'warning') {
            pulseIntensity = 0.2;
          }
          
          const pulseScale = 1 + Math.sin(time + child.userData.id) * pulseIntensity;
          child.scale.setScalar(pulseScale);

          // Update emissive intensity for glow effect
          if (child.children[0] && child.children[0].material) {
            const material = child.children[0].material;
            material.emissiveIntensity = 0.2 + Math.sin(time + child.userData.id) * 0.1;
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mouseleave', onMouseUp);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [viewMode, isAutoRotate, filters]);

  const setupEnhancedGlobeView = (scene) => {
    const globeGroup = new THREE.Group();
    globeGroup.name = 'globeGroup';

    // Create enhanced Earth sphere with better materials
    const earthGeometry = new THREE.SphereGeometry(1.8, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      transparent: true,
      opacity: 0.7,
      wireframe: true,
      wireframeLinewidth: 1
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earth);

    // Add atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(2.0, 32, 32);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.5 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
      `
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphere);

    // Add filtered deployment nodes
    filteredDeployments.forEach(deployment => {
      const nodeGroup = createEnhancedDeploymentNode(deployment);
      
      // Convert lat/lng to 3D coordinates
      const phi = (90 - deployment.lat) * (Math.PI / 180);
      const theta = (deployment.lng + 180) * (Math.PI / 180);
      
      const radius = 2.1;
      nodeGroup.position.x = radius * Math.sin(phi) * Math.cos(theta);
      nodeGroup.position.y = radius * Math.cos(phi);
      nodeGroup.position.z = radius * Math.sin(phi) * Math.sin(theta);
      
      globeGroup.add(nodeGroup);
    });

    // Add connection lines between healthy nodes of same type
    addEnhancedConnectionLines(globeGroup);
    
    scene.add(globeGroup);
  };

  const setupEnhancedGridView = (scene) => {
    const gridSize = Math.ceil(Math.sqrt(filteredDeployments.length));
    const spacing = 1.5;
    
    filteredDeployments.forEach((deployment, index) => {
      const nodeGroup = createEnhancedDeploymentNode(deployment);
      
      // Grid layout with performance-based positioning
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      
      nodeGroup.position.x = (col - gridSize/2) * spacing;
      nodeGroup.position.z = (row - gridSize/2) * spacing;
      
      // Y position based on combined performance metrics
      const performanceScore = (200 - deployment.latency) / 100 + 
                              (deployment.uptime / 100) + 
                              (1 - deployment.errorRate / 10);
      nodeGroup.position.y = performanceScore / 2;
      
      scene.add(nodeGroup);
    });
  };

  const createEnhancedDeploymentNode = (deployment) => {
    const group = new THREE.Group();
    group.userData = { ...deployment, isDeployment: true };

    // Enhanced node geometry with better materials
    const geometry = new THREE.OctahedronGeometry(0.12);
    let color, emissiveColor;
    
    switch(deployment.status) {
      case 'healthy': 
        color = 0x10b981; 
        emissiveColor = 0x10b981;
        break;
      case 'warning': 
        color = 0xf59e0b; 
        emissiveColor = 0xf59e0b;
        break;
      case 'error': 
        color = 0xef4444; 
        emissiveColor = 0xef4444;
        break;
      default: 
        color = 0x6b7280;
        emissiveColor = 0x6b7280;
    }

    const material = new THREE.MeshPhongMaterial({
      color: color,
      transparent: true,
      opacity: 0.9,
      emissive: emissiveColor,
      emissiveIntensity: 0.3,
      shininess: 100
    });

    const node = new THREE.Mesh(geometry, material);
    node.castShadow = true;
    node.receiveShadow = true;
    group.add(node);

    // Add performance-based rings
    if (deployment.throughput > 700) {
      const ringGeometry = new THREE.RingGeometry(0.15, 0.18, 16);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
    }

    // Add data flow visualization for active nodes
    if (deployment.status === 'healthy') {
      const particleCount = 8;
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 0.25;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius;
        positions[i * 3 + 2] = 0;
      }
      
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const particleMaterial = new THREE.PointsMaterial({
        color: 0x8b5cf6,
        size: 0.02,
        transparent: true,
        opacity: 0.8
      });
      
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      group.add(particles);
    }

    return group;
  };

  const addEnhancedConnectionLines = (globeGroup) => {
    // Only connect healthy nodes of the same model type
    const healthyNodes = filteredDeployments.filter(d => d.status === 'healthy');
    const modelGroups = healthyNodes.reduce((acc, deployment) => {
      if (!acc[deployment.modelType]) acc[deployment.modelType] = [];
      acc[deployment.modelType].push(deployment);
      return acc;
    }, {});

    Object.values(modelGroups).forEach(group => {
      if (group.length < 2) return;
      
      for (let i = 0; i < group.length - 1; i++) {
        const dep1 = group[i];
        const dep2 = group[i + 1];
        
        const phi1 = (90 - dep1.lat) * (Math.PI / 180);
        const theta1 = (dep1.lng + 180) * (Math.PI / 180);
        const phi2 = (90 - dep2.lat) * (Math.PI / 180);
        const theta2 = (dep2.lng + 180) * (Math.PI / 180);
        
        const radius = 2.1;
        const pos1 = new THREE.Vector3(
          radius * Math.sin(phi1) * Math.cos(theta1),
          radius * Math.cos(phi1),
          radius * Math.sin(phi1) * Math.sin(theta1)
        );
        const pos2 = new THREE.Vector3(
          radius * Math.sin(phi2) * Math.cos(theta2),
          radius * Math.cos(phi2),
          radius * Math.sin(phi2) * Math.sin(theta2)
        );

        // Create curved connection line
        const curve = new THREE.QuadraticBezierCurve3(
          pos1,
          new THREE.Vector3(0, 0, 0).addVectors(pos1, pos2).multiplyScalar(0.6),
          pos2
        );
        
        const points = curve.getPoints(20);
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0x8b5cf6,
          transparent: true,
          opacity: 0.4,
          linewidth: 2
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        globeGroup.add(line);
      }
    });
  };

  const handleNodeClick = (deployment) => {
    setSelectedDeployment(deployment);
  };

  const resetView = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, viewMode === 'globe' ? 3.5 : 6);
    }
    const globeGroup = sceneRef.current?.getObjectByName('globeGroup');
    if (globeGroup) {
      globeGroup.rotation.set(0, 0, 0);
    }
  };

  return (
    <div className="enhanced-spatial-interface">
      {/* Enhanced Header with Controls */}
      <div className="spatial-header">
        <div className="header-left">
          <h3>3D Spatial Deployment View</h3>
          <div className="status-summary">
            {filteredDeployments.length} of {deploymentData.length} deployments shown
          </div>
        </div>
        
        <div className="header-controls">
          <div className="view-controls">
            <button 
              className={`control-btn ${viewMode === 'globe' ? 'active' : ''}`}
              onClick={() => setViewMode('globe')}
              title="Globe View"
            >
              <Globe size={16} />
            </button>
            <button 
              className={`control-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <Grid3X3 size={16} />
            </button>
          </div>
          
          <div className="interaction-controls">
            <button 
              className={`control-btn ${isAutoRotate ? 'active' : ''}`}
              onClick={() => setIsAutoRotate(!isAutoRotate)}
              title="Auto Rotate"
            >
              <RotateCcw size={16} />
            </button>
            <button 
              className="control-btn"
              onClick={resetView}
              title="Reset View"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="enhanced-filters">
        <div className="filter-group">
          <Filter size={14} />
          <select 
            value={filters.status} 
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
        
        <div className="filter-group">
          <select 
            value={filters.modelType} 
            onChange={(e) => setFilters({...filters, modelType: e.target.value})}
            className="filter-select"
          >
            <option value="all">All Models</option>
            <option value="LLM">LLM</option>
            <option value="Vision">Vision</option>
            <option value="NLP">NLP</option>
            <option value="Edge">Edge</option>
          </select>
        </div>
        
        <div className="filter-group">
          <select 
            value={filters.region} 
            onChange={(e) => setFilters({...filters, region: e.target.value})}
            className="filter-select"
          >
            <option value="all">All Regions</option>
            <option value="North America">North America</option>
            <option value="Europe">Europe</option>
            <option value="Asia">Asia</option>
            <option value="Oceania">Oceania</option>
          </select>
        </div>
      </div>

      {/* Main visualization area */}
      <div className="spatial-main">
        <div className="spatial-canvas" ref={mountRef}></div>
        
        {/* Enhanced deployment details panel */}
        {selectedDeployment && (
          <div className="deployment-detail-panel">
            <div className="panel-header">
              <div className="deployment-title">
                <div className={`status-dot ${selectedDeployment.status}`}></div>
                <div>
                  <h4>{selectedDeployment.name}</h4>
                  <p>{selectedDeployment.city}, {selectedDeployment.region}</p>
                </div>
              </div>
              <button 
                className="close-btn"
                onClick={() => setSelectedDeployment(null)}
              >
                ×
              </button>
            </div>
            
            <div className="panel-content">
              <div className="metric-grid">
                <div className="metric-card">
                  <div className="metric-icon">
                    <Clock size={16} />
                  </div>
                  <div className="metric-info">
                    <div className="metric-value">{selectedDeployment.latency}ms</div>
                    <div className="metric-label">Latency</div>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-icon">
                    <Zap size={16} />
                  </div>
                  <div className="metric-info">
                    <div className="metric-value">{selectedDeployment.throughput}/s</div>
                    <div className="metric-label">Throughput</div>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-icon">
                    <Activity size={16} />
                  </div>
                  <div className="metric-info">
                    <div className="metric-value">{selectedDeployment.uptime}%</div>
                    <div className="metric-label">Uptime</div>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-icon">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="metric-info">
                    <div className="metric-value">{selectedDeployment.errorRate}%</div>
                    <div className="metric-label">Error Rate</div>
                  </div>
                </div>
              </div>
              
              <div className="resource-usage">
                <div className="usage-item">
                  <div className="usage-header">
                    <span>CPU Usage</span>
                    <span>{selectedDeployment.cpuUsage}%</span>
                  </div>
                  <div className="usage-bar">
                    <div 
                      className="usage-fill cpu"
                      style={{ width: `${selectedDeployment.cpuUsage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="usage-item">
                  <div className="usage-header">
                    <span>Memory Usage</span>
                    <span>{selectedDeployment.memoryUsage}%</span>
                  </div>
                  <div className="usage-bar">
                    <div 
                      className="usage-fill memory"
                      style={{ width: `${selectedDeployment.memoryUsage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="deployment-meta">
                <div className="meta-item">
                  <span>Model Type:</span>
                  <span className="model-tag">{selectedDeployment.modelType}</span>
                </div>
                <div className="meta-item">
                  <span>Total Requests:</span>
                  <span>{selectedDeployment.requests.toLocaleString()}</span>
                </div>
                <div className="meta-item">
                  <span>Last Updated:</span>
                  <span>{selectedDeployment.lastUpdated}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Statistics */}
      <div className="enhanced-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon healthy">
              <CheckCircle size={16} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{filteredDeployments.filter(d => d.status === 'healthy').length}</div>
              <div className="stat-label">Healthy</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon warning">
              <AlertTriangle size={16} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{filteredDeployments.filter(d => d.status === 'warning').length}</div>
              <div className="stat-label">Warning</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon error">
              <AlertTriangle size={16} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{filteredDeployments.filter(d => d.status === 'error').length}</div>
              <div className="stat-label">Error</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Database size={16} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{filteredDeployments.reduce((acc, d) => acc + d.throughput, 0)}</div>
              <div className="stat-label">Total Throughput</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .enhanced-spatial-interface {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
          border-radius: 16px;
          border: 1px solid rgba(139, 92, 246, 0.2);
          overflow: hidden;
        }

        .spatial-header {
          padding: 20px;
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%);
        }

        .header-left h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #ffffff;
        }

        .status-summary {
          font-size: 12px;
          color: #9ca3af;
        }

        .header-controls {
          display: flex;
          gap: 12px;
        }

        .view-controls, .interaction-controls {
          display: flex;
          gap: 4px;
        }

        .control-btn {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          padding: 8px;
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .control-btn:hover {
          background: rgba(139, 92, 246, 0.2);
          color: #ffffff;
          transform: translateY(-1px);
        }

        .control-btn.active {
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          color: #ffffff;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .enhanced-filters {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(139, 92, 246, 0.1);
          display: flex;
          gap: 16px;
          align-items: center;
          background: rgba(139, 92, 246, 0.03);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-select {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 6px;
          padding: 6px 12px;
          color: #ffffff;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-select:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }

        .spatial-main {
          flex: 1;
          display: flex;
          position: relative;
        }

        .spatial-canvas {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #1a1a2e 0%, #0a0a0a 100%);
          position: relative;
        }

        .deployment-detail-panel {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 320px;
          background: rgba(26, 26, 26, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          z-index: 10;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .panel-header {
          padding: 16px;
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .deployment-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .deployment-title h4 {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
          color: #ffffff;
        }

        .deployment-title p {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
          transition: color 0.2s ease;
        }

        .close-btn:hover {
          color: #ffffff;
        }

        .panel-content {
          padding: 16px;
        }

        .metric-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .metric-card {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .metric-icon {
          color: #8b5cf6;
        }

        .metric-info {
          flex: 1;
        }

        .metric-value {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 2px;
        }

        .metric-label {
          font-size: 11px;
          color: #9ca3af;
        }

        .resource-usage {
          margin-bottom: 16px;
        }

        .usage-item {
          margin-bottom: 12px;
        }

        .usage-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 12px;
          color: #9ca3af;
        }

        .usage-bar {
          height: 6px;
          background: rgba(139, 92, 246, 0.2);
          border-radius: 3px;
          overflow: hidden;
        }

        .usage-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .usage-fill.cpu {
          background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
        }

        .usage-fill.memory {
          background: linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%);
        }

        .deployment-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .meta-item {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #9ca3af;
        }

        .model-tag {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
        }

        .enhanced-stats {
          padding: 16px 20px;
          border-top: 1px solid rgba(139, 92, 246, 0.1);
          background: rgba(139, 92, 246, 0.03);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .stat-card {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          background: rgba(139, 92, 246, 0.15);
          transform: translateY(-1px);
        }

        .stat-icon {
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.healthy {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .stat-icon.warning {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .stat-icon.error {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 2px;
        }

        .stat-label {
          font-size: 11px;
          color: #9ca3af;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .status-dot.healthy {
          background: #10b981;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
        }

        .status-dot.warning {
          background: #f59e0b;
          box-shadow: 0 0 6px rgba(245, 158, 11, 0.5);
        }

        .status-dot.error {
          background: #ef4444;
          box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @media (max-width: 768px) {
          .spatial-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .header-controls {
            justify-content: center;
          }

          .enhanced-filters {
            flex-wrap: wrap;
          }

          .deployment-detail-panel {
            position: fixed;
            top: 0;
            right: 0;
            width: 100%;
            height: 100%;
            border-radius: 0;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedSpatialInterface;