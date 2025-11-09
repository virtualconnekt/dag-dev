/**
 * App.tsx
 * 
 * Main React component for DAG visualizer.
 * Displays real-time BlockDAG graph with D3.js.
 * 
 * Features:
 * - Real-time DAG visualization
 * - Blue/red block coloring
 * - Interactive block details
 * - DAG statistics
 * - Mining controls
 * 
 * @phase Phase 8 - DAG Visualizer (WOW Feature!)
 */

import { useState, useEffect } from 'react';
import './App.css';
// import DAGGraph from './components/DAGGraph';
// import Stats from './components/Stats';
// import Controls from './components/Controls';

function App() {
  const [blocks, setBlocks] = useState([]);
  const [stats, setStats] = useState({
    totalBlocks: 0,
    blueBlocks: 0,
    redBlocks: 0,
    tips: 0,
    maxDepth: 0,
  });

  useEffect(() => {
    // Connect to WebSocket server
    // const ws = new WebSocket('ws://localhost:8546');

    // ws.onmessage = (event) => {
    //   const message = JSON.parse(event.data);
      
    //   switch (message.type) {
    //     case 'initialState':
    //       setBlocks(message.data.blocks);
    //       setStats(message.data.stats);
    //       break;
        
    //     case 'blockAdded':
    //       setBlocks(prev => [...prev, message.data.block]);
    //       setStats(message.data.stats);
    //       break;
        
    //     case 'dagUpdated':
    //       setStats(message.data.stats);
    //       break;
    //   }
    // };

    // return () => ws.close();
  }, []);

  return (
    <div className="App">
      <header>
        <h1>🔷 DagDev Visualizer</h1>
        <p>Real-time BlockDAG Graph</p>
      </header>

      <main>
        {/* <Controls /> */}
        
        <div className="visualizer">
          {/* <DAGGraph blocks={blocks} /> */}
          <div className="placeholder">
            <h2>DAG Graph Visualization</h2>
            <p>D3.js force-directed graph will appear here</p>
            <p>Blocks: {blocks.length}</p>
          </div>
        </div>

        {/* <Stats stats={stats} /> */}
        <div className="stats">
          <h3>DAG Statistics</h3>
          <ul>
            <li>Total Blocks: {stats.totalBlocks}</li>
            <li>Blue Blocks: {stats.blueBlocks}</li>
            <li>Red Blocks: {stats.redBlocks}</li>
            <li>Tips: {stats.tips}</li>
            <li>Max Depth: {stats.maxDepth}</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
