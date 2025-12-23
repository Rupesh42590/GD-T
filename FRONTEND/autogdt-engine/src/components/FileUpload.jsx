import React, { useState } from 'react';
import { UploadCloud, FileType } from 'lucide-react';

const FileUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('3d-to-2d'); // Default mode
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return alert("Please select a file first!");
    
    setLoading(true);
    try {
      // We are mocking the success for now since Backend isn't ready
      console.log(`Uploading ${file.name} for ${mode} conversion...`);
      
      // Simulating API call delay
      setTimeout(() => {
        onUploadSuccess({ fileName: file.name, mode: mode });
        setLoading(false);
      }, 1500);

      // ACTUAL CODE (Uncomment when Backend is ready):
      // const result = await uploadFile(file, mode);
      // onUploadSuccess(result);
      
    } catch (error) {
      alert("Failed to process file");
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2><FileType size={18} style={{marginRight: '8px'}}/> Configuration</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{display: 'block', marginBottom: '8px', fontWeight: 500}}>Conversion Mode</label>
        <select 
          value={mode} 
          onChange={(e) => setMode(e.target.value)}
          style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
        >
          <option value="3d-to-2d">3D Model → 2D Drawing</option>
          <option value="2d-to-3d">2D Drawing → 3D Model</option>
        </select>
      </div>

      <div className="upload-zone">
        <input 
          type="file" 
          id="fileInput" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
        />
        <label htmlFor="fileInput">
          <UploadCloud size={40} color="#94a3b8" />
          <p style={{ margin: '10px 0 0', color: '#64748b' }}>
            {file ? file.name : "Click to Upload CAD/Drawing"}
          </p>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Supported: STEP, IGES, DXF, PDF
          </span>
        </label>
      </div>

      <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? "Processing..." : "Generate Models"}
      </button>
    </div>
  );
};

export default FileUpload;