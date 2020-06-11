import React, { Component } from 'react'
import BarChart from './BarChart.js'
import ReignLengthChart from './ReignLengthChart.js'
import Header from './Header.js'
import ReignHeader from './ReignHeader.js'
import MedianReignLength from './MedianReignLength.js'
import Footer from './Footer.js'
import "../css/style.css"


class App extends Component {

	render() {
  
		return (
			<div id={"content"}>
				<Header />
				<BarChart />
				<ReignHeader />
				<ReignLengthChart />
				<MedianReignLength />
				<Footer />
			</div>
		);
	}
  }

export default App;
