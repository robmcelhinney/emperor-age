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
        .text("Reign");
        
    let legend = g.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", "0.8em")
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys.slice())
        .enter().append("g")
        .attr("transform", function(d, i) {
            return "translate(0," + i * 12 + ")";
        })
    legend.append("rect")
        .attr("x", width + 90)
        .attr("y", 20)
        .attr("width", 9)
        .attr("height", 9)
        .attr("fill", z);
    legend.append("text")
        .attr("x", width + 88)
        .attr("y", 19.5)
        .attr("dy", "0.8em")
        .text(function(d) {
            return d;
        });
}

export function createCircleLegend(z, g, width, cause_death, cause_keys, x) {
    // LEGEND: Death Circle 

    g.append("g")
        .attr("class", "axis")
        .append("text")
        .attr("x", x(x.ticks().pop()) + 10)
        .attr("y", 100)
        .attr("dy", "0.32em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text("Cause of Death");
        
    let legend_death = g.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", "0.8em")
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(cause_keys.slice())
        .enter().append("g")
        .attr("transform", function(d, i) {
            return "translate(0," + i * 12 + ")";
        })
    legend_death
        .append("circle")
        .attr("cx", function() {
            return width + 95;
        })
        .attr("cy", 126)
        .attr("r", 4)
        .attr("fill", cause_death);
    legend_death.append("text")
        .attr("x", width + 90)
        .attr("y", 120)
        .attr("dy", "0.8em")
        .text(function(d) {
            return d;
        });
}