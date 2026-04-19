import React from 'react';
import useSimulationStore from '../../../store/useSimulationStore';
import SCCView from './connectivityResult/SCCView';
import APView from './connectivityResult/APView';

const ConnectivityResult = () => {
  const { resultData } = useSimulationStore();

  if (!resultData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        Run SCC or Articulation Points to see results.
      </div>
    );
  }

  if (resultData.type === 'scc') {
    return <SCCView data={resultData} />;
  }

  if (resultData.type === 'ap') {
    return <APView data={resultData} />;
  }

  return null;
};

export default ConnectivityResult;
