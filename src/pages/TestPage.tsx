import React from 'react';

export default function TestPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1>Hello from Test Page!</h1>
      <p>If you can see this, routing is working correctly.</p>
      <p>Environment: {import.meta.env.MODE}</p>
      <p>Base URL: {import.meta.env.BASE_URL}</p>
    </div>
  );
}
