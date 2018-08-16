import React, { Component } from 'react';
import * as paper from 'paper';
import './App.css';

const HOVER_OPACITY = 0.2;

const getArrayOfRandomLength = max => [...(new Array(Math.round(Math.random() * max)))];

const createCanvas = (canvasElement) => {
	paper.setup(canvasElement);
	return paper;
};

const makeRuby = ({
	x, y, onClick, onHover,
}) => {
	const rubyRect = new paper.Path.Rectangle(x - 5, y, 10, 10, 2);
	rubyRect.style = {
		fillColor: '#FF00BB',
		strokeColor: '#FFFFFF',
		strokeWidth: 1,
	};
	rubyRect.rotate(45);

	rubyRect.onMouseEnter = function onRubyMouseOver(mouseInfos) {
		this.parent.children.forEach((otherElement) => {
			/* eslint-disable no-param-reassign */
			if (otherElement.style.fillColor) {
				otherElement.style.fillColor.alpha = HOVER_OPACITY;
			}
			if (otherElement.style.strokeColor) {
				otherElement.style.strokeColor.alpha = HOVER_OPACITY;
			}
			if (otherElement.segments && otherElement.segments[0].point.x === x) {
				otherElement.style.strokeColor.alpha = 1;
			}
			/* eslint-enable no-param-reassign */
		});
		this.style.fillColor.alpha = 1;
		onHover(this, mouseInfos);
	};
	rubyRect.onMouseLeave = function onRubyMouseOut() {
		this.parent.children.forEach((otherElement) => {
			/* eslint-disable no-param-reassign */
			if (otherElement.style.fillColor) {
				otherElement.style.fillColor.alpha = 1;
			}
			if (otherElement.style.strokeColor) {
				otherElement.style.strokeColor.alpha = 1;
			}
			/* eslint-enable no-param-reassign */
		});
	};
	rubyRect.onClick = function onRubyClick(mouseInfo) { onClick(this, mouseInfo); };

	return rubyRect;
};

const isElementInRange = ({ x, scrollLeft, canvasWidth }) => (
	(x > scrollLeft) && (x < (scrollLeft + canvasWidth))
);

const makeConnectionLine = ({
	aX, aY, bX, bY,
}) => {
	const pointA = new paper.Point(aX, aY);
	const handleA = new paper.Point(0, ((bY - aY) / 2));

	const pointB = new paper.Point(bX, bY);
	const handleB = new paper.Point(0, -((bY - aY) / 2));

	const segmentA = new paper.Segment(pointA, null, handleA);
	const segmentB = new paper.Segment(pointB, handleB, null);

	const connectionLine = new paper.Path(segmentA, segmentB);

	connectionLine.fullySelected = false;
	connectionLine.style = {
		strokeWidth: 1,
		strokeColor: '#FF00BB',
	};

	return {
		path: connectionLine,
		pointA,
		handleA,
		pointB,
		handleB,
	};
};

const getDataPointsGraphics = (dataPoints, dataPointsXB, {
	scrollLeft,
	canvasHeight,
	canvasWidth,
	onHover = () => { },
	onClick = () => { },
} = {}) => {
	const dataGraphics = dataPoints.map(({ aX, bX }) => {
		const connectionLine = makeConnectionLine({
			aX,
			aY: 57,
			bX: scrollLeft + bX,
			bY: canvasHeight - 50,
		});
		connectionLine.path.visible = isElementInRange({
			x: aX, canvasWidth, scrollLeft,
		});
		const ruby = makeRuby({
			x: aX, y: 50, onClick, onHover,
		});
		return {
			aX, bX, ruby, connectionLine,
		};
	});

	return dataGraphics;
};

class Timeline extends Component {
	constructor(props) {
		super(props);
		this.scrollLeft = 0;
	}

	componentDidMount() {
		const wrapperWidth = this.wrapperNode.getBoundingClientRect().width;
		const canvasWidth = this.canvasNode.getBoundingClientRect().width;

		this.dataPointsX = getArrayOfRandomLength(Math.round(canvasWidth / 20))
			.map(() => ({
				aX: Math.round(Math.random() * canvasWidth),
				bX: Math.round(Math.random() * wrapperWidth),
			}))
			.sort(({ aX }, { aX: a2X }) => a2X - aX);
		this.canvasApp = createCanvas(this.canvasNode);
		this.drawGraphics();
	}

	shouldComponentUpdate() {
		return false;
	}

	drawGraphics() {
		const { scrollLeft } = this.wrapperNode;
		const { width: canvasWidth, height: canvasHeight } = this.wrapperNode.getBoundingClientRect();
		if (!this.dataGraphics) {
			this.dataGraphics = getDataPointsGraphics(this.dataPointsX, this.dataPointsXB, {
				scrollLeft,
				canvasWidth,
				canvasHeight,
			});
			this.canvasApp.view.draw();
			return;
		}
		this.dataGraphics.forEach(({ connectionLine, aX, bX }) => {
			/* eslint-disable no-param-reassign */
			connectionLine.path.segments[1].point.x = scrollLeft + bX;
			const inRange = isElementInRange({
				x: aX, canvasWidth, scrollLeft,
			});
			connectionLine.path.visible = inRange;
			/* eslint-enable no-param-reassign */
		});
		this.canvasApp.view.update();
	}

	render() {
		return (
			<div
				className="canvasRoot"
				onScroll={() => this.drawGraphics()}
				ref={(node) => {
					this.wrapperNode = node;
				}}
			>
				<canvas
					ref={(node) => {
						this.canvasNode = node;
					}}
				/>
			</div>
		);
	}
}

export default Timeline;
