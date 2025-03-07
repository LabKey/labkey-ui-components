import { Ajax, Utils } from '@labkey/api';

/**
 * Handles Ajax.request() failures. Calls the passed in "reject" handler with the error
 * from the request as determined by Utils.getCallbackWrapper(). The "reject" parameter can be a normal function
 * or a rejection handler for a Promise. If a response status code is available, then it will append that value
 * to the error object as "status".
 * Example:
 * ```
 * import { Ajax } from '@labkey/api';
 *
 * new Promise((resolve, reject) => {
 *     return Ajax.request({
 *         // ... url, success handler, etc
 *         failure: handleRequestFailure(reject, 'This optional message is logged to console.error'),
 *     });
 * });
 * ```
 */
export function handleRequestFailure(reject: (error: any) => void, logMsg?: string) {
    return Utils.getCallbackWrapper(
        (error, response) => {
            // Appends the response's status code to the error object
            const errorWithStatus = { ...error, status: response?.status };
            if (logMsg) {
                console.error(logMsg, errorWithStatus);
            }
            reject(errorWithStatus);
        },
        undefined,
        true
    );
}

export type RequestHandler = (request: XMLHttpRequest) => void;

export interface RequestOptions extends Omit<Ajax.RequestOptions, 'failure' | 'scope' | 'success'> {
    errorLogMsg?: string;
    requestHandler?: RequestHandler;
}

/**
 * This is a light wrapper around Ajax.request that takes the same options, minus success and failure. Instead of
 * passing success or failure you wrap the call in try/catch and await the call to request e.g.:
 *
 * try {
 *     const resp = await request(myOptions);
 * } catch (error) {
 *     // handle error here
 * }
 */
export function request<T>(options: RequestOptions): Promise<T> {
    const { errorLogMsg = 'Error making ajax request', requestHandler, ...ajaxOptions } = options;

    return new Promise((resolve, reject) => {
        const xmlHttpRequest = Ajax.request({
            ...ajaxOptions,
            success: Utils.getCallbackWrapper((res: T) => resolve(res)),
            failure: handleRequestFailure(reject, errorLogMsg),
        });
        requestHandler?.(xmlHttpRequest);
    });
}
