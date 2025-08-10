describe('Math utilities', () => {
	test('should add two numbers correctly', () => {
		expect(1 + 1).toBe(2);
	});

	test('should multiply two numbers correctly', () => {
		expect(2 * 3).toBe(6);
	});

	test('should handle string concatenation', () => {
		expect('Hello' + ' ' + 'World').toBe('Hello World');
	});
});
