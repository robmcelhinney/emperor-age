export function createRectLegend(z, g, width, keys, x) {
    g.append("g")
        .attr("class", "axis")
        .append("text")
        .attr("x", x(x.ticks().pop()) + 50)
        .attr("y", 2)
        .attr("dy", "0.32em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text("Reign")

    let legend = g
        .append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", "0.8em")
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys.slice())
        .enter()
        .append("g")
        .attr("transform", function (d, i) {
            return "translate(0," + i * 12 + ")"
        })
    legend
        .append("rect")
        .attr("x", width + 90)
        .attr("y", 20)
        .attr("width", 9)
        .attr("height", 9)
        .attr("fill", z)
    legend
        .append("text")
        .attr("x", width + 88)
        .attr("y", 19.5)
        .attr("dy", "0.8em")
        .text(function (d) {
            return d
        })
}

export function createDynastyLegend(dynasty_scale, g, width, dynasty_keys, x) {
    // LEGEND: Dynasty
    // Calculate starting position based on number of dynasty items
    let dynastyStartY = 50 + dynasty_keys.length * 16 + 35

    g.append("g")
        .attr("class", "axis")
        .append("text")
        .attr("x", x(x.ticks().pop()) + 50)
        .attr("y", 50)
        .attr("dy", "0.32em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text("Dynasty")

    let legend_dynasty = g
        .append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", "0.8em")
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(dynasty_keys.slice())
        .enter()
        .append("g")
        .attr("transform", function (d, i) {
            return "translate(0," + (50 + i * 16) + ")"
        })
    legend_dynasty
        .append("rect")
        .attr("x", width + 100)
        .attr("y", 20)
        .attr("width", 9)
        .attr("height", 9)
        .attr("fill", dynasty_scale)
    legend_dynasty
        .append("text")
        .attr("x", width + 92)
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
) {
    // LEGEND: Death Circle
    // Position below the dynasty legend, accounting for it if it exists
    let causeLegendStartY = startY

    g.append("g")
        .attr("class", "axis")
        .append("text")
        .attr("x", x(x.ticks().pop()) + 10)
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
        .attr("font-size", "0.8em")
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(cause_keys.slice())
        .enter()
        .append("g")
        .attr("transform", function (d, i) {
            return "translate(0," + (causeLegendStartY + 36 + i * 16) + ")"
        })
    legend_death
        .append("text")
        .attr("x", width + 105)
        .attr("y", -6)
        .attr("dy", "0.8em")
        .attr("text-anchor", "middle")
        .text(function (d) {
            return causeIcons[d] || ""
        })
    legend_death
        .append("text")
        .attr("x", width + 94)
        .attr("y", -6)
        .attr("dy", "0.8em")
        .text(function (d) {
            return d
        })
}
