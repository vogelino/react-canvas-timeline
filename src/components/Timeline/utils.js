import * as paper from 'paper';
import {
	RUBY_SIZE,
	RUBY_TOP_OFFSET,
	LINE_BOTTOM_OFFSET,
	DEFAULT_LETTER_COLOR,
	STORY_LETTER_COLOR,
	TIMELINE_ZOOM_FACTOR,
	TIMELINE_BACKGROUND_COLOR,
	TIMELINE_NAVIGATOR_HEIGHT,
	TIMELINE_NAVIGATOR_RADIUS,
	TIMELINE_NAVIGATOR_ZONE_COLOR,
	TIMELINE_NAVIGATOR_HANDLE_WIDTH,
	TIMELINE_NAVIGATOR_HANDLE_RADIUS,
	TIMELINE_NAVIGATOR_HANDLE_COLOR,
} from './constants';

export const getArrayOfRandomLength = max => [...(new Array(Math.round(Math.random() * max)))];

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

	rubyRect.isRuby = true;
	return rubyRect;
};

const isElementInRange = ({ x, scrollLeft, viewWidth }) => (
	(x > scrollLeft) && (x < (scrollLeft + viewWidth))
);

const makeConnectionLine = ({
	aX, aY, bX, bY, visible, onMouseEnter, onMouseLeave, onClick,
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

	connectionLine.onMouseEnter = onMouseEnter;
	connectionLine.onMouseLeave = onMouseLeave;
	connectionLine.onClick = onClick;

	connectionLine.isConnectionLine = true;
	return {
		path: connectionLine, pointA, handleA, pointB, handleB,
	};
};

export const getDataPointsGraphics = (dataPoints, dataPointsXB, {
	scrollLeft,
	viewHeight,
	viewWidth,
	...handlers
} = {}) => dataPoints.map(({ aX, bX }) => {
	const connectionLine = makeConnectionLine({
		aX,
		aY: RUBY_TOP_OFFSET + RUBY_SIZE,
		bX: scrollLeft + bX,
		bY: viewHeight - LINE_BOTTOM_OFFSET,
		visible: isElementInRange({ x: aX, viewWidth, scrollLeft }),
		...handlers,
	});
	const ruby = makeRuby({ x: aX, y: RUBY_TOP_OFFSET, ...handlers });

	ruby.connectionLine = connectionLine;
	connectionLine.path.ruby = ruby;

	return {
		aX, bX, connectionLine, ruby,
	};
});

export const updateConnectionLine = (connectionLine, {
	scrollLeft, viewHeight, viewWidth, aX, bX,
}) => {
	/* eslint-disable no-param-reassign */
	const segmentA = connectionLine.path.segments[0];
	const segmentB = connectionLine.path.segments[1];
	const halfPointY = (segmentB.point.y - segmentA.point.y) / 2;

	segmentB.point.x = scrollLeft + bX;
	segmentB.point.y = viewHeight - LINE_BOTTOM_OFFSET;

	segmentA.handleOut.y = halfPointY;
	segmentB.handleIn.y = -halfPointY;

	connectionLine.path.visible = isElementInRange({
		x: aX, viewWidth, scrollLeft,
	});
	/* eslint-enable no-param-reassign */
};

export const toViewProportions = a => (a / (100 / TIMELINE_ZOOM_FACTOR));
export const toCanvasProportions = a => (a * (100 / TIMELINE_ZOOM_FACTOR));

export const getNavigator = ({
	scrollLeft,
	viewWidth,
	onMouseDrag,
	onMouseEnter,
	onMouseLeave,
}) => {
	const zone = new paper.Path.Rectangle(
		scrollLeft + toViewProportions(scrollLeft),
		0,
		toViewProportions(viewWidth),
		TIMELINE_NAVIGATOR_HEIGHT,
		TIMELINE_NAVIGATOR_RADIUS,
	);
	zone.style = {
		fillColor: TIMELINE_NAVIGATOR_ZONE_COLOR,
	};
	zone.onMouseDrag = onMouseDrag;
	zone.onMouseEnter = onMouseEnter;
	zone.onMouseLeave = onMouseLeave;
	setElementAlpha(zone, 0.3);

	const leftHandle = new paper.Path.Rectangle(
		zone.bounds.x - (TIMELINE_NAVIGATOR_HANDLE_WIDTH / 2),
		0,
		TIMELINE_NAVIGATOR_HANDLE_WIDTH,
		TIMELINE_NAVIGATOR_HEIGHT,
		TIMELINE_NAVIGATOR_HANDLE_RADIUS,
	);

	const rightHandle = new paper.Path.Rectangle(
		leftHandle.bounds.x + zone.bounds.getWidth(),
		0,
		TIMELINE_NAVIGATOR_HANDLE_WIDTH,
		TIMELINE_NAVIGATOR_HEIGHT,
		TIMELINE_NAVIGATOR_HANDLE_RADIUS,
	);

	const handleStyle = {
		fillColor: TIMELINE_NAVIGATOR_HANDLE_COLOR,
	};

	leftHandle.style = handleStyle;
	rightHandle.style = handleStyle;

	return { zone, leftHandle, rightHandle };
};

export const updateNavigator = (navigator, { scrollLeft }) => {
	/* eslint-disable no-param-reassign */
	navigator.zone.bounds.x = scrollLeft + toViewProportions(scrollLeft);
	navigator.leftHandle.bounds.x = navigator.zone.bounds.x - (TIMELINE_NAVIGATOR_HANDLE_WIDTH / 2);
	navigator.rightHandle.bounds.x = navigator.leftHandle.bounds.x + navigator.zone.bounds.getWidth();
	/* eslint-enable no-param-reassign */
};
