import React, { Component } from 'react'
import "../css/style.css"


class Header extends Component {

	render() {
  
		return (
			<div id={"Header"}>
                <div id={"Heading"}>Roman Emperors Ages</div>
                <div>From Augustus to Theodosius</div>
                <div>(63 BCE to 395 CE)</div>
			</div>
		);
	}
  }

export default Header;
