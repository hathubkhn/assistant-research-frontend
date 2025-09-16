'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    HSStaticMethods?: {
      autoInit: () => void;
    };
  }
}

export default function PrelineScript() {
  useEffect(() => {
    const prelineScript = document.createElement('script');
    prelineScript.src = 'https://cdn.jsdelivr.net/npm/preline@1.9.0/dist/preline.min.js';
    prelineScript.async = true;
    prelineScript.id = 'preline-script';
    prelineScript.onload = () => {
      if (typeof window.HSStaticMethods !== 'undefined') {
        window.HSStaticMethods.autoInit();
      }
    };
    document.body.appendChild(prelineScript);

    return () => {
      const scriptElement = document.getElementById('preline-script');
      if (scriptElement && document.body.contains(scriptElement)) {
        document.body.removeChild(scriptElement);
      }
    };
  }, []);

  return null;
} 