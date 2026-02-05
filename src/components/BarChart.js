import React, { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import * as constClass from "../constants/constants.js"
import * as Legends from "../functions/Legends.js"

const BarChart = (props) => {
    const [sortBy, setSortBy] = useState("chronological")
    const [filterDynasty, setFilterDynasty] = useState("all")
    const chartRef = useRef(null)
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640

    useEffect(() => {
        createBarChart()
        return () => {
            if (chartRef.current) {
                d3.select(chartRef.current).selectAll("*").remove()
            }
        }
    }, [sortBy, filterDynasty, props.data])

    function formatDate(dateStr) {
        if (!dateStr) return "Unknown"
        // Handle BCE dates (format: 0XXX-XX-XX where 0 indicates BCE)
        const isNegative = dateStr.startsWith("-")
        const date = new Date(dateStr)
        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ]
        const day = date.getUTCDate()
        const month = months[date.getUTCMonth()]
        const year = Math.abs(parseInt(dateStr.split("-")[0]))
        const era = dateStr.startsWith("0") ? " BCE" : " CE"
        return `${day} ${month} ${year}${era}`
    }

    function createBarChart() {
        if (!chartRef.current) {
            return
        }

        let data = []
        for (let index in props.data) {
            if ("Pre Emperor" in props.data[index]) data.push(props.data[index])
        }

        const container = d3.select(chartRef.current)

        // Clear previous chart elements so updates (sort/filter) redraw in-place
        container.selectAll("svg").remove()
        container.selectAll("div.tooltip").remove()

        let cause_keys = Object.keys(constClass.CAUSE_COLOUR).map(
            function (key) {
                return key
            },
        )
        let cause_values = Object.keys(constClass.CAUSE_COLOUR).map(
            function (key) {
                return constClass.CAUSE_COLOUR[key]
            },
        )

        const parseReignStart = (row) => {
            const startRaw = row.reign_start || row.birth
            const endRaw = row.reign_end || row.death
            if (!startRaw || !endRaw) return null
            const startYear = parseInt(startRaw.split("-")[0], 10)
            const endYear = parseInt(endRaw.split("-")[0], 10)
            if (Number.isNaN(startYear) || Number.isNaN(endYear)) return null
            const year = startYear > endYear ? -(startYear - 1) : startYear
            const date = new Date(Date.UTC(0, 0, 1))
            date.setUTCFullYear(year)
            return date
        }

        // Create dynasty color scale (chronological order)
        const dynastyStart = new Map()
        data.forEach((row) => {
            const dynasty = row.dynasty || "Unknown"
            const start = parseReignStart(row)
            if (!start) return
            const existing = dynastyStart.get(dynasty)
            if (!existing || start < existing) {
                dynastyStart.set(dynasty, start)
            }
        })
        let dynasties = [...new Set(data.map((d) => d.dynasty || "Unknown"))]
        dynasties.sort((a, b) => {
            const da = dynastyStart.get(a)
            const db = dynastyStart.get(b)
            if (da && db) return da - db
            if (da) return -1
            if (db) return 1
            return a.localeCompare(b)
        })
        let dynasty_scale = d3
            .scaleOrdinal()
            .domain(dynasties)
            .range(
                dynasties.map(
                    (d) =>
                        constClass.DYNASTY_COLOUR[d] ||
                        constClass.DYNASTY_COLOUR["Unknown"],
                ),
            )

        // Reign period colors (for stacking)
        let z = d3.scaleOrdinal().range(["#38b3fa", "#800080", "#748091"])

        // fix pre-processing
        let keys = []
        for (let key in data[0]) {
            if (
                key !== "name" &&
                key !== "index" &&
                key !== "cause" &&
                key !== "dynasty" &&
                key !== "birth" &&
                key !== "death" &&
                key !== "reign_start" &&
                key !== "reign_end" &&
                key !== "image" &&
                key !== "total" &&
                key !== "birth_lat" &&
                key !== "birth_lng" &&
                key !== "birth_city" &&
                key !== "rise" &&
                key !== "killer"
            )
                keys.push(key)
        }
        if (sortBy === "reign_length") {
            keys = ["Emperor"]
        } else if (sortBy === "age") {
            keys = ["Pre Emperor", "Emperor", "Post Emperor"]
        }
        data.forEach(function (d) {
            d.total = 0
            keys.forEach(function (k) {
                d.total += d[k]
            })
        })

        const fullData = data

        // Apply filtering
        let filteredData = data
        if (filterDynasty !== "all") {
            filteredData = data.filter((d) => d.dynasty === filterDynasty)
        }

        // Apply sorting
        if (sortBy === "chronological") {
            filteredData.sort(function (x, y) {
                return x["index"] - y["index"]
            })
        } else if (sortBy === "reign_length") {
            filteredData.sort(function (x, y) {
                return y["Emperor"] - x["Emperor"]
            })
        } else if (sortBy === "age") {
            filteredData.sort(function (x, y) {
                const ageX =
                    x["Pre Emperor"] + x["Emperor"] + (x["Post Emperor"] || 0)
                const ageY =
                    y["Pre Emperor"] + y["Emperor"] + (y["Post Emperor"] || 0)
                return ageY - ageX
            })
        }

        data = filteredData

        const legendWidth = isMobile ? 20 : 320
        let margin = {
            top: 20,
            right: isMobile ? 10 : 20 + legendWidth,
            bottom: 40,
            left: isMobile ? 20 : 30,
        }
        const barStep = isMobile ? 18 : 14
        const height = Math.max(520, data.length * barStep)
        let width = 100
        if (chartRef.current) {
            width = chartRef.current.clientWidth - margin.left - margin.right
        } else if (typeof window !== `undefined`) {
            width = window.innerWidth - margin.left - margin.right
        }
        if (width < 240) {
            width = 240
        }
        if (width > 1440) {
            width = width - (width - 1000)
        }
        const viewbox_width = isMobile
            ? width + margin.left + margin.right
            : Math.max(500, width + margin.left + margin.right)
        const viewbox_height = height + margin.top + margin.bottom

        // Create tooltip
        let tooltip = container
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("padding", "10px 14px")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("font-size", isMobile ? "16px" : "14px")
            .style("line-height", "1.35")
            .style("max-width", "320px")
            .style("z-index", "1000")
            .style("opacity", 0)
            .style("transition", "opacity 0.3s")

        // append the svg object to the body of the page
        let svg = container
                .append("svg")
                .attr("viewBox", "0 0 " + viewbox_width + " " + viewbox_height)
                .attr("preserveAspectRatio", "xMinYMin meet"),
            g = svg
                .append("g")
                .attr(
                    "transform",
                    "translate(" + margin.left + "," + margin.top + ")",
                )

        // Add X axis
        let x = d3.scaleLinear().range([0, width])

        // Y axis
        let y = d3
            .scaleBand()
            .range([0, height])
            .domain(
                data.map(function (d) {
                    return d.name
                }),
            )
            .padding(0.1)

        const filteredMax = d3.max(data.length ? data : [], function (d) {
            return d.total
        })
        x.domain([0, filteredMax || 0]).nice()
        z.domain(keys)

        g.append("g")
            .selectAll("g")
            .data(d3.stack().keys(keys)(data))
            .enter()
            .append("g")
            .attr("fill", function (d) {
                return z(d.key)
            })
            .selectAll("rect")
            .data(function (d) {
                return d
            })
            .enter()
            .append("rect")
            .attr("y", function (d) {
                return y(d.data.name)
            })
            .attr("x", function (d) {
                return x(d[0])
            })
            .attr("width", function (d) {
                return -(x(d[0]) - x(d[1]))
            })
            .attr("height", y.bandwidth())
            .style("opacity", 0.8)

        // Bottom Axis (Years)
        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(
                d3
                    .axisBottom(x)
                    .tickFormat(function (d) {
                        return d + " yrs"
                    })
                    .tickSize(-height),
            )

        // Dynasty-colored background bars
        const positionTooltip = (event) => {
            const containerNode = container.node()
            const tooltipNode = tooltip.node()
            if (!containerNode || !tooltipNode) return
            const rect = containerNode.getBoundingClientRect()
            const tipRect = tooltipNode.getBoundingClientRect()
            let x = event.clientX - rect.left + 12
            let y = event.clientY - rect.top + 12
            x = Math.max(8, Math.min(x, rect.width - tipRect.width - 8))
            y = Math.max(8, Math.min(y, rect.height - tipRect.height - 8))
            tooltip.style("left", x + "px").style("top", y + "px")
        }

        const showTooltip = (event, d) => {
            tooltip.transition().duration(200).style("opacity", 1)
            const reignStart = formatDate(d.reign_start || d.birth)
            const reignEnd = formatDate(d.reign_end || d.death)
            const ageAtDeath =
                d["Pre Emperor"] + d["Emperor"] + (d["Post Emperor"] || 0)
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
                reignStart +
                " – " +
                reignEnd +
                "<br/>" +
                "Age at death: " +
                ageAtDeath +
                " years<br/>" +
                "Reign length: " +
                d["Emperor"] +
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

        const moveTooltip = (event) => {
            positionTooltip(event)
        }

        const hideTooltip = () => {
            tooltip.transition().duration(200).style("opacity", 0)
        }

        const dynastyBars = g
            .append("g")
            .attr("class", "dynasty-bar")
            .selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("y", function (d) {
                return y(d.name)
            })
            .attr("x", 0)
            .attr("width", function (d) {
                return x(d.total)
            })
            .attr("height", y.bandwidth())
            .style("fill", function (d) {
                return dynasty_scale(d.dynasty || "Unknown")
            })
            .style("opacity", 0.25)
            .on("mousemove", moveTooltip)
            .on("mouseover", function (event, d) {
                d3.select(this).style("opacity", 0.35)
                showTooltip(event, d)
            })
            .on("mouseout", function () {
                d3.select(this).style("opacity", 0.25)
                hideTooltip()
            })

        // Name
        g.append("g")
            .attr("class", "bar-label")
            .selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .text((d) => d.name)
            .attr("text-anchor", "start")
            .attr("y", function (d) {
                return y(d.name) - 3
            })
            .attr("x", "2")
            .attr("dy", "1em")
            .attr("font-size", "0.9em")
            .style("fill", "black")
            .on("mousemove", moveTooltip)
            .on("mouseover", function (event, d) {
                const bar = dynastyBars.filter((row) => row === d)
                if (!bar.empty()) {
                    bar.style("opacity", 0.25)
                }
                showTooltip(event, d)
            })
            .on("mouseout", function (event, d) {
                const bar = dynastyBars.filter((row) => row === d)
                if (!bar.empty()) {
                    bar.style("opacity", 0.15)
                }
                hideTooltip()
            })

        // Cause-of-death icons (emoji)
        const causeIcons = {
            Assassination: "🗡️",
            Suicide: "🍷",
            "Natural Causes": "🍂",
            "Died in Battle": "⚔️",
            Execution: "🪓",
            Captivity: "⛓️",
            Unknown: "❔",
        }
        g.append("g")
            .attr("class", "cause-icons")
            .selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .text((d) => causeIcons[d.cause] || "")
            .attr("x", -14)
            .attr("y", function (d) {
                return y(d.name) + 8
            })
            .attr("font-size", "11px")
            .attr("text-anchor", "middle")

        if (!isMobile) {
            // LEGEND: Life Segments
            Legends.createRectLegend(z, g, width, keys, x, {
                fontSize: "0.78em",
                rowStep: 12,
            })

            // LEGEND: DYNASTY
            let dynasty_keys = dynasties.slice()
            const causeLegendStartY = Legends.createDynastyLegend(
                dynasty_scale,
                g,
                width,
                dynasty_keys,
                x,
                {
                    fontSize: "0.78em",
                    rowStep: 16,
                    baseY: 90,
                },
            )

            let cause_death = d3.scaleOrdinal().range(cause_values)
            Legends.createCircleLegend(
                z,
                g,
                width,
                cause_death,
                cause_keys,
                x,
                causeLegendStartY,
                {
                    fontSize: "0.78em",
                    rowStep: 16,
                },
            )
        }
    }

    const segmentLabels = {
        "Pre Emperor": "Pre-Emperor",
        Emperor: "Reign",
        "Post Emperor": "Post-Emperor",
    }
    const causeIcons = {
        Assassination: "🗡️",
        Suicide: "🍷",
        "Natural Causes": "🍂",
        "Died in Battle": "⚔️",
        Execution: "🪓",
        Captivity: "⛓️",
        Unknown: "❔",
    }
    const parseReignStart = (row) => {
        const startRaw = row.reign_start || row.birth
        const endRaw = row.reign_end || row.death
        if (!startRaw || !endRaw) return null
        const startYear = parseInt(startRaw.split("-")[0], 10)
        const endYear = parseInt(endRaw.split("-")[0], 10)
        if (Number.isNaN(startYear) || Number.isNaN(endYear)) return null
        const year = startYear > endYear ? -(startYear - 1) : startYear
        const date = new Date(Date.UTC(0, 0, 1))
        date.setUTCFullYear(year)
        return date
    }
    const dynastyStart = new Map()
    props.data.forEach((row) => {
        const dynasty = row.dynasty || "Unknown"
        const start = parseReignStart(row)
        if (!start) return
        const existing = dynastyStart.get(dynasty)
        if (!existing || start < existing) dynastyStart.set(dynasty, start)
    })
    const dynastyKeys = [
        ...new Set(props.data.map((d) => d.dynasty || "Unknown")),
    ].sort((a, b) => {
        const da = dynastyStart.get(a)
        const db = dynastyStart.get(b)
        if (da && db) return da - db
        if (da) return -1
        if (db) return 1
        return a.localeCompare(b)
    })

    let lifeSegments = ["Pre Emperor", "Emperor", "Post Emperor"]
    if (sortBy === "reign_length") {
        lifeSegments = ["Emperor"]
    }

    return (
        <div>
            <div style={{ padding: "20px", backgroundColor: "#f5f5f5" }}>
                <div style={{ marginBottom: "15px" }}>
                    <label style={{ fontWeight: "bold", marginRight: "10px" }}>
                        Metric:
                    </label>
                    <button
                        onClick={() => setSortBy("chronological")}
                        style={{
                            padding: "8px 16px",
                            marginRight: "8px",
                            backgroundColor:
                                sortBy === "chronological" ? "#800080" : "#ddd",
                            color:
                                sortBy === "chronological" ? "white" : "black",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight:
                                sortBy === "chronological" ? "bold" : "normal",
                        }}
                    >
                        Full Timeline
                    </button>
                    <button
                        onClick={() => setSortBy("reign_length")}
                        style={{
                            padding: "8px 16px",
                            marginRight: "8px",
                            backgroundColor:
                                sortBy === "reign_length" ? "#800080" : "#ddd",
                            color:
                                sortBy === "reign_length" ? "white" : "black",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight:
                                sortBy === "reign_length" ? "bold" : "normal",
                        }}
                    >
                        Reign Length Only
                    </button>
                    <button
                        onClick={() => setSortBy("age")}
                        style={{
                            padding: "8px 16px",
                            marginRight: "8px",
                            backgroundColor:
                                sortBy === "age" ? "#800080" : "#ddd",
                            color: sortBy === "age" ? "white" : "black",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: sortBy === "age" ? "bold" : "normal",
                        }}
                    >
                        Age at Death
                    </button>
                </div>
                <div>
                    <label style={{ fontWeight: "bold", marginRight: "10px" }}>
                        Filter by Dynasty:
                    </label>
                    <button
                        onClick={() => setFilterDynasty("all")}
                        style={{
                            padding: "8px 16px",
                            marginRight: "8px",
                            backgroundColor:
                                filterDynasty === "all" ? "#800080" : "#ddd",
                            color: filterDynasty === "all" ? "white" : "black",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight:
                                filterDynasty === "all" ? "bold" : "normal",
                        }}
                    >
                        All Dynasties
                    </button>
                    {[
                        "Julio-Claudian",
                        "Flavian",
                        "Nerva-Antonine",
                        "Severan",
                        "Gordian",
                        "Constantinian",
                        "Valentinian",
                        "Theodosian",
                    ].map((dynasty) => (
                        <button
                            key={dynasty}
                            onClick={() => setFilterDynasty(dynasty)}
                            style={{
                                padding: "8px 16px",
                                marginRight: "8px",
                                marginTop: "8px",
                                backgroundColor:
                                    filterDynasty === dynasty
                                        ? constClass.DYNASTY_COLOUR[dynasty]
                                        : "#ddd",
                                color:
                                    filterDynasty === dynasty
                                        ? "white"
                                        : "black",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontWeight:
                                    filterDynasty === dynasty
                                        ? "bold"
                                        : "normal",
                            }}
                        >
                            {dynasty}
                        </button>
                    ))}
                </div>
            </div>
            <div
                id={"chart"}
                ref={chartRef}
                style={{
                    position: "relative",
                    maxHeight: "70vh",
                    overflowY: "auto",
                }}
            />
            {isMobile && (
                <div style={{ padding: "12px 20px 0 20px" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                        Life Segments
                    </div>
                    {lifeSegments.map((k) => (
                        <div key={k} style={{ display: "flex", gap: "8px" }}>
                            <span
                                style={{
                                    width: "12px",
                                    height: "12px",
                                    background:
                                        k === "Pre Emperor"
                                            ? "#38b3fa"
                                            : k === "Emperor"
                                              ? "#800080"
                                              : "#748091",
                                    display: "inline-block",
                                }}
                            />
                            <span>{segmentLabels[k]}</span>
                        </div>
                    ))}

                    <div style={{ fontWeight: "bold", margin: "10px 0 6px" }}>
                        Dynasty (background)
                    </div>
                    {dynastyKeys.map((d) => (
                        <div key={d} style={{ display: "flex", gap: "8px" }}>
                            <span
                                style={{
                                    width: "12px",
                                    height: "12px",
                                    background:
                                        constClass.DYNASTY_COLOUR[d] ||
                                        constClass.DYNASTY_COLOUR["Unknown"],
                                    display: "inline-block",
                                }}
                            />
                            <span>{d}</span>
                        </div>
                    ))}

                    <div style={{ fontWeight: "bold", margin: "10px 0 6px" }}>
                        Cause of Death
                    </div>
                    {Object.keys(constClass.CAUSE_COLOUR).map((c) => (
                        <div key={c} style={{ display: "flex", gap: "8px" }}>
                            <span>{causeIcons[c] || "•"}</span>
                            <span>{c}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default BarChart
