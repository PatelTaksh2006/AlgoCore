import React, { useState } from 'react';
import GraphCanvas from './modules/graph/components/GraphCanvas';
import Sidebar from './modules/simulation/components/core/Sidebar';
import RoutingTable from './modules/simulation/components/core/RoutingTable';
import DataStructurePanel from './modules/simulation/components/core/DataStructurePanel';
import ResultPanel from './modules/simulation/components/results/ResultPanel';
import { useAlgorithm } from './modules/algorithm/context/AlgorithmContext';

function App() {
  // eslint-disable-next-line no-unused-vars
  const [showResult, setShowResult] = useState(true);
  const constraintsRef = React.useRef(null);
  const { selectedAlgorithm } = useAlgorithm();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex-1 relative flex flex-col" ref={constraintsRef}>

        <DataStructurePanel constraintsRef={constraintsRef} />

        <div className="flex w-full h-full relative">
          <div className="flex-1 flex flex-row">
            <div className="flex-1 relative border-r border-gray-200 bg-white">
              <GraphCanvas />
            </div>
            <div className="flex-1 relative border-l border-gray-200 bg-gray-50 overflow-hidden transition-all duration-500" id="result-panel">
              {selectedAlgorithm === 'distanceVector' || selectedAlgorithm === 'linkState' ? <RoutingTable /> : <ResultPanel />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
