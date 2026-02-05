import React, { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import * as constClass from "../constants/constants.js"
import * as Legends from "../functions/Legends.js"

const ReignLengthChart = (props) => {
    const [sortBy, setSortBy] = useState("chronological")
    const [filterDynasty, setFilterDynasty] = useState("all")
    const chartRef = useRef(null)

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
        let data = props.data

        // Clear previous chart elements so updates (sort/filter) redraw in-place
        if (chartRef.current) {
            d3.select(chartRef.current).selectAll("*").remove()
        }

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

        // Create dynasty color scale
        let dynasties = [...new Set(data.map((d) => d.dynasty || "Unknown"))]
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

        let z = d3.scaleOrdinal().range(["#a8a8a8"])

        // fix pre-processing
        let keys = ["Emperor"]
        data.forEach(function (d) {
            d.total = 0
            keys.forEach(function (k) {
                d.total += d[k]
            })
        })

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

        const legendWidth = 180
        let margin = {
            top: 20,
            right: 20 + legendWidth,
            bottom: 40,
            left: 30,
        }
        const barStep = 14
        const height = Math.max(520, data.length * barStep)
        let width = 100
        if (chartRef.current) {
            width = chartRef.current.clientWidth - margin.left - margin.right
        } else if (typeof window !== `undefined`) {
            width = window.innerWidth - margin.left - margin.right
        }
        if (width > 1440) {
            width = width - (width - 1000)
        }
        const viewbox_width = Math.max(500, width + margin.left + margin.right)
        const viewbox_height = height + margin.top + margin.bottom

        const container = d3.select(chartRef.current)

        // Create tooltip
        let tooltip = container
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

        // append the svg object to the body of the page
        let svg = d3
                .select(chartRef.current)
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

        x.domain([
            0,
            d3.max(data, function (d) {
                return d.total
            }),
        ]).nice()
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
        const showTooltip = (event, d) => {
            tooltip.transition().duration(200).style("opacity", 1)
            const reignStart = formatDate(d.reign_start || d.birth)
            const reignEnd = formatDate(d.reign_end || d.death)
            const ageAtDeath =
                d["Pre Emperor"] + d["Emperor"] + (d["Post Emperor"] || 0)
            const focusLine =
                sortBy === "age"
                    ? "Age at death: " + ageAtDeath + " years<br/>"
                    : "Reign length: " + d["Emperor"] + " years<br/>"
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
                focusLine +
                "Cause of death: " +
                d.cause
            tooltip.html(
                '<div style="display:flex;gap:10px;align-items:center;">' +
                    imageHtml +
                    '<div style="min-width:0;">' +
                    detailHtml +
                    "</div></div>",
            )
            const [mouseX, mouseY] = d3.pointer(event, container.node())
            tooltip.style("left", mouseX + 12 + "px").style("top", mouseY - 10 + "px")
        }

        const moveTooltip = (event) => {
            const [mouseX, mouseY] = d3.pointer(event, container.node())
            tooltip.style("left", mouseX + 12 + "px").style("top", mouseY - 10 + "px")
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
            .style("opacity", 0.15)
            .on("mousemove", moveTooltip)
            .on("mouseover", function (event, d) {
                d3.select(this).style("opacity", 0.25)
                showTooltip(event, d)
            })
            .on("mouseout", function () {
                d3.select(this).style("opacity", 0.15)
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

        // Death Circles
        g.append("g")
            .attr("class", "bar-label")
            .selectAll("circle")
            .append("svg")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", function () {
                return -10
            })
            .attr("cy", function (d) {
                return y(d.name) + 6
            })
            .attr("r", 4)
            .style("fill", function (d) {
                return constClass.CAUSE_COLOUR[d.cause]
            })
            .attr("dy", "1em")

        // LEGEND: REIGN
        Legends.createRectLegend(z, g, width, keys, x)

        // LEGEND: DYNASTY
        let dynasty_keys = dynasties.slice()
        const causeLegendStartY = Legends.createDynastyLegend(
            dynasty_scale,
            g,
            width,
            dynasty_keys,
            x,
        )

        // LEGEND: Death Circle
        let cause_death = d3.scaleOrdinal().range(cause_values)

        Legends.createCircleLegend(
            z,
            g,
            width,
            cause_death,
            cause_keys,
            x,
            causeLegendStartY,
        )
    }

    return (
        <div>
            <div style={{ padding: "20px", backgroundColor: "#f5f5f5" }}>
                <div style={{ marginBottom: "15px" }}>
                    <label style={{ fontWeight: "bold", marginRight: "10px" }}>
                        Sort by:
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
                        Chronological
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
                        Longest Reign
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
                        Oldest Age
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
                id={"reign_chart"}
                ref={chartRef}
                style={{
                    position: "relative",
                    // maxHeight: "80vh",
                    overflowY: "auto",
                }}
            />
        </div>
    )
}

export default ReignLengthChart
