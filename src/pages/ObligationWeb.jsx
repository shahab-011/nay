import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getObligationWeb } from '../api/graph.api';

/* ── Color + shape config ───────────────────────────────────────── */
const NODE_COLOR = {
  document:   '#44e5c2',
  party:      '#a78bfa',
  obligation: '#f59e0b',
  date:       '#22c55e',
  risk:       '#ff6b6b',
};

const EDGE_COLOR = {
  conflicts_with: '#ff6b6b',
  bound_by:       '#4a5568',
  involves:       '#2d3748',
  due_by:         '#22c55e',
  references:     '#374151',
  owned_by:       '#4a5568',
  paid_by:        '#4a5568',
};

const NODE_RADIUS = { document: 22, party: 15, obligation: 16, date: 14, risk: 15 };

const SEV_BADGE = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high:     'bg-orange-400/20 text-orange-400 border-orange-400/30',
  medium:   'bg-amber-400/20 text-amber-300 border-amber-400/30',
  low:      'bg-primary/20 text-primary border-primary/30',
};

const LOADING_STEPS = [
  'Reading documents…',
  'Mapping obligations…',
  'Finding connections…',
  'Detecting conflicts…',
  'Building your legal web…',
];

/* ── Detail panel ───────────────────────────────────────────────── */
function DetailPanel({ node, onClose, onNavigate }) {
  if (!node) return null;
  const color = NODE_COLOR[node.type] || '#888';
  return (
    <div className="absolute top-4 right-4 w-72 bg-surface-container border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between"
        style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
        <div>
          <span className="text-[9px] font-label font-bold uppercase tracking-widest"
            style={{ color }}>{node.type}</span>
          <p className="font-headline font-bold text-sm text-on-surface mt-0.5">{node.label}</p>
        </div>
        <button onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-on-surface-variant transition-colors">
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
      <div className="px-5 py-4 space-y-3">
        {node.details && (
          <p className="text-sm text-on-surface-variant leading-relaxed">{node.details}</p>
        )}
        {node.severity && node.severity !== 'null' && (
          <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border font-label ${SEV_BADGE[node.severity] || SEV_BADGE.low}`}>
            {node.severity.toUpperCase()} SEVERITY
          </span>
        )}
        {node.type === 'document' && (
          <div className="space-y-2">
            {node.healthScore != null && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest">Health Score</span>
                <span className={`font-headline font-bold text-sm ${node.healthScore >= 70 ? 'text-primary' : node.healthScore >= 40 ? 'text-amber-400' : 'text-error'}`}>
                  {node.healthScore}/100
                </span>
              </div>
            )}
            {node.docType && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest">Type</span>
                <span className="text-sm text-on-surface">{node.docType}</span>
              </div>
            )}
            {node.documentId && (
              <button
                onClick={() => onNavigate(node.documentId)}
                className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Open Analysis
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Conflicts panel ────────────────────────────────────────────── */
function ConflictsPanel({ conflicts }) {
  if (!conflicts?.length) return null;
  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-red-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
        <h3 className="font-headline font-bold text-base text-red-400">{conflicts.length} Conflict{conflicts.length !== 1 ? 's' : ''} Detected</h3>
      </div>
      {conflicts.map((c, i) => (
        <div key={i} className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-[10px] font-bold text-red-400 flex-shrink-0 mt-0.5">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-on-surface leading-relaxed">{c.description}</p>
            {c.severity && (
              <span className={`mt-1.5 inline-flex text-[9px] font-bold px-2 py-0.5 rounded-full border font-label ${SEV_BADGE[c.severity] || SEV_BADGE.medium}`}>
                {c.severity.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────── */
export default function ObligationWeb() {
  const navigate      = useNavigate();
  const svgRef        = useRef(null);
  const simulationRef = useRef(null);

  const [graphData,     setGraphData]     = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [loadStep,      setLoadStep]      = useState(0);
  const [error,         setError]         = useState('');
  const [selectedNode,  setSelectedNode]  = useState(null);
  const [filter,        setFilter]        = useState('all');
  const [docFilter,     setDocFilter]     = useState('');

  /* ── Step-through loading text ────────────────────────────────── */
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setLoadStep(s => (s + 1) % LOADING_STEPS.length), 900);
    return () => clearInterval(t);
  }, [loading]);

  /* ── Fetch ────────────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    setSelectedNode(null);
    try {
      const res = await getObligationWeb();
      setGraphData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to build Obligation Web.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Build D3 graph ───────────────────────────────────────────── */
  useEffect(() => {
    if (!graphData || !svgRef.current) return;
    buildGraph();
  }, [graphData, filter, docFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildGraph = useCallback(() => {
    if (!graphData || !svgRef.current) return;

    // Kill previous simulation
    if (simulationRef.current) simulationRef.current.stop();

    const container = svgRef.current.parentElement;
    const W = container.clientWidth  || 800;
    const H = container.clientHeight || 500;

    // Filter nodes / edges
    let nodes = graphData.nodes.map(n => ({ ...n }));
    let edges = graphData.edges.map(e => ({ ...e }));

    if (filter === 'conflicts') {
      const conflictIds = new Set(edges.filter(e => e.isConflict).flatMap(e => [e.source, e.target]));
      nodes = nodes.filter(n => conflictIds.has(n.id));
      edges = edges.filter(e => e.isConflict);
    } else if (filter === 'doc' && docFilter) {
      // Show nodes reachable from selected doc within 2 hops
      const reachable = new Set([docFilter]);
      for (let hop = 0; hop < 2; hop++) {
        edges.forEach(e => {
          const src = typeof e.source === 'object' ? e.source.id : e.source;
          const tgt = typeof e.target === 'object' ? e.target.id : e.target;
          if (reachable.has(src)) reachable.add(tgt);
          if (reachable.has(tgt)) reachable.add(src);
        });
      }
      nodes = nodes.filter(n => reachable.has(n.id));
      edges = edges.filter(e => {
        const src = typeof e.source === 'object' ? e.source.id : e.source;
        const tgt = typeof e.target === 'object' ? e.target.id : e.target;
        return reachable.has(src) && reachable.has(tgt);
      });
    }

    const nodeById = new Map(nodes.map(n => [n.id, n]));
    const validEdges = edges.filter(e => {
      const src = typeof e.source === 'object' ? e.source.id : e.source;
      const tgt = typeof e.target === 'object' ? e.target.id : e.target;
      return nodeById.has(src) && nodeById.has(tgt);
    });

    // Clear SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', W).attr('height', H);

    // Dot-grid background
    const defs = svg.append('defs');
    defs.append('pattern')
      .attr('id', 'dots')
      .attr('width', 24).attr('height', 24)
      .attr('patternUnits', 'userSpaceOnUse')
      .append('circle')
      .attr('cx', 2).attr('cy', 2).attr('r', 1)
      .attr('fill', 'rgba(255,255,255,0.04)');

    // Arrow markers
    ['default', 'conflict'].forEach(k => {
      defs.append('marker')
        .attr('id', `arrow-${k}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 28).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', k === 'conflict' ? '#ff6b6b' : '#4a5568');
    });

    const root = svg.append('g').attr('class', 'root');

    root.append('rect')
      .attr('width', W).attr('height', H)
      .attr('fill', 'url(#dots)');

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        inner.attr('transform', event.transform);
      });
    svg.call(zoom);

    const inner = root.append('g').attr('class', 'inner');

    // Edges
    const edgeG = inner.append('g').attr('class', 'edges');
    const edgeSel = edgeG.selectAll('line')
      .data(validEdges)
      .join('line')
      .attr('stroke', d => EDGE_COLOR[d.relationship] || '#4a5568')
      .attr('stroke-width', d => d.isConflict ? 2 : 1.5)
      .attr('stroke-dasharray', d => (d.isConflict || d.relationship === 'references') ? '6 4' : null)
      .attr('marker-end', d => d.isConflict ? 'url(#arrow-conflict)' : 'url(#arrow-default)')
      .attr('opacity', d => d.isConflict ? 1 : 0.55);

    // Conflict edges pulse
    function pulseConflicts() {
      edgeSel.filter(d => d.isConflict)
        .transition().duration(1200).ease(d3.easeSinInOut)
        .attr('opacity', 0.3)
        .transition().duration(1200).ease(d3.easeSinInOut)
        .attr('opacity', 1)
        .on('end', pulseConflicts);
    }
    if (validEdges.some(e => e.isConflict)) pulseConflicts();

    // Edge labels
    const edgeLabelG = inner.append('g').attr('class', 'edge-labels');
    edgeLabelG.selectAll('text')
      .data(validEdges.filter(e => e.label))
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('fill', '#6b7280')
      .attr('pointer-events', 'none')
      .text(d => d.label);

    // Nodes
    const nodeG = inner.append('g').attr('class', 'nodes');
    const nodeSel = nodeG.selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      });

    // Node glow filter
    defs.append('filter').attr('id', 'glow')
      .append('feGaussianBlur').attr('stdDeviation', 3).attr('result', 'blur')
      .select(function() { return this.parentNode; })
      .append('feMerge').selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic']).join('feMergeNode')
      .attr('in', d => d);

    // Draw shape by type
    nodeSel.each(function(d) {
      const g    = d3.select(this);
      const col  = NODE_COLOR[d.type] || '#888';
      const r    = NODE_RADIUS[d.type] || 16;

      if (d.type === 'obligation') {
        g.append('rect')
          .attr('x', -r).attr('y', -r / 1.5)
          .attr('width', r * 2).attr('height', r * 1.3)
          .attr('rx', 6)
          .attr('fill', col + '22')
          .attr('stroke', col)
          .attr('stroke-width', d.severity === 'critical' ? 2.5 : 1.5);
      } else if (d.type === 'date') {
        const s = r * 1.1;
        g.append('polygon')
          .attr('points', `0,${-s} ${s},0 0,${s} ${-s},0`)
          .attr('fill', col + '22')
          .attr('stroke', col)
          .attr('stroke-width', 1.5);
      } else if (d.type === 'risk') {
        const s = r * 1.2;
        g.append('polygon')
          .attr('points', `0,${-s} ${s},${s * 0.8} ${-s},${s * 0.8}`)
          .attr('fill', col + '22')
          .attr('stroke', col)
          .attr('stroke-width', 2);
      } else {
        // document & party — circles
        g.append('circle')
          .attr('r', r)
          .attr('fill', col + '22')
          .attr('stroke', col)
          .attr('stroke-width', d.type === 'document' ? 2.5 : 1.5);
        if (d.type === 'document') {
          g.append('circle')
            .attr('r', r * 0.5)
            .attr('fill', col + '44')
            .attr('stroke', 'none');
        }
      }

      // Type icon text inside node
      const iconMap = { document: '📄', party: '👤', obligation: '⚖', date: '📅', risk: '⚠' };
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', r * 0.75)
        .attr('pointer-events', 'none')
        .text(iconMap[d.type] || '');

      // Label below node
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', r + 13)
        .attr('font-size', 10)
        .attr('font-family', 'sans-serif')
        .attr('fill', '#bacac3')
        .attr('pointer-events', 'none')
        .text(d.label?.length > 22 ? d.label.slice(0, 20) + '…' : d.label);
    });

    // Hover tooltip
    const tooltip = d3.select(svgRef.current.parentElement)
      .selectAll('.graph-tooltip')
      .data([null])
      .join('div')
      .attr('class', 'graph-tooltip')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', '#0c1c49')
      .style('border', '1px solid rgba(255,255,255,0.1)')
      .style('border-radius', '8px')
      .style('padding', '6px 10px')
      .style('font-size', '11px')
      .style('color', '#dbe1ff')
      .style('opacity', '0')
      .style('transition', 'opacity 0.15s')
      .style('max-width', '200px')
      .style('z-index', '30');

    nodeSel
      .on('mouseenter', (event, d) => {
        tooltip.style('opacity', '1')
          .html(`<strong style="color:${NODE_COLOR[d.type]}">${d.label}</strong><br/><span style="color:#6b7280">${d.type}</span>${d.details ? `<br/><span style="color:#9ca3af;font-size:10px">${d.details.slice(0, 80)}</span>` : ''}`);
      })
      .on('mousemove', (event) => {
        const rect = svgRef.current.parentElement.getBoundingClientRect();
        tooltip
          .style('left', `${event.clientX - rect.left + 12}px`)
          .style('top',  `${event.clientY - rect.top  - 10}px`);
      })
      .on('mouseleave', () => tooltip.style('opacity', '0'));

    // Click on SVG background clears selection
    svg.on('click', () => setSelectedNode(null));

    // Force simulation
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(validEdges).id(d => d.id).distance(d => d.isConflict ? 200 : 130))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide().radius(d => (NODE_RADIUS[d.type] || 16) + 20));

    simulationRef.current = sim;

    sim.on('tick', () => {
      edgeSel
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      edgeLabelG.selectAll('text')
        .attr('x', d => ((d.source.x || 0) + (d.target.x || 0)) / 2)
        .attr('y', d => ((d.source.y || 0) + (d.target.y || 0)) / 2 - 5);

      nodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => sim.stop();
  }, [graphData, filter, docFilter]);

  /* ── Legend ───────────────────────────────────────────────────── */
  const Legend = () => (
    <div className="absolute bottom-3 left-3 bg-surface-container/90 border border-white/8 rounded-xl px-3 py-2 text-[10px] text-on-surface-variant space-y-1.5 backdrop-blur-sm">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {Object.entries(NODE_COLOR).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        ))}
      </div>
      <div className="flex gap-3 border-t border-white/5 pt-1.5">
        <span className="flex items-center gap-1"><span className="w-5 h-px bg-slate-500 inline-block" />Connection</span>
        <span className="flex items-center gap-1" style={{ color: '#ff6b6b' }}>
          <span className="w-5 inline-block" style={{ borderTop: '1.5px dashed #ff6b6b' }} />Conflict
        </span>
      </div>
    </div>
  );

  /* ── Render ───────────────────────────────────────────────────── */
  const docNodes = graphData?.nodes.filter(n => n.type === 'document') || [];

  return (
    <>
      <Header title="Obligation Web" />
      <div className="p-4 md:p-8 pb-24 space-y-6 max-w-7xl">

        {/* Page title */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight text-white flex items-center gap-3">
              <span className="text-2xl">🕸</span>
              Obligation Web
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Interactive network of all your contracts, parties, and obligations
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-on-surface-variant hover:text-white hover:border-white/20 text-sm font-bold transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-96 gap-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
              <div className="absolute inset-2 border-4 border-primary/40 rounded-full animate-spin" />
              <span className="absolute inset-0 flex items-center justify-center text-2xl">🕸</span>
            </div>
            <div className="text-center">
              <p className="font-headline font-bold text-lg text-on-surface">{LOADING_STEPS[loadStep]}</p>
              <p className="text-sm text-on-surface-variant mt-1">Analyzing document relationships with AI</p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-80 gap-6">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/20">device_hub</span>
            <div className="text-center">
              <p className="font-headline font-bold text-xl text-on-surface mb-2">Cannot Build Obligation Web</p>
              <p className="text-on-surface-variant text-sm max-w-md">{error}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                Try Again
              </button>
              <button
                onClick={() => navigate('/documents')}
                className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-high text-on-surface rounded-xl text-sm font-bold hover:opacity-90 transition-opacity border border-white/10"
              >
                <span className="material-symbols-outlined text-base">description</span>
                My Documents
              </button>
            </div>
          </div>
        )}

        {/* Graph */}
        {!loading && !error && graphData && (
          <>
            {/* Summary + stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Documents',  value: graphData.documentCount,           icon: 'description',  color: 'text-primary'    },
                { label: 'Nodes',      value: graphData.nodes.length,            icon: 'device_hub',   color: 'text-secondary'  },
                { label: 'Connections',value: graphData.edges.length,            icon: 'share',        color: 'text-amber-400'  },
                { label: 'Conflicts',  value: graphData.conflicts?.length || 0,  icon: 'warning',      color: 'text-red-400'    },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="bg-surface-container-low rounded-xl p-4 border border-white/5 flex items-center gap-3">
                  <span className={`material-symbols-outlined text-xl ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  <div>
                    <p className="text-xl font-headline font-extrabold text-on-surface">{value}</p>
                    <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {graphData.summary && (
              <p className="text-sm text-on-surface-variant bg-surface-container-low rounded-xl px-5 py-3 border border-white/5 leading-relaxed">
                <span className="material-symbols-outlined text-primary text-sm align-middle mr-1.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                {graphData.summary}
              </p>
            )}

            {/* Filter bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Filter:</span>
              {[
                { key: 'all',       label: 'Show All'       },
                { key: 'conflicts', label: 'Conflicts Only' },
                { key: 'doc',       label: 'By Document'    },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setFilter(key); if (key !== 'doc') setDocFilter(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-label transition-all ${
                    filter === key
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-surface-container-high text-on-surface-variant border border-white/8 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
              {filter === 'doc' && docNodes.length > 0 && (
                <select
                  value={docFilter}
                  onChange={e => setDocFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-surface-container-high text-on-surface border border-white/10 focus:outline-none focus:border-primary/40"
                >
                  <option value="">Select document…</option>
                  {docNodes.map(n => (
                    <option key={n.id} value={n.id}>{n.label}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Graph canvas */}
            <div
              className="relative rounded-2xl overflow-hidden border border-white/8"
              style={{ background: '#000f3b', height: 520 }}
            >
              <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />
              <Legend />
              {selectedNode && (
                <DetailPanel
                  node={selectedNode}
                  onClose={() => setSelectedNode(null)}
                  onNavigate={(docId) => navigate(`/analysis/${docId}`)}
                />
              )}
              {/* Instructions overlay — fades on interaction */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] text-on-surface-variant/40 text-center pointer-events-none select-none">
                Drag nodes · Scroll to zoom · Click for details
              </div>
            </div>

            {/* Conflicts panel */}
            <ConflictsPanel conflicts={graphData.conflicts} />
          </>
        )}
      </div>
    </>
  );
}
