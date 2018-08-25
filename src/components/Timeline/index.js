/* global window */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as paper from 'paper';
import throttle from 'lodash.throttle';
import { TIMELINE_ZOOM_FACTOR, HOVER_OPACITY } from './constants';
import {
	createCanvas,
	setElementAlpha,
	getDataPointsGraphics,
	updateConnectionLine,
	updateRuby,
	normaliseConnections,
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
		return function onRubyMouseEnter(id, mouseX, mouseY) {
			this.parent.children.forEach((otherElement) => {
				setElementAlpha(otherElement, HOVER_OPACITY);
			});
			if (!this.isConnectionLine) {
				this.connectionLines.forEach((connectionLine) => {
					setElementAlpha(connectionLine.path, 1);
					connectionLine.path.bringToFront();
				});
				this.bringToFront();
			} else if (this.isConnectionLine) {
				setElementAlpha(this.ruby, 1);
				this.ruby.connectionLines.forEach((connectionLine) => {
					setElementAlpha(connectionLine.path, 1);
					connectionLine.path.bringToFront();
				});
				this.ruby.bringToFront();
			}
			setElementAlpha(this, 1);
			update();
			onMouseEnter(id, mouseX, mouseY);
		};
	}

	getMouseLeaveHandler(onMouseLeave = () => { }) {
		const update = () => this.canvasApp.view.update();
		return function onRubyMouseLeave(id) {
			this.parent.children.forEach((otherElement) => {
				setElementAlpha(otherElement, 1);
			});
			update();
			onMouseLeave(id);
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

		const { onChartMove } = this.props;
		onChartMove({
			visibleRange: {
				a: (this.scrollLeft / this.canvasWidth) * 100,
				b: ((this.scrollLeft + this.viewWidth) / this.canvasWidth) * 100,
			},
		});

		this.drawGraphics();
	}

	drawGraphics() {
		const {
			connections,
			onConnectionClick,
			onConnectionMouseEnter,
			onConnectionMouseLeave,
		} = this.props;
		const {
			viewWidth, viewHeight, scrollLeft, zoomFactor, canvasWidth,
		} = this;
		const viewProps = {
			...this.props,
			viewWidth,
			viewHeight,
			scrollLeft,
			zoomFactor,
			canvasWidth,
		};

		const handlers = {
			onMouseEnter: this.getMouseEnterHandler((connectionId, mouseX, mouseY) => {
				this.canvasNode.style.cursor = 'pointer';
				onConnectionMouseEnter(connectionId, mouseX, mouseY);
			}),
			onMouseLeave: this.getMouseLeaveHandler((connectionId) => {
				this.canvasNode.style.cursor = 'default';
				onConnectionMouseLeave(connectionId);
			}),
			onClick: onConnectionClick,
		};

		if (!this.dataGraphics) {
			this.dataGraphics = getDataPointsGraphics(
				normaliseConnections(connections, viewProps),
				{ ...viewProps, ...handlers },
			);
			this.canvasApp.view.draw();
			return;
		}

		this.dataGraphics.forEach(({
			connectionLines, ruby, ...rest
		}) => {
			const params = { ...viewProps, ...rest };
			connectionLines.forEach(
				(connectionLine, lineIndex) => updateConnectionLine(connectionLine, lineIndex, params),
			);
			updateRuby(ruby, params);
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
		this.canvasWidth = this.viewWidth * (100 / this.zoomFactor);
		this.scrollLeft = 0;
		this.canvasApp.view.center = new paper.Point(
			this.viewWidth / 2,
			this.viewHeight / 2,
		);
		this.canvasApp.project.clear();
		this.dataGraphics = null;
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

Timeline.defaultProps = {
	onChartMove: () => { },
	onConnectionClick: () => { },
	onConnectionMouseEnter: () => { },
	onConnectionMouseLeave: () => { },
	defaultColor: '#CCCCCC',
	connections: [],
	maxNameWidth: 150,
	endPointWidth: 20,
	endPointTotalAmount: 0,
};

Timeline.propTypes = {
	connections: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		color: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.oneOf([null]),
		]),
		startPointXPosition: PropTypes.number.isRequired,
		endPointsXPositions: PropTypes.arrayOf(PropTypes.number).isRequired,
	})),
	defaultColor: PropTypes.string, /* eslint-disable-line react/no-unused-prop-types */
	onChartMove: PropTypes.func,
	onConnectionClick: PropTypes.func,
	onConnectionMouseEnter: PropTypes.func,
	onConnectionMouseLeave: PropTypes.func,
	maxNameWidth: PropTypes.number, /* eslint-disable-line react/no-unused-prop-types */
	endPointWidth: PropTypes.number, /* eslint-disable-line react/no-unused-prop-types */
	endPointTotalAmount: PropTypes.number, /* eslint-disable-line react/no-unused-prop-types */
};

export default Timeline;
