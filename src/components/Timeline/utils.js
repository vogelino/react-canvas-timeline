import paper from 'paper';
import {
	RUBY_SIZE,
	RUBY_TOP_OFFSET,
	LINE_BOTTOM_OFFSET,
	DEFAULT_LETTER_COLOR,
	STORY_LETTER_COLOR,
	TIMELINE_BACKGROUND_COLOR,
} from './constants';

export const getArrayOfRandomLength = max => [...(new Array(Math.round(Math.random() * max)))];

export const createCanvas = (canvasElement) => {
	paper.setup(canvasElement);
	paper.view.autoUpdate = false;
	return paper;
};

export const startPointIsSameAs = (element, x) => element.segments[0].point.x === x;
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
} = {}) => dataPoints.map(({ aX, bX }) => ({
	aX,
	bX,
	connectionLine: makeConnectionLine({
		aX,
		aY: RUBY_TOP_OFFSET + RUBY_SIZE,
		bX: scrollLeft + bX,
		bY: viewHeight - LINE_BOTTOM_OFFSET,
		visible: isElementInRange({ x: aX, viewWidth, scrollLeft }),
		...handlers,
	}),
	ruby: makeRuby({ x: aX, y: RUBY_TOP_OFFSET, ...handlers }),
}));

export const updateConnectionLine = (connectionLine, {
	scrollLeft, viewHeight, viewWidth, aX, bX,
}) => {
	/* eslint-disable no-param-reassign */
	const segmentA = connectionLine.path.segments[0];
	const segmentB = connectionLine.path.segments[1];
	const halfPointY = (segmentB.point.y - segmentA.point.y) / 2;

	segmentB.point.x = scrollLeft + bX;
	segmentB.point.y = viewHeight - LINE_BOTTOM_OFFSET;
	segmentB.handleIn.y = -halfPointY;
	segmentA.handleOut.y = halfPointY;

	const inRange = isElementInRange({
		x: aX, viewWidth, scrollLeft,
	});
	connectionLine.path.visible = inRange;
	/* eslint-enable no-param-reassign */
};
