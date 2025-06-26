import React from 'react';
import './ResizableFrame.css';

// Import the frame parts
import frameTL from './assets/frameTL.png';
import frameTM from './assets/frameTM.png';
import frameTR from './assets/frameTR.png';
import frameML from './assets/frameML.png';
import frameMM from './assets/frameMM.png';
import frameMR from './assets/frameMR.png';
import frameBL from './assets/frameBL.png';
import frameBM from './assets/frameBM.png';
import frameBR from './assets/frameBR.png';

export default function ResizableFrame({ width = 200, height = 100, children }) {
  const cornerSize = 32; // change if your corners aren't 16px
  const contentWidth = width - 2 * cornerSize;
  const contentHeight = height - 2 * cornerSize;

  return (
    <div className="frame-container" style={{ width, height }}>
      {/* Top Row */}
      <div className="frame-row">
        <img src={frameTL} className="corner" alt="top-left" />
        <div
          className="edge horizontal"
          style={{
            backgroundImage: `url(${frameTM})`,
            width: contentWidth,
          }}
        />
        <img src={frameTR} className="corner" alt="top-right" />
      </div>

      {/* Middle Row */}
      <div className="frame-row">
        <div
          className="edge vertical"
          style={{
            backgroundImage: `url(${frameML})`,
            height: contentHeight,
          }}
        />
        <div
          className="center"
          style={{
            backgroundImage: `url(${frameMM})`,
            width: contentWidth,
            height: contentHeight,
          }}
        >
          {children}
        </div>
        <div
          className="edge vertical"
          style={{
            backgroundImage: `url(${frameMR})`,
            height: contentHeight,
          }}
        />
      </div>

      {/* Bottom Row */}
      <div className="frame-row">
        <img src={frameBL} className="corner" alt="bottom-left" />
        <div
          className="edge horizontal"
          style={{
            backgroundImage: `url(${frameBM})`,
            width: contentWidth,
          }}
        />
        <img src={frameBR} className="corner" alt="bottom-right" />
      </div>
    </div>
  );
}
