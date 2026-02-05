import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import * as constClass from "../constants/constants.js"

const AgeDistribution = (props) => {
    const chartRef = useRef(null)

    useEffect(() => {
        renderPlot()
        return () => {
            if (chartRef.current) {
                d3.select(chartRef.current).selectAll("*").remove()
            }
        }
    }, [props.data])

    function renderPlot() {
        if (!chartRef.current) return
        const container = d3.select(chartRef.current)
        container.selectAll("*").remove()

        const data = (props.data || []).filter((d) => "Emperor" in d)
        if (!data.length) return

        const nodes = data
            .map((d) => ({
                name: d.name,
                dynasty: d.dynasty || "Unknown",
                age: d["Pre Emperor"] + d["Emperor"] + (d["Post Emperor"] || 0),
                cause: d.cause,
                image: d.image || null,
            }))
            .filter((d) => Number.isFinite(d.age))

        const dynasties = Array.from(
            new Set(nodes.map((d) => d.dynasty)),
        ).sort()

        const isMobile =
            typeof window !== "undefined" && window.innerWidth < 640
        const margin = {
            top: 20,
            right: 20,
            bottom: 40,
            left: isMobile ? 90 : 140,
        }
        let width = chartRef.current.clientWidth - margin.left - margin.right
        if (width > 1440) {
            width = width - (width - 1000)
        }
        const height = Math.max(260, dynasties.length * 28)
        const viewboxWidth = isMobile
            ? Math.max(900, width + margin.left + margin.right)
            : Math.max(600, width + margin.left + margin.right)
        const viewboxHeight = height + margin.top + margin.bottom

        const svg = container
            .append("svg")
            .attr("viewBox", "0 0 " + viewboxWidth + " " + viewboxHeight)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("width", isMobile ? viewboxWidth : null)

        const g = svg
            .append("g")
            .attr(
                "transform",
                "translate(" + margin.left + "," + margin.top + ")",
            )

        const x = d3
            .scaleLinear()
            .domain([0, d3.max(nodes, (d) => d.age) || 0])
            .nice()
            .range([0, width])

        const y = d3
            .scaleBand()
            .domain(dynasties)
            .range([0, height])
            .padding(0.4)

        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(
                d3
                    .axisBottom(x)
                    .tickFormat((d) => d + " yrs")
                    .tickSize(-height),
            )

        g.append("g").attr("class", "axis").call(d3.axisLeft(y))

        const tooltip = container
            .append("div")
            .style("position", "absolute")
            .style("padding", "10px 14px")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("font-size", "16px")
            .style("line-height", "1.35")
            .style("max-width", "320px")
            .style("z-index", "1000")
            .style("opacity", 0)
            .style("transition", "opacity 0.3s")

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

        const simulation = d3
            .forceSimulation(nodes)
            .force("x", d3.forceX((d) => x(d.age)).strength(1))
            .force(
                "y",
                d3
                    .forceY((d) => y(d.dynasty) + y.bandwidth() / 2)
                    .strength(0.8),
            )
            .force("collide", d3.forceCollide(6))
            .stop()

        for (let i = 0; i < 200; i += 1) {
            simulation.tick()
        }

        let lockedDynasty = null

        const applyHighlight = (dynasty) => {
            g.selectAll("circle")
                .attr("opacity", (node) =>
                    dynasty && node.dynasty === dynasty
                        ? 1
                        : dynasty
                          ? 0.15
                          : 0.9,
                )
                .attr("stroke-width", (node) =>
                    dynasty && node.dynasty === dynasty ? 1.2 : 0.3,
                )
        }

        let hideTimer = null
        const showTip = (event, d) => {
            if (hideTimer) {
                clearTimeout(hideTimer)
                hideTimer = null
            }
            tooltip.transition().duration(150).style("opacity", 1)
            const imageHtml = d.image
                ? '<img src="' +
                  d.image +
                  '" alt="' +
                  d.name +
                  '" style="width:64px;height:64px;object-fit:cover;border-radius:4px;flex:0 0 auto;" />'
                : ""
            const detailHtml =
                "<strong>" +
                d.name +
                "</strong><br/>" +
                "Dynasty: " +
                d.dynasty +
                "<br/>" +
                "Age at death: " +
                d.age +
                " years<br/>" +
                "Cause of death: " +
                d.cause
            tooltip.html(
                '<div style="display:flex;gap:10px;align-items:center;">' +
                    imageHtml +
                    '<div style="min-width:0;">' +
                    detailHtml +
                    "</div></div>",
            )
            positionTooltip(event)
        }

        const hideTip = () => {
            tooltip.transition().duration(150).style("opacity", 0)
        }

        const circles = g
            .append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("r", 5)
            .attr(
                "fill",
                (d) =>
                    constClass.DYNASTY_COLOUR[d.dynasty] ||
                    constClass.DYNASTY_COLOUR["Unknown"] ||
                    "#6bbbf2",
            )
            .attr("opacity", 0.9)
            .attr("stroke", "#1f1f1f")
            .attr("stroke-width", 0.3)
            .attr("data-dynasty", (d) => d.dynasty)
            .on("mouseover", function (event, d) {
                applyHighlight(lockedDynasty || d.dynasty)
                showTip(event, d)
            })
            .on("mousemove", function (event) {
                positionTooltip(event)
            })
            .on("mouseout", function () {
                applyHighlight(lockedDynasty)
                hideTip()
            })
            .on("click", function (event, d) {
                event.stopPropagation()
                lockedDynasty = lockedDynasty === d.dynasty ? null : d.dynasty
                applyHighlight(lockedDynasty)
            })
            .on("touchstart", function (event, d) {
                event.preventDefault()
                showTip(event, d)
                hideTimer = setTimeout(() => hideTip(), 2000)
            })

        svg.on("click", function () {
            lockedDynasty = null
            applyHighlight(lockedDynasty)
        })
    }

    return (
        <div style={{ marginTop: "30px" }}>
            <div style={{ padding: "0 20px 10px 20px" }}>
                <h2 style={{ margin: 0 }}>Age Distribution</h2>
                <p style={{ margin: "6px 0 0 0" }}>
                    Each emperor is a dot placed by age at death, grouped by
                    dynasty.
                </p>
            </div>
            <div
                id={"age_distribution"}
                ref={chartRef}
                style={{
                    position: "relative",
                    maxHeight: "70vh",
                    overflowY: "auto",
                    overflowX: "auto",
                }}
            />
        </div>
    )
}

export default AgeDistribution
