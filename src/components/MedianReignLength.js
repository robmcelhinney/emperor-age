import React, { useEffect, useState } from "react"

const MedianReignLength = (props) => {
	const [medianReign, setMedianReign] = useState(
		0
    )
	const [medianAge, setMedianAge] = useState(
		0
    )
    
    useEffect(() => {
        getMedianReignLength()
      }, [medianReign, medianAge])

    const getMedianReignLength = () => {
        let data = props.data
        let median_reign = []
        let median_age = []
        let count = 0
        for (let row in data) {
            const reign = Number(data[row]["Emperor"])
            const post_reign = Number(data[row]["Post Emperor"])
            if ("Pre Emperor" in data[row]) {
                const pre_reign = Number(data[row]["Pre Emperor"])
                median_age.push(pre_reign + reign + post_reign)
            }
            median_reign.push(reign)
            count++
        }
        median_reign.sort((a, b) => a - b)
        median_age.sort((a, b) => a - b)
        if (count % 2 === 0) {  // is even
            setMedianReign((median_reign[count / 2 - 1] + median_reign[count / 2]) / 2)
            setMedianAge((median_age[count / 2 - 1] + median_age[count / 2]) / 2)
        } else { // is odd
            setMedianReign(median_reign[(count - 1) / 2])
            setMedianAge(median_age[(count - 1) / 2])
        }
    }

    return (
        <div className={"Header"}>
            <div className={"Heading"}>Extra Info</div>
            <div id={"median"}>Median Reign: {medianReign} years</div>
            <div id={"median"}>Median Age at death: {medianAge} years</div>
            <br/>
            <div>Missing data for Numerian, Florian, Severus II, Vetranio, Carinus, Olybrius, Glycerius</div>
            <div>Rounded up reigns shorter than 1 year</div>
            <div>Data retrieved from <a href="https://github.com/zonination/emperors/">Zonination</a> but I have made some small changes in line with Wikipedia</div>
        </div>
    )
  }

export default MedianReignLength
