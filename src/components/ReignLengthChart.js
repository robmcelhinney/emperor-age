import React, { useEffect } from "react"
import * as d3 from "d3"
import * as constClass from "../constants/constants.js"
import * as Legends from "../functions/Legends.js"

const ReignLengthChart = () => {

    useEffect(() => {
        createBarChart()
      }, [])

    function createBarChart() {

		let cause_keys = Object.keys(constClass.CAUSE_COLOUR).map(function(key){
			return key;
		});
		let cause_values = Object.keys(constClass.CAUSE_COLOUR).map(function(key){
			return constClass.CAUSE_COLOUR[key];
		});
        
        let z = d3.scaleOrdinal()
			.range(["#a8a8a8"]);

		  
		d3.json(process.env.PUBLIC_URL + "/data/emperors.json").then((data) => {

			// fix pre-processing
			let keys = [];
			for (let key in data[0]){
				if (key !== "name" && key !== "index" && key !== "cause" && key !== "Pre Emperor" && key !== "Post Emperor")
					keys.push(key);
			}
			data.forEach(function(d){
				d.total = 0;
				keys.forEach(function(k){
					d.total += d[k];
				})
			});
			data.sort(function(x, y){
				return x["index"] - y["index"];
			})

			let margin = {
				top: 20, 
				right: 20, 
				bottom: 40, 
				left: 30
			},
			height = 900
			let width = 0;
			if (typeof window !== `undefined`) {
				width =  window.innerWidth - margin.left - margin.right
			}
			if (width > 1440) {
				width = width - (width - 1000)
			}
			let viewbox_width = 0
			if (width < 700) {
				viewbox_width = 500
			}
			else {
				viewbox_width = 1200
			}
		
			// append the svg object to the body of the page
			let svg = d3.select("div#reign_chart")
				.append("svg")
				.attr("viewBox", "0 0 " + viewbox_width + " 1000")
				.attr("preserveAspectRatio", "xMinYMin meet"),
			g = svg
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


			// Add X axis
			let x = d3.scaleLinear()
				.range([ 0, width ])

			// Y axis
			let y = d3.scaleBand()
				.range([ 0, height ])
				.domain(data.map(function(d) { return d.name }))
				.padding(.1)


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


			// Bottom Axis (Years)
			g.append("g")
				.attr("class", "axis")
				.attr("transform", "translate(0," + height + ")")
				.call(
					d3.axisBottom(x)
					.tickFormat(function(d){
						return d + " yrs"
					})
					.tickSize(-height)
				)

			// Name
			g.append("g")
				.attr('class', 'bar-label')
				.selectAll("text")
				.data(data)
				.enter()
				.append("text")
				.text(d => d.name)
				.attr("text-anchor", "start")
				.attr("y", function(d) { return y(d.name) - 3 })
				.attr('x', "2")
				.attr("dy", "1em")
				.attr("font-size", "0.9em")
				.style('fill', 'black')
				
			// Death Circles
			g.append("g")
				.attr('class', 'bar-label')
				.selectAll("circle")
				.append("svg")
				.data(data)
				.enter()
				.append("circle")
				.attr("cx", function() {
					return -10;
				})
				.attr("cy", function(d) { return y(d.name) + 6 })
				.attr("r", 4)
				.style("fill", function(d) { return constClass.CAUSE_COLOUR[d.cause] })
				.attr("dy", "1em")
		
			// LEGEND: REIGN 
			Legends.createRectLegend(z, g, width, keys, x)
			
			// LEGEND: Death Circle 
			let cause_death = d3.scaleOrdinal()
				.range(cause_values);

			Legends.createCircleLegend(z, g, width, cause_death, cause_keys, x)
		})
    }

	return (
        <div id={"reign_chart"}>
            
        </div>
	);
};

export default ReignLengthChart;