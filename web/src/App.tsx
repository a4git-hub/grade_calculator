import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Settings, Sparkles } from 'lucide-react';

function App() {
  const [uuid, setUuid] = useState<string>('');

  useEffect(() => {
    // Generate a temporary UUID for this browser session
    const newUuid = crypto.randomUUID();
    setUuid(newUuid);

    // In the future, this is where we will connect to Firebase
    // and listen for data arriving at /syncs/{newUuid}
  }, []);

  if (!uuid) return null;

  return (
    <div className="login-container">
      <div className="shape-1" />
      <div className="shape-2" />
      
      <div className="login-card">
        <div className="login-left">
          <div className="logo-wrap">
            <div className="logo-icon">
              <Sparkles size={20} color="#000" />
            </div>
            <div className="logo-text">Lumina Web</div>
          </div>
          
          <h1 className="login-title">Your grades,<br/>on the big screen.</h1>
          <p className="login-subtitle">
            Scan the QR code with your Lumina iOS app to securely sync your Infinite Campus dashboard.
          </p>
          
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-text">Open the <strong>Lumina app</strong> on your iPhone.</div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-text">Tap the <strong>Settings</strong> <Settings size={14} style={{display:'inline', marginBottom:'-2px'}}/> icon in the top right.</div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-text">Tap <strong>"Lumina Web Sync"</strong> and point your camera at this screen.</div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="qr-container">
            <QRCode 
              value={uuid} 
              size={240}
              bgColor="#ffffff"
              fgColor="#09090b"
              level="Q"
            />
          </div>
          <div className="scan-status">
            <div className="pulse-dot" />
            Waiting for scan...
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
