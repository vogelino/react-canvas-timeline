/* global window */
import React, { Component } from 'react';
import * as paper from 'paper';
import throttle from 'lodash.throttle';
import { TIMELINE_ZOOM_FACTOR, HOVER_OPACITY } from './constants';
import {
	getArrayOfRandomLength,
	createCanvas,
	isConnectionLine,
	startPointIsSameAs,
	setElementAlpha,
	getDataPointsGraphics,
	updateConnectionLine,
} from './utils';
import './Timeline.css';

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

	onMouseWheel({ deltaX }) {
		const initialScrollLeft = this.scrollLeft + deltaX;
		this.scrollView({ initialScrollLeft, deltaX });
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
		if (!this.dataGraphics) {
			this.dataGraphics = getDataPointsGraphics(this.dataPointsX, this.dataPointsXB, {
				scrollLeft: this.scrollLeft,
				viewWidth: this.viewWidth,
				viewHeight: this.viewHeight,
				onMouseEnter: this.getRubyMouseEnterHandler(() => {
					this.canvasNode.style.cursor = 'pointer';
				}),
				onMouseLeave: this.getRubyMouseLeaveHandler(() => {
					this.canvasNode.style.cursor = 'default';
				}),
			});
			this.canvasApp.view.draw();
			return;
		}
		this.dataGraphics.forEach(({ connectionLine, aX, bX }) => {
			updateConnectionLine(connectionLine, {
				aX,
				bX,
				scrollLeft: this.scrollLeft,
				viewHeight: this.viewHeight,
				viewWidth: this.viewWidth,
			});
		});
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
		this.canvasWidth = this.viewWidth * (100 / TIMELINE_ZOOM_FACTOR);
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
