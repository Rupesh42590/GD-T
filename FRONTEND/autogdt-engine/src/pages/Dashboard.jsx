import React, { useState } from 'react';
import Header from '../components/Header';
import FileUpload from '../components/FileUpload';
import ModelViewer from '../components/ModelViewer';

const Dashboard = () => {
  const [currentFile, setCurrentFile] = useState(null);

  const handleUploadSuccess = (fileData) => {
    setCurrentFile(fileData);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="container dashboard-grid">
        {/* Left Column: Controls */}
        <aside>
          <FileUpload onUploadSuccess={handleUploadSuccess} />
          
          <div className="card" style={{marginTop: '20px'}}>
            <h2>Instructions</h2>
            <p style={{fontSize: '14px', color: '#64748b', lineHeight: '1.5'}}>
              1. Select conversion mode.<br/>
              2. Upload your STEP/DXF file.<br/>
              3. Wait for the AI to identify GD&T layers.<br/>
              4. Download the converted output.
            </p>
          </div>
        </aside>

        {/* Right Column: Visualization */}
        <main>
          <ModelViewer currentFile={currentFile} />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;