"use client";

import { useEffect } from 'react';

const ServiceWorkerProvider = ({ children }) => {
  useEffect(() => {
    // Register service worker if supported
    if ('serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('SW registered: ', registration);
        } catch (registrationError) {
          console.log('SW registration failed: ', registrationError);
        }
      };

      // Wait for the page to be fully loaded before registering
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', registerServiceWorker);
      } else {
        registerServiceWorker();
      }
    }
  }, []);

  return <>{children}</>;
};

export default ServiceWorkerProvider;