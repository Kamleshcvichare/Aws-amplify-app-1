import { AuthError } from '../error/AuthError';
import { AuthConfigErrorMap } from '../error/types/maps/authConfigErrorMap';

/**
 *  Throws a config error
 *
 * @param  errorData config error object
 *
 * @throws
 *  error: {@link AuthError}
 *
 */
export function throwConfigError<
	ErrorType extends keyof AuthConfigErrorMap
>(errorData: {
	name: `${ErrorType}`;
	message: AuthConfigErrorMap[ErrorType]['message'];
	recoverySuggestion: AuthConfigErrorMap[ErrorType]['recovery'];
}): never {
	throw new AuthError({
		name: errorData.name,
		message: errorData.message,
		recoverySuggestion: errorData.recoverySuggestion,
	});
}
