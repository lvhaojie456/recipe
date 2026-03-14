import React, { useMemo } from 'react';
import { KnowledgeGraphData, KGNode } from '../types';

interface KnowledgeGraphVizProps {
  data: KnowledgeGraphData;
}

const KnowledgeGraphViz: React.FC<KnowledgeGraphVizProps> = ({ data }) => {
  // Simple static layout algorithm
  // Center: Root (Recipe)
  // Inner Circle: Ingredients
  // Outer Circle: Effects / Body Conditions / Location Factors

  const width = 600;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  const { nodes, links } = useMemo(() => {
    const rootNode = data.nodes.find(n => n.type === 'Root') || data.nodes[0];
    const ingredients = data.nodes.filter(n => n.type === 'Ingredient');
    const others = data.nodes.filter(n => n.type !== 'Root' && n.type !== 'Ingredient');

    const calculatedNodes = data.nodes.map(node => {
      let x = centerX;
      let y = centerY;

      if (node.type === 'Root') {
        x = centerX;
        y = centerY;
      } else if (node.type === 'Ingredient') {
        const index = ingredients.findIndex(n => n.id === node.id);
        const angle = (index / ingredients.length) * 2 * Math.PI;
        const radius = 100;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      } else {
        const index = others.findIndex(n => n.id === node.id);
        const angle = (index / others.length) * 2 * Math.PI + (Math.PI / others.length); // Offset slightly
        const radius = 180;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      }
      return { ...node, x, y };
    });

    return { nodes: calculatedNodes, links: data.links };
  }, [data]);

  const getNodeColor = (type: KGNode['type']) => {
    switch (type) {
      case 'Root': return '#f97316'; // Brand orange
      case 'Ingredient': return '#84cc16'; // Lime green
      case 'Effect': return '#3b82f6'; // Blue
      case 'BodyCondition': return '#ef4444'; // Red
      case 'LocationFactor': return '#a855f7'; // Purple
      default: return '#9ca3af';
    }
  };

  return (
    <div className="w-full h-full overflow-hidden bg-slate-50 rounded-xl border border-slate-200 relative">
      <div className="absolute top-2 left-2 flex flex-col gap-1 text-[10px] bg-white/80 p-2 rounded shadow-sm z-10">
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#f97316]"></div> 食谱</div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#84cc16]"></div> 核心食材</div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div> 功效/作用</div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ef4444]"></div> 针对体质/BMI</div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#a855f7]"></div> 地理/环境因素</div>
      </div>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="19" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
          </marker>
        </defs>
        
        {/* Links */}
        {links.map((link, i) => {
          const source = nodes.find(n => n.id === link.source);
          const target = nodes.find(n => n.id === link.target);
          if (!source || !target) return null;

          return (
            <g key={i}>
                <line 
                    x1={source.x} 
                    y1={source.y} 
                    x2={target.x} 
                    y2={target.y} 
                    stroke="#cbd5e1" 
                    strokeWidth="1.5"
                    markerEnd="url(#arrowhead)"
                />
                <text 
                    x={(source.x! + target.x!) / 2} 
                    y={(source.y! + target.y!) / 2} 
                    textAnchor="middle" 
                    fill="#64748b" 
                    fontSize="10"
                    dy="-3"
                    className="bg-white"
                >
                    {link.label}
                </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <g key={i} className="cursor-pointer transition-opacity hover:opacity-80">
            <circle 
                cx={node.x} 
                cy={node.y} 
                r={node.type === 'Root' ? 25 : 18} 
                fill="white"
                stroke={getNodeColor(node.type)}
                strokeWidth={node.type === 'Root' ? 3 : 2}
                className="drop-shadow-sm"
            />
            <text 
                x={node.x} 
                y={node.y! + (node.type === 'Root' ? 35 : 30)} 
                textAnchor="middle" 
                className="text-[10px] font-medium fill-slate-700 pointer-events-none"
            >
                {node.label}
            </text>
            {/* Icon inside circle (simplified as text for now) */}
             <text 
                x={node.x} 
                y={node.y} 
                dy="4"
                textAnchor="middle" 
                fill={getNodeColor(node.type)} 
                fontSize={node.type === 'Root' ? 14 : 10}
                fontWeight="bold"
            >
                {node.label.charAt(0)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default KnowledgeGraphViz;
