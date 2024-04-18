import { CanceledError } from '../../src/errors/CanceledError';

describe('CanceledError', () => {
	it('works with instanceof operator', () => {
		const error = new CanceledError({
			name: 'TestError',
			message: 'message',
		});

		expect(error instanceof CanceledError).toBe(true);
	});
});
