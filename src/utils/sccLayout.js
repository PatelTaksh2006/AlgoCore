
/**
 * Calculates layout for SCC visualization.
 * Groups nodes by component and arranges them in circles.
 */
export function calculateSCCLayout(components, nodes, width = 600, height = 500) {
    if (!components || components.length === 0) return { positions: {}, labels: [] };

    const positions = {};
    const labels = [];
    const componentCount = components.length;

    // Grid layout for components
    const cols = Math.ceil(Math.sqrt(componentCount));
    const rows = Math.ceil(componentCount / cols);

    const cellWidth = width / cols;
    const cellHeight = height / rows;

    components.forEach((component, index) => {
        // Find cell for this component
        const row = Math.floor(index / cols);
        const col = index % cols;

        const centerX = (col * cellWidth) + (cellWidth / 2);
        const centerY = (row * cellHeight) + (cellHeight / 2);

        // Label for the component
        labels.push({
            id: `comp-${index}`,
            text: `SCC ${index + 1}`,
            x: centerX,
            y: centerY - (Math.min(cellWidth, cellHeight) * 0.45) // Place above the circle
        });

        // Radius for the component circle
        // Keep it small enough to fit in cell with padding
        const radius = Math.min(cellWidth, cellHeight) * 0.35;

        const nodeCount = component.length;
        const angleStep = (2 * Math.PI) / nodeCount;

        component.forEach((nodeId, nodeIndex) => {
            const angle = nodeIndex * angleStep - (Math.PI / 2); // Start top
            positions[nodeId] = {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            };
        });
    });

    return { positions, labels };
}
