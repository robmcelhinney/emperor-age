import React, { useEffect, useState } from "react"

const MedianReignLength = () => {
	const [medianReign, setMedianReign] = useState(
		0
    );
	const [medianAge, setMedianAge] = useState(
		0
    );
    
    useEffect(() => {
        getMedianReignLength()
      }, [medianReign, medianAge])

    const getMedianReignLength = () => {
        fetch(process.env.PUBLIC_URL + "/data/emperors.json")
            .then((r) => r.json())
            .then((data) =>{
                let median_value = []
                let median_age = []
                let count = 0
                for (let row in data) {
                    const pre_reign = Number(data[row]["Pre Emperor"])
                    const reign = Number(data[row]["Emperor"])
                    const post_reign = Number(data[row]["Post Emperor"])
                    median_value.push(reign)
                    median_age.push(pre_reign + reign + post_reign)
                    count++
                }
                median_value.sort((a, b) => a - b)
                median_age.sort((a, b) => a - b)
                console.log("count: ", count)
                console.log("median_value: ", median_value)
                if (count % 2 === 0) {  // is even
                    setMedianReign((median_value[count / 2 - 1] + median_value[count / 2]) / 2)
                    setMedianAge((median_age[count / 2 - 1] + median_age[count / 2]) / 2)
                } else { // is odd
                    setMedianReign(median_value[(count - 1) / 2])
                    setMedianAge(median_age[(count - 1) / 2])
                }
            })
        
    }

    return (
        <div className={"Header"}>
            <div className={"Heading"}>Extra Info</div>
            <div id={"median"}>Median Reign: {medianReign} years</div>
            <div id={"median"}>Median Age at death: {medianAge} years</div>
            <br/>
            <div>Missing data for Numerian, Florian, Severus II, Vetranio, Carinus</div>
            <div>Rounded up reigns shorter than 1 year</div>
            <div>Data retrieved from <a href="https://github.com/zonination/emperors/">Zonination</a> but I have made some small changes in line with Wikipedia</div>
        </div>
    );
  }

export default MedianReignLength;
