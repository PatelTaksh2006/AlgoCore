import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GraphProvider } from './modules/graph/context/GraphContext';
import { AlgorithmProvider } from './modules/algorithm/context/AlgorithmContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GraphProvider>
      <AlgorithmProvider>
        <App />
      </AlgorithmProvider>
    </GraphProvider>
  </StrictMode>,
)
