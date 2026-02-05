#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

// Parse CSV manually
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, "utf8")
    const lines = content.split("\n")
    const headers = lines[0].split(",").map((h) => h.trim())

    const data = {}
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue

        const values = lines[i].split(",")
        const row = {}
        headers.forEach((header, idx) => {
            row[header] = values[idx] ? values[idx].trim() : ""
        })

        if (row.name) {
            data[row.name.trim()] = row
        }
    }
    return data
}

// Read emperor data from CSV
const emperor_data = parseCSV("./emperors.csv")

// Read the existing emperors.json
const emperors = JSON.parse(
    fs.readFileSync("../src/data/emperors.json", "utf8"),
)

// Add dates to each emperor
emperors.forEach((emperor) => {
    const name = emperor.name.trim()
    if (emperor_data[name]) {
        const data = emperor_data[name]
        emperor.birth = data.birth || ""
        emperor.death = data.death || ""
        emperor.reign_start = data["reign.start"] || ""
        emperor.reign_end = data["reign.end"] || ""
    }
})

// Write back to file
fs.writeFileSync("../src/data/emperors.json", JSON.stringify(emperors, null, 2))
console.log("Added date information to emperors.json")
