import React from 'react';
import { getArrayOfRandomLength } from './components/Timeline/utils';
import Timeline from './components/Timeline';
import './App.css';

export default () => (
	<Timeline
		data={
			getArrayOfRandomLength(288)
				.map(() => ({
					id: 'wefwfw',
					color: '#CCCCCC',
					startPointXPosition: Math.round(Math.random() * 1440),
					endPointsXPositions: Math.round(Math.random() * 1440),
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
