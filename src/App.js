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
