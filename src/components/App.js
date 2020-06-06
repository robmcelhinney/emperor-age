import React, { Component } from 'react'
import * as d3 from 'd3'
// import moment from 'moment'


class App extends Component {

	componentDidMount() {
		var svg = d3.select("svg"),
		margin = {
			top: 20,
			right: 20,
			bottom: 30,
			left: 40
		},
		width = +svg.attr("width") - margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom,
		g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var x = d3.scaleBand()
			.rangeRound([0, width])
			.paddingInner(0.05)
			.align(0.1);

		var y = d3.scaleLinear()
			.rangeRound([height, 0]);

		var z = d3.scaleOrdinal()
			.range(["#98abc5", "#8a89a6", "#98abc5", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

		  
		d3.json(process.env.PUBLIC_URL + "/data/emperors.json").then((data) => {

			// fix pre-processing
			var keys = [];
			for (let key in data[0]){
				if (key !== "name" && key !== "index")
					keys.push(key);
			}
			data.forEach(function(d){
				d.total = 0;
				console.log("keys: ", keys)
				keys.forEach(function(k){
					d.total += d[k];
				})
			});

			data.sort(function(x, y){
				return d3.ascending(x.index, y.index);
			})

			x.domain(data.map(function(d) {
				return d.name;
			}));
			y.domain([0, d3.max(data, function(d) {
				return d.total;
			})]).nice();
			z.domain(keys);
		
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
				.attr("x", function(d) {
					return x(d.data.name);
				})
				.attr("y", function(d) {
					console.log("d: ", d)
					return y(d[1]);
				})
				.attr("height", function(d) {
					console.log("height: ", y(d[0]) - y(d[1]))
					return y(d[0]) - y(d[1]);
				})
				.attr("width", x.bandwidth());
		
			g.append("g")
				.attr("class", "axis")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x));
		
			g.append("g")
				.attr("class", "axis")
				.call(d3.axisLeft(y).ticks(null, "s"))
				.append("text")
				.attr("x", 2)
				.attr("y", y(y.ticks().pop()) + 0.5)
				.attr("dy", "0.32em")
				.attr("fill", "#000")
				.attr("font-weight", "bold")
				.attr("text-anchor", "start")
				.text("Reign");
		
			var legend = g.append("g")
				.attr("font-family", "sans-serif")
				.attr("font-size", 10)
				.attr("text-anchor", "end")
				.selectAll("g")
				.data(keys.slice().reverse())
				.enter().append("g")
				.attr("transform", function(d, i) {
					return "translate(0," + i * 20 + ")";
				});
		
			legend.append("rect")
				.attr("x", width - 19)
				.attr("width", 19)
				.attr("height", 19)
				.attr("fill", z);
		
			legend.append("text")
				.attr("x", width - 24)
				.attr("y", 9.5)
				.attr("dy", "0.32em")
				.text(function(d) {
					return d;
				});
		})
	}

	render() {
  
		return (
			<svg width="1500" height="500"></svg>
		);
	}
  }

export default App;
