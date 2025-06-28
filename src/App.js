import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ReferenceLine } from 'recharts';
import { BarChart3, AlertTriangle, TrendingUp, Activity, FileText, Clock, CheckCircle, XCircle, AlertCircle, Globe, Grid3X3, Bell, Eye, ArrowUp, ArrowDown, Zap, Shield } from 'lucide-react';
import * as THREE from 'three';

// Sample deployment data for 3D visualization
const deploymentData = [
  { id: 1, name: 'US-East-1', lat: 39.0458, lng: -76.6413, status: 'healthy', latency: 45, throughput: 850, modelType: 'LLM' },
  { id: 2, name: 'EU-West-1', lat: 53.3478, lng: -6.2597, status: 'warning', latency: 72, throughput: 420, modelType: 'Vision' },
  { id: 3, name: 'Asia-Pacific', lat: 35.6762, lng: 139.6503, status: 'healthy', latency: 38, throughput: 920, modelType: 'LLM' },
  { id: 4, name: 'US-West-2', lat: 45.5152, lng: -122.6784, status: 'healthy', latency: 52, throughput: 680, modelType: 'NLP' },
  { id: 5, name: 'EU-Central', lat: 50.1109, lng: 8.6821, status: 'error', latency: 156, throughput: 120, modelType: 'Vision' },
  { id: 6, name: 'Singapore', lat: 1.3521, lng: 103.8198, status: 'healthy', latency: 41, throughput: 750, modelType: 'Edge' }
];

// Enhanced data with timestamps and thresholds
const accuracyData = [
  { x: 30, y: 0.85 }, { x: 32, y: 0.83 }, { x: 34, y: 0.86 }, { x: 36, y: 0.84 },
  { x: 38, y: 0.87 }, { x: 40, y: 0.85 }, { x: 42, y: 0.88 }, { x: 44, y: 0.86 },
  { x: 46, y: 0.89 }, { x: 48, y: 0.87 }, { x: 50, y: 0.90 }, { x: 52, y: 0.88 },
  { x: 54, y: 0.91 }, { x: 56, y: 0.89 }, { x: 58, y: 0.82 }, { x: 60, y: 0.80 }
];

const latencyData = [
  { x: 15, y: 45 }, { x: 15.2, y: 52 }, { x: 15.4, y: 38 }, { x: 15.6, y: 48 },
  { x: 15.8, y: 42 }, { x: 16, y: 55 }, { x: 16.2, y: 35 }, { x: 16.4, y: 49 },
  { x: 16.6, y: 41 }, { x: 16.8, y: 53 }, { x: 17, y: 37 }, { x: 17.2, y: 46 },
  { x: 17.4, y: 44 }, { x: 17.6, y: 61 }, { x: 17.8, y: 68 }, { x: 18, y: 72 }
];

const confidenceData = [
  { x: 33, y: 0.72 }, { x: 35, y: 0.75 }, { x: 37, y: 0.73 }, { x: 39, y: 0.76 },
  { x: 41, y: 0.74 }, { x: 43, y: 0.77 }, { x: 45, y: 0.75 }, { x: 47, y: 0.78 },
  { x: 49, y: 0.76 }, { x: 50, y: 0.79 }
];

const driftData = [
  { x: 5, y: 0.3 }, { x: 5.2, y: 0.25 }, { x: 5.4, y: 0.35 }, { x: 5.6, y: 0.4 },
  { x: 5.8, y: 0.45 }, { x: 6, y: 0.5 }, { x: 6.2, y: 0.35 }, { x: 6.4, y: 0.6 },
  { x: 6.6, y: 0.45 }, { x: 6.8, y: 0.7 }, { x: 7, y: 0.55 }, { x: 7.2, y: 0.8 },
  { x: 7.4, y: 0.65 }, { x: 7.6, y: 0.85 }, { x: 7.8, y: 0.75 }, { x: 8, y: 0.9 }
];

const trainingData = [
  { step: 100, loss: 0.8, accuracy: 0.65, learningRate: 0.001, valLoss: 0.85, valAccuracy: 0.62, forwardTime: 35, backwardTime: 52, forwardMemory: 1.2, backwardMemory: 1.8, forwardGPU: 88, backwardGPU: 82 },
  { step: 200, loss: 0.6, accuracy: 0.72, learningRate: 0.001, valLoss: 0.68, valAccuracy: 0.70, forwardTime: 33, backwardTime: 50, forwardMemory: 1.4, backwardMemory: 1.9, forwardGPU: 89, backwardGPU: 84 },
  { step: 300, loss: 0.45, accuracy: 0.78, learningRate: 0.0008, valLoss: 0.52, valAccuracy: 0.75, forwardTime: 31, backwardTime: 48, forwardMemory: 1.5, backwardMemory: 2.0, forwardGPU: 90, backwardGPU: 85 },
  { step: 400, loss: 0.35, accuracy: 0.83, learningRate: 0.0008, valLoss: 0.42, valAccuracy: 0.80, forwardTime: 30, backwardTime: 47, forwardMemory: 1.6, backwardMemory: 2.0, forwardGPU: 91, backwardGPU: 86 },
  { step: 500, loss: 0.28, accuracy: 0.87, learningRate: 0.0006, valLoss: 0.35, valAccuracy: 0.84, forwardTime: 29, backwardTime: 46, forwardMemory: 1.7, backwardMemory: 2.1, forwardGPU: 91, backwardGPU: 87 },
  { step: 600, loss: 0.22, accuracy: 0.89, learningRate: 0.0006, valLoss: 0.28, valAccuracy: 0.87, forwardTime: 28, backwardTime: 46, forwardMemory: 1.7, backwardMemory: 2.1, forwardGPU: 92, backwardGPU: 87 },
  { step: 700, loss: 0.18, accuracy: 0.91, learningRate: 0.0004, valLoss: 0.24, valAccuracy: 0.88, forwardTime: 28, backwardTime: 46, forwardMemory: 1.8, backwardMemory: 2.1, forwardGPU: 92, backwardGPU: 88 },
  { step: 800, loss: 0.15, accuracy: 0.92, learningRate: 0.0004, valLoss: 0.22, valAccuracy: 0.89, forwardTime: 28, backwardTime: 46, forwardMemory: 1.8, backwardMemory: 2.1, forwardGPU: 92, backwardGPU: 88 },
];

// Enhanced Critical Alert Banner Component
const CriticalAlertBanner = ({ alerts, onViewDetails, onDismiss }) => {
  const criticalAlerts = alerts.filter(alert => alert.severity === 'High');
  
  if (criticalAlerts.length === 0) return null;

  return (
    <div className="critical-alert-banner">
      <div className="alert-banner-content">
        <div className="alert-banner-icon">
          <AlertTriangle size={20} />
        </div>
        <div className="alert-banner-text">
          <strong>Critical Alert:</strong> {criticalAlerts[0].message}
          {criticalAlerts.length > 1 && ` (+${criticalAlerts.length - 1} more)`}
        </div>
        <div className="alert-banner-actions">
          <button className="alert-banner-action" onClick={() => onViewDetails?.(criticalAlerts[0])}>
            <Eye size={16} />
            View Details
          </button>
          <button className="alert-banner-action secondary" onClick={() => onDismiss?.(criticalAlerts[0].id)}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Metric Card Component with thresholds and trends
const MetricCard = ({ title, value, threshold, trend, unit = '', status = 'normal' }) => {
  const getTrendIcon = () => {
    if (trend > 0) return <ArrowUp size={16} className="trend-up" />;
    if (trend < 0) return <ArrowDown size={16} className="trend-down" />;
    return null;
  };

  const getStatusColor = () => {
    switch(status) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'good': return '#10b981';
      default: return '#8b5cf6';
    }
  };

  return (
    <div className={`metric-card ${status}`}>
      <div className="metric-header">
        <h4>{title}</h4>
        {getTrendIcon()}
      </div>
      <div className="metric-value" style={{ color: getStatusColor() }}>
        {value}{unit}
      </div>
      {threshold && (
        <div className="metric-threshold">
          Threshold: {threshold}{unit}
        </div>
      )}
    </div>
  );
};

// Enhanced Overview Page Component with actionable insights
const OverviewPage = () => {
  const [showModal, setShowModal] = useState(null);
  const [retrainingStatus, setRetrainingStatus] = useState('idle'); // idle, starting, running
  const [scalingStatus, setScalingStatus] = useState('idle');
  
  const currentAccuracy = accuracyData[accuracyData.length - 1].y;
  const currentLatency = latencyData[latencyData.length - 1].y;
  const currentDrift = driftData[driftData.length - 1].y;
  
  const alerts = [
    { id: 1, type: 'error', message: 'Model accuracy dropped to 80% (below 85% threshold)', time: '2 minutes ago', severity: 'High' },
    { id: 2, type: 'warning', message: 'Latency spiked to 72ms in US regions', time: '5 minutes ago', severity: 'Medium' },
    { id: 3, type: 'error', message: 'Critical data drift detected (0.9/1.0)', time: '8 minutes ago', severity: 'High' },
  ];

  const handleStartRetraining = () => {
    setRetrainingStatus('starting');
    setTimeout(() => {
      setRetrainingStatus('running');
      setShowModal('retraining-started');
    }, 1500);
  };

  const handleScaleNow = () => {
    setScalingStatus('starting');
    setTimeout(() => {
      setScalingStatus('idle');
      setShowModal('scaling-complete');
    }, 2000);
  };

  const handleInvestigate = () => {
    setShowModal('investigation-report');
  };

  const handleAlertAction = (alert) => {
    setShowModal('alert-details');
  };

  const handleDismissAlert = (alertId) => {
    setShowModal('alert-dismissed');
  };

  return (
    <div className="page-content">
      <CriticalAlertBanner 
        alerts={alerts} 
        onViewDetails={handleAlertAction}
        onDismiss={handleDismissAlert}
      />
      
      <div className="page-header">
        <h2>Model Overview</h2>
        <p>Real-time monitoring of your ML models with actionable insights</p>
      </div>

      {/* Key Metrics Summary */}
      <div className="metrics-summary">
        <MetricCard 
          title="Current Accuracy" 
          value={(currentAccuracy * 100).toFixed(1)} 
          unit="%" 
          threshold="85"
          trend={-2.1}
          status={currentAccuracy < 0.85 ? 'critical' : 'good'}
        />
        <MetricCard 
          title="Avg Latency" 
          value={currentLatency.toFixed(0)} 
          unit="ms" 
          threshold="60"
          trend={1.8}
          status={currentLatency > 60 ? 'warning' : 'good'}
        />
        <MetricCard 
          title="Drift Score" 
          value={currentDrift.toFixed(2)} 
          unit="" 
          threshold="0.5"
          trend={2.5}
          status={currentDrift > 0.8 ? 'critical' : currentDrift > 0.5 ? 'warning' : 'good'}
        />
        <MetricCard 
          title="Active Models" 
          value="12" 
          unit="" 
          trend={0}
          status="good"
        />
      </div>
      
      <div className="charts-grid">
        <div className="chart-container">
          <div className="chart-header">
            <h3>ACCURACY</h3>
            <div className="chart-actions">
              <span className={`status-indicator ${currentAccuracy < 0.85 ? 'critical' : 'good'}`}>
                {currentAccuracy < 0.85 ? 'Below Threshold' : 'Healthy'}
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={accuracyData}>
              <XAxis dataKey="x" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis domain={[0.75, 1]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <ReferenceLine y={0.85} stroke="#ef4444" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="y" stroke="#8B5CF6" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="chart-insight">
            <AlertCircle size={14} />
            <span>Accuracy dropped 8% in last hour. Check recent data quality.</span>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>LATENCY</h3>
            <div className="chart-actions">
              <span className={`status-indicator ${currentLatency > 60 ? 'warning' : 'good'}`}>
                {currentLatency > 60 ? 'High Latency' : 'Normal'}
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={latencyData}>
              <XAxis dataKey="x" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="y" stroke="#8B5CF6" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="chart-insight">
            <Zap size={14} />
            <span>Latency increased 15% in US-East region. Scale additional instances.</span>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>CONFIDENCE</h3>
            <div className="chart-actions">
              <span className="status-indicator good">Stable</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={confidenceData}>
              <XAxis dataKey="x" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis domain={[0.6, 0.85]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <Line type="monotone" dataKey="y" stroke="#8B5CF6" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="chart-insight">
            <CheckCircle size={14} />
            <span>Confidence scores remain stable across all regions.</span>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>DRIFT SCORE</h3>
            <div className="chart-actions">
              <span className="status-indicator critical">Critical</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={driftData}>
              <XAxis dataKey="x" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <ReferenceLine y={0.5} stroke="#f59e0b" strokeDasharray="3 3" />
              <ReferenceLine y={0.8} stroke="#ef4444" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="y" stroke="#8B5CF6" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="chart-insight">
            <Shield size={14} />
            <span>Feature X showing 90% drift. Retrain model with recent data immediately.</span>
          </div>
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="recommendations-section">
        <h3>Immediate Actions Required</h3>
        <div className="recommendations-grid">
          <div className="recommendation-card urgent">
            <div className="recommendation-icon">
              <AlertTriangle size={20} />
            </div>
            <div className="recommendation-content">
              <h4>Model Retraining Required</h4>
              <p>High drift score (0.9) indicates training data mismatch. Schedule immediate retraining.</p>
              <button 
                className={`recommendation-action ${retrainingStatus === 'starting' ? 'loading' : ''}`}
                onClick={handleStartRetraining}
                disabled={retrainingStatus !== 'idle'}
              >
                {retrainingStatus === 'idle' && 'Start Retraining'}
                {retrainingStatus === 'starting' && 'Starting...'}
                {retrainingStatus === 'running' && 'Retraining Active'}
              </button>
            </div>
          </div>
          
          <div className="recommendation-card warning">
            <div className="recommendation-icon">
              <Zap size={20} />
            </div>
            <div className="recommendation-content">
              <h4>Scale Infrastructure</h4>
              <p>Latency spikes in US regions. Add 2 more instances to handle increased load.</p>
              <button 
                className={`recommendation-action ${scalingStatus === 'starting' ? 'loading' : ''}`}
                onClick={handleScaleNow}
                disabled={scalingStatus !== 'idle'}
              >
                {scalingStatus === 'idle' && 'Scale Now'}
                {scalingStatus === 'starting' && 'Scaling...'}
              </button>
            </div>
          </div>
          
          <div className="recommendation-card info">
            <div className="recommendation-icon">
              <Eye size={20} />
            </div>
            <div className="recommendation-content">
              <h4>Data Quality Check</h4>
              <p>Accuracy drop correlates with recent data changes. Review input validation.</p>
              <button className="recommendation-action" onClick={handleInvestigate}>
                Investigate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal System */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {showModal === 'retraining-started' && (
              <>
                <h3>🚀 Model Retraining Started</h3>
                <p>Training pipeline initiated with the last 30 days of data. Estimated completion: 2.5 hours.</p>
                <div className="modal-actions">
                  <button onClick={() => setShowModal(null)}>Close</button>
                  <button className="primary">Monitor Progress</button>
                </div>
              </>
            )}
            {showModal === 'scaling-complete' && (
              <>
                <h3>⚡ Infrastructure Scaled</h3>
                <p>Successfully added 2 new instances in US-East-1. Latency should improve within 5 minutes.</p>
                <div className="modal-actions">
                  <button onClick={() => setShowModal(null)}>Close</button>
                  <button className="primary">View Metrics</button>
                </div>
              </>
            )}
            {showModal === 'investigation-report' && (
              <>
                <h3>🔍 Data Quality Investigation</h3>
                <div className="investigation-details">
                  <p><strong>Issue Detected:</strong> 15% increase in missing values in feature_x</p>
                  <p><strong>Root Cause:</strong> Data pipeline modification on Dec 18</p>
                  <p><strong>Recommendation:</strong> Roll back pipeline changes and implement validation</p>
                </div>
                <div className="modal-actions">
                  <button onClick={() => setShowModal(null)}>Close</button>
                  <button className="primary">Fix Pipeline</button>
                </div>
              </>
            )}
            {showModal === 'alert-details' && (
              <>
                <h3>🔴 Critical Alert Details</h3>
                <p>Model accuracy has dropped below the 85% threshold and requires immediate attention.</p>
                <div className="alert-timeline">
                  <div className="timeline-item">
                    <span className="time">14:30</span>
                    <span className="event">Accuracy: 85.2% → 82.1%</span>
                  </div>
                  <div className="timeline-item">
                    <span className="time">14:32</span>
                    <span className="event">Alert triggered</span>
                  </div>
                </div>
                <div className="modal-actions">
                  <button onClick={() => setShowModal(null)}>Close</button>
                  <button className="primary">Take Action</button>
                </div>
              </>
            )}
            {showModal === 'alert-dismissed' && (
              <>
                <h3>✅ Alert Dismissed</h3>
                <p>The alert has been acknowledged. Monitor the situation and take action if needed.</p>
                <div className="modal-actions">
                  <button onClick={() => setShowModal(null)}>Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Alerts Page Component
const AlertsPage = () => {
  const alerts = [
    { id: 1, type: 'error', message: 'Model accuracy dropped below 85% threshold', time: '2 minutes ago', severity: 'High', feature: 'accuracy_monitor', region: 'US-East-1' },
    { id: 2, type: 'warning', message: 'Latency increased by 15% in production', time: '5 minutes ago', severity: 'Medium', feature: 'latency_monitor', region: 'EU-West-1' },
    { id: 3, type: 'error', message: 'Critical data drift detected in Feature X', time: '8 minutes ago', severity: 'High', feature: 'drift_monitor', region: 'Global' },
    { id: 4, type: 'info', message: 'Model v2.1.3 deployed successfully', time: '1 hour ago', severity: 'Low', feature: 'deployment', region: 'All Regions' },
    { id: 5, type: 'warning', message: 'Memory usage approaching 85% limit', time: '2 hours ago', severity: 'Medium', feature: 'resource_monitor', region: 'Asia-Pacific' }
  ];

  const getAlertIcon = (type) => {
    switch(type) {
      case 'error': return <XCircle className="alert-icon error" />;
      case 'warning': return <AlertCircle className="alert-icon warning" />;
      case 'success': return <CheckCircle className="alert-icon success" />;
      default: return <AlertCircle className="alert-icon info" />;
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Alerts & Notifications</h2>
        <p>Monitor system alerts with contextual information and recommended actions</p>
      </div>
      
      <div className="alerts-container">
        <div className="alerts-summary">
          <div className="summary-card error">
            <h4>2</h4>
            <p>Critical Alerts</p>
            <span className="summary-trend">+1 from yesterday</span>
          </div>
          <div className="summary-card warning">
            <h4>2</h4>
            <p>Warnings</p>
            <span className="summary-trend">Same as yesterday</span>
          </div>
          <div className="summary-card success">
            <h4>1</h4>
            <p>Resolved Today</p>
            <span className="summary-trend">-3 from yesterday</span>
          </div>
          <div className="summary-card info">
            <h4>98.2%</h4>
            <p>System Uptime</p>
            <span className="summary-trend">↑ 0.1% this week</span>
          </div>
        </div>

        <div className="alerts-list">
          {alerts.map(alert => (
            <div key={alert.id} className={`alert-item ${alert.type}`}>
              {getAlertIcon(alert.type)}
              <div className="alert-content">
                <div className="alert-message">{alert.message}</div>
                <div className="alert-meta">
                  <span className="alert-time">{alert.time}</span>
                  <span className={`alert-severity ${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                  <span className="alert-feature">{alert.feature}</span>
                  <span className="alert-region">{alert.region}</span>
                </div>
              </div>
              <div className="alert-actions">
                <button className="alert-action-btn">Fix Now</button>
                <button className="alert-action-btn">Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced Training Page Component (ONLY THIS IS REPLACED)
const TrainingPage = () => {
  const [selectedPhase, setSelectedPhase] = useState('combined');
  const currentData = trainingData[trainingData.length - 1];
  const totalIterationTime = currentData.forwardTime + currentData.backwardTime;
  const batchSize = 64;
  const forwardSamplesPerSecond = Math.round((batchSize * 1000) / currentData.forwardTime);
  const backwardSamplesPerSecond = Math.round((batchSize * 1000) / currentData.backwardTime);
  const effectiveSamplesPerSecond = Math.round((batchSize * 1000) / totalIterationTime);
  const peakMemory = 2.1;

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Model Training</h2>
        <p>Real-time training progress with forward/backward pass performance insights</p>
      </div>

      {/* Enhanced Training Status Banner */}
      <div className="enhanced-training-banner">
        <div className="banner-content">
          <div className="banner-icon">
            <Activity size={20} />
          </div>
          <div className="banner-text">
            <strong>Training in Progress:</strong> Step 800/1000 (80.0% complete) | ETA: 45 minutes
          </div>
          <button className="banner-button">Monitor Live</button>
        </div>
      </div>

      {/* Enhanced Performance Grid */}
      <div className="enhanced-performance-grid">
        <div className="performance-header">
          <h3>Training Performance Breakdown</h3>
          <div className="phase-selector">
            {['combined', 'forward', 'backward'].map(phase => (
              <button 
                key={phase}
                className={`phase-btn ${selectedPhase === phase ? 'active' : ''}`}
                onClick={() => setSelectedPhase(phase)}
              >
                {phase === 'combined' ? 'Overview' : phase === 'forward' ? 'Forward Pass' : 'Backward Pass'}
              </button>
            ))}
          </div>
        </div>

        {selectedPhase === 'combined' && (
          <div className="performance-overview">
            {/* Performance Summary Stats */}
            <div className="performance-summary">
              <div className="summary-stat">
                <span className="stat-label">Total Time</span>
                <span className="stat-value">{totalIterationTime}ms</span>
                <span className="stat-detail">per iteration</span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Effective Throughput</span>
                <span className="stat-value">{effectiveSamplesPerSecond.toLocaleString()}</span>
                <span className="stat-detail">samples/sec</span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Peak Memory</span>
                <span className="stat-value">{peakMemory}GB</span>
                <span className="stat-detail">of 12.8GB</span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Avg GPU Usage</span>
                <span className="stat-value">90%</span>
                <span className="stat-detail">utilization</span>
              </div>
            </div>
            
            {/* Phase Comparison */}
            <div className="phase-comparison">
              <div className="phase-card forward">
                <div className="phase-header">
                  <h4>🟢 Forward Pass</h4>
                  <span className="phase-time">{currentData.forwardTime}ms</span>
                </div>
                <div className="phase-metrics">
                  <div className="phase-metric">
                    <span>Throughput</span>
                    <span>{forwardSamplesPerSecond.toLocaleString()}/s</span>
                  </div>
                  <div className="phase-metric">
                    <span>Memory</span>
                    <span>1.8GB</span>
                  </div>
                  <div className="phase-metric">
                    <span>GPU</span>
                    <span>92%</span>
                  </div>
                </div>
              </div>

              <div className="phase-card backward">
                <div className="phase-header">
                  <h4>🔴 Backward Pass</h4>
                  <span className="phase-time">{currentData.backwardTime}ms</span>
                </div>
                <div className="phase-metrics">
                  <div className="phase-metric">
                    <span>Throughput</span>
                    <span>{backwardSamplesPerSecond.toLocaleString()}/s</span>
                  </div>
                  <div className="phase-metric">
                    <span>Memory</span>
                    <span>2.1GB</span>
                  </div>
                  <div className="phase-metric">
                    <span>GPU</span>
                    <span>88%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Insight */}
            <div className="performance-insight">
              <div className="insight-icon">⚖️</div>
              <div className="insight-content">
                <h4>Well Optimized</h4>
                <p>Current settings are near optimal for this model architecture.</p>
              </div>
            </div>
          </div>
        )}

        {(selectedPhase === 'forward' || selectedPhase === 'backward') && (
          <div className={`phase-detail ${selectedPhase}`}>
            <div className="detail-header">
              <h4>{selectedPhase === 'forward' ? '🟢 Forward Pass Deep Dive' : '🔴 Backward Pass Deep Dive'}</h4>
              <div className="detail-status">
                <span className="status-badge good">Optimized</span>
              </div>
            </div>
            
            <div className="detail-grid">
              <div className="detail-card">
                <h5>Performance</h5>
                <div className="detail-metrics">
                  <div className="detail-metric">
                    <span>Time per iteration</span>
                    <span className="metric-highlight">
                      {selectedPhase === 'forward' ? currentData.forwardTime : currentData.backwardTime}ms
                    </span>
                  </div>
                  <div className="detail-metric">
                    <span>Samples processed</span>
                    <span>
                      {selectedPhase === 'forward' ? forwardSamplesPerSecond.toLocaleString() : backwardSamplesPerSecond.toLocaleString()}/sec
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-card">
                <h5>Resource Usage</h5>
                <div className="detail-metrics">
                  <div className="detail-metric">
                    <span>Memory consumption</span>
                    <span className="metric-highlight">{selectedPhase === 'forward' ? '1.8' : '2.1'}GB</span>
                  </div>
                  <div className="detail-metric">
                    <span>GPU utilization</span>
                    <span>{selectedPhase === 'forward' ? '92' : '88'}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="optimization-suggestions">
              <h5>Optimization Opportunities</h5>
              <div className="suggestions-list">
                <div className="suggestion-item good">
                  <span>✅ {selectedPhase} pass is well optimized</span>
                </div>
                <div className="suggestion-item info">
                  <span>💡 Performance is within optimal range</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Key Training Metrics */}
      <div className="metrics-summary">
        <MetricCard 
          title="Current Accuracy" 
          value={(currentData.accuracy * 100).toFixed(1)} 
          unit="%" 
          threshold="90"
          trend={1.2}
          status={currentData.accuracy > 0.9 ? 'good' : 'warning'}
        />
        <MetricCard 
          title="Training Loss" 
          value={currentData.loss.toFixed(3)} 
          unit="" 
          threshold="0.2"
          trend={-2.8}
          status={currentData.loss < 0.2 ? 'good' : 'warning'}
        />
        <MetricCard 
          title="Peak Memory" 
          value={peakMemory.toFixed(1)} 
          unit="GB" 
          threshold="10.0"
          trend={0.1}
          status={peakMemory < 10 ? 'good' : 'warning'}
        />
        <MetricCard 
          title="Effective Throughput" 
          value={effectiveSamplesPerSecond.toLocaleString()} 
          unit=" samples/s" 
          trend={0.8}
          status="good"
        />
      </div>
      
      {/* Enhanced Training Charts */}
      <div className="training-enhanced-grid">
        <div className="chart-container large">
          <div className="chart-header">
            <h3>TRAINING & VALIDATION CURVES</h3>
            <div className="chart-actions">
              <span className="status-indicator good">Converging Well</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={trainingData}>
              <XAxis dataKey="step" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} dot={false} name="Train Accuracy" />
              <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={3} dot={false} name="Train Loss" />
            </LineChart>
          </ResponsiveContainer>
          <div className="chart-insight">
            <CheckCircle size={14} />
            <span>Training converging well. No overfitting detected.</span>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>FORWARD vs BACKWARD PERFORMANCE</h3>
            <div className="chart-actions">
              <span className="status-indicator good">Optimized</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={trainingData}>
              <XAxis dataKey="step" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <Line type="monotone" dataKey="forwardTime" stroke="#10b981" strokeWidth={3} dot={false} name="Forward Time" />
              <Line type="monotone" dataKey="backwardTime" stroke="#ef4444" strokeWidth={3} dot={false} name="Backward Time" />
            </LineChart>
          </ResponsiveContainer>
          <div className="chart-insight">
            <Zap size={14} />
            <span>Forward and backward passes are well balanced and optimized.</span>
          </div>
        </div>
      </div>

      {/* Training Recommendations */}
      <div className="training-recommendations">
        <h3>Training Optimizations & Insights</h3>
        <div className="recommendations-grid">
          <div className="recommendation-card info">
            <div className="recommendation-icon">
              <TrendingUp size={20} />
            </div>
            <div className="recommendation-content">
              <h4>Performance Excellent</h4>
              <p>Current settings are near optimal. Training is proceeding efficiently with balanced resource usage.</p>
              <button className="recommendation-action">Schedule Checkpoint</button>
            </div>
          </div>
          
          <div className="recommendation-card info">
            <div className="recommendation-icon">
              <Clock size={20} />
            </div>
            <div className="recommendation-content">
              <h4>Memory Efficiency</h4>
              <p>Peak memory usage at {peakMemory}GB out of 12.8GB available. Excellent headroom for larger batches.</p>
              <button className="recommendation-action">Monitor Efficiency</button>
            </div>
          </div>

          <div className="recommendation-card info">
            <div className="recommendation-icon">
              <Activity size={20} />
            </div>
            <div className="recommendation-content">
              <h4>GPU Utilization</h4>
              <p>Forward: 92%, Backward: 88%. Excellent resource utilization across training phases.</p>
              <button className="recommendation-action">Maintain Settings</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Spatial Page Component with 3D Globe and Deployment Monitoring
const SpatialPage = () => {
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [globeRotation, setGlobeRotation] = useState(true);
  const [globeView, setGlobeView] = useState('3d'); // '3d' or 'flat'
  const globeRef = useRef();

  useEffect(() => {
    if (!globeRef.current || globeView === 'flat') return;

    // Initialize Three.js scene for globe
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, globeRef.current.offsetWidth / globeRef.current.offsetHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(globeRef.current.offsetWidth, globeRef.current.offsetHeight);
    renderer.setClearColor(0x000000, 0);
    globeRef.current.appendChild(renderer.domElement);

    // Create enhanced globe geometry with better wireframe
    const geometry = new THREE.SphereGeometry(2, 64, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x2a2a2a,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Add deployment points with enhanced visibility
    deploymentData.forEach(deployment => {
      const phi = (90 - deployment.lat) * (Math.PI / 180);
      const theta = (deployment.lng + 180) * (Math.PI / 180);
      
      const x = -(2.1 * Math.sin(phi) * Math.cos(theta));
      const z = (2.1 * Math.sin(phi) * Math.sin(theta));
      const y = (2.1 * Math.cos(phi));

      // Main deployment point
      const pointGeometry = new THREE.SphereGeometry(0.08, 16, 16);
      let pointColor = 0x10b981; // green for healthy
      if (deployment.status === 'warning') pointColor = 0xf59e0b; // yellow for warning
      if (deployment.status === 'error') pointColor = 0xef4444; // red for error

      const pointMaterial = new THREE.MeshBasicMaterial({ 
        color: pointColor,
        transparent: true,
        opacity: 0.9
      });
      const point = new THREE.Mesh(pointGeometry, pointMaterial);
      point.position.set(x, y, z);
      point.userData = deployment;
      scene.add(point);

      // Add glowing effect for better visibility
      const glowGeometry = new THREE.SphereGeometry(0.12, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: pointColor,
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.set(x, y, z);
      scene.add(glow);
    });

    camera.position.z = 5;
    camera.position.y = 1;

    let animationId;
    // Animation loop
    function animate() {
      animationId = requestAnimationFrame(animate);
      if (globeRotation) {
        globe.rotation.y += 0.003;
      }
      renderer.render(scene, camera);
    }
    animate();

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (globeRef.current && renderer.domElement) {
        globeRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [globeRotation, globeView]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'healthy': return 'Operational';
      case 'warning': return 'Warning';
      case 'error': return 'Critical';
      default: return 'Unknown';
    }
  };

  const FlatMapView = () => (
    <div className="flat-map-container">
      <div className="world-map">
        <svg viewBox="0 0 1000 500" className="map-svg">
          {/* Simplified world map outline */}
          <path d="M150,200 L200,180 L300,190 L400,200 L500,210 L600,200 L700,190 L800,200 L850,210" 
                stroke="#444" strokeWidth="2" fill="none" opacity="0.3"/>
          <path d="M100,250 L200,240 L300,250 L400,260 L500,250 L600,240 L700,250 L800,260 L900,250" 
                stroke="#444" strokeWidth="2" fill="none" opacity="0.3"/>
          <path d="M200,300 L300,290 L400,300 L500,310 L600,300 L700,290 L800,300" 
                stroke="#444" strokeWidth="2" fill="none" opacity="0.3"/>
          
          {/* Deployment points on flat map */}
          {deploymentData.map(deployment => {
            // Convert lat/lng to SVG coordinates (simplified projection)
            const x = ((deployment.lng + 180) / 360) * 1000;
            const y = ((90 - deployment.lat) / 180) * 500;
            
            return (
              <g key={deployment.id} className="deployment-point">
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill={getStatusColor(deployment.status)}
                  opacity="0.8"
                  stroke="#fff"
                  strokeWidth="2"
                  className="deployment-circle"
                  onClick={() => setSelectedDeployment(deployment)}
                />
                <circle
                  cx={x}
                  cy={y}
                  r="20"
                  fill={getStatusColor(deployment.status)}
                  opacity="0.2"
                  className="deployment-glow"
                />
                <text
                  x={x}
                  y={y - 25}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="12"
                  fontWeight="bold"
                  className="deployment-label"
                >
                  {deployment.name}
                </text>
                <text
                  x={x}
                  y={y + 35}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize="10"
                  className="deployment-metric"
                >
                  {deployment.latency}ms
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>3D Spatial View</h2>
        <p>Interactive visualization of model deployments worldwide</p>
      </div>

      {/* Global Status Summary */}
      <div className="spatial-status-banner">
        <div className="status-summary">
          <div className="status-item healthy">
            <div className="status-dot"></div>
            <span>4 Healthy</span>
          </div>
          <div className="status-item warning">
            <div className="status-dot"></div>
            <span>1 Warning</span>
          </div>
          <div className="status-item error">
            <div className="status-dot"></div>
            <span>1 Critical</span>
          </div>
          <div className="status-metric">
            <span>Global Avg Latency: <strong>58ms</strong></span>
          </div>
          <div className="status-metric">
            <span>Total Throughput: <strong>3.72K req/s</strong></span>
          </div>
        </div>
      </div>

      <div className="spatial-layout">
        {/* Enhanced Globe/Map Visualization */}
        <div className="globe-container">
          <div className="globe-header">
            <h3>Global Deployment Map</h3>
            <div className="globe-controls">
              <button 
                className={`control-btn ${globeView === '3d' ? 'active' : ''}`}
                onClick={() => setGlobeView('3d')}
              >
                3D Globe
              </button>
              <button 
                className={`control-btn ${globeView === 'flat' ? 'active' : ''}`}
                onClick={() => setGlobeView('flat')}
              >
                Flat Map
              </button>
              {globeView === '3d' && (
                <button 
                  className={`control-btn ${globeRotation ? 'active' : ''}`}
                  onClick={() => setGlobeRotation(!globeRotation)}
                >
                  {globeRotation ? 'Pause' : 'Rotate'}
                </button>
              )}
            </div>
          </div>
          
          {globeView === '3d' ? (
            <div ref={globeRef} className="globe-canvas"></div>
          ) : (
            <FlatMapView />
          )}
          
          <div className="globe-legend">
            <div className="legend-item">
              <div className="legend-dot healthy"></div>
              <span>Healthy (4)</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot warning"></div>
              <span>Warning (1)</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot error"></div>
              <span>Critical (1)</span>
            </div>
          </div>
        </div>

        {/* Deployment Details */}
        <div className="deployment-details">
          <h3>Regional Deployments</h3>
          <div className="deployment-list">
            {deploymentData.map(deployment => (
              <div 
                key={deployment.id} 
                className={`deployment-card ${selectedDeployment?.id === deployment.id ? 'selected' : ''}`}
                onClick={() => setSelectedDeployment(deployment)}
              >
                <div className="deployment-header">
                  <div className="deployment-name">
                    <div 
                      className="status-indicator-dot" 
                      style={{ backgroundColor: getStatusColor(deployment.status) }}
                    ></div>
                    <span>{deployment.name}</span>
                  </div>
                  <span className={`deployment-status ${deployment.status}`}>
                    {getStatusLabel(deployment.status)}
                  </span>
                </div>
                <div className="deployment-metrics">
                  <div className="metric">
                    <span className="metric-label">Latency</span>
                    <span className="metric-value">{deployment.latency}ms</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Throughput</span>
                    <span className="metric-value">{deployment.throughput} req/s</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Model Type</span>
                    <span className="metric-value">{deployment.modelType}</span>
                  </div>
                </div>
                {selectedDeployment?.id === deployment.id && (
                  <div className="deployment-actions">
                    <button className="action-btn primary">Scale Up</button>
                    <button className="action-btn secondary">View Logs</button>
                    <button className="action-btn secondary">Restart</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="spatial-metrics">
        <div className="metrics-grid">
          <div className="metric-panel">
            <h4>Global Load Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deploymentData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Bar dataKey="throughput" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="metric-panel">
            <h4>Regional Latency</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={deploymentData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Area type="monotone" dataKey="latency" fill="#06b6d4" stroke="#06b6d4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Drift Page Component with Feature Analysis
const DriftPage = () => {
  const [selectedFeature, setSelectedFeature] = useState('feature_x');
  const [timeRange, setTimeRange] = useState('7d');

  const featureList = [
    { id: 'feature_x', name: 'Feature X', type: 'Numerical', drift: 0.89, status: 'critical' },
    { id: 'feature_y', name: 'Feature Y', type: 'Categorical', drift: 0.23, status: 'good' },
    { id: 'feature_z', name: 'Feature Z', type: 'Numerical', drift: 0.67, status: 'warning' },
    { id: 'feature_a', name: 'Feature A', type: 'Text', drift: 0.45, status: 'warning' },
    { id: 'feature_b', name: 'Feature B', type: 'Numerical', drift: 0.12, status: 'good' },
    { id: 'feature_c', name: 'Feature C', type: 'Categorical', drift: 0.78, status: 'warning' }
  ];

  const distributionData = selectedFeature === 'feature_x' ? [
    { bin: '0-10', training: 120, production: 45, drift: 0.8 },
    { bin: '10-20', training: 200, production: 180, drift: 0.1 },
    { bin: '20-30', training: 350, production: 380, drift: 0.08 },
    { bin: '30-40', training: 280, production: 420, drift: 0.5 },
    { bin: '40-50', training: 150, production: 220, drift: 0.47 },
    { bin: '50-60', training: 80, production: 180, drift: 1.25 },
    { bin: '60-70', training: 45, production: 120, drift: 1.67 },
    { bin: '70-80', training: 25, production: 95, drift: 2.8 }
  ] : [
    { bin: 'A', training: 400, production: 350, drift: 0.12 },
    { bin: 'B', training: 300, production: 280, drift: 0.07 },
    { bin: 'C', training: 200, production: 450, drift: 1.25 },
    { bin: 'D', training: 100, production: 120, drift: 0.2 }
  ];

  const getFeatureStatusColor = (status) => {
    switch(status) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'good': return '#10b981';
      default: return '#6b7280';
    }
  };

  const selectedFeatureData = featureList.find(f => f.id === selectedFeature);

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Data Drift Analysis</h2>
        <p>Monitor data distribution changes and feature drift over time</p>
      </div>

      {/* Drift Alert Banner */}
      {selectedFeatureData?.status === 'critical' && (
        <div className="drift-alert-banner">
          <div className="alert-content">
            <AlertTriangle size={20} />
            <div className="alert-text">
              <strong>Critical Drift Detected:</strong> {selectedFeatureData.name} showing {(selectedFeatureData.drift * 100).toFixed(0)}% drift. 
              Immediate model retraining recommended.
            </div>
            <button className="alert-action">Trigger Retraining</button>
          </div>
        </div>
      )}

      {/* Drift Summary Cards */}
      <div className="drift-summary">
        <MetricCard 
          title="Features at Risk" 
          value={featureList.filter(f => f.status === 'critical').length}
          unit="" 
          threshold="0"
          trend={1}
          status="critical"
        />
        <MetricCard 
          title="Avg Drift Score" 
          value={(featureList.reduce((acc, f) => acc + f.drift, 0) / featureList.length).toFixed(2)}
          unit="" 
          threshold="0.5"
          trend={0.8}
          status="warning"
        />
        <MetricCard 
          title="Days Since Retrain" 
          value="14" 
          unit="" 
          threshold="7"
          trend={0}
          status="warning"
        />
        <MetricCard 
          title="Data Points Analyzed" 
          value="1.2M" 
          unit="" 
          trend={0}
          status="good"
        />
      </div>

      <div className="drift-layout">
        {/* Feature Selection Sidebar */}
        <div className="features-panel">
          <div className="panel-header">
            <h3>Features</h3>
            <div className="time-selector">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="time-select"
              >
                <option value="1d">Last 24h</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
          </div>
          
          <div className="features-list">
            {featureList.map(feature => (
              <div 
                key={feature.id}
                className={`feature-item ${selectedFeature === feature.id ? 'selected' : ''}`}
                onClick={() => setSelectedFeature(feature.id)}
              >
                <div className="feature-header">
                  <div className="feature-info">
                    <span className="feature-name">{feature.name}</span>
                    <span className="feature-type">{feature.type}</span>
                  </div>
                  <div 
                    className="feature-status-dot"
                    style={{ backgroundColor: getFeatureStatusColor(feature.status) }}
                  ></div>
                </div>
                <div className="feature-drift">
                  <span className="drift-label">Drift Score</span>
                  <span 
                    className="drift-value"
                    style={{ color: getFeatureStatusColor(feature.status) }}
                  >
                    {feature.drift.toFixed(2)}
                  </span>
                </div>
                <div className="drift-bar">
                  <div 
                    className="drift-progress"
                    style={{ 
                      width: `${Math.min(feature.drift * 100, 100)}%`,
                      backgroundColor: getFeatureStatusColor(feature.status)
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Analysis Panel */}
        <div className="analysis-panel">
          <div className="analysis-header">
            <h3>{selectedFeatureData?.name} Analysis</h3>
            <div className="analysis-actions">
              <button className="action-btn">Export Report</button>
              <button className="action-btn primary">Schedule Retrain</button>
            </div>
          </div>

          {/* Distribution Comparison */}
          <div className="chart-container large">
            <div className="chart-header">
              <h4>Distribution Comparison: Training vs Production</h4>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#8b5cf6' }}></div>
                  <span>Training Data</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#06b6d4' }}></div>
                  <span>Production Data</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionData}>
                <XAxis dataKey="bin" />
                <YAxis />
                <Bar dataKey="training" fill="#8b5cf6" name="Training" />
                <Bar dataKey="production" fill="#06b6d4" name="Production" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Statistical Summary */}
          <div className="stats-grid">
            <div className="stat-card">
              <h5>KL Divergence</h5>
              <div className="stat-value critical">0.89</div>
              <div className="stat-description">Very High Drift</div>
            </div>
            <div className="stat-card">
              <h5>Population Stability Index</h5>
              <div className="stat-value warning">0.67</div>
              <div className="stat-description">Significant Change</div>
            </div>
            <div className="stat-card">
              <h5>Jensen-Shannon Distance</h5>
              <div className="stat-value critical">0.72</div>
              <div className="stat-description">High Divergence</div>
            </div>
            <div className="stat-card">
              <h5>Wasserstein Distance</h5>
              <div className="stat-value warning">1.34</div>
              <div className="stat-description">Elevated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="drift-recommendations">
        <h2>Drift Mitigation Recommendations</h2>
        <div className="recommendations-grid">
          <div className="recommendation-card urgent">
            <div className="recommendation-icon">
              <AlertTriangle size={20} />
            </div>
            <div className="recommendation-content">
              <h4>Immediate Retraining Required</h4>
              <p>Feature X shows critical drift (89%). Model performance likely degraded. Start retraining with last 30 days of data.</p>
              <button className="recommendation-action">Start Retraining</button>
            </div>
          </div>
          
          <div className="recommendation-card warning">
            <div className="recommendation-icon">
              <Eye size={20} />
            </div>
            <div className="recommendation-content">
              <h4>Enhanced Monitoring</h4>
              <p>Set up automated alerts for Feature Z and Feature A. Consider reducing drift detection threshold.</p>
              <button className="recommendation-action">Configure Alerts</button>
            </div>
          </div>
          
          <div className="recommendation-card info">
            <div className="recommendation-icon">
              <Shield size={20} />
            </div>
            <div className="recommendation-content">
              <h4>Data Quality Check</h4>
              <p>Investigate data source changes in the last 3 days. Validate feature engineering pipeline.</p>
              <button className="recommendation-action">Run Validation</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Logs Page Component with Advanced Filtering and Real-time Monitoring
const LogsPage = () => {
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [timeRange, setTimeRange] = useState('1h');

  const logSources = ['all', 'model_server', 'inference_engine', 'data_pipeline', 'monitoring', 'auth_service', 'load_balancer'];
  const logLevels = ['all', 'error', 'warning', 'info', 'debug'];

  const logEntries = [
    {
      id: 1,
      timestamp: '2024-12-19 14:32:15.234',
      level: 'error',
      source: 'model_server',
      message: 'Model inference failed for request_id: req_789abc - GPU memory exhausted',
      details: {
        request_id: 'req_789abc',
        model_version: 'v2.1.3',
        gpu_memory: '11.2GB/12GB',
        error_code: 'CUDA_OUT_OF_MEMORY',
        stack_trace: 'RuntimeError: CUDA out of memory. Tried to allocate 2.00 GiB...',
        user_id: 'user_12345'
      },
      tags: ['gpu', 'memory', 'inference']
    },
    {
      id: 2,
      timestamp: '2024-12-19 14:31:58.127',
      level: 'warning',
      source: 'data_pipeline',
      message: 'Data quality check failed - 15% missing values detected in feature_x',
      details: {
        batch_id: 'batch_456def',
        missing_percentage: 15.3,
        affected_features: ['feature_x', 'feature_y'],
        record_count: 10000,
        data_source: 'prod_database'
      },
      tags: ['data_quality', 'features', 'validation']
    },
    {
      id: 3,
      timestamp: '2024-12-19 14:31:42.891',
      level: 'info',
      source: 'inference_engine',
      message: 'Successful batch prediction completed for 5000 samples',
      details: {
        batch_id: 'batch_123ghi',
        sample_count: 5000,
        avg_latency: '45ms',
        accuracy_score: 0.94,
        model_version: 'v2.1.3'
      },
      tags: ['batch', 'prediction', 'success']
    }
  ];

  const filteredLogs = logEntries.filter(log => {
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    const matchesSource = selectedSource === 'all' || log.source === selectedSource;
    const matchesSearch = searchQuery === '' || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesLevel && matchesSource && matchesSearch;
  });

  const getLevelColor = (level) => {
    switch(level) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'debug': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  const getLevelIcon = (level) => {
    switch(level) {
      case 'error': return <XCircle size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'info': return <CheckCircle size={16} />;
      case 'debug': return <Activity size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const logLevelCounts = {
    error: logEntries.filter(log => log.level === 'error').length,
    warning: logEntries.filter(log => log.level === 'warning').length,
    info: logEntries.filter(log => log.level === 'info').length,
    debug: logEntries.filter(log => log.level === 'debug').length
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>System Logs</h2>
        <p>Real-time system logs with advanced filtering and debugging tools</p>
      </div>

      {/* Log Summary Cards */}
      <div className="logs-summary">
        <div className="summary-card error">
          <div className="summary-icon">
            <XCircle size={20} />
          </div>
          <div className="summary-content">
            <h4>{logLevelCounts.error}</h4>
            <p>Errors (Last Hour)</p>
          </div>
        </div>
        <div className="summary-card warning">
          <div className="summary-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="summary-content">
            <h4>{logLevelCounts.warning}</h4>
            <p>Warnings (Last Hour)</p>
          </div>
        </div>
        <div className="summary-card info">
          <div className="summary-icon">
            <CheckCircle size={20} />
          </div>
          <div className="summary-content">
            <h4>{logLevelCounts.info}</h4>
            <p>Info Messages</p>
          </div>
        </div>
        <div className="summary-card success">
          <div className="summary-icon">
            <Activity size={20} />
          </div>
          <div className="summary-content">
            <h4>Live</h4>
            <p>Auto-refresh {autoRefresh ? 'ON' : 'OFF'}</p>
          </div>
        </div>
      </div>

      {/* Controls and Filters */}
      <div className="logs-controls">
        <div className="controls-left">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search logs, tags, or error codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <select 
            value={selectedLevel} 
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="filter-select"
          >
            {logLevels.map(level => (
              <option key={level} value={level}>
                {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>

          <select 
            value={selectedSource} 
            onChange={(e) => setSelectedSource(e.target.value)}
            className="filter-select"
          >
            {logSources.map(source => (
              <option key={source} value={source}>
                {source === 'all' ? 'All Sources' : source.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="controls-right">
          <button 
            className={`auto-refresh-btn ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity size={16} />
            Auto-refresh
          </button>
        </div>
      </div>

      <div className="logs-layout">
        {/* Main Logs List */}
        <div className="logs-list">
          <div className="logs-header">
            <h3>System Logs ({filteredLogs.length} entries)</h3>
          </div>

          <div className="logs-container">
            {filteredLogs.map(log => (
              <div 
                key={log.id} 
                className={`log-entry ${log.level} ${selectedLog?.id === log.id ? 'selected' : ''}`}
                onClick={() => setSelectedLog(log)}
              >
                <div className="log-main">
                  <div className="log-header">
                    <div className="log-level" style={{ color: getLevelColor(log.level) }}>
                      {getLevelIcon(log.level)}
                      <span>{log.level.toUpperCase()}</span>
                    </div>
                    <div className="log-timestamp">{log.timestamp}</div>
                  </div>
                  
                  <div className="log-message">{log.message}</div>
                  
                  <div className="log-meta">
                    <div className="log-source">{log.source}</div>
                    <div className="log-tags">
                      {log.tags.map(tag => (
                        <span key={tag} className="log-tag">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedLog?.id === log.id && (
                  <div className="log-details">
                    <h4>Log Details</h4>
                    <div className="details-grid">
                      {Object.entries(log.details).map(([key, value]) => (
                        <div key={key} className="detail-item">
                          <span className="detail-key">{key.replace('_', ' ')}:</span>
                          <span className="detail-value">{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Log Analytics Sidebar */}
        <div className="logs-sidebar">
          <div className="sidebar-section">
            <h4>Log Distribution</h4>
            <div className="log-chart">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { level: 'Error', count: logLevelCounts.error, color: '#ef4444' },
                  { level: 'Warning', count: logLevelCounts.warning, color: '#f59e0b' },
                  { level: 'Info', count: logLevelCounts.info, color: '#3b82f6' }
                ]}>
                  <XAxis dataKey="level" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const ModelPulse = () => {
  const [currentPage, setCurrentPage] = useState('overview');

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'training', label: 'Training', icon: TrendingUp },
    { id: 'spatial', label: 'Spatial', icon: Globe },
    { id: 'drift', label: 'Drift', icon: Activity },
    { id: 'logs', label: 'Logs', icon: FileText }
  ];

  const renderPage = () => {
    switch(currentPage) {
      case 'overview': return <OverviewPage />;
      case 'alerts': return <AlertsPage />;
      case 'training': return <TrainingPage />;
      case 'spatial': return <SpatialPage />;
      case 'drift': return <DriftPage />;
      case 'logs': return <LogsPage />;
      default: return <OverviewPage />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-section">
          <div className="logo">
            <div className="logo-icon"></div>
            <h1>ModelPulse</h1>
          </div>
        </div>

        <nav className="nav">
          {menuItems.map(item => {
            const IconComponent = item.icon;
            return (
              <div 
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => setCurrentPage(item.id)}
              >
                <IconComponent size={20} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="interface-placeholder">
          <div className="placeholder-text">Live Model Metrics</div>
          <div className="metric-mini-grid">
            <div className="mini-metric">
              <span className="mini-label">Uptime</span>
              <span className="mini-value">99.8%</span>
            </div>
            <div className="mini-metric">
              <span className="mini-label">Requests/s</span>
              <span className="mini-value">1.2K</span>
            </div>
            <div className="mini-metric">
              <span className="mini-label">Avg Latency</span>
              <span className="mini-value">45ms</span>
            </div>
            <div className="mini-metric">
              <span className="mini-label">Error Rate</span>
              <span className="mini-value">0.02%</span>
            </div>
          </div>
          <div className="placeholder-bars">
            <div className="bar-row">
              <div className="bar long"></div>
              <div className="bar long light"></div>
            </div>
            <div className="bar-row">
              <div className="bar short"></div>
              <div className="bar short light"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {renderPage()}
      </div>

      <style>{`
        .app-container {
          display: flex;
          height: 100vh;
          background: #0f0f0f;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #ffffff;
        }

        .critical-alert-banner {
          background: linear-gradient(90deg, #ef4444, #dc2626);
          border-radius: 12px;
          margin-bottom: 24px;
          padding: 16px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .alert-banner-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .alert-banner-icon {
          color: #ffffff;
        }

        .alert-banner-text {
          flex: 1;
          color: #ffffff;
          font-weight: 500;
        }

        .alert-banner-action {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 8px 16px;
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .alert-banner-actions {
          display: flex;
          gap: 8px;
        }

        .alert-banner-action.secondary {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: linear-gradient(180deg, #1a1a1a 0%, #161616 100%);
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-content h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 16px 0;
          color: #ffffff;
        }

        .modal-content p {
          color: #9ca3af;
          margin: 0 0 24px 0;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .modal-actions button {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 10px 20px;
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-actions button.primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          border-color: #8b5cf6;
          color: #ffffff;
        }

        .investigation-details {
          background: rgba(139, 92, 246, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }

        .alert-timeline {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }

        .timeline-item {
          display: flex;
          gap: 16px;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .timeline-item:last-child {
          border-bottom: none;
        }

        .sidebar {
          width: 280px;
          background: linear-gradient(180deg, #1a1a1a 0%, #161616 100%);
          border-right: 1px solid #2a2a2a;
          display: flex;
          flex-direction: column;
          padding: 24px;
          gap: 32px;
        }

        .logo-section {
          border-bottom: 1px solid #2a2a2a;
          padding-bottom: 24px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          border-radius: 8px;
        }

        .logo h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #9ca3af;
        }

        .nav-item:hover {
          background: rgba(139, 92, 246, 0.1);
          color: #ffffff;
        }

        .nav-item.active {
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          color: #ffffff;
        }

        .interface-placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
          background: rgba(139, 92, 246, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .placeholder-text {
          font-size: 14px;
          color: #8b5cf6;
          text-align: center;
          font-weight: 600;
        }

        .metric-mini-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .mini-metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 6px;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .mini-label {
          font-size: 10px;
          color: #9ca3af;
          margin-bottom: 4px;
        }

        .mini-value {
          font-size: 14px;
          font-weight: 700;
          color: #8b5cf6;
        }

        .placeholder-bars {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .bar-row {
          display: flex;
          gap: 8px;
        }

        .bar {
          height: 4px;
          background: linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%);
          border-radius: 2px;
        }

        .bar.long {
          flex: 2;
        }

        .bar.short {
          flex: 1;
        }

        .bar.light {
          opacity: 0.3;
        }

        .main-content {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
        }

        .page-content {
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .page-header h2 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #ffffff 0%, #9ca3af 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-header p {
          color: #9ca3af;
          margin: 0;
          font-size: 16px;
        }

        .metrics-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .metric-card {
          background: linear-gradient(180deg, #1a1a1a 0%, #161616 100%);
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .metric-card.critical {
          border-left: 4px solid #ef4444;
        }

        .metric-card.warning {
          border-left: 4px solid #f59e0b;
        }

        .metric-card.good {
          border-left: 4px solid #10b981;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .metric-header h4 {
          font-size: 14px;
          font-weight: 500;
          margin: 0;
          color: #9ca3af;
        }

        .trend-up {
          color: #10b981;
        }

        .trend-down {
          color: #ef4444;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 700;
          margin: 8px 0;
        }

        .metric-threshold {
          font-size: 12px;
          color: #6b7280;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .chart-container {
          background: linear-gradient(180deg, #1a1a1a 0%, #161616 100%);
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          padding: 24px;
          height: 300px;
          display: flex;
          flex-direction: column;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .chart-header h3 {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
          color: #9ca3af;
          letter-spacing: 0.5px;
        }

        .chart-actions {
          display: flex;
          gap: 8px;
        }

        .status-indicator {
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
        }

        .status-indicator.critical {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .status-indicator.warning {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .status-indicator.good {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .chart-insight {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding: 8px 12px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 8px;
          font-size: 12px;
          color: #9ca3af;
        }

        .recommendations-section {
          margin-top: 32px;
        }

        .recommendations-section h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 16px 0;
          color: #ffffff;
        }

        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .recommendation-card {
          background: linear-gradient(180deg, #1a1a1a 0%, #161616 100%);
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .recommendation-card.urgent {
          border-left: 4px solid #ef4444;
        }

        .recommendation-card.warning {
          border-left: 4px solid #f59e0b;
        }

        .recommendation-card.info {
          border-left: 4px solid #3b82f6;
        }

        .recommendation-icon {
          flex-shrink: 0;
          padding: 8px;
          border-radius: 8px;
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .recommendation-content {
          flex: 1;
        }

        .recommendation-content h4 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #ffffff;
        }

        .recommendation-content p {
          font-size: 14px;
          color: #9ca3af;
          margin: 0 0 12px 0;
        }

        .recommendation-action {
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          color: #ffffff;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .recommendation-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .recommendation-action.loading {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .recommendation-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Alert Page Styles */
        .alerts-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .alerts-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .summary-card {
          background: linear-gradient(180deg, #1a1a1a 0%, #161616 100%);
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          border-left: 4px solid;
        }

        .summary-card.error {
          border-left-color: #ef4444;
        }

        .summary-card.warning {
          border-left-color: #f59e0b;
        }

        .summary-card.success {
          border-left-color: #10b981;
        }

        .summary-card.info {
          border-left-color: #3b82f6;
        }

        .summary-card h4 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #ffffff;
        }

        .summary-card p {
          font-size: 14px;
          color: #9ca3af;
          margin: 0;
        }

        .summary-trend {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 4px;
          display: block;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alert-item {
          display: flex;
          align-items: center;
          gap: 16px;
          background: linear-gradient(180deg, #1a1a1a 0%, #161616 100%);
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 16px;
          border-left: 4px solid;
        }

        .alert-item.error {
          border-left-color: #ef4444;
        }

        .alert-item.warning {
          border-left-color: #f59e0b;
        }

        .alert-icon {
          width: 20px;
          height: 20px;
        }

        .alert-icon.error {
          color: #ef4444;
        }

        .alert-icon.warning {
          color: #f59e0b;
        }

        .alert-content {
          flex: 1;
        }

        .alert-message {
          font-size: 14px;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .alert-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .alert-time {
          font-size: 12px;
          color: #9ca3af;
        }

        .alert-severity {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
        }

        .alert-severity.high {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .alert-severity.medium {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .alert-feature {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
        }

        .alert-region {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
        }

        .alert-actions {
          display: flex;
          gap: 8px;
        }

        .alert-action-btn {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 6px;
          padding: 6px 12px;
          color: #8b5cf6;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .alert-action-btn:hover {
          background: rgba(139, 92, 246, 0.2);
        }

        /* Enhanced Training Page Styles */
        .enhanced-training-banner {
          background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
          border-radius: 16px;
          margin-bottom: 32px;
          padding: 24px;
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.2);
        }

        .banner-content {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .banner-icon {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.15);
          padding: 12px;
          border-radius: 12px;
        }

        .banner-text {
          flex: 1;
          color: #ffffff;
          font-weight: 600;
          font-size: 16px;
        }

        .banner-button {
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 12px 24px;
          color: #ffffff;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .banner-button:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }

        .enhanced-performance-grid {
          background: linear-gradient(135deg, #1a1a1a 0%, #161616 50%, #121212 100%);
          border: 1px solid #2a2a2a;
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 40px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .performance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .performance-header h3 {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
        }

        .phase-selector {
          display: flex;
          gap: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 6px;
        }

        .phase-btn {
          background: transparent;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          color: #9ca3af;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .phase-btn:hover {
          background: rgba(139, 92, 246, 0.1);
          color: #ffffff;
        }

        .phase-btn.active {
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          color: #ffffff;
        }

        .performance-overview {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .performance-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .summary-stat {
          text-align: center;
          padding: 24px 20px;
          background: rgba(139, 92, 246, 0.08);
          border-radius: 16px;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .stat-label {
          display: block;
          font-size: 13px;
          color: #9ca3af;
          margin-bottom: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .stat-value {
          display: block;
          font-size: 28px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .stat-detail {
          display: block;
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
        }

        .phase-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .phase-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          padding: 24px;
        }

        .phase-card.forward {
          border-left: 4px solid #10b981;
        }

        .phase-card.backward {
          border-left: 4px solid #ef4444;
        }

        .phase-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .phase-header h4 {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .phase-time {
          font-size: 20px;
          font-weight: 700;
        }

        .phase-card.forward .phase-time {
          color: #10b981;
        }

        .phase-card.backward .phase-time {
          color: #ef4444;
        }

        .phase-metrics {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .phase-metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
        }

        .phase-metric span:first-child {
          color: #9ca3af;
          font-weight: 500;
        }

        .phase-metric span:last-child {
          color: #ffffff;
          font-weight: 700;
        }

        .performance-insight {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          background: rgba(139, 92, 246, 0.12);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 16px;
        }

        .insight-icon {
          font-size: 28px;
        }

        .insight-content h4 {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 8px 0;
        }

        .insight-content p {
          font-size: 14px;
          color: #d1d5db;
          margin: 0;
        }

        .phase-detail {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid #2a2a2a;
          border-radius: 20px;
          padding: 32px;
        }

        .phase-detail.forward {
          border-left: 4px solid #10b981;
        }

        .phase-detail.backward {
          border-left: 4px solid #ef4444;
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .detail-header h4 {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .detail-status .status-badge {
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.good {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 24px;
        }

        .detail-card {
          background: rgba(139, 92, 246, 0.08);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: 16px;
          padding: 24px;
        }

        .detail-card h5 {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 20px 0;
        }

        .detail-metrics {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .detail-metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
        }

        .detail-metric span:first-child {
          color: #9ca3af;
          font-weight: 500;
        }

        .metric-highlight {
          color: #8b5cf6 !important;
          font-weight: 700 !important;
        }

        .optimization-suggestions {
          margin-top: 24px;
        }

        .optimization-suggestions h5 {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px 0;
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .suggestion-item {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .suggestion-item.good {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .suggestion-item.info {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .training-enhanced-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .chart-container.large {
          grid-column: span 2;
          height: 400px;
        }

        .training-recommendations {
          margin-bottom: 32px;
        }

        .training-recommendations h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 16px 0;
          color: #ffffff;
        }

        /* Spatial Page Styles */
        .spatial-status-banner {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 1px solid #3a3a3a;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .status-summary {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .status-item.healthy .status-dot {
          background: #10b981;
        }

        .status-item.warning .status-dot {
          background: #f59e0b;
        }

        .status-item.error .status-dot {
          background: #ef4444;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-metric {
          color: #e5e7eb;
          font-size: 14px;
          font-weight: 500;
        }

        .spatial-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 24px;
          margin-bottom: 32px;
        }

        .globe-container {
          background: linear-gradient(180deg, #1a1a1a 0%, #161616 100%);
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          padding: 24px;
          height: 500px;
          display: flex;
          flex-direction: column;
        }

        .globe-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .globe-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .globe-controls {
          display: flex;
          gap: 8px;
        }

        .control-btn {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 6px;
          padding: 6px 12px;
          color: #8b5cf6;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .control-btn.active {
          background: rgba(139, 92, 246, 0.3);
          border-color: #8b5cf6;
          color: #ffffff;
        }

        .flat-map-container {
          flex: 1;
          background: #0a0a0a;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }

        .world-map {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%);
        }

        .map-svg {
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
        }

        .deployment-point {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .deployment-point:hover .deployment-circle {
          r: 16;
          stroke-width: 3;
        }

        .deployment-point:hover .deployment-glow {
          opacity: 0.4;
          r: 25;
        }

        .globe-canvas {
          flex: 1;
          border-radius: 8px;
          overflow: hidden;
        }

        .globe-legend {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 16px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #e5e7eb;
          font-weight: 500;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-dot.healthy {
          background: #10b981;
        }

        .legend-dot.warning {
          background: #f59e0b;
        }

        .legend-dot.error {
          background: #ef4444;
        }

        .deployment-details {
          background: linear-gradient(180deg, #1a1a1a 0%, #161616 100%);
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          padding: 24px;
          height: 500px;
          overflow-y: auto;
        }

        .deployment-details h3 {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px 0;
        }

        .deployment-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .deployment-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .deployment-card:hover {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
        }

        .deployment-card.selected {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
        }

        .deployment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .deployment-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #f3f4f6;
        }

        .status-indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .deployment-status {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 500;
        }

        .deployment-status.healthy {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .deployment-status.warning {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .deployment-status.error {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .deployment-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }

        .metric {
          text-align: center;
        }

        .metric-label {
          display: block;
          font-size: 11px;
          color: #9ca3af;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 16px;
          font-weight: 700;
          color: #f9fafb;
        }

        .deployment-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #2a2a2a;
        }

        .action-btn {
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          color: #ffffff;
        }

        .action-btn.secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #2a2a2a;
          color: #9ca3af;
        }

        .action-btn:hover {
          transform: translateY(-1px);
        }

        .spatial-metrics {
          margin-top: 32px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }

        .metric-panel {
          background: linear-gradient(180deg, #1a1a1a 0%, #161616 100%);
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          padding: 24px;
        }

        .metric-panel h4 {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px 0;
        }

        /* Drift Page Styles */
        .drift-alert-banner {
          background: linear-gradient(90deg, #ef4444, #dc2626);
          border-radius: 12px;
          margin-bottom: 24px;
          padding: 16px;
          animation: pulse 2s infinite;
        }

        .alert-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .alert-text {
          flex: 1;
          color: #ffffff;
          font-weight: 500;
        }

        .alert-action {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 8px 16px;
          color: #ffffff;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .alert-action:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .drift-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .drift-layout {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }

        .features-panel {
          background: linear-gradient(180deg, #1a1a1a 0%, #161616 100%);
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          padding: 24px;
          height: fit-content;
          max-height: 700px;
          overflow-y: auto;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #2a2a2a;
        }

        .panel-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .time-select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          padding: 6px 12px;
          color: #ffffff;
          font-size: 12px;
        }

        .features-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .feature-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .feature-item:hover {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
        }

        .feature-item.selected {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
        }

        .feature-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .feature-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .feature-name {
          font-weight: 500;
          color: #ffffff;
          font-size: 14px;
        }

        .feature-type {
          font-size: 11px;
          color: #9ca3af;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 3px;
          width: fit-content;
        }

        .feature-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 3px;
        }

        .feature-drift {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .drift-label {
          font-size: 12px;
          color: #9ca3af;
        }

        .drift-value {
          font-size: 14px;
          font-weight: 600;
        }

        .drift-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .drift-progress {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .analysis-panel {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .analysis-header h3 {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .analysis-actions {
          display: flex;
          gap: 8px;
        }

        .chart-legend {
          display: flex;
          gap: 16px;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 24px;
        }

        .stat-card {
          background: linear-gradient(180deg, #1a1a1a 0%, #161616 100%);
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .stat-card h5 {
          font-size: 12px;
          color: #9ca3af;
          margin: 0 0 8px 0;
          font-weight: 500;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          margin: 8px 0;
        }

        .stat-value.critical {
          color: #ef4444;
        }

        .stat-value.warning {
          color: #f59e0b;
        }

        .stat-value.good {
          color: #10b981;
        }

        .stat-description {
          font-size: 11px;
          color: #9ca3af;
        }

        .drift-recommendations {
          margin-top: 48px;
        }

        .drift-recommendations h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 24px 0;
          color: #ffffff;
          background: linear-gradient(135deg, #ffffff 0%, #9ca3af 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Logs Page Styles */
        .logs-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .logs-summary .summary-card {
          background: linear-gradient(180deg, #1a1a1a 0%, #161616 100%);
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-left: 4px solid;
        }

        .logs-summary .summary-card.error {
          border-left-color: #ef4444;
        }

        .logs-summary .summary-card.warning {
          border-left-color: #f59e0b;
        }

        .logs-summary .summary-card.info {
          border-left-color: #3b82f6;
        }

        .logs-summary .summary-card.success {
          border-left-color: #10b981;
        }

        .summary-icon {
          padding: 8px;
          border-radius: 8px;
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .summary-content h4 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: #ffffff;
        }

        .summary-content p {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }

        .logs-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(180deg, #1a1a1a 0%, #161616 100%);
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .controls-left {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .controls-right {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .search-container {
          position: relative;
          min-width: 300px;
        }

        .search-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 10px 16px;
          color: #ffffff;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
        }

        .search-input::placeholder {
          color: #6b7280;
        }

        .filter-select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 10px 16px;
          color: #ffffff;
          font-size: 14px;
          min-width: 120px;
          cursor: pointer;
        }

        .filter-select:focus {
          outline: none;
          border-color: #8b5cf6;
        }

        .auto-refresh-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          padding: 10px 16px;
          color: #8b5cf6;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .auto-refresh-btn.active {
          background: rgba(139, 92, 246, 0.2);
          border-color: #8b5cf6;
        }

        .auto-refresh-btn:hover {
          background: rgba(139, 92, 246, 0.2);
        }

        .logs-layout {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 24px;
        }

        .logs-list {
          background: linear-gradient(180deg, #1a1a1a 0%, #161616 100%);
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          padding: 24px;
          height: 600px;
          display: flex;
          flex-direction: column;
        }

        .logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #2a2a2a;
        }

        .logs-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .logs-container {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .log-entry {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 4px solid;
        }

        .log-entry.error {
          border-left-color: #ef4444;
        }

        .log-entry.warning {
          border-left-color: #f59e0b;
        }

        .log-entry.info {
          border-left-color: #3b82f6;
        }

        .log-entry.debug {
          border-left-color: #9ca3af;
        }

        .log-entry:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: #8b5cf6;
        }

        .log-entry.selected {
          background: rgba(139, 92, 246, 0.1);
          border-color: #8b5cf6;
        }

        .log-main {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .log-level {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .log-timestamp {
          font-size: 11px;
          color: #6b7280;
          font-family: 'Courier New', monospace;
        }

        .log-message {
          color: #ffffff;
          font-size: 14px;
          line-height: 1.4;
        }

        .log-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .log-source {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
        }

        .log-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .log-tag {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 500;
        }

        .log-details {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #2a2a2a;
        }

        .log-details h4 {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 12px 0;
        }

        .details-grid {
          display: grid;
          gap: 8px;
          margin-bottom: 16px;
        }

        .detail-item {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 12px;
          font-size: 12px;
        }

        .detail-key {
          color: #9ca3af;
          font-weight: 500;
          text-transform: capitalize;
        }

        .detail-value {
          color: #ffffff;
          font-family: 'Courier New', monospace;
          word-break: break-all;
        }

        .logs-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sidebar-section {
          background: linear-gradient(180deg, #1a1a1a 0%, #161616 100%);
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 20px;
        }

        .sidebar-section h4 {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px 0;
        }

        .log-chart {
          height: 200px;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .spatial-layout {
            grid-template-columns: 1fr;
          }

          .deployment-details {
            height: auto;
            max-height: 400px;
          }

          .drift-layout {
            grid-template-columns: 1fr;
          }

          .features-panel {
            max-height: none;
          }

          .performance-summary {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .phase-comparison {
            grid-template-columns: 1fr;
          }
          
          .detail-grid {
            grid-template-columns: 1fr;
          }
          
          .chart-container.large {
            grid-column: span 1;
          }

          .logs-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .app-container {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            height: auto;
            flex-direction: row;
            padding: 16px;
            gap: 16px;
          }

          .nav {
            flex-direction: row;
            overflow-x: auto;
          }

          .interface-placeholder {
            display: none;
          }

          .main-content {
            padding: 16px;
          }

          .charts-grid {
            grid-template-columns: 1fr;
          }

          .performance-summary {
            grid-template-columns: 1fr;
          }
          
          .banner-content {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }
          
          .performance-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
          
          .enhanced-performance-grid {
            padding: 20px;
          }

          .logs-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .controls-left, .controls-right {
            justify-content: center;
          }

          .search-container {
            min-width: auto;
          }

          .detail-item {
            grid-template-columns: 1fr;
            gap: 4px;
          }

          .logs-summary {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default ModelPulse;