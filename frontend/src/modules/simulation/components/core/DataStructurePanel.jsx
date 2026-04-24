import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, LayoutGroup, useDragControls, useMotionValue } from 'framer-motion';
import useSimulationStore from '../../../../store/useSimulationStore';
import { useAlgorithm } from '../../../algorithm/context/AlgorithmContext';
import { useGraph } from '../../../graph/context/GraphContext';
import { saveDataStructurePanelState, loadDataStructurePanelState } from '../../../../utils/persistenceUtils';
import DataStructureSections from '../dataStructurePanel/DataStructureSections';

const PANEL_MARGIN = 16;
const MIN_PANEL_WIDTH = 320;
const MIN_PANEL_HEIGHT = 200;
const DEFAULT_PANEL_HEIGHT = 360;
const DEFAULT_SECTION_ORDER = ['primaryDS', 'parent', 'visited', 'scc', 'ap', 'floyd', 'routing'];

const DataStructurePanel = ({ constraintsRef }) => {
  const { activeDS, internalState, routingTable, activeTableNodeId } = useSimulationStore();
  const { selectedAlgorithm, visited, parent, components } = useAlgorithm();
  const { nodes } = useGraph();

  const panelRef = useRef(null);
  const hasPositionedRef = useRef(false);
  const hasManualResizeRef = useRef(false);
  const resizeStateRef = useRef(null);
  const resizeFrameRef = useRef(null);
  const dragControls = useDragControls();
  const persistedPanelStateRef = useRef(loadDataStructurePanelState());

  const isRoutingAlgorithm = ['distanceVector', 'linkState'].includes(selectedAlgorithm);

  const getTypeLabel = () => {
    if (selectedAlgorithm === 'dfs') return 'Stack';
    if (selectedAlgorithm === 'scc') return 'Finish Stack';
    if (selectedAlgorithm === 'bfs') return 'Queue';
    if (selectedAlgorithm === 'dijkstra' || selectedAlgorithm === 'prim') return 'Priority Queue';
    if (selectedAlgorithm === 'linkState') return 'Priority Queue (SPF)';
    return 'Data Structure';
  };

  const [sectionOrder, setSectionOrder] = useState(
    persistedPanelStateRef.current?.sectionOrder || DEFAULT_SECTION_ORDER,
  );

  const visibleSectionIds = useMemo(() => {
    const ids = ['primaryDS', 'parent', 'visited'];
    if (selectedAlgorithm === 'scc') ids.push('scc');
    if (selectedAlgorithm === 'articulationPoints') ids.push('ap');
    if (isRoutingAlgorithm) ids.push('routing');
    return ids;
  }, [selectedAlgorithm, isRoutingAlgorithm]);

  const orderedVisibleSectionIds = useMemo(() => {
    const visibleSet = new Set(visibleSectionIds);
    const inOrder = sectionOrder.filter((id) => visibleSet.has(id));
    const missing = visibleSectionIds.filter((id) => !inOrder.includes(id));
    return [...inOrder, ...missing];
  }, [sectionOrder, visibleSectionIds]);

  const handleSectionReorder = useCallback((nextVisibleOrder) => {
    setSectionOrder((prev) => {
      const hidden = prev.filter((id) => !visibleSectionIds.includes(id));
      return [...nextVisibleOrder, ...hidden];
    });
  }, [visibleSectionIds]);

  const nodeLabelMap = useMemo(() => {
    const map = {};
    nodes.forEach((n) => {
      map[n.id] = n.label;
    });
    return map;
  }, [nodes]);

  const defaultPanelWidth = 600;
  const [panelSize, setPanelSize] = useState(() => {
    const savedSize = persistedPanelStateRef.current?.panelSize;
    if (savedSize?.width && savedSize?.height) {
      hasManualResizeRef.current = true;
      return savedSize;
    }
    return { width: defaultPanelWidth, height: DEFAULT_PANEL_HEIGHT };
  });

  const x = useMotionValue(persistedPanelStateRef.current?.position?.x ?? PANEL_MARGIN);
  const y = useMotionValue(persistedPanelStateRef.current?.position?.y ?? PANEL_MARGIN);

  if (persistedPanelStateRef.current?.position && !hasPositionedRef.current) {
    hasPositionedRef.current = true;
  }

  const persistPanelState = useCallback(() => {
    saveDataStructurePanelState({
      sectionOrder,
      panelSize,
      position: { x: x.get(), y: y.get() },
    });
  }, [panelSize, sectionOrder, x, y]);

  useEffect(() => {
    persistPanelState();
  }, [panelSize, sectionOrder, persistPanelState]);

  const clampPosition = useCallback((nextX, nextY, size = panelSize) => {
    const container = constraintsRef?.current;
    if (!container) {
      return { x: nextX, y: nextY };
    }

    const maxX = Math.max(PANEL_MARGIN, container.clientWidth - size.width - PANEL_MARGIN);
    const maxY = Math.max(PANEL_MARGIN, container.clientHeight - size.height - PANEL_MARGIN);

    return {
      x: Math.min(Math.max(PANEL_MARGIN, nextX), maxX),
      y: Math.min(Math.max(PANEL_MARGIN, nextY), maxY),
    };
  }, [constraintsRef, panelSize]);

  const clampSize = useCallback((nextWidth, nextHeight) => {
    const container = constraintsRef?.current;
    if (!container) {
      return {
        width: Math.max(MIN_PANEL_WIDTH, nextWidth),
        height: Math.max(MIN_PANEL_HEIGHT, nextHeight),
      };
    }

    const maxWidth = Math.max(MIN_PANEL_WIDTH, container.clientWidth - (PANEL_MARGIN * 2));
    const maxHeight = Math.max(MIN_PANEL_HEIGHT, container.clientHeight - (PANEL_MARGIN * 2));

    return {
      width: Math.min(Math.max(MIN_PANEL_WIDTH, nextWidth), maxWidth),
      height: Math.min(Math.max(MIN_PANEL_HEIGHT, nextHeight), maxHeight),
    };
  }, [constraintsRef]);

  const syncPanelWithinViewport = useCallback((size = panelSize) => {
    const boundedSize = clampSize(size.width, size.height);
    const nextSize = boundedSize.width === size.width && boundedSize.height === size.height ? size : boundedSize;

    if (nextSize !== size) {
      setPanelSize((current) => (
        current.width === nextSize.width && current.height === nextSize.height ? current : nextSize
      ));
    }

    const boundedPosition = clampPosition(x.get(), y.get(), nextSize);
    x.set(boundedPosition.x);
    y.set(boundedPosition.y);
  }, [clampPosition, clampSize, panelSize, x, y]);

  const endResize = useCallback(() => {
    const resizeData = resizeStateRef.current;

    if (resizeFrameRef.current) {
      cancelAnimationFrame(resizeFrameRef.current);
      resizeFrameRef.current = null;
    }

    if (resizeData) {
      window.removeEventListener('pointermove', resizeData.onPointerMove);
      window.removeEventListener('pointerup', resizeData.onPointerUp);
      window.removeEventListener('pointercancel', resizeData.onPointerUp);
      resizeStateRef.current = null;
    }

    syncPanelWithinViewport();
    persistPanelState();
  }, [persistPanelState, syncPanelWithinViewport]);

  const startResize = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();

    hasManualResizeRef.current = true;

    const resizeData = {
      startX: event.clientX,
      startY: event.clientY,
      startWidth: panelSize.width,
      startHeight: panelSize.height,
      nextWidth: panelSize.width,
      nextHeight: panelSize.height,
      rafScheduled: false,
      onPointerMove: null,
      onPointerUp: null,
    };

    const onPointerMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - resizeData.startX;
      const deltaY = moveEvent.clientY - resizeData.startY;
      const bounded = clampSize(resizeData.startWidth + deltaX, resizeData.startHeight + deltaY);

      resizeData.nextWidth = bounded.width;
      resizeData.nextHeight = bounded.height;

      if (!resizeData.rafScheduled) {
        resizeData.rafScheduled = true;
        resizeFrameRef.current = requestAnimationFrame(() => {
          resizeData.rafScheduled = false;
          setPanelSize((current) => {
            if (current.width === resizeData.nextWidth && current.height === resizeData.nextHeight) {
              return current;
            }
            return { width: resizeData.nextWidth, height: resizeData.nextHeight };
          });
        });
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      resizeStateRef.current = null;
      endResize();
    };

    resizeData.onPointerMove = onPointerMove;
    resizeData.onPointerUp = onPointerUp;
    resizeStateRef.current = resizeData;

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }, [clampSize, endResize, panelSize.height, panelSize.width]);

  useEffect(() => {
    return () => {
      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
      }
      const resizeData = resizeStateRef.current;
      if (resizeData) {
        window.removeEventListener('pointermove', resizeData.onPointerMove);
        window.removeEventListener('pointerup', resizeData.onPointerUp);
        window.removeEventListener('pointercancel', resizeData.onPointerUp);
      }
    };
  }, []);

  useLayoutEffect(() => {
    const container = constraintsRef?.current;
    if (!container) {
      return;
    }

    const preferredSize = hasManualResizeRef.current ? panelSize : clampSize(defaultPanelWidth, DEFAULT_PANEL_HEIGHT);

    if (!hasManualResizeRef.current && (
      preferredSize.width !== panelSize.width ||
      preferredSize.height !== panelSize.height
    )) {
      setPanelSize(preferredSize);
    }

    if (!hasPositionedRef.current) {
      const startX = Math.max(PANEL_MARGIN, (container.clientWidth - preferredSize.width) / 2);
      const startY = Math.max(PANEL_MARGIN, container.clientHeight - preferredSize.height - PANEL_MARGIN);
      x.set(startX);
      y.set(startY);
      hasPositionedRef.current = true;
      return;
    }

    const boundedPosition = clampPosition(x.get(), y.get(), preferredSize);
    x.set(boundedPosition.x);
    y.set(boundedPosition.y);
  }, [clampPosition, clampSize, constraintsRef, defaultPanelWidth, panelSize, x, y]);

  useEffect(() => {
    const container = constraintsRef?.current;
    if (!container) {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      syncPanelWithinViewport();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [constraintsRef, syncPanelWithinViewport]);

  return (
    <motion.div
      ref={panelRef}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={constraintsRef}
      dragMomentum={false}
      dragElastic={0.04}
      whileDrag={{ scale: 1.01, boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)' }}
      onDragEnd={() => {
        syncPanelWithinViewport();
        persistPanelState();
      }}
      style={{
        x,
        y,
        left: 0,
        top: 0,
        width: panelSize.width,
        height: panelSize.height,
        minWidth: MIN_PANEL_WIDTH,
        minHeight: MIN_PANEL_HEIGHT,
        willChange: 'transform',
      }}
      className="absolute bg-white/92 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 p-3 flex flex-col gap-3 z-20 overflow-hidden touch-none"
    >
      <div
        onPointerDown={(event) => dragControls.start(event)}
        className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: 'none' }}
      >
        <div>
          <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-500">Data Structure Panel</div>
          <div className="text-xs text-gray-400">Drag from this bar. Resize from the bottom-right corner.</div>
        </div>
      </div>

      <LayoutGroup>
        <DataStructureSections
          orderedVisibleSectionIds={orderedVisibleSectionIds}
          handleSectionReorder={handleSectionReorder}
          getTypeLabel={getTypeLabel}
          activeDS={activeDS}
          parent={parent}
          visited={visited}
          components={components}
          nodeLabelMap={nodeLabelMap}
          selectedAlgorithm={selectedAlgorithm}
          internalState={internalState}
          nodes={nodes}
          routingTable={routingTable}
          activeTableNodeId={activeTableNodeId}
        />
      </LayoutGroup>

      <button
        type="button"
        onPointerDown={startResize}
        className="absolute bottom-1 right-1 h-5 w-5 cursor-se-resize rounded-sm border border-gray-200 bg-white/90 text-gray-400 hover:text-gray-600"
        aria-label="Resize data structure panel"
        title="Resize"
      >
        <span className="pointer-events-none block text-[10px] leading-none">//</span>
      </button>
    </motion.div>
  );
};

export default DataStructurePanel;
