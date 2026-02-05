export function createRectLegend(z, g, width, keys, x, options = {}) {
    const legendX = width + 40
    const labelX = legendX + 22
    const fontSize = options.fontSize || "0.78em"
    const rowStep = options.rowStep || 12
    g.append("g")
        .attr("class", "axis")
        .append("text")
        .attr("x", legendX)
        .attr("y", 6)
        .attr("dy", "0.32em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text("Life Segments")

    const segmentLabels = {
        "Pre Emperor": "Pre-Emperor",
        Emperor: "Reign",
        "Post Emperor": "Post-Emperor",
    }

    let legend = g
        .append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize)
        .attr("text-anchor", "start")
        .selectAll("g")
        .data(keys.slice())
        .enter()
        .append("g")
        .attr("transform", function (d, i) {
            return "translate(0," + i * rowStep + ")"
        })
    legend
        .append("rect")
        .attr("x", legendX)
        .attr("y", 20)
        .attr("width", 9)
        .attr("height", 9)
        .attr("fill", z)
    legend
        .append("text")
        .attr("x", labelX)
        .attr("y", 19.5)
        .attr("dy", "0.8em")
        .text(function (d) {
            return segmentLabels[d] || d
        })
}

export function createDynastyLegend(
    dynasty_scale,
    g,
    width,
    dynasty_keys,
    x,
    options = {},
) {
    // LEGEND: Dynasty
    // Calculate starting position based on number of dynasty items
    const dynastyBaseY = options.baseY || 90
    const rowStep = options.rowStep || 16
    const fontSize = options.fontSize || "0.78em"
    let dynastyStartY = dynastyBaseY + dynasty_keys.length * rowStep + 35
    const legendX = width + 40
    const labelX = legendX + 22

    g.append("g")
        .attr("class", "axis")
        .append("text")
        .attr("x", legendX)
        .attr("y", dynastyBaseY)
        .attr("dy", "0.32em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text("Dynasty (background)")

    let legend_dynasty = g
        .append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize)
        .attr("text-anchor", "start")
        .selectAll("g")
        .data(dynasty_keys.slice())
        .enter()
        .append("g")
        .attr("transform", function (d, i) {
            return "translate(0," + (dynastyBaseY + i * rowStep) + ")"
        })
    legend_dynasty
        .append("rect")
        .attr("x", legendX)
        .attr("y", 20)
        .attr("width", 9)
        .attr("height", 9)
        .attr("fill", dynasty_scale)
    legend_dynasty
        .append("text")
        .attr("x", labelX)
        .attr("y", 17)
        .attr("dy", "0.8em")
        .text(function (d) {
            return d
        })

    return dynastyStartY
}

export function createCircleLegend(
    z,
    g,
    width,
    cause_death,
    cause_keys,
    x,
    startY = 100,
    options = {},
) {
    // LEGEND: Death Circle
    // Position below the dynasty legend, accounting for it if it exists
    let causeLegendStartY = startY
    const legendX = width + 40
    const labelX = legendX + 22
    const fontSize = options.fontSize || "0.78em"
    const rowStep = options.rowStep || 16

    g.append("g")
        .attr("class", "axis")
        .append("text")
        .attr("x", legendX)
        .attr("y", causeLegendStartY)
        .attr("dy", "0.32em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text("Cause of Death")

    const causeIcons = {
        Assassination: "🗡️",
        Suicide: "🍷",
        "Natural Causes": "🍂",
        "Died in Battle": "⚔️",
        Execution: "🪓",
        Captivity: "⛓️",
        Unknown: "❔",
    }

    let legend_death = g
        .append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize)
        .attr("text-anchor", "start")
        .selectAll("g")
        .data(cause_keys.slice())
        .enter()
        .append("g")
        .attr("transform", function (d, i) {
            return "translate(0," + (causeLegendStartY + 36 + i * rowStep) + ")"
        })
    legend_death
        .append("text")
        .attr("x", legendX)
        .attr("y", -6)
        .attr("dy", "0.8em")
        .attr("text-anchor", "start")
        .text(function (d) {
            return causeIcons[d] || ""
        })
    legend_death
        .append("text")
        .attr("x", labelX)
        .attr("y", -6)
        .attr("dy", "0.8em")
        .text(function (d) {
            return d
        })
}
