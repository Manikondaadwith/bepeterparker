import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import * as d3 from 'd3';

export default function SkillMap() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [viewMode, setViewMode] = useState('graph'); // 'graph' or 'list'
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getSkills();
        setSkills(data.skills || []);
      } catch (err) {
        console.error('Skills load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Auto-switch to list on very small screens
  useEffect(() => {
    if (window.innerWidth < 480 && skills.length > 0) {
      setViewMode('list');
    }
  }, [skills]);

  // D3 Skill Graph
  useEffect(() => {
    if (!svgRef.current || skills.length === 0 || viewMode !== 'graph') return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = Math.max(400, Math.min(600, container.clientWidth * 0.75));

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const maxXP = Math.max(...skills.map(s => s.xp), 10);
    const isMobile = width < 500;
    const nodes = skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      xp: skill.xp,
      questCount: skill.quest_count,
      color: skill.color || '#DC143C',
      radius: isMobile
        ? Math.max(18, Math.min(40, 15 + (skill.xp / maxXP) * 25))
        : Math.max(25, Math.min(60, 20 + (skill.xp / maxXP) * 40)),
    }));

    nodes.unshift({
      id: 'center',
      name: '🕷️',
      xp: 0,
      questCount: 0,
      color: '#DC143C',
      radius: isMobile ? 28 : 40,
      fx: width / 2,
      fy: height / 2,
    });

    const links = skills.map(skill => ({
      source: 'center',
      target: skill.id,
    }));

    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        if (skills[i].domain === skills[j].domain) {
          links.push({ source: skills[i].id, target: skills[j].id });
        }
      }
    }

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(isMobile ? 70 : 120))
      .force('charge', d3.forceManyBody().strength(isMobile ? -150 : -300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + (isMobile ? 5 : 10)));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', 'rgba(220,20,60,0.2)')
      .attr('stroke-width', 1.5);

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (d.id !== 'center') setSelectedSkill(d);
      })
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          if (d.id !== 'center') { d.fx = null; d.fy = null; }
        })
      );

    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const merge = filter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'coloredBlur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.id === 'center' ? 'var(--color-verse-panel)' : `${d.color}20`)
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2)
      .attr('filter', 'url(#glow)');

    node.append('text')
      .text(d => d.id === 'center' ? d.name : d.name.length > (isMobile ? 8 : 12) ? d.name.substring(0, isMobile ? 6 : 10) + '…' : d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.id === 'center' ? 5 : -5)
      .attr('fill', d => d.id === 'center' ? '#fff' : d.color)
      .attr('font-size', d => d.id === 'center' ? (isMobile ? '16px' : '20px') : (isMobile ? '9px' : '11px'))
      .attr('font-weight', '600')
      .attr('font-family', 'Inter, sans-serif');

    node.filter(d => d.id !== 'center')
      .append('text')
      .text(d => `${d.xp} XP`)
      .attr('text-anchor', 'middle')
      .attr('dy', 12)
      .attr('fill', 'rgba(139,148,158,0.8)')
      .attr('font-size', isMobile ? '7px' : '9px')
      .attr('font-family', 'Inter, sans-serif');

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [skills, viewMode]);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <span className="text-5xl">🕸️</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="max-w-6xl mx-auto mobile-safe">
        <div className="flex items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-3xl font-extrabold mb-1">
              🧠 Skill Map
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-[11px] sm:text-sm" style={{ color: 'var(--color-verse-muted)' }}>
              {skills.length > 0 ? 'Tap nodes to explore. Drag to rearrange.' : 'Complete quests to discover skills.'}
            </motion.p>
          </div>
          {skills.length > 0 && (
            <button
              onClick={() => setViewMode(v => v === 'graph' ? 'list' : 'graph')}
              className="text-[10px] sm:text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium shrink-0"
              style={{ background: 'var(--color-verse-panel)', border: '1px solid var(--color-verse-border)', color: 'var(--color-verse-muted)' }}
            >
              {viewMode === 'graph' ? '📊 List' : '🕸️ Graph'}
            </button>
          )}
        </div>

        {skills.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10 sm:p-16 text-center">
            <p className="text-5xl sm:text-6xl mb-4">🕸️</p>
            <h2 className="text-lg sm:text-xl font-bold mb-2">No Skills Yet</h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--color-verse-muted)' }}>
              Complete quests to discover new skill domains!
            </p>
          </motion.div>
        ) : viewMode === 'graph' ? (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Graph */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:flex-[2] glass-card overflow-hidden"
              ref={containerRef}
              style={{ minHeight: 350 }}
            >
              <svg ref={svgRef} style={{ width: '100%', height: '100%', minHeight: 350, touchAction: 'none' }} />
            </motion.div>

            {/* Skill List sidebar */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="lg:flex-1 space-y-2 sm:space-y-3">
              <h3 className="font-bold text-sm sm:text-lg mb-2 sm:mb-3">📊 Breakdown</h3>
              {skills.map((skill, i) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="glass-card p-3 sm:p-4"
                  style={{
                    borderLeft: `3px solid ${skill.color || '#DC143C'}`,
                    background: selectedSkill?.name === skill.name ? 'rgba(220,20,60,0.1)' : undefined
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-2">
                    <span className="font-semibold text-xs sm:text-sm truncate">{skill.name}</span>
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: `${skill.color || '#DC143C'}20`, color: skill.color || '#DC143C' }}>
                      {skill.xp} XP
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 sm:h-2 rounded-full" style={{ background: 'var(--color-verse-panel)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min(100, (skill.xp / Math.max(...skills.map(s => s.xp), 1)) * 100)}%`,
                        background: skill.color || '#DC143C'
                      }} />
                    </div>
                    <span className="text-[10px] sm:text-xs shrink-0" style={{ color: 'var(--color-verse-muted)' }}>
                      {skill.quest_count}q
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ) : (
          /* List view — better for small screens */
          <div className="space-y-2 sm:space-y-3">
            {skills.map((skill, i) => (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
                className="glass-card p-3 sm:p-4"
                style={{ borderLeft: `3px solid ${skill.color || '#DC143C'}` }}
              >
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <span className="font-semibold text-xs sm:text-sm truncate">{skill.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] sm:text-xs" style={{ color: 'var(--color-verse-muted)' }}>
                      {skill.quest_count} quests
                    </span>
                    <span className="text-xs sm:text-sm font-bold" style={{ color: skill.color || '#DC143C' }}>
                      {skill.xp} XP
                    </span>
                  </div>
                </div>
                <div className="h-1.5 sm:h-2 rounded-full" style={{ background: 'var(--color-verse-panel)' }}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${Math.min(100, (skill.xp / Math.max(...skills.map(s => s.xp), 1)) * 100)}%`,
                    background: skill.color || '#DC143C'
                  }} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
