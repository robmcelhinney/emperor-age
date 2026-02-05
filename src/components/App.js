import React, { Component } from 'react'
import BarChart from './BarChart.js'
import CrisisTimeline from './CrisisTimeline.js'
import AgeDistribution from './AgeDistribution.js'
import BirthplaceMap from './BirthplaceMap.js'
import CareerMatrix from './CareerMatrix.js'
import WebOfDeath from './WebOfDeath.js'
import Header from './Header.js'
import MedianReignLength from './MedianReignLength.js'
import Footer from './Footer.js'
import emperor from "../data/emperors.json"
import riseByNameData from "../data/rise_by_name.json"
import killerByNameData from "../data/killer_by_name.json"
import emperorImages from "../data/emperor_images.json"
import birthplaceCoords from "../data/birthplace_coords.json"


class App extends Component {

	render() {
		const riseByName = new Map(
			Object.entries(riseByNameData || {}),
		)
		const killerByName = new Map(
			Object.entries(killerByNameData || {}),
		)
		const attachImages = (items) =>
			items.map((item) => ({
				...item,
				image: emperorImages[item.name] || null,
				birth_lat: birthplaceCoords[item.name]?.lat ?? null,
				birth_lng: birthplaceCoords[item.name]?.lng ?? null,
				birth_city: birthplaceCoords[item.name]?.city ?? null,
				rise: riseByName.get(item.name) || item.rise || null,
				killer: killerByName.get(item.name) || item.killer || null,
			}))
		let barChartData = attachImages(JSON.parse(JSON.stringify(emperor)))
		let medianData = attachImages(JSON.parse(JSON.stringify(emperor)))

		return (
			<div id={"content"}>
				<Header />
				<BarChart data={barChartData} />
				<CrisisTimeline data={barChartData} />
				<AgeDistribution data={barChartData} />
				<BirthplaceMap data={barChartData} />
				<CareerMatrix data={barChartData} />
				<WebOfDeath data={barChartData} />
				<MedianReignLength data={medianData} />
				<Footer />
			</div>
		)
	}
  }

export default App
