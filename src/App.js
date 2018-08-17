import React, { Component } from 'react';
import * as paper from 'paper';
import './App.css';

const HOVER_OPACITY = 0.2;

const getArrayOfRandomLength = max => [...(new Array(Math.round(Math.random() * max)))];

const createCanvas = (canvasElement) => {
	paper.setup(canvasElement);
	paper.view.autoUpdate = false;
	return paper;
};

const isConnectionLine = element => Boolean(element.segments);
const startPointIsSameAs = (element, x) => element.segments[0].point.x === x;
const setElementAlpha = (element, alpha) => {
	/* eslint-disable no-param-reassign */
	if (element.style.fillColor) {
		element.style.fillColor.alpha = alpha;
	}
	if (element.style.strokeColor) {
		element.style.strokeColor.alpha = alpha;
	}
	/* eslint-enable no-param-reassign */
};

const makeRuby = ({
	x, y, onClick, onHover,
}) => {
	const rubyRect = new paper.Path.Rectangle(x - 5, y, 10, 10, 2.5);
	rubyRect.style = {
		fillColor: x % 8 ? '#BDBDBD' : '#FF00BB',
		strokeColor: '#FFFFFF',
		strokeWidth: 1.5,
	};
	rubyRect.rotate(45);

	rubyRect.onMouseEnter = function onRubyMouseOver(mouseInfos) {
		this.parent.children.forEach((otherElement) => {
			setElementAlpha(otherElement, HOVER_OPACITY);
			if (isConnectionLine(otherElement) && startPointIsSameAs(otherElement, x)) {
				setElementAlpha(otherElement, 1);
			}
		});
		setElementAlpha(this, 1);
		onHover(this, mouseInfos);
	};
	rubyRect.onMouseLeave = function onRubyMouseOut() {
		this.parent.children.forEach((otherElement) => {
			setElementAlpha(otherElement, 1);
		});
	};
	rubyRect.onClick = function onRubyClick(mouseInfo) { onClick(this, mouseInfo); };

	return rubyRect;
};

const isElementInRange = ({ x, scrollLeft, viewWidth }) => (
	(x > scrollLeft) && (x < (scrollLeft + viewWidth))
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
		strokeWidth: 1.3,
		strokeColor: aX % 8 ? '#BDBDBD' : '#FF00BB',
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
	viewHeight,
	viewWidth,
	onHover = () => { },
	onClick = () => { },
} = {}) => {
	const dataGraphics = dataPoints.map(({ aX, bX }) => {
		const connectionLine = makeConnectionLine({
			aX,
			aY: 60,
			bX: scrollLeft + bX,
			bY: viewHeight - 50,
		});
		connectionLine.path.visible = isElementInRange({
			x: aX, viewWidth, scrollLeft,
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
		this.viewWidth = this.canvasNode.getBoundingClientRect().width;
		this.viewHeight = this.canvasNode.getBoundingClientRect().height;
		this.canvasWidth = this.viewWidth * 4;

		this.dataPointsX = getArrayOfRandomLength(Math.round(this.canvasWidth / 20))
			.map(() => ({
				aX: Math.round(Math.random() * this.canvasWidth),
				bX: Math.round(Math.random() * this.viewWidth),
			}))
			.sort(({ aX }, { aX: a2X }) => a2X - aX);
		const canvasApp = createCanvas(this.canvasNode);
		const toolPan = new paper.Tool();
		toolPan.activate();
		const drawGraphics = this.drawGraphics.bind(this);

		toolPan.onMouseDrag = (event) => {
			const delta = event.downPoint.subtract(event.point);
			const initialScrollLeft = this.canvasApp.view.bounds.x;
			if (this.scrollLeft + delta.x < 0) {
				this.canvasApp.view.center = new paper.Point(
					this.viewWidth / 2,
					this.viewHeight / 2,
				);
				this.scrollLeft = 0;
			} else if (this.scrollLeft + delta.x > this.canvasWidth - this.viewWidth) {
				this.canvasApp.view.center = new paper.Point(
					this.canvasWidth - (this.viewWidth / 2),
					this.viewHeight / 2,
				);
				this.scrollLeft = this.canvasWidth - this.viewWidth;
			} else {
				this.scrollLeft = initialScrollLeft + delta.x;
				delta.y = 0;
				this.canvasApp.view.scrollBy(delta);
			}

			drawGraphics();
		};

		this.canvasApp = canvasApp;
		drawGraphics();
	}

	shouldComponentUpdate() {
		return false;
	}

	drawGraphics() {
		if (!this.dataGraphics) {
			this.dataGraphics = getDataPointsGraphics(this.dataPointsX, this.dataPointsXB, {
				scrollLeft: this.scrollLeft,
				viewWidth: this.viewWidth,
				viewHeight: this.viewHeight,
			});
			this.canvasApp.view.draw();
			return;
		}
		this.dataGraphics.forEach(({ connectionLine, aX, bX }) => {
			/* eslint-disable no-param-reassign */
			connectionLine.path.segments[1].point.x = this.scrollLeft + bX;
			const inRange = isElementInRange({
				x: aX, viewWidth: this.viewWidth, scrollLeft: this.scrollLeft,
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
