import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import '../styles.css';

const style = document.createElement('style');

document.head.appendChild(style);

function injectAgency() {
  const mainLayout = document.getElementById('main');
  const rootId = 'agency-native-widget';

  if (mainLayout && !document.getElementById(rootId)) {
    const root = document.createElement('div');
    root.id = rootId;
    root.style.width = '300px'; 
    root.style.minWidth = '300px';
    root.style.flexShrink = '0'; 
    root.style.display = 'none'; 
    root.style.marginLeft = '24px'; 
    root.style.marginRight = '24px'; 
    root.style.height = 'fit-content'; 

    mainLayout.appendChild(root);

    createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

injectAgency();

setInterval(() => {
    
    // page detection for context
    const path = window.location.pathname;
    const isAssignment = path.includes('/assignments/') && !path.includes('/syllabus');
    const isDashboard = path === '/';

    const mainLayout = document.getElementById('main');
    const myWidget = document.getElementById('agency-native-widget');
    const nativeSidebarWrapper = document.getElementById('right-side-wrapper');

    // widget visibility
    const shouldShowWidget = isDashboard || isAssignment;

    if (myWidget) {
        if (shouldShowWidget) {
            myWidget.style.display = 'block';
        } else {
            myWidget.style.display = 'none';
        }
    } else if (shouldShowWidget) {
        injectAgency(); 
    }

    // for main layouts like grades etc
    if (mainLayout) {
        mainLayout.style.display = 'flex';
        mainLayout.style.flexDirection = 'row';
        mainLayout.style.alignItems = 'flex-start';
        mainLayout.style.width = '100%';
    }

    // native sidebar
    if (nativeSidebarWrapper) {
        nativeSidebarWrapper.style.setProperty('position', 'static', 'important');
        
        nativeSidebarWrapper.style.display = 'block';
        nativeSidebarWrapper.style.width = 'auto'; 
        nativeSidebarWrapper.style.minWidth = '250px'; 
        nativeSidebarWrapper.style.maxWidth = '285px'; 
        nativeSidebarWrapper.style.flexShrink = '0'; 
        document.body.classList.remove('with-right-side');
    }

    // smart size when open/close left nav
    const leftNav = document.getElementById('left-side');
    const isNavOpen = leftNav && leftNav.getBoundingClientRect().width > 0;

    if (mainLayout) {
        const desiredWidth = isNavOpen ? '89.45%' : '100%';

        if (mainLayout.style.maxWidth !== desiredWidth) {
            mainLayout.style.maxWidth = desiredWidth;
        }
    }

    // middle content
    const contentArea = document.getElementById('not_right_side');
    if (contentArea) {
        if (contentArea.style.flexGrow !== '1') contentArea.style.flexGrow = '1';
        if (contentArea.style.width !== '0px') contentArea.style.width = '0px'; 
        if (contentArea.style.minWidth !== '0px') contentArea.style.minWidth = '0px';
        
        if (shouldShowWidget) {
             contentArea.style.marginRight = '24px';
        } else {
             contentArea.style.marginRight = '0px';
        }
    }

}, 0);