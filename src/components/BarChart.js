import React, { useEffect } from "react";
import * as d3 from 'd3'

const BarChart = () => {

    useEffect(() => {
        createBarChart()
      }, [])

    function createBarChart() {
        console.log("createBarChart")

        
        var z = d3.scaleOrdinal()
			.range(["#98abc5", "#800080", "#748091", "#6b486b"]);

		  
		d3.json(process.env.PUBLIC_URL + "/data/emperors.json").then((data) => {

			// fix pre-processing
			var keys = [];
			for (let key in data[0]){
				if (key !== "name" && key !== "index")
					keys.push(key);
			}
			data.forEach(function(d){
				d.total = 0;
				// console.log("keys: ", keys)
				keys.forEach(function(k){
					d.total += d[k];
				})
			});
			data.sort(function(x, y){
				return x["index"] - y["index"];
			})

			// 
			// console.log("data.length * 20: ", data.length * 20)

			let margin = {
				top: 20, 
				right: 120, 
				bottom: 40, 
				left: 150
			},
			width =  400,
            height = 700;
		
			// append the svg object to the body of the page
			let svg = d3.select("div#chart")
				.append("svg")
				.attr("viewBox", "0 0 700 800")
				.attr("preserveAspectRatio", "xMinYMin meet"),
			g = svg
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");



			// Add X axis
			var x = d3.scaleLinear()
				.range([ 0, width ])

			// Y axis
			var y = d3.scaleBand()
				.range([ 0, height ])
				.domain(data.map(function(d) { return d.name }))
				.padding(.3)


			x.domain([0, d3.max(data, function(d) {
				return d.total
			})]).nice()
			z.domain(keys)


			g.append("g")
			.selectAll("g")
				.data(d3.stack().keys(keys)(data))
				.enter().append("g")
				.attr("fill", function(d) {
					return z(d.key);
				})
				.selectAll("rect")
				.data(function(d) {
					return d;
				})
				.enter().append("rect")
				.attr("y", function(d) {
					return y(d.data.name);
				})
				.attr("x", function(d) {
					// console.log("d: ", d)
					return x(d[0]);
				})
				.attr("width", function(d) {
					return -(x(d[0]) - x(d[1]));
				})
				.attr("height", y.bandwidth());


			
			g.append("g")
				.attr("class", "axis")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x))
		
			g.append("g")
				.attr("class", "axis")
				.call(d3.axisLeft(y).ticks(null, "s"))
				.style("font-size", "0.8em")

				// LEGEND: REIGN 
				.append("text")
				.attr("x", x(x.ticks().pop()) + 0.5)
				.attr("y", 2)
				.attr("dy", "0.32em")
				.attr("fill", "#000")
				.attr("font-weight", "bold")
				.attr("text-anchor", "start")
				.text("Reign");
				
			var legend = g.append("g")
				.attr("font-family", "sans-serif")
				.attr("font-size", "0.35em")
				.attr("text-anchor", "end")
				.selectAll("g")
				.data(keys.slice().reverse())
				.enter().append("g")
				.attr("transform", function(d, i) {
					return "translate(0," + i * 20 + ")";
				})
			legend.append("rect")
				.attr("x", width + 20)
				.attr("y", 15)
				.attr("width", 9)
				.attr("height", 9)
				.attr("fill", z);
			legend.append("text")
				.attr("x", width + 18)
				.attr("y", 19.5)
				.attr("dy", "0.4em")
				.text(function(d) {
					return d;
				});

		})
    }

	return (
        <div id={"chart"}>
            
        </div>
	);
};

export default BarChart;