import * as paper from 'paper';
import {
	RUBY_SIZE,
	RUBY_TOP_OFFSET,
	LINE_BOTTOM_OFFSET,
	DEFAULT_LETTER_COLOR,
	STORY_LETTER_COLOR,
	TIMELINE_BACKGROUND_COLOR,
} from './constants';

export const getArrayOfRandomLength = max => [...(new Array(Math.round(Math.random() * max)))];

export const toViewProportions = (a, zoomFactor) => (a / (100 / zoomFactor));
export const toCanvasProportions = (a, zoomFactor) => (a * (100 / zoomFactor));

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

export const getDataPointsGraphics = (dataPoints, {
	scrollLeft,
	viewHeight,
	viewWidth,
	zoomFactor,
	...handlers
} = {}) => dataPoints.map(({ aX, bX }) => {
	const proportionedAX = toCanvasProportions(aX, zoomFactor);
	const connectionLine = makeConnectionLine({
		aX: proportionedAX,
		aY: RUBY_TOP_OFFSET + RUBY_SIZE,
		bX: scrollLeft + bX,
		bY: viewHeight - LINE_BOTTOM_OFFSET,
		visible: isElementInRange({ x: proportionedAX, viewWidth, scrollLeft }),
		...handlers,
	});
	const ruby = makeRuby({ x: proportionedAX, y: RUBY_TOP_OFFSET, ...handlers });

	ruby.connectionLine = connectionLine;
	connectionLine.path.ruby = ruby;
	return {
		aX, bX, connectionLine, ruby,
	};
});

export const updateRuby = (ruby, {
	zoomFactor, aX,
}) => {
	/* eslint-disable no-param-reassign */
	ruby.bounds.centerX = toCanvasProportions(aX, zoomFactor);
	/* eslint-enable no-param-reassign */
};

export const updateConnectionLine = (connectionLine, {
	scrollLeft, viewHeight, viewWidth, zoomFactor, aX, bX,
}) => {
	/* eslint-disable no-param-reassign */
	const segmentA = connectionLine.path.segments[0];
	const segmentB = connectionLine.path.segments[1];
	const halfPointY = (segmentB.point.y - segmentA.point.y) / 2;

	segmentA.point.x = toCanvasProportions(aX, zoomFactor);
	segmentA.handleOut.y = halfPointY;

	segmentB.point.x = scrollLeft + bX;
	segmentB.point.y = viewHeight - LINE_BOTTOM_OFFSET;
	segmentB.handleIn.y = -halfPointY;

	connectionLine.path.visible = isElementInRange({
		x: toCanvasProportions(aX, zoomFactor), viewWidth, scrollLeft,
	});
	/* eslint-enable no-param-reassign */
};
