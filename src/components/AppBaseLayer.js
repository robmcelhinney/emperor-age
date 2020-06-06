import React, { Component } from 'react'
import * as d3 from 'd3'
import moment from 'moment'


class App extends Component {

	componentDidMount() {
		// set the dimensions and margins of the graph
		const margin = {top: 20, right: 30, bottom: 40, left: 90},
		width = 1460 - margin.left - margin.right,
		height = 1400 - margin.top - margin.bottom;
	
		// append the svg object to the body of the page
		let svg = d3.select("body")
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("transform",
				"translate(" + margin.left + "," + margin.top + ")");

		d3.json(process.env.PUBLIC_URL + "/data/emperors.json").then((data) => {
				// format the data
			data.forEach(function(d) {
				d.age = +d.age;
			});

			data.sort(function(x, y){
				return d3.ascending(x.index, y.index);
			 })

			const x = d3.scaleLinear()
				.domain([0, 80])
				.range([ 0, width]);
			console.log("max : ", d3.max(data, function(d) { return d.age; }))
			svg.append("g")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x))
				.selectAll("text")
				.attr("transform", "translate(-10,0)rotate(-45)")
				.style("text-anchor", "end");

			// Y axis
			const y = d3.scaleBand()
				.range([ 0, height ])
				.domain(data.map(function(d) { return d.name; }))
				.padding(.15);
			svg.append("g")
				.call(d3.axisLeft(y))

			//Bars
			svg.selectAll("rect")
				.data(data)
				.enter()
				.append("rect")
				.attr("x", x(0) )
				.attr("y", function(d) { return y(d.name); })
				.attr("width", function(d) { return x(d.age); })
				.attr("height", y.bandwidth() )
				.attr("fill", "#69b3a2")


				svg.selectAll("rect.addon")
				.data(data)
				.enter()
				.append("rect")
					.attr('class', 'addon')
					.attr("x", x(0) )
					.attr("y", function(d) { return y(d.name); })
					.attr("width", function(d) { return x(d.reign_end)})
					.attr("height", y.bandwidth() )
					.attr("fill", "red")
		})
	}

	render() {
  
		return (
			<div>
			</div>
		);
	}
  }

export default App;
