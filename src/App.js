import React from 'react';
import { getArrayOfRandomLength } from './components/Timeline/utils';
import Timeline from './components/Timeline';
import './App.css';

const connections = getArrayOfRandomLength(180).map(() => ({
	id: 'wefwfw',
	color: Math.random() > 0.9 ? '#fa5a8f' : null,
	startPointXPosition: Math.round(Math.random() * 100) || 1,
	endPointsXPositions: getArrayOfRandomLength(4)
		.map(() => Math.round(Math.random() * 100) || 1),
}));

const onlyUnique = (value, index, self) => self.indexOf(value) === index;
const endPointTotalAmount = connections
	.reduce(({ endPointsXPositions }, indexes) => [...indexes, endPointsXPositions], [])
	.filter(onlyUnique)
	.length;

export default () => (
	<Timeline
		connections={connections}
		visibleRange={{ a: 0, b: 25 }}
		endPointWidth={20}
		endPointTotalAmount={endPointTotalAmount}
		defaultColor="#b5b5b5"
		onConnectionClick={(id) => {
			/* eslint-disable no-console */
			console.log('onConnectionClick triggered!', id);
			/* eslint-enable no-console */
		}}
		onConnectionMouseEnter={(id, mouseX, mouseY) => {
			/* eslint-disable no-console */
			console.log('onConnectionMouseEnter triggered!', id, mouseX, mouseY);
			/* eslint-enable no-console */
		}}
		onConnectionMouseLeave={(id) => {
			/* eslint-disable no-console */
			console.log('onConnectionMouseLeave triggered!', id);
			/* eslint-enable no-console */
		}}
		onChartMove={(visibleRange) => {
			/* eslint-disable no-console */
			console.log('onChartMove triggered!', visibleRange);
			/* eslint-enable no-console */
		}}
	/>
);
