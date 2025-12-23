import React, { useState } from 'react';
import { UploadCloud, FileType } from 'lucide-react';
import { convertFile } from '../services/api';

const FileUpload = ({ onUploadSuccess, onError }) => {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('3d-to-2d');
  const [view, setView] = useState('top');
  const [outputFormat, setOutputFormat] = useState('svg');
  const [renderMode, setRenderMode] = useState('filled');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }
    
    setLoading(true);
    try {
      console.log(`Converting ${file.name} - View: ${view}, Format: ${outputFormat}, Mode: ${renderMode}`);
      
      const result = await convertFile(file, mode, view, outputFormat, renderMode);
      
      onUploadSuccess({
        fileName: file.name,
        mode: mode,
        view: view,
        format: outputFormat,
        renderMode: renderMode,
        resultUrl: result.url,
        resultFileName: result.fileName,
        resultBlob: result.blob
      });
      
    } catch (error) {
      console.error("Conversion error:", error);
      const errorMessage = error.message || "Failed to process file";
      alert(errorMessage);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2><FileType size={18} style={{marginRight: '8px'}}/> Configuration</h2>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px'}}>
          Conversion Mode
        </label>
        <select 
          value={mode} 
          onChange={(e) => setMode(e.target.value)}
          style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
        >
          <option value="3d-to-2d">3D Model → 2D Drawing</option>
          <option value="2d-to-3d">2D Drawing → 3D Model (Coming Soon)</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px'}}>
          View Angle
        </label>
        <select 
          value={view} 
          onChange={(e) => setView(e.target.value)}
          style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
          disabled={mode !== '3d-to-2d'}
        >
          <option value="top">Top View</option>
          <option value="front">Front View</option>
          <option value="side">Side View</option>
          <option value="isometric">Isometric View</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px'}}>
          Output Format
        </label>
        <select 
          value={outputFormat} 
          onChange={(e) => setOutputFormat(e.target.value)}
          style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
          disabled={mode !== '3d-to-2d'}
        >
          <option value="svg">SVG (Vector)</option>
          <option value="png">PNG (Raster)</option>
          <option value="dxf">DXF (CAD)</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px'}}>
          Render Mode
        </label>
        <select 
          value={renderMode} 
          onChange={(e) => setRenderMode(e.target.value)}
          style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
          disabled={mode !== '3d-to-2d'}
        >
          <option value="filled">Filled (Solid)</option>
          <option value="wireframe">Wireframe (Edges)</option>
          <option value="outline">Outline (Border)</option>
        </select>
      </div>

      <div className="upload-zone">
        <input 
          type="file" 
          id="fileInput" 
          onChange={handleFileChange} 
          accept=".stl,.obj,.ply,.off,.step,.stp,.glb,.gltf"
          style={{ display: 'none' }} 
        />
        <label htmlFor="fileInput" style={{cursor: 'pointer'}}>
          <UploadCloud size={40} color="#94a3b8" />
          <p style={{ margin: '10px 0 0', color: '#64748b' }}>
            {file ? file.name : "Click to Upload 3D Model"}
          </p>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Supported: STL, OBJ, PLY, STEP
          </span>
        </label>
      </div>

      <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? "Processing..." : "Convert to 2D"}
      </button>
    </div>
  );
};

export default FileUpload;