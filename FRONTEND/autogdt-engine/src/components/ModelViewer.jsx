import React from 'react';
import { Monitor } from 'lucide-react';

const ModelViewer = ({ currentFile }) => {
  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h2>Preview & Results</h2>
        {currentFile && <span style={{color: 'green'}}>Active: {currentFile.fileName}</span>}
      </div>

      <div className="viewer-placeholder">
        {currentFile ? (
          <div style={{ textAlign: 'center' }}>
            <Monitor size={48} style={{ marginBottom: '16px' }} />
            <h3>Rendering {currentFile.mode === '3d-to-2d' ? '2D Drawing' : '3D Model'}...</h3>
            <p>Processing complete. (Visualization Engine Loading...)</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', opacity: 0.5 }}>
            <p>No model loaded</p>
            <p>Upload a file to begin automation</p>
          </div>
        )}
      </div>
      
      {/* Simulation of Output Log */}
      <div style={{ marginTop: '20px', background: '#f1f5f9', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
        <strong>System Log:</strong>
        <ul style={{ listStyle: 'none', padding: 0, margin: '5px 0 0' }}>
          <li>✓ System Ready</li>
          {currentFile && <li>✓ Received {currentFile.fileName}</li>}
          {currentFile && <li>✓ GD&T Feature Recognition Started...</li>}
        </ul>
      </div>
    </div>
  );
};

export default ModelViewer;