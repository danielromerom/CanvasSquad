import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '../App' // Adjust path if needed
import '../index.css'

function injectAgency() {
  // 1. Target the Native Canvas Sidebar
  const mainLayout = document.getElementById('not_right_side');
  const rootId = 'agency-native-widget';

  // Safety Check: Does the sidebar exist?
  if (mainLayout && !document.getElementById(rootId)) {
    
    // 2. Create our container
    const root = document.createElement('div');
    root.id = rootId;
    
    root.style.width = '300px'; 
    root.style.minWidth = '300px';
    root.style.marginLeft = '24px'; // Standard Canvas gap
    root.style.flexShrink = '0'; 
    root.style.display = 'block';

    // 4. PREPEND it. This puts it at the TOP of the sidebar (above "To Do")
    mainLayout.appendChild(root);

    // 5. Render React
    createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

// Run immediately
injectAgency();

// Run periodically because Canvas is a "Single Page App" 
// (If you click "Dashboard" -> "Courses" -> "Dashboard", the sidebar might rebuild)
setInterval(injectAgency, 2000);