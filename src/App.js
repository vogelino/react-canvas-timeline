import React, { Component } from 'react';
import * as paper from 'paper';
import './App.css';

const TIMELINE_ZOOM_FACTOR = 25;
const HOVER_OPACITY = 0.2;
const RUBY_SIZE = 10;
const RUBY_TOP_OFFSET = 60;
const LINE_BOTTOM_OFFSET = 60;
const DEFAULT_LETTER_COLOR = '#BDBDBD';
const STORY_LETTER_COLOR = '#FF00BB';
const TIMELINE_BACKGROUND_COLOR = '#FFFFFF';

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
	x = 0,
	y = 0,
	onClick = () => { },
	onMouseEnter = () => { },
	onMouseLeave = () => { },
}) => {
	const width = RUBY_SIZE;
	const height = width;
	const borderRadius = width / 4;
	const offsetX = () => x - width / 2;
	const rubyRect = new paper.Path.Rectangle(offsetX(x), y, width, height, borderRadius);
	rubyRect.style = {
		fillColor: x % 8 ? DEFAULT_LETTER_COLOR : STORY_LETTER_COLOR,
		strokeColor: TIMELINE_BACKGROUND_COLOR,
		strokeWidth: 1.5,
	};
	rubyRect.rotate(45);

	rubyRect.onMouseEnter = onMouseEnter;
	rubyRect.onMouseLeave = onMouseLeave;
	rubyRect.onClick = onClick;

	return rubyRect;
};

const isElementInRange = ({ x, scrollLeft, viewWidth }) => (
	(x > scrollLeft) && (x < (scrollLeft + viewWidth))
);

const makeConnectionLine = ({
	aX, aY, bX, bY, visible,
}) => {
	const pointA = new paper.Point(aX, aY);
	const handleA = new paper.Point(0, ((bY - aY) / 2));

	const pointB = new paper.Point(bX, bY);
	const handleB = new paper.Point(0, -((bY - aY) / 2));

	const segmentA = new paper.Segment(pointA, null, handleA);
	const segmentB = new paper.Segment(pointB, handleB, null);

	const connectionLine = new paper.Path(segmentA, segmentB);

	connectionLine.visible = visible;
	connectionLine.fullySelected = false;
	connectionLine.style = {
		strokeWidth: 1.3,
		strokeColor: aX % 8 ? DEFAULT_LETTER_COLOR : STORY_LETTER_COLOR,
	};

	return {
		path: connectionLine, pointA, handleA, pointB, handleB,
	};
};

const getDataPointsGraphics = (dataPoints, dataPointsXB, {
	scrollLeft,
	viewHeight,
	viewWidth,
	...handlers
} = {}) => dataPoints.map(({ aX, bX }) => ({
	aX,
	bX,
	connectionLine: makeConnectionLine({
		aX,
		aY: RUBY_TOP_OFFSET + RUBY_SIZE,
		bX: scrollLeft + bX,
		bY: viewHeight - LINE_BOTTOM_OFFSET,
		visible: isElementInRange({ x: aX, viewWidth, scrollLeft }),
	}),
	ruby: makeRuby({ x: aX, y: RUBY_TOP_OFFSET, ...handlers }),
}));

class Timeline extends Component {
	constructor(props) {
		super(props);
		this.scrollLeft = 0;
	}

	componentDidMount() {
		this.viewWidth = this.canvasNode.getBoundingClientRect().width;
		this.viewHeight = this.canvasNode.getBoundingClientRect().height;
		this.canvasWidth = this.viewWidth * (100 / TIMELINE_ZOOM_FACTOR);

		this.dataPointsX = getArrayOfRandomLength(Math.round(this.canvasWidth / 20))
			.map(() => ({
				aX: Math.round(Math.random() * this.canvasWidth),
				bX: Math.round(Math.random() * this.viewWidth),
			}))
			.sort(({ aX }, { aX: a2X }) => a2X - aX);
		this.canvasApp = createCanvas(this.canvasNode);

		this.initTimelineInteraction();
		this.drawGraphics();
	}

	shouldComponentUpdate() {
		return false;
	}

	getRubyMouseEnterHandler(onMouseEnter = () => { }) {
		const update = () => this.canvasApp.view.update();
		return function onRubyMouseEnter(mouseInfos) {
			this.parent.children.forEach((otherElement) => {
				setElementAlpha(otherElement, HOVER_OPACITY);
				if (isConnectionLine(otherElement)
					&& startPointIsSameAs(otherElement, this.bounds.centerX)) {
					setElementAlpha(otherElement, 1);
				} else {
					this.insertAbove(otherElement);
				}
			});
			setElementAlpha(this, 1);
			update();
			onMouseEnter(this, mouseInfos);
		};
	}

	getRubyMouseLeaveHandler(onMouseLeave = () => { }) {
		const update = () => this.canvasApp.view.update();
		return function onRubyMouseLeave() {
			this.parent.children.forEach((otherElement) => {
				setElementAlpha(otherElement, 1);
			});
			update();
			onMouseLeave(this);
		};
	}

	getTimelineDragHandler() {
		const drawGraphics = this.drawGraphics.bind(this);

		return (event) => {
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
	}

	drawGraphics() {
		if (!this.dataGraphics) {
			this.dataGraphics = getDataPointsGraphics(this.dataPointsX, this.dataPointsXB, {
				scrollLeft: this.scrollLeft,
				viewWidth: this.viewWidth,
				viewHeight: this.viewHeight,
				onMouseEnter: this.getRubyMouseEnterHandler(),
				onMouseLeave: this.getRubyMouseLeaveHandler(),
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

	initTimelineInteraction() {
		const toolPan = new paper.Tool();
		toolPan.activate();

		toolPan.onMouseDrag = this.getTimelineDragHandler();
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
