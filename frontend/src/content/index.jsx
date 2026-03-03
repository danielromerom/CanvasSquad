import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import '../styles.css';
import '../index.css';


function injectAgency() {
  const mainLayout = document.getElementById('main');
  const rootId = 'agency-native-widget';

  if (mainLayout && !document.getElementById(rootId)) {
    const root = document.createElement('div');
    root.id = rootId;

    // ⚡️ FIX: Use strict inline styles to fight Tailwind defaults
    Object.assign(root.style, {
      width: '300px',
      minWidth: '300px',
      maxWidth: '300px', // Added safety
      flexShrink: '0',
      display: 'none',    // Tailwind might try to make it something else
      marginLeft: '24px',
      marginRight: '24px',
      height: 'fit-content',
      position: 'static',  // Ensure it doesn't float/overlay
      zIndex: '1'          // Ensure it sits in the flow
    });

    mainLayout.appendChild(root);

    createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

setInterval(() => {
    // ... (Your existing detection logic) ...
   const path = window.location.pathname;
    
    // Updated detection logic
    const isAssignment = path.includes('/assignments/') && !path.includes('/syllabus');
    const isDashboard = path === '/' || path === '/dashboard';
    
    // New Check: Matches /courses/123 or /courses/123/assignments (but not a specific assignment)
    const isCourseView = path.match(/^\/courses\/\d+(\/assignments)?\/?$/);

    const mainLayout = document.getElementById('main');
    const myWidget = document.getElementById('agency-native-widget');
    
    const nativeSidebarWrapper = document.getElementById('right-side-wrapper');

    // The widget should now show on Dashboard, Assignment pages, or Course pages
    const shouldShowWidget = isDashboard || isAssignment || isCourseView;

    if (myWidget) {
        myWidget.style.display = shouldShowWidget ? 'block' : 'none';
    } else if (shouldShowWidget) {
        injectAgency(); 
    }

    // ⚡️ FIX: Reinforce the Flex container on #main
    if (mainLayout) {
        // We use setProperty to ensure priority over any Tailwind utility classes
        mainLayout.style.setProperty('display', 'flex', 'important');
        mainLayout.style.setProperty('flex-direction', 'row', 'important');
        mainLayout.style.setProperty('align-items', 'flex-start', 'important');
        mainLayout.style.setProperty('width', '100%', 'important');
        // Ensure no weird overflow behavior from Tailwind
        mainLayout.style.setProperty('box-sizing', 'border-box', 'important'); 
    }

    // ... (Your existing Sidebar Logic) ...
    if (nativeSidebarWrapper) {
        nativeSidebarWrapper.style.setProperty('position', 'static', 'important');
        nativeSidebarWrapper.style.display = 'block';
        nativeSidebarWrapper.style.width = 'auto'; 
        nativeSidebarWrapper.style.minWidth = '250px'; 
        nativeSidebarWrapper.style.maxWidth = '285px'; 
        nativeSidebarWrapper.style.flexShrink = '0'; 
        document.body.classList.remove('with-right-side');
    }

    // ... (Your Smart Width Logic) ...
    const leftNav = document.getElementById('left-side');
    const isNavOpen = leftNav && leftNav.getBoundingClientRect().width > 0;

    if (mainLayout) {
        const desiredWidth = isNavOpen ? '89.45%' : '100%';
        if (mainLayout.style.maxWidth !== desiredWidth) {
            mainLayout.style.maxWidth = desiredWidth;
        }
    }

    // ... (Your Middle Content Logic) ...
    const contentArea = document.getElementById('not_right_side');
    if (contentArea) {
        if (contentArea.style.flexGrow !== '1') contentArea.style.flexGrow = '1';
        
        // ⚡️ CRITICAL: Tailwind sets 'width: auto' on many things. 
        // We need to force this back to 100% (or 0px if you preferred the shrink trick).
        // If 0px was squishing it, stick to 100% or auto but add min-width: 0.
        if (contentArea.style.width !== '100%') contentArea.style.width = '100%';
        if (contentArea.style.minWidth !== '0px') contentArea.style.minWidth = '0px';

        if (shouldShowWidget) {
             contentArea.style.marginRight = '24px';
        } else {
             contentArea.style.marginRight = '0px';
        }
    }

}, 100);