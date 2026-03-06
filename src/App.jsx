import React, { useState } from 'react';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import ResultTree from './components/ResultTree';
import RoutingTable from './components/RoutingTable';
import LsrPanel from './components/LsrPanel';
import DataStructurePanel from './components/DataStructurePanel';
import { useAlgorithm } from './context/AlgorithmContext';

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
              {selectedAlgorithm === 'distanceVector' ? <RoutingTable /> :
                selectedAlgorithm === 'linkState' ? (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 min-h-[50%] border-b border-gray-200"><LsrPanel /></div>
                    <div className="flex-1 min-h-[50%]"><RoutingTable /></div>
                  </div>
                ) : <ResultTree />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
