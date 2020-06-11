import React, { Component } from 'react'


class Header extends Component {

	render() {
  
		return (
			<div className={"Header"}>
                <div className={"Heading"}>Roman Emperors' Ages</div>
                <div>From Augustus to Theodosius</div>
                <div>(63 BCE to 395 CE)</div>
			</div>
		);
	}
  }

export default Header;
