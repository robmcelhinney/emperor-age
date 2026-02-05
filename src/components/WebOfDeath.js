import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import killerByNameData from "../data/killer_by_name.json"

const WebOfDeath = (props) => {
    const chartRef = useRef(null)

    useEffect(() => {
        renderGraph()
        return () => {
            if (chartRef.current) {
                d3.select(chartRef.current).selectAll("*").remove()
            }
        }
    }, [props.data])

    function renderGraph() {
        if (!chartRef.current) return
        const container = d3.select(chartRef.current)
        container.selectAll("*").remove()

        const emperors = (props.data || [])
            .map((d) => ({
                ...d,
                killer: killerByNameData[d.name] || d.killer || null,
            }))
            .filter((d) => d.killer)

        if (!emperors.length) return

        const killers = Array.from(new Set(emperors.map((d) => d.killer)))
        const killerCounts = killers.reduce((acc, k) => {
            acc[k] = emperors.filter((e) => e.killer === k).length
            return acc
        }, {})

        const killerIcons = {
            "Praetorian Guard": "🗡️",
            "Other Emperor": "👑",
            "Opposing Army": "⚔️",
            "Own Army": "⚔️",
            Senate: "🪓",
            Usurper: "🗡️",
            "Court Officials": "🗝️",
            Wife: "🍷",
            Disease: "🍂",
            "Heart Failure": "🍂",
            Aneurism: "🍂",
            Lightning: "⚡",
            Fire: "🔥",
            Fumes: "💨",
            Unknown: "❔",
        }

        const nodes = [
            ...killers.map((k) => ({
                id: `killer:${k}`,
                label: k,
                type: "killer",
                count: killerCounts[k] || 1,
                icon: killerIcons[k] || "❔",
            })),
            ...emperors.map((e) => ({
                id: `emp:${e.name}`,
                label: e.name,
                type: "emperor",
                dynasty: e.dynasty || "Unknown",
                cause: e.cause,
                image: e.image || null,
            })),
        ]

        const links = emperors.map((e) => ({
            source: `emp:${e.name}`,
            target: `killer:${e.killer}`,
        }))

        const margin = { top: 20, right: 20, bottom: 20, left: 20 }
        let width = chartRef.current.clientWidth - margin.left - margin.right
        if (width > 1440) {
            width = width - (width - 1000)
        }
        if (!width || width < 300) {
            width = 900
        }
        const height = 520
        const viewboxWidth = Math.max(700, width + margin.left + margin.right)
        const viewboxHeight = height + margin.top + margin.bottom

        const svg = container
            .append("svg")
            .attr("viewBox", "0 0 " + viewboxWidth + " " + viewboxHeight)
            .attr("preserveAspectRatio", "xMinYMin meet")

        const g = svg
            .append("g")
            .attr(
                "transform",
                "translate(" + margin.left + "," + margin.top + ")",
            )

        const tooltip = container
            .append("div")
            .style("position", "absolute")
            .style("padding", "10px 14px")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("font-size", "14px")
            .style("line-height", "1.35")
            .style("max-width", "320px")
            .style("z-index", "1000")
            .style("opacity", 0)
            .style("transition", "opacity 0.2s")

        const positionTooltip = (event) => {
            const containerNode = container.node()
            const tooltipNode = tooltip.node()
            if (!containerNode || !tooltipNode) return
            const rect = containerNode.getBoundingClientRect()
            const tipRect = tooltipNode.getBoundingClientRect()
            let tx = event.clientX - rect.left + 12
            let ty = event.clientY - rect.top + 12
            tx = Math.max(8, Math.min(tx, rect.width - tipRect.width - 8))
            ty = Math.max(8, Math.min(ty, rect.height - tipRect.height - 8))
            tooltip.style("left", tx + "px").style("top", ty + "px")
        }

        const killerRadius = (d) =>
            14 + Math.min(16, Math.sqrt(d.count || 1) * 3)

        const killerColor = d3
            .scaleOrdinal()
            .domain(killers)
            .range(d3.schemeTableau10)

        const simulation = d3
            .forceSimulation(nodes)
            .force(
                "link",
                d3
                    .forceLink(links)
                    .id((d) => d.id)
                    .distance(70),
            )
            .force("charge", d3.forceManyBody().strength(-80))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force(
                "collide",
                d3.forceCollide((d) =>
                    d.type === "killer" ? killerRadius(d) + 6 : 10,
                ),
            )
            .force("x", d3.forceX(width / 2).strength(0.07))
            .force("y", d3.forceY(height / 2).strength(0.07))

        const link = g
            .append("g")
            .attr("stroke", "#bdbdbd")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .enter()
            .append("line")
            .attr("stroke-width", 1)

        const node = g
            .append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("r", (d) => (d.type === "killer" ? killerRadius(d) : 5))
            .attr("fill", (d) =>
                d.type === "killer" ? killerColor(d.label) : "#5aa0d8",
            )
            .attr("stroke", (d) =>
                d.type === "killer" ? "#2f2118" : "#2e5a7a",
            )
            .attr("stroke-width", (d) => (d.type === "killer" ? 1.4 : 0.6))
            .call(
                d3
                    .drag()
                    .on("start", (event, d) => {
                        if (!event.active) simulation.alphaTarget(0.3).restart()
                        d.fx = d.x
                        d.fy = d.y
                    })
                    .on("drag", (event, d) => {
                        d.fx = event.x
                        d.fy = event.y
                    })
                    .on("end", (event, d) => {
                        if (!event.active) simulation.alphaTarget(0)
                        d.fx = null
                        d.fy = null
                    }),
            )
            .on("mouseover", function (event, d) {
                if (d.type === "killer") {
                    tooltip
                        .style("opacity", 1)
                        .html(
                            "<strong>" +
                                d.label +
                                "</strong><br/>Killer category",
                        )
                } else {
                    const imageHtml = d.image
                        ? '<img src="' +
                          d.image +
                          '" alt="' +
                          d.label +
                          '" style="width:48px;height:48px;object-fit:cover;border-radius:4px;flex:0 0 auto;" />'
                        : ""
                    tooltip
                        .style("opacity", 1)
                        .html(
                            '<div style="display:flex;gap:10px;align-items:center;">' +
                                imageHtml +
                                '<div style="min-width:0;"><strong>' +
                                d.label +
                                "</strong><br/>" +
                                "Dynasty: " +
                                d.dynasty +
                                "<br/>" +
                                "Cause: " +
                                d.cause +
                                "</div></div>",
                        )
                }
                positionTooltip(event)
            })
            .on("mousemove", (event) => {
                positionTooltip(event)
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0)
            })

        const iconLabel = g
            .append("g")
            .selectAll("text")
            .data(nodes.filter((d) => d.type === "killer"))
            .enter()
            .append("text")
            .attr("font-size", "16px")
            .attr("text-anchor", "middle")
            .text((d) => d.icon)

        const label = g
            .append("g")
            .selectAll("text")
            .data(nodes.filter((d) => d.type === "killer"))
            .enter()
            .append("text")
            .attr("font-size", "11px")
            .attr("font-weight", 600)
            .attr("fill", "#2c1c12")
            .attr("text-anchor", "middle")
            .attr("paint-order", "stroke")
            .attr("stroke", "rgba(255,255,255,0.9)")
            .attr("stroke-width", 3)
            .text((d) => d.label)

        simulation.on("tick", () => {
            const clampX = (x) => Math.max(10, Math.min(width - 10, x))
            const clampY = (y) => Math.max(10, Math.min(height - 10, y))

            link.attr("x1", (d) => clampX(d.source.x))
                .attr("y1", (d) => clampY(d.source.y))
                .attr("x2", (d) => clampX(d.target.x))
                .attr("y2", (d) => clampY(d.target.y))

            node.attr("cx", (d) => clampX(d.x)).attr("cy", (d) => clampY(d.y))
            iconLabel
                .attr("x", (d) => clampX(d.x))
                .attr("y", (d) => clampY(d.y + 6))
            label
                .attr("x", (d) => clampX(d.x))
                .attr("y", (d) => clampY(d.y + 34))
        })
    }

    return (
        <div style={{ marginTop: "30px" }}>
            <div style={{ padding: "0 20px 10px 20px" }}>
                <h2 style={{ margin: 0 }}>Web of Death</h2>
                <p style={{ margin: "6px 0 0 0" }}>
                    A force-directed network of emperors and their killers.
                </p>
            </div>
            <div ref={chartRef} style={{ position: "relative" }} />
        </div>
    )
}

export default WebOfDeath
