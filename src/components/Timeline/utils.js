import * as paper from 'paper';
import {
	RUBY_SIZE,
	RUBY_TOP_OFFSET,
	LINE_BOTTOM_OFFSET,
	TIMELINE_BACKGROUND_COLOR,
} from './constants';

export const getArrayOfRandomLength = (max) => {
	const randomLengthArray = [...(new Array(Math.round(Math.random() * max)))];
	return randomLengthArray.length > 0 ? randomLengthArray : [0];
};

export const toViewProportions = (a, zoomFactor) => (a / (100 / zoomFactor));
export const toCanvasProportions = (a, zoomFactor) => (a * (100 / zoomFactor));

export const percentToValue = ({ part, total }) => (total / 100) * part;
export const valueToPercent = ({ value, total }) => (value * 100) / total;

export const createCanvas = (canvasElement) => {
	const canvas = paper.setup(canvasElement);
	canvas.view.autoUpdate = false;
	return canvas;
};

export const setElementAlpha = (element, alpha) => {
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
	color: fillColor = '#FF0000',
	id,
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
		fillColor,
		strokeColor: TIMELINE_BACKGROUND_COLOR,
		strokeWidth: 1.5,
	};
	rubyRect.rotate(45);

	rubyRect.onMouseEnter = function onLineEnter({ point }) {
		onMouseEnter.bind(this)(id, point.x, point.y);
	};
	rubyRect.onMouseLeave = function onLineOut() { onMouseLeave.bind(this)(id); };
	rubyRect.onClick = function onLineClick() { onClick.bind(this)(id); };

	rubyRect.isRuby = true;
	return rubyRect;
};

const isElementInRange = ({ x, scrollLeft, viewWidth }) => (
	(x > scrollLeft) && (x < (scrollLeft + viewWidth))
);

const makeConnectionLine = ({
	startX,
	startY,
	endX,
	endY,
	visible,
	onMouseEnter,
	onMouseLeave,
	onClick,
	color,
	id,
	maxNameWidth,
}) => {
	const endCurveY = endY - maxNameWidth;
	const pointA = new paper.Point(startX, startY);
	const handleA = new paper.Point(0, ((endCurveY - startY) / 2));

	const pointB = new paper.Point(endX, endCurveY);
	const handleB = new paper.Point(0, -((endCurveY - startY) / 2));

	const pointC = new paper.Point(endX, endY);

	const segmentA = new paper.Segment(pointA, null, handleA);
	const segmentB = new paper.Segment(pointB, handleB, null);
	const segmentC = new paper.Segment(pointC, null, null);

	const connectionLine = new paper.Path(segmentA, segmentB, segmentC);

	connectionLine.visible = visible;
	connectionLine.style = {
		strokeWidth: 1.3,
		strokeColor: color,
	};

	connectionLine.onMouseEnter = function onLineEnter({ point }) {
		onMouseEnter.bind(this)(id, point.x, point.y);
	};
	connectionLine.onMouseLeave = function onLineOut() { onMouseLeave.bind(this)(id); };
	connectionLine.onClick = function onLineClick() { onClick.bind(this)(id); };

	connectionLine.isConnectionLine = true;
	return {
		path: connectionLine, pointA, handleA, pointB, handleB,
	};
};

const ifTrueThenOr = (ifTrue, then, or) => (ifTrue ? then : or);

const getEndPointPosition = (pointIndex, pointWidth) => Math.round(
	(pointIndex * pointWidth) + (pointWidth / 2),
);

const normaliseEndPoint = ({
	displayableAmount, endPointWidth, viewWidth,
}) => (point) => {
	const endPointIndex = ifTrueThenOr(
		point >= displayableAmount,
		displayableAmount - 1,
		point,
	);
	return valueToPercent({
		value: getEndPointPosition(endPointIndex, endPointWidth),
		total: viewWidth,
	});
};

const normaliseEndPoints = ({ points, ...args }) => points.map(normaliseEndPoint(args));

const getDisplayablePointsAmount = ({ totalWidth, pointWidth }) => Math.floor(
	totalWidth / pointWidth,
);

export const normaliseConnections = (connections, {
	viewWidth, endPointWidth,
}) => {
	const displayableAmount = getDisplayablePointsAmount({
		totalWidth: viewWidth, pointWidth: endPointWidth,
	});
	return connections.map(connection => ({
		...connection,
		endPointsXPositions: normaliseEndPoints({
			points: connection.endPointsXPositions,
			viewWidth,
			displayableAmount,
			endPointWidth,
		}),
	}));
};

export const getDataPointsGraphics = (dataPoints, {
	scrollLeft,
	viewHeight,
	viewWidth,
	canvasWidth,
	defaultColor,
	maxNameWidth,
	endPointWidth,
	...handlers
}) => dataPoints.map(({
	id, color, startPointXPosition, endPointsXPositions,
}) => {
	const displayableAmount = getDisplayablePointsAmount({
		totalWidth: viewWidth, pointWidth: endPointWidth,
	});
	const startX = percentToValue({
		part: startPointXPosition,
		total: canvasWidth,
	});
	const ruby = makeRuby({
		id, x: startX, y: RUBY_TOP_OFFSET, color: color || defaultColor, ...handlers,
	});
	const connectionLines = normaliseEndPoints({
		points: endPointsXPositions,
		viewWidth,
		displayableAmount,
		endPointWidth,
	}).map((bX) => {
		const connectionLine = makeConnectionLine({
			id,
			startX,
			startY: RUBY_TOP_OFFSET + RUBY_SIZE,
			endX: scrollLeft + percentToValue({ part: bX, total: viewWidth }),
			endY: viewHeight - LINE_BOTTOM_OFFSET,
			visible: isElementInRange({ x: startX, viewWidth, scrollLeft }),
			color: color || defaultColor,
			maxNameWidth,
			...handlers,
		});
		connectionLine.path.ruby = ruby;

		return connectionLine;
	});

	ruby.connectionLines = connectionLines;

	return {
		id, color, startPointXPosition, endPointsXPositions, connectionLines, ruby,
	};
});

export const updateRuby = (ruby, {
	startPointXPosition, canvasWidth,
}) => {
	/* eslint-disable no-param-reassign */
	ruby.bounds.centerX = percentToValue({
		part: startPointXPosition,
		total: canvasWidth,
	});
	/* eslint-enable no-param-reassign */
};

export const updateConnectionLine = (connectionLine, lineIndex, {
	scrollLeft,
	viewHeight,
	viewWidth,
	canvasWidth,
	startPointXPosition,
	endPointsXPositions,
	maxNameWidth,
}) => {
	/* eslint-disable no-param-reassign */
	const segmentA = connectionLine.path.segments[0];
	const segmentB = connectionLine.path.segments[1];
	const segmentC = connectionLine.path.segments[2];
	const halfPointY = (segmentB.point.y - segmentA.point.y) / 2;

	segmentA.point.x = percentToValue({
		part: startPointXPosition,
		total: canvasWidth,
	});
	segmentA.handleOut.y = halfPointY;

	segmentB.point.x = scrollLeft + percentToValue({
		part: endPointsXPositions[lineIndex],
		total: viewWidth,
	});
	segmentB.point.y = viewHeight - LINE_BOTTOM_OFFSET - maxNameWidth;
	segmentB.handleIn.y = -halfPointY;

	segmentC.point.x = segmentB.point.x;
	segmentC.point.y = viewHeight - LINE_BOTTOM_OFFSET;

	connectionLine.path.visible = isElementInRange({
		x: segmentA.point.x,
		viewWidth,
		scrollLeft,
	});
	/* eslint-enable no-param-reassign */
};
