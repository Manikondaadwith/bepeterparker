import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import * as d3 from 'd3';

export default function SkillMap() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState(null);
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

  // D3 Skill Graph
  useEffect(() => {
    if (!svgRef.current || skills.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = Math.max(500, container.clientHeight);

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create nodes from skills
    const maxXP = Math.max(...skills.map(s => s.xp), 10);
    const nodes = skills.map((skill, i) => ({
      id: skill.id,
      name: skill.name,
      xp: skill.xp,
      questCount: skill.quest_count,
      color: skill.color || '#DC143C',
      radius: Math.max(25, Math.min(60, 20 + (skill.xp / maxXP) * 40)),
    }));

    // Create central node
    nodes.unshift({
      id: 'center',
      name: '🕷️',
      xp: 0,
      questCount: 0,
      color: '#DC143C',
      radius: 40,
      fx: width / 2,
      fy: height / 2,
    });

    // Create links from center to each skill
    const links = skills.map(skill => ({
      source: 'center',
      target: skill.id,
    }));

    // Add cross-links between skills in same domain groups
    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        if (skills[i].domain === skills[j].domain) {
          links.push({ source: skills[i].id, target: skills[j].id });
        }
      }
    }

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 10));

    // Draw links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', 'rgba(220,20,60,0.2)')
      .attr('stroke-width', 1.5);

    // Draw node groups
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (d.id !== 'center') {
          setSelectedSkill(d);
        }
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

    // Glow filter
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const merge = filter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'coloredBlur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Node circles
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.id === 'center' ? 'var(--color-verse-panel)' : `${d.color}20`)
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2)
      .attr('filter', 'url(#glow)');

    // Node labels
    node.append('text')
      .text(d => d.id === 'center' ? d.name : d.name.length > 12 ? d.name.substring(0, 10) + '…' : d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.id === 'center' ? 5 : -5)
      .attr('fill', d => d.id === 'center' ? '#fff' : d.color)
      .attr('font-size', d => d.id === 'center' ? '20px' : '11px')
      .attr('font-weight', '600')
      .attr('font-family', 'Inter, sans-serif');

    // XP labels
    node.filter(d => d.id !== 'center')
      .append('text')
      .text(d => `${d.xp} XP`)
      .attr('text-anchor', 'middle')
      .attr('dy', 12)
      .attr('fill', 'rgba(139,148,158,0.8)')
      .attr('font-size', '9px')
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
  }, [skills]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16" style={{ background: 'var(--color-verse-bg)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <span className="text-5xl">🕸️</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8 px-4" style={{ background: 'var(--color-verse-bg)' }}>
      <div className="max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold mb-2"
        >
          🧠 Skill Discovery Map
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 text-sm"
          style={{ color: 'var(--color-verse-muted)' }}
        >
          Your knowledge graph grows with every completed quest. Drag nodes to explore connections.
        </motion.p>

        {skills.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-16 text-center"
          >
            <p className="text-6xl mb-4">🕸️</p>
            <h2 className="text-xl font-bold mb-2">No Skills Yet</h2>
            <p style={{ color: 'var(--color-verse-muted)' }}>
              Complete quests to discover new skill domains and build your knowledge web!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Graph */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-2 glass-card overflow-hidden"
              ref={containerRef}
              style={{ minHeight: 500 }}
            >
              <svg ref={svgRef} style={{ width: '100%', height: '100%', minHeight: 500 }} />
            </motion.div>

            {/* Skill List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              <h3 className="font-bold text-lg mb-3">📊 Skill Breakdown</h3>
              {skills.map((skill, i) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="glass-card p-4"
                  style={{
                    borderLeft: `3px solid ${skill.color || '#DC143C'}`,
                    background: selectedSkill?.name === skill.name ? 'rgba(220,20,60,0.1)' : undefined
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{skill.name}</span>
                    <span className="text-xs px-2 py-1 rounded-full"
                      style={{ background: `${skill.color || '#DC143C'}20`, color: skill.color || '#DC143C' }}>
                      {skill.xp} XP
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--color-verse-panel)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min(100, (skill.xp / Math.max(...skills.map(s => s.xp), 1)) * 100)}%`,
                        background: skill.color || '#DC143C'
                      }} />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--color-verse-muted)' }}>
                      {skill.quest_count} quests
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
