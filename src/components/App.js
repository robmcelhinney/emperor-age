import React, { Component } from 'react'
import BarChart from './BarChart.js'
import Header from './Header.js'
import "../css/style.css"


class App extends Component {

	render() {
  
		return (
			<>
				<Header />
				<BarChart />
			</>
		);
	}
  }

export default App;
