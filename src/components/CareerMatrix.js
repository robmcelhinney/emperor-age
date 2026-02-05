import React, { useEffect, useRef } from "react"
import * as d3 from "d3"

const CareerMatrix = (props) => {
    const chartRef = useRef(null)

    useEffect(() => {
        renderMatrix()
        return () => {
            if (chartRef.current) {
                d3.select(chartRef.current).selectAll("*").remove()
            }
        }
    }, [props.data])

    function renderMatrix() {
        if (!chartRef.current) return
        const container = d3.select(chartRef.current)
        container.selectAll("*").remove()

        const data = (props.data || []).filter((d) => d.rise && d.cause)
        if (!data.length) return

        const riseOrder = [
            "Birthright",
            "Appointment by Emperor",
            "Appointment by Senate",
            "Appointment by Praetorian Guard",
            "Appointment by Army",
            "Election",
            "Purchase",
            "Seized Power",
        ]
        const causeOrder = [
            "Natural Causes",
            "Assassination",
            "Execution",
            "Suicide",
            "Died in Battle",
            "Captivity",
            "Unknown",
        ]

        const riseValues = riseOrder.filter((v) =>
            data.some((d) => d.rise === v),
        )
        const causeValues = causeOrder.filter((v) =>
            data.some((d) => d.cause === v),
        )

        const counts = new Map()
        data.forEach((d) => {
            const key = `${d.rise}||${d.cause}`
            counts.set(key, (counts.get(key) || 0) + 1)
        })

        const cells = []
        riseValues.forEach((r) => {
            causeValues.forEach((c) => {
                const key = `${r}||${c}`
                cells.push({ rise: r, cause: c, count: counts.get(key) || 0 })
            })
        })

        const maxCount = d3.max(cells, (d) => d.count) || 1
        const isMobile =
            typeof window !== "undefined" && window.innerWidth < 640

        const margin = {
            top: 20,
            right: 20,
            bottom: 50,
            left: isMobile ? 120 : 220,
        }
        let width = chartRef.current.clientWidth - margin.left - margin.right
        if (width > 1440) {
            width = width - (width - 1000)
        }
        const cellSize = 26
        const height = Math.max(220, riseValues.length * cellSize)
        const viewboxWidth = isMobile
            ? Math.max(900, width + margin.left + margin.right)
            : Math.max(700, width + margin.left + margin.right)
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
            .scaleBand()
            .domain(causeValues)
            .range([0, width])
            .padding(0.08)

        const y = d3
            .scaleBand()
            .domain(riseValues)
            .range([0, height])
            .padding(0.08)

        const color = d3
            .scaleSequential(d3.interpolateReds)
            .domain([0, maxCount])

        g.append("g").attr("class", "axis").call(d3.axisLeft(y))

        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-25)")
            .style("text-anchor", "end")

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

        let hideTimer = null
        const showTip = (event, d) => {
            if (hideTimer) {
                clearTimeout(hideTimer)
                hideTimer = null
            }
            tooltip
                .style("opacity", 1)
                .html(
                    "<strong>" +
                        d.rise +
                        "</strong> → <strong>" +
                        d.cause +
                        "</strong><br/>" +
                        d.count +
                        " emperors",
                )
            positionTooltip(event)
        }

        const hideTip = () => {
            tooltip.style("opacity", 0)
        }

        g.append("g")
            .selectAll("rect")
            .data(cells)
            .enter()
            .append("rect")
            .attr("x", (d) => x(d.cause))
            .attr("y", (d) => y(d.rise))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .attr("fill", (d) => color(d.count))
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 1)
            .on("mouseover", function (event, d) {
                showTip(event, d)
            })
            .on("mousemove", function (event) {
                positionTooltip(event)
            })
            .on("mouseout", function () {
                hideTip()
            })
            .on("touchstart", function (event, d) {
                event.preventDefault()
                showTip(event, d)
                hideTimer = setTimeout(() => hideTip(), 2000)
            })

        g.append("g")
            .selectAll("text")
            .data(cells.filter((d) => d.count > 0))
            .enter()
            .append("text")
            .attr("x", (d) => x(d.cause) + x.bandwidth() / 2)
            .attr("y", (d) => y(d.rise) + y.bandwidth() / 2 + 4)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("fill", (d) => (d.count > maxCount * 0.5 ? "#fff" : "#222"))
            .text((d) => d.count)
    }

    return (
        <div style={{ marginTop: "30px" }}>
            <div style={{ padding: "0 20px 10px 20px" }}>
                <h2 style={{ margin: 0 }}>Career Matrix</h2>
                <p style={{ margin: "6px 0 0 0" }}>
                    Rise to power vs. cause of death. Darker cells mean more
                    emperors.
                </p>
            </div>
            <div
                ref={chartRef}
                style={{ position: "relative", overflowX: "auto" }}
            />
        </div>
    )
}

export default CareerMatrix
