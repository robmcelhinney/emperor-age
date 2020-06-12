import React, { Component } from 'react'
import BarChart from './BarChart.js'
import ReignLengthChart from './ReignLengthChart.js'
import Header from './Header.js'
import ReignHeader from './ReignHeader.js'
import MedianReignLength from './MedianReignLength.js'
import Footer from './Footer.js'
import emperor from "../data/emperors.json"


class App extends Component {

	render() {
		let barChartData = JSON.parse(JSON.stringify(emperor))
		let reignChartData = JSON.parse(JSON.stringify(emperor))
		let medianData = JSON.parse(JSON.stringify(emperor))

		return (
			<div id={"content"}>
				<Header />
				<BarChart data={barChartData} />
				<ReignHeader/>
				<ReignLengthChart data={reignChartData} />
				<MedianReignLength data={medianData} />
				<Footer />
			</div>
		);
	}
  }

export default App;
