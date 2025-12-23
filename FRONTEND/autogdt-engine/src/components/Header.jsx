import React from 'react';
import { Box } from 'lucide-react';

const Header = () => {
  return (
    <header className="header">
      <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Box size={24} color="#3b82f6" />
        AutoGD&T Engine
      </div>
      <nav>
        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>v1.0.0 Alpha</span>
      </nav>
    </header>
  );
};

export default Header;