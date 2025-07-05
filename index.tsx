import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './global.css'; // Import global styles

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then(registration => {
//         console.log('Gym Max ServiceWorker registration successful with scope: ', registration.scope);
//       })
//       .catch(error => {
//         console.log('Gym Max ServiceWorker registration failed: ', error);
//       });
//   });
// }
