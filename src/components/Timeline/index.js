/* global window */
import React, { Component } from 'react';
import * as paper from 'paper';
import throttle from 'lodash.throttle';
import { TIMELINE_ZOOM_FACTOR, HOVER_OPACITY } from './constants';
import {
	getArrayOfRandomLength,
	createCanvas,
	setElementAlpha,
	getDataPointsGraphics,
	updateConnectionLine,
	updateRuby,
} from './utils';
import './Timeline.css';

class Timeline extends Component {
	constructor(props) {
		super(props);
		this.scrollLeft = 0;
		this.zoomFactor = TIMELINE_ZOOM_FACTOR;
	}

	componentDidMount() {
		this.viewWidth = this.canvasNode.getBoundingClientRect().width;
		this.viewHeight = this.canvasNode.getBoundingClientRect().height;
		this.canvasWidth = this.viewWidth * (100 / this.zoomFactor);

		this.dataPointsX = getArrayOfRandomLength(Math.round(this.canvasWidth / 20))
			.map(() => ({
				aX: Math.round(Math.random() * this.viewWidth),
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

	onMouseWheel({ deltaX }) {
		const initialScrollLeft = this.scrollLeft + deltaX;
		this.scrollView({ initialScrollLeft, deltaX });
	}

	getMouseEnterHandler(onMouseEnter = () => { }) {
		const update = () => this.canvasApp.view.update();
		return function onRubyMouseEnter(mouseInfos) {
			this.parent.children.forEach((otherElement) => {
				setElementAlpha(otherElement, HOVER_OPACITY);
			});
			if (!this.isConnectionLine) {
				setElementAlpha(this.connectionLine.path, 1);
				this.connectionLine.path.bringToFront();
				this.bringToFront();
			} else if (this.isConnectionLine) {
				setElementAlpha(this.ruby, 1);
				this.bringToFront();
				this.ruby.bringToFront();
			}
			setElementAlpha(this, 1);
			update();
			onMouseEnter(this, mouseInfos);
		};
	}

	getMouseLeaveHandler(onMouseLeave = () => { }) {
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
		return (event) => {
			const deltaX = event.downPoint.subtract(event.point).x;
			const initialScrollLeft = this.scrollLeft + deltaX;

			this.scrollView({ initialScrollLeft, deltaX });
		};
	}

	scrollView({ initialScrollLeft, deltaX }) {
		if (initialScrollLeft < 0) {
			this.canvasApp.view.center = new paper.Point(
				this.viewWidth / 2,
				this.viewHeight / 2,
			);
			this.scrollLeft = 0;
		} else if (initialScrollLeft > this.canvasWidth - this.viewWidth) {
			this.canvasApp.view.center = new paper.Point(
				this.canvasWidth - (this.viewWidth / 2),
				this.viewHeight / 2,
			);
			this.scrollLeft = this.canvasWidth - this.viewWidth;
		} else {
			this.scrollLeft = initialScrollLeft;
			this.canvasApp.view.scrollBy(new paper.Point(deltaX, 0));
		}

		this.drawGraphics();
	}

	drawGraphics() {
		const {
			viewWidth, viewHeight, scrollLeft, zoomFactor,
		} = this;
		const setCursorToPointer = () => {
			this.canvasNode.style.cursor = 'pointer';
		};
		const setCursorToDefault = () => {
			this.canvasNode.style.cursor = 'default';
		};

		if (!this.dataGraphics) {
			this.dataGraphics = getDataPointsGraphics(this.dataPointsX, {
				scrollLeft,
				viewWidth,
				viewHeight,
				zoomFactor,
				onMouseEnter: this.getMouseEnterHandler(setCursorToPointer),
				onMouseLeave: this.getMouseLeaveHandler(setCursorToDefault),
			});
			this.canvasApp.view.draw();
		} else {
			this.dataGraphics.forEach(({
				connectionLine,
				ruby,
				aX,
				bX,
			}) => {
				const params = {
					aX, bX, zoomFactor, scrollLeft, viewHeight, viewWidth,
				};
				updateConnectionLine(connectionLine, params);
				updateRuby(ruby, params);
			});
		}
		this.canvasApp.view.update();
	}

	initTimelineInteraction() {
		const toolPan = new paper.Tool();
		toolPan.activate();

		toolPan.onMouseDrag = this.getTimelineDragHandler();
		window.addEventListener('resize',
			throttle(() => this.resizeCanvas(), 500, { leading: false, trailing: true }));
	}

	resizeCanvas() {
		this.viewWidth = this.canvasApp.view.viewSize.width;
		this.viewHeight = this.canvasApp.view.viewSize.height;
		this.canvasWidth = this.viewWidth * (100 / this.zoomFactor);
		this.scrollLeft = 0;
		this.canvasApp.view.center = new paper.Point(
			this.viewWidth / 2,
			this.viewHeight / 2,
		);
		this.drawGraphics();
	}

	render() {
		return (
			<div
				className="canvasRoot"
				onWheel={evt => this.onMouseWheel(evt)}
			>
				<canvas
					ref={(node) => {
						this.canvasNode = node;
					}}
					data-paper-resize="true"
				/>
			</div>
		);
	}
}

export default Timeline;
