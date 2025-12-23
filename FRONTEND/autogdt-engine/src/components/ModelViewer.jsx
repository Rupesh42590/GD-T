import React from 'react';
import { Monitor, Download, Eye } from 'lucide-react';

const ModelViewer = ({ currentFile }) => {
  const handleDownload = () => {
    if (currentFile && currentFile.resultUrl) {
      const a = document.createElement('a');
      a.href = currentFile.resultUrl;
      a.download = currentFile.resultFileName || `output.${currentFile.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const renderPreview = () => {
    if (!currentFile || !currentFile.resultUrl) {
      return (
        <div style={{ textAlign: 'center', opacity: 0.5 }}>
          <Monitor size={48} style={{ marginBottom: '16px' }} />
          <p>No model loaded</p>
          <p>Upload a 3D file to begin conversion</p>
        </div>
      );
    }

    // Render based on output format
    if (currentFile.format === 'svg') {
      return (
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          maxHeight: '600px',
          overflow: 'auto'
        }}>
          <img 
            src={currentFile.resultUrl} 
            alt="2D Projection" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '550px',
              objectFit: 'contain'
            }}
          />
        </div>
      );
    } else if (currentFile.format === 'png') {
      return (
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          maxHeight: '600px',
          overflow: 'auto'
        }}>
          <img 
            src={currentFile.resultUrl} 
            alt="2D Projection" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '550px',
              objectFit: 'contain'
            }}
          />
        </div>
      );
    } else if (currentFile.format === 'dxf') {
      return (
        <div style={{ 
          textAlign: 'center',
          background: 'white',
          padding: '40px',
          borderRadius: '8px'
        }}>
          <Eye size={64} color="#3b82f6" style={{ marginBottom: '20px' }} />
          <h3>DXF File Generated</h3>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>
            DXF files cannot be previewed in the browser.
            <br />
            Download the file to open it in CAD software.
          </p>
          <button 
            onClick={handleDownload}
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '10px 24px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            <Download size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Download DXF
          </button>
        </div>
      );
    }
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px' 
      }}>
        <h2>Preview & Results</h2>
        {currentFile && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{color: '#10b981', fontSize: '14px', fontWeight: 500}}>
              ✓ {currentFile.fileName}
            </span>
            {currentFile.format !== 'dxf' && (
              <button 
                onClick={handleDownload}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={14} />
                Download
              </button>
            )}
          </div>
        )}
      </div>

      <div className="viewer-placeholder" style={{ minHeight: '500px' }}>
        {renderPreview()}
      </div>
      
      {/* Conversion Info */}
      {currentFile && (
        <div style={{ 
          marginTop: '16px', 
          background: '#f1f5f9', 
          padding: '12px', 
          borderRadius: '6px', 
          fontSize: '13px' 
        }}>
          <strong style={{ display: 'block', marginBottom: '8px' }}>Conversion Details:</strong>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '8px',
            color: '#64748b'
          }}>
            <div>View: <strong style={{ color: '#334155' }}>{currentFile.view}</strong></div>
            <div>Format: <strong style={{ color: '#334155' }}>{currentFile.format.toUpperCase()}</strong></div>
            <div>Render: <strong style={{ color: '#334155' }}>{currentFile.renderMode}</strong></div>
            <div>Status: <strong style={{ color: '#10b981' }}>Complete</strong></div>
          </div>
        </div>
      )}
      
      {/* System Log */}
      <div style={{ 
        marginTop: '16px', 
        background: '#1e293b', 
        color: '#e2e8f0',
        padding: '12px', 
        borderRadius: '6px', 
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <strong style={{ display: 'block', marginBottom: '8px' }}>System Log:</strong>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ color: '#10b981' }}>✓ Backend Connected</li>
          {currentFile && (
            <>
              <li style={{ color: '#10b981' }}>✓ File Uploaded: {currentFile.fileName}</li>
              <li style={{ color: '#10b981' }}>✓ Conversion Complete</li>
              <li style={{ color: '#10b981' }}>✓ Output Generated: {currentFile.resultFileName}</li>
            </>
          )}
          {!currentFile && <li style={{ color: '#94a3b8' }}>⏳ Awaiting file upload...</li>}
        </ul>
      </div>
    </div>
  );
};

export default ModelViewer;