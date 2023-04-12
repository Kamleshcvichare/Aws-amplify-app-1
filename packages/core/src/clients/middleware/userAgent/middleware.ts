import { HttpRequest, HttpResponse } from '../../types/http';
import { Middleware } from '../../types/core';

export interface UserAgentOptions {
	userAgentHeader?: string;
	userAgentValue?: string;
}

// TODO: incorporate new user agent design
export const userAgentMiddleware: Middleware<
	HttpRequest,
	HttpResponse,
	UserAgentOptions
> =
	({
		userAgentHeader = 'x-amz-user-agent',
		userAgentValue = '',
	}: UserAgentOptions) =>
	next => {
		return async function userAgentMiddleware(request) {
			if (userAgentValue.trim().length === 0) {
				return await next(request);
			} else {
				const headerName = userAgentHeader.toLowerCase();
				request.headers[headerName] = request.headers[headerName]
					? `${request.headers[headerName]} ${userAgentValue}`
					: userAgentValue;
				const response = await next(request);
				return response;
			}
		};
	};
