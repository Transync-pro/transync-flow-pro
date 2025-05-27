import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('Main script loaded');
console.log('Environment:', import.meta.env.MODE);
console.log('Base URL:', import.meta.env.BASE_URL);

try {
  const container = document.getElementById('root');
  
  if (!container) {
    throw new Error('Failed to find the root element');
  }
  
  console.log('Root element found, rendering App...');
  
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to render the application:', error);
  
  const errorContainer = document.createElement('div');
  errorContainer.style.color = 'red';
  errorContainer.style.padding = '20px';
  errorContainer.style.fontFamily = 'Arial, sans-serif';
  errorContainer.innerHTML = `
    <h1>Application Error</h1>
    <p>${error instanceof Error ? error.message : 'An unknown error occurred'}</p>
    <p>Please check the console for more details.</p>
  `;
  
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '';
    root.appendChild(errorContainer);
  } else {
    document.body.innerHTML = '';
    document.body.appendChild(errorContainer);
  }
}
