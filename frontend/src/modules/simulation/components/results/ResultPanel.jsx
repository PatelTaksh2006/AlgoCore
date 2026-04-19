import React from 'react';
import { useAlgorithm } from '../../../algorithm/context/AlgorithmContext';
import ResultTree from '../ResultTree';
import ConnectivityResult from '../ConnectivityResult';
import APSPResult from '../APSPResult';
import { motion, AnimatePresence } from 'framer-motion';

const ResultPanel = () => {
    const { selectedAlgorithm } = useAlgorithm();

    const isConnectivity = false;
    const isAPSP = selectedAlgorithm === 'floydWarshall';

    return (
        <div className="w-full h-full relative">
            <AnimatePresence mode="wait">
                {isConnectivity ? (
                    <motion.div
                        key="connectivity"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full h-full"
                    >
                        <ConnectivityResult />
                    </motion.div>
                ) : isAPSP ? (
                    <motion.div
                        key="apsp"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full h-full"
                    >
                        <APSPResult />
                    </motion.div>
                ) : (
                    <motion.div
                        key="tree"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full h-full"
                    >
                        <ResultTree />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ResultPanel;
