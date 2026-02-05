import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import * as constClass from "../constants/constants.js"

const CrisisTimeline = (props) => {
    const chartRef = useRef(null)

    useEffect(() => {
        renderTimeline()
        return () => {
            if (chartRef.current) {
                d3.select(chartRef.current).selectAll("*").remove()
            }
        }
    }, [props.data])

    function parseDate(dateStr, overrideYear = null) {
        if (!dateStr) return null
        const [yearStr, monthStr, dayStr] = dateStr.split("-")
        if (!yearStr) return null
        const yearInt = parseInt(yearStr, 10)
        const year = overrideYear !== null ? overrideYear : yearInt
        const month = (parseInt(monthStr || "1", 10) || 1) - 1
        const day = parseInt(dayStr || "1", 10) || 1
        // Use setUTCFullYear so years 0-99 don't get coerced to 1900+.
        const date = new Date(Date.UTC(0, month, day))
        date.setUTCFullYear(year)
        return date
    }

    function formatYear(date) {
        if (!date) return "Unknown"
        const year = date.getUTCFullYear()
        if (year <= 0) return `${Math.abs(year - 1)} BCE`
        return `${year} CE`
    }

    function renderTimeline() {
        if (!chartRef.current) return

        const container = d3.select(chartRef.current)
        container.selectAll("*").remove()

        const data = (props.data || [])
            .map((d) => {
                const startRaw = d.reign_start || d.birth
                const endRaw = d.reign_end || d.death
                if (!startRaw || !endRaw) return null
                const startYear = parseInt(startRaw.split("-")[0], 10)
                const endYear = parseInt(endRaw.split("-")[0], 10)
                let start = null
                let end = null
                if (!Number.isNaN(startYear) && !Number.isNaN(endYear)) {
                    if (startYear > endYear) {
                        // Treat start as BCE when it numerically exceeds end (e.g., 0027 -> 27 BCE, 0014 -> 14 CE).
                        const bceYear = -(startYear - 1)
                        start = parseDate(startRaw, bceYear)
                        end = parseDate(endRaw, endYear)
                    } else {
                        start = parseDate(startRaw, startYear)
                        end = parseDate(endRaw, endYear)
                    }
                }
                if (!start || !end) return null
                return { ...d, start, end }
            })
            .filter(Boolean)
            .sort((a, b) => a.start - b.start)

        if (!data.length) return

        const legendWidth = 0
        const margin = { top: 20, right: 20 + legendWidth, bottom: 40, left: 30 }
        const rowHeight = 14

        // Lane assignment to show overlaps (stacked rows)
        const lanes = []
        data.forEach((d) => {
            let laneIndex = lanes.findIndex((laneEnd) => laneEnd <= d.start)
            if (laneIndex === -1) {
                laneIndex = lanes.length
                lanes.push(d.end)
            } else {
                lanes[laneIndex] = d.end
            }
            d.lane = laneIndex
        })

        const height = Math.max(260, lanes.length * rowHeight + 40)
        let width = chartRef.current.clientWidth - margin.left - margin.right
        if (width > 1440) {
            width = width - (width - 1000)
        }

        const viewboxWidth = Math.max(500, width + margin.left + margin.right)
        const viewboxHeight = height + margin.top + margin.bottom

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

        const svg = container
            .append("svg")
            .attr("viewBox", "0 0 " + viewboxWidth + " " + viewboxHeight)
            .attr("preserveAspectRatio", "xMinYMin meet")

        const g = svg
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

        const minStart = d3.min(data, (d) => d.start)
        const maxEnd = d3.max(data, (d) => d.end)
        const x = d3.scaleTime().domain([minStart, maxEnd]).range([0, width])

        const y = d3
            .scaleBand()
            .domain(d3.range(lanes.length))
            .range([0, height])
            .padding(0.2)

        // Highlight Year of the Four Emperors (69 CE)
        const year69Start = parseDate("0069-01-01", 69)
        const year69End = parseDate("0069-12-31", 69)
        g.append("rect")
            .attr("x", x(year69Start))
            .attr("y", 0)
            .attr("width", Math.max(2, x(year69End) - x(year69Start)))
            .attr("height", height)
            .attr("fill", "#f4d03f")
            .attr("opacity", 0.18)
        g.append("text")
            .attr("x", x(year69Start) + 4)
            .attr("y", 12)
            .attr("fill", "#7a5d00")
            .attr("font-size", "12px")
            .attr("font-weight", 600)
            .text("69 CE")

        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(
                d3
                    .axisBottom(x)
                    .tickFormat((d) => formatYear(d))
                    .ticks(10)
                    .tickSize(-height),
            )

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

        // Alternating lane background for separation
        g.append("g")
            .selectAll("rect")
            .data(d3.range(lanes.length))
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", (d) => y(d))
            .attr("width", width)
            .attr("height", y.bandwidth())
            .attr("fill", (d) => (d % 2 === 0 ? "#f7f7f7" : "#ffffff"))
            .attr("opacity", 0.6)

        const bars = g.append("g")
            .selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", (d) => x(d.start))
            .attr("y", (d) => y(d.lane))
            .attr("width", (d) => Math.max(1, x(d.end) - x(d.start)))
            .attr("height", y.bandwidth())
            .attr("fill", (d) => constClass.DYNASTY_COLOUR[d.dynasty] || "#6bbbf2")
            .attr("opacity", 0.85)
            .attr("stroke", "#1f1f1f")
            .attr("stroke-width", 0.4)
            .on("mouseover", function (event, d) {
                d3.select(this).attr("stroke-width", 1.2)
                tooltip.transition().duration(200).style("opacity", 1)
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
                    (d.dynasty || "Unknown") +
                    "<br/>" +
                    "Reign: " +
                    formatYear(d.start) +
                    " – " +
                    formatYear(d.end) +
                    "<br/>" +
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
            })
            .on("mousemove", function (event) {
                positionTooltip(event)
            })
            .on("mouseout", function () {
                d3.select(this).attr("stroke-width", 0.4)
                tooltip.transition().duration(200).style("opacity", 0)
            })

        // Labels for longer reigns to improve identification
        g.append("g")
            .selectAll("text")
            .data(data.filter((d) => x(d.end) - x(d.start) > 60))
            .enter()
            .append("text")
            .attr("x", (d) => x(d.start) + 4)
            .attr("y", (d) => y(d.lane) + y.bandwidth() / 2 + 4)
            .attr("fill", "#111")
            .attr("font-size", "11px")
            .attr("font-weight", 600)
            .attr("pointer-events", "none")
            .text((d) => d.name)
    }

    return (
        <div style={{ marginTop: "30px" }}>
            <div style={{ padding: "0 20px 10px 20px" }}>
                <h2 style={{ margin: 0 }}>Crisis Timeline</h2>
                <p style={{ margin: "6px 0 0 0" }}>
                    Overlapping reigns reveal instability during succession crises.
                </p>
            </div>
            <div
                id={"crisis_timeline"}
                ref={chartRef}
                style={{
                    position: "relative",
                    maxHeight: "70vh",
                    overflowY: "auto",
                }}
            />
        </div>
    )
}

export default CrisisTimeline
