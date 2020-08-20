import * as Cookies from 'js-cookie';

/** @class */
export default class CookieStorage {
	/**
	 * Constructs a new CookieStorage object
	 * @param {object} data Creation options.
	 * @param {string} data.domain Cookies domain (mandatory).
	 * @param {string} data.path Cookies path (default: '/')
	 * @param {integer} data.expires Cookie expiration (in days, default: 365)
	 * @param {boolean} data.secure Cookie secure flag (default: true)
	 * @param {string} data.sameSite Cookie request behaviour (default: null)
	 */
	constructor(data) {
		if (data.domain) {
			this.domain = data.domain;
		} else {
			throw new Error('The domain of cookieStorage can not be undefined.');
		}
		if (data.path) {
			this.path = data.path;
		} else {
			this.path = '/';
		}
		if (Object.prototype.hasOwnProperty.call(data, 'expires')) {
			this.expires = data.expires;
		} else {
			this.expires = 365;
		}
		if (Object.prototype.hasOwnProperty.call(data, 'secure')) {
			this.secure = data.secure;
		} else {
			this.secure = true;
		}
		if (Object.prototype.hasOwnProperty.call(data, 'sameSite')) {
			if (data.sameSite !== 'strict' && data.sameSite !== 'lax') {
				throw new Error(
					'The sameSite value of cookieStorage must be "lax" or "strict".'
				);
			}
			this.sameSite = data.sameSite;
		} else {
			this.sameSite = null;
		}
	}

	/**
	 * This is used to set a specific item in storage
	 * @param {string} key - the key for the item
	 * @param {object} value - the value
	 * @returns {string} value that was set
	 */
	setItem(key, value) {
		const options = {
			path: this.path,
			expires: this.expires,
			domain: this.domain,
			secure: this.secure,
		};

		if (this.sameSite) {
			options.sameSite = this.sameSite;
		}

		Cookies.set(key, value, options);
		return Cookies.get(key);
	}

	/**
	 * This is used to get a specific key from storage
	 * @param {string} key - the key for the item
	 * This is used to clear the storage
	 * @returns {string} the data item
	 */
	getItem(key) {
		return Cookies.get(key);
	}

	/**
	 * This is used to remove an item from storage
	 * @param {string} key - the key being set
	 * @returns {string} value - value that was deleted
	 */
	removeItem(key) {
		const options = {
			path: this.path,
			expires: this.expires,
			domain: this.domain,
			secure: this.secure,
		};

		if (this.sameSite) {
			options.sameSite = this.sameSite;
		}

		return Cookies.remove(key, options);
	}

	/**
	 * This is used to clear the storage
	 * @returns {string} nothing
	 */
	clear() {
		const cookies = Cookies.get();
		let index;
		for (index = 0; index < cookies.length; ++index) {
			Cookies.remove(cookies[index]);
		}
		return {};
	}
}
