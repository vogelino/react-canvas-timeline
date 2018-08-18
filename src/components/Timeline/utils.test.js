/* global test, expect */
import { getArrayOfRandomLength } from './utils';

test('getArrayOfRandomLength should return an array of length btw 0 and the max', () => {
	const arrayOfRandomLength = getArrayOfRandomLength(10);
	expect(arrayOfRandomLength.length).toBeGreaterThanOrEqual(0);
	expect(arrayOfRandomLength.length).toBeLessThanOrEqual(10);
});
