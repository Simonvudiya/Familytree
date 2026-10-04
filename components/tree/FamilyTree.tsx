"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Person } from "@/types/person";
import { formatLifespan, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface FamilyTreeProps {
  people: Person[];
  centerPersonId?: string | null;
  onPersonClick?: (person: Person) => void;
  zoom?: number;
}

export function FamilyTree({
  people,
  centerPersonId,
  onPersonClick,
  zoom = 1,
}: FamilyTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!containerRef.current || !people.length) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 800;

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("transform", `scale(${zoom})`)
      .style("transform-origin", "center top");

    // Build hierarchy from relationships
    const personMap = new Map(people.map(p => [p.id, { ...p, children: [] as Person[] }]));
    const roots: Person[] = [];

    people.forEach(person => {
      // This would use actual relationships in production
      // For now, use generation as hierarchy level
    });

    // Group by generation
    const generations = new Map<number, Person[]>();
    people.forEach(p => {
      const gen = p.generation || 1;
      if (!generations.has(gen)) generations.set(gen, []);
      generations.get(gen)!.push(p);
    });

    const sortedGenerations = Array.from(generations.entries()).sort((a, b) => a[0] - b[0]);
    const genHeight = height / (sortedGenerations.length + 1);

    // Render each generation
    sortedGenerations.forEach(([gen, genPeople], genIndex) => {
      const y = (genIndex + 1) * genHeight;
      const spacing = width / (genPeople.length + 1);

      genPeople.forEach((person, personIndex) => {
        const x = (personIndex + 1) * spacing;
        const isCenter = person.id === centerPersonId;
        const initials = getInitials(person.name);
        const lifespan = formatLifespan(person.birth_date, person.death_date, person.is_living);

        // Node group
        const node = svg.append("g")
          .attr("transform", `translate(${x}, ${y})`)
          .style("cursor", onPersonClick ? "pointer" : "default")
          .on("click", () => onPersonClick?.(person));

        // Circle
        node.append("circle")
          .attr("r", 30)
          .attr("fill", isCenter ? "#0ea5e9" : "#e0f2fe")
          .attr("stroke", isCenter ? "#0369a1" : "#0ea5e9")
          .attr("stroke-width", isCenter ? 3 : 2)
          .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");

        // Initials
        node.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .attr("font-size", "14px")
          .attr("font-weight", "bold")
          .attr("font-family", "Georgia, serif")
          .attr("fill", isCenter ? "white" : "#0ea5e9")
          .text(initials);

        // Name
        node.append("text")
          .attr("y", 45)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("font-weight", "500")
          .attr("fill", "#1e293b")
          .attr("max-width", "100px")
          .style("white-space", "nowrap")
          .style("overflow", "hidden")
          .style("text-overflow", "ellipsis")
          .text(person.name.length > 15 ? person.name.substring(0, 15) + "…" : person.name);

        // Lifespan
        if (lifespan) {
          node.append("text")
            .attr("y", 62)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "#64748b")
            .text(lifespan);
        }

        // Center indicator
        if (isCenter) {
          node.append("circle")
            .attr("r", 35)
            .attr("fill", "none")
            .attr("stroke", "#0ea5e9")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5")
            .style("animation", "pulse 2s infinite");
        }
      });
    });

    // Add generation labels
    sortedGenerations.forEach(([gen, genPeople], genIndex) => {
      const y = (genIndex + 1) * genHeight;
      svg.append("text")
        .attr("x", 20)
        .attr("y", y)
        .attr("dy", "0.35em")
        .attr("font-size", "14px")
        .attr("font-weight", "600")
        .attr("fill", "#0ea5e9")
        .attr("background", "white")
        .text(`Generation ${gen}`);
    });

    // Add pulse animation style
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0% { stroke-opacity: 0.5; }
        50% { stroke-opacity: 1; }
        100% { stroke-opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [people, centerPersonId, onPersonClick, zoom]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full h-[800px] overflow-auto bg-background", "relative")}
      style={{ transform: `scale(${zoom})`, transformOrigin: "center top" }}
    >
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}