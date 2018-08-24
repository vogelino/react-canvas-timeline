import React from 'react';
import { getArrayOfRandomLength } from './components/Timeline/utils';
import Timeline from './components/Timeline';
import './App.css';

export default () => (
	<Timeline
		connections={
			getArrayOfRandomLength(288)
				.map(() => ({
					id: 'wefwfw',
					color: '#CCCCCC',
					startPointXPosition: Math.round(Math.random() * 100) || 1,
					endPointsXPositions: getArrayOfRandomLength(4)
						.map(() => Math.round(Math.random() * 100) || 1),
				}))
		}
		visibleRange={{
			a: 0,
			b: 25,
		}}
		onConnectionClick={() => {
			/* eslint-disable no-console */
			console.log('onConnectionClick triggered!');
			/* eslint-enable no-console */
		}}
		onConnectionMouseEnter={() => {
			/* eslint-disable no-console */
			console.log('onConnectionMouseEnter triggered!');
			/* eslint-enable no-console */
		}}
		onConnectionMouseLeave={() => {
			/* eslint-disable no-console */
			console.log('onConnectionMouseLeave triggered!');
			/* eslint-enable no-console */
		}}
		onChartMove={() => {
			/* eslint-disable no-console */
			console.log('onChartMove triggered!');
			/* eslint-enable no-console */
		}}
	/>
);
