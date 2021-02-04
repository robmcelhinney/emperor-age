import React, { Component } from 'react'


class Header extends Component {

	render() {
  
		return (
			<div className={"Header"}>
                <div className={"Heading"}>Roman Emperors' Ages</div>
                <div>From Augustus to Avitus</div>
                <div>(63 BCE to 455 CE)</div>
			</div>
		);
	}
  }

export default Header;
