/* global window */
import React, { Component } from 'react';
import * as PIXI from 'pixi.js';
import './App.css';

const getArrayOfRandomLength = max =>
	[...(new Array(Math.round(Math.random() * max)))];

const createCanvas = (width = 3856, height = 512) => {
	PIXI.settings.RESOLUTION = window.devicePixelRatio;
	PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

	const app = new PIXI.Application();
	app.renderer = new PIXI.WebGLRenderer({ width, height, antialias: true });
	app.renderer.backgroundColor = 0xFFFFFF;
	app.renderer.autoResize = true;
	app.renderer.resize(width, height);

	return app;
};

const makeRuby = ({
	x, y, onClick, onHover,
}) => {
	const ruby = new PIXI.Graphics();
	const width = 10;
	const height = width;
	ruby.lineStyle(1, 0xFFFFFF, 1);
	ruby.beginFill(0xFF00BB, 1);
	ruby.drawRoundedRect(0, 0, width, height, 2.3);
	ruby.endFill();

	ruby.pivot.x = width / 2;
	ruby.pivot.y = height / 2;
	ruby.rotation = 0.8;
	ruby.x = x;
	ruby.y = y;

	ruby.interactive = true;
	ruby.buttonMode = true;

	ruby.mouseover = function onRubyMouseOver(mouseInfos) {
		this.parent.children.forEach((child) => {
			child.alpha = 0.1; // eslint-disable-line
		});
		this.alpha = 1;
		onHover(this, mouseInfos);
	};
	ruby.mouseout = function onRubyMouseOut() {
		this.parent.children.forEach((child) => {
			child.alpha = 1; // eslint-disable-line
		});
	};
	ruby.click = function onRubyClick(mouseInfo) { onClick(this, mouseInfo); };

	return ruby;
};

const makeConnectionLine = ({
	aX, aY, bX, bY, scrollLeft, canvasWidth,
}) => {
	const connectionLine = new PIXI.Graphics();
	connectionLine.lineStyle(1.4, 0xFF00BB, 1);
	connectionLine.moveTo(aX, aY);
	connectionLine.bezierCurveTo(aX, aY + (bY - aY / 2), bX, aY + (bY - aY / 2), bX, bY);
	const aXIsInRange = aX > scrollLeft && aX < canvasWidth + scrollLeft;
	if (aXIsInRange) {
		connectionLine.visible = true;
	} else {
		connectionLine.visible = false;
	}

	return connectionLine;
};

const getDataPointsGraphics = (dataPoints, {
	scrollLeft,
	canvasWidth,
	canvasHeight,
	onHover = () => { },
	onClick = () => { },
} = {}) => {
	const container = new PIXI.Container();
	const dataGraphics = dataPoints.map((x) => {
		const connectionLine = makeConnectionLine({
			aX: x,
			aY: 57,
			bX: scrollLeft + (canvasWidth / 2),
			bY: canvasHeight - 50,
			scrollLeft,
			canvasWidth: window.innerWidth,
		});
		const ruby = makeRuby({
			x, y: 50, onClick, onHover,
		});
		container.addChild(connectionLine);
		container.addChild(ruby);
		return { x, ruby, connectionLine };
	});

	return {
		container,
		dataGraphics,
	};
};

const updateDataGraphics = function (dataGraphics, {
	canvasWidth,
	canvasHeight,
	scrollLeft,
}) {
	dataGraphics.forEach(({ x, connectionLine }) => {
		Object.assign(connectionLine, makeConnectionLine({
			aX: x,
			aY: 57,
			bX: scrollLeft + (canvasWidth / 2),
			bY: canvasHeight - 50,
			scrollLeft,
			canvasWidth: window.innerWidth,
		}));
	});
};

class Timeline extends Component {
	constructor(props) {
		super(props);
		this.scrollLeft = 0;
		this.canvasWidth = 3856;
		this.canvasHeight = 512;
		this.dataPointsX = getArrayOfRandomLength(this.canvasWidth / 3)
			.map(() => Math.round(Math.random() * (this.canvasWidth * 4)))
			.sort();
	}

	componentDidMount() {
		this.canvasApp = createCanvas(this.canvasWidth, this.canvasHeight);
		const { container, dataGraphics } = getDataPointsGraphics(this.dataPointsX, {
			scrollLeft: this.scrollLeft,
			canvasWidth: this.wrapperNode.getBoundingClientRect().width,
			canvasHeight: this.canvasHeight,
			onHover: () => { },
			onClick: () => { },
		});
		this.dataGraphics = dataGraphics;
		this.canvasApp.stage.addChild(container);
		this.wrapperNode.appendChild(this.canvasApp.view);
	}

	shouldComponentUpdate() {
		return false;
	}

	onTimelineScroll() {
		const { scrollLeft } = this.wrapperNode;
		this.scrollLeft = scrollLeft;
		updateDataGraphics(this.dataGraphics, {
			scrollLeft: this.scrollLeft,
			canvasWidth: this.wrapperNode.getBoundingClientRect().width,
			canvasHeight: this.canvasHeight,
		});
		this.canvasApp.renderer.render(this.canvasApp.stage, null, false, false, true);
	}

	render() {
		return (
			<div
				className="canvasRoot"
				ref={(node) => {
					this.wrapperNode = node;
				}}
				onScroll={() => this.onTimelineScroll()}
			/>
		);
	}
}

export default Timeline;
