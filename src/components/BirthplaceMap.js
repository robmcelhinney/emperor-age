import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import { withPrefix } from "gatsby"

const BirthplaceMap = (props) => {
    const chartRef = useRef(null)

    useEffect(() => {
        renderMap()
        return () => {
            if (chartRef.current) {
                d3.select(chartRef.current).selectAll("*").remove()
            }
        }
    }, [props.data])

    async function renderMap() {
        if (!chartRef.current) return
        const container = d3.select(chartRef.current)
        container.selectAll("*").remove()

        const points = (props.data || [])
            .filter(
                (d) =>
                    Number.isFinite(d.birth_lat) &&
                    Number.isFinite(d.birth_lng),
            )
            .map((d) => ({
                name: d.name,
                city: d.birth_city || d.birth_cty || "",
                dynasty: d.dynasty || "Unknown",
                cause: d.cause,
                age: d["Pre Emperor"] + d["Emperor"] + (d["Post Emperor"] || 0),
                image: d.image || null,
                lat: d.birth_lat,
                lng: d.birth_lng,
            }))

        if (!points.length) return

        const margin = { top: 20, right: 20, bottom: 20, left: 20 }
        let width = chartRef.current.clientWidth - margin.left - margin.right
        if (width > 1440) {
            width = width - (width - 1000)
        }
        const height = 420
        const viewboxWidth = Math.max(600, width + margin.left + margin.right)
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

        const projection = d3.geoMercator()

        const featurePoints = {
            type: "FeatureCollection",
            features: points.map((p) => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: [p.lng, p.lat] },
                properties: {},
            })),
        }

        projection.fitExtent(
            [
                [20, 20],
                [width - 20, height - 20],
            ],
            featurePoints,
        )

        const path = d3.geoPath().projection(projection)
        const graticule = d3.geoGraticule().step([10, 10])

        // Load coastlines/land
        let world = null
        try {
            world = await d3.json(withPrefix("/world-110m.geojson"))
        } catch (err) {
            world = null
        }

        g.append("path")
            .datum({ type: "Sphere" })
            .attr("d", path)
            .attr("fill", "#f8f8f8")
            .attr("stroke", "#cfcfcf")
            .attr("stroke-width", 0.8)

        if (world) {
            g.append("g")
                .selectAll("path")
                .data(world.features || [])
                .enter()
                .append("path")
                .attr("d", path)
                .attr("fill", "#f1efe9")
                .attr("stroke", "#c7c2b8")
                .attr("stroke-width", 0.6)
        }

        g.append("path")
            .datum(graticule())
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", "#e0e0e0")
            .attr("stroke-width", 0.6)

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

        // Subtle birthplace dots for clarity
        g.append("g")
            .selectAll("circle")
            .data(points)
            .enter()
            .append("circle")
            .attr("cx", (d) => projection([d.lng, d.lat])[0])
            .attr("cy", (d) => projection([d.lng, d.lat])[1])
            .attr("r", 2)
            .attr("fill", "#7a2b2b")
            .attr("opacity", 0.5)
            .on("mouseover", function (event, d) {
                d3.select(this).attr("r", 3.5).attr("opacity", 0.9)
                const imageHtml = d.image
                    ? '<img src="' +
                      d.image +
                      '" alt="' +
                      d.name +
                      '" style="width:48px;height:48px;object-fit:cover;border-radius:4px;flex:0 0 auto;" />'
                    : ""
                const detailHtml =
                    "<strong>" +
                    d.name +
                    "</strong><br/>" +
                    "Birthplace: " +
                    (d.city || "Unknown") +
                    "<br/>" +
                    "Dynasty: " +
                    d.dynasty +
                    "<br/>" +
                    "Age at death: " +
                    d.age +
                    " years<br/>" +
                    "Cause of death: " +
                    d.cause
                tooltip
                    .style("opacity", 1)
                    .html(
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
                d3.select(this).attr("r", 2).attr("opacity", 0.5)
                tooltip.style("opacity", 0)
            })

        // Zoom + pan
        const zoom = d3
            .zoom()
            .scaleExtent([1, 6])
            .on("zoom", (event) => {
                g.attr("transform", event.transform)
            })

        svg.call(zoom)
    }

    return (
        <div style={{ marginTop: "30px" }}>
            <div style={{ padding: "0 20px 10px 20px" }}>
                <h2 style={{ margin: 0 }}>Birthplace Map</h2>
                <p style={{ margin: "6px 0 0 0" }}>
                    Dots represent approximate locations of emperor birthplaces.
                </p>
            </div>
            <div
                id={"birthplace_map"}
                ref={chartRef}
                style={{ position: "relative" }}
            />
        </div>
    )
}

export default BirthplaceMap
