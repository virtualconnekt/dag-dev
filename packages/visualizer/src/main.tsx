/**
 * main.tsx
 * 
 * Entry point for DAG visualizer React app.
 * 
 * @phase Phase 8 - DAG Visualizer
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
