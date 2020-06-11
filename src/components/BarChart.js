import React, { useEffect } from "react"
import * as d3 from "d3"
import * as constClass from "../constants/constants.js"

const BarChart = () => {

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
			.range(["#38b3fa", "#800080", "#748091", "#6b486b"]);

		  
		d3.json(process.env.PUBLIC_URL + "/data/emperors.json").then((data) => {

			// fix pre-processing
			let keys = [];
			for (let key in data[0]){
				if (key !== "name" && key !== "index" && key !== "cause")
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
				right: 20, 
				bottom: 40, 
				left: 30
			},
			width =  400,
            height = 900;
		
			// append the svg object to the body of the page
			let svg = d3.select("div#chart")
				.append("svg")
				.attr("viewBox", "0 0 700 1000")
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
				.attr("dy", "0.9em")
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
			g.append("g")
				.attr("class", "axis")
				.append("text")
				.attr("x", x(x.ticks().pop()) + 10)
				.attr("y", 2)
				.attr("dy", "0.32em")
				.attr("fill", "#000")
				.attr("font-weight", "bold")
				.attr("text-anchor", "start")
				.text("Reign");
				
			let legend = g.append("g")
				.attr("font-family", "sans-serif")
				.attr("font-size", "0.5em")
				.attr("text-anchor", "end")
				.selectAll("g")
				.data(keys.slice().reverse())
				.enter().append("g")
				.attr("transform", function(d, i) {
					return "translate(0," + i * 12 + ")";
				})
			legend.append("rect")
				.attr("x", width + 60)
				.attr("y", 15)
				.attr("width", 9)
				.attr("height", 9)
				.attr("fill", z);
			legend.append("text")
				.attr("x", width + 58)
				.attr("y", 19.5)
				.attr("dy", "0.4em")
				.text(function(d) {
					return d;
				});


			
			// LEGEND: Death Circle 
			let cause_death = d3.scaleOrdinal()
				.range(cause_values);

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
				.attr("font-size", "0.5em")
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
					return width + 65;
				})
				.attr("cy", 120)
				.attr("r", 4)
				.attr("fill", cause_death);
			legend_death.append("text")
				.attr("x", width + 60)
				.attr("y", 120)
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