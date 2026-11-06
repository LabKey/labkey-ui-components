/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Ajax, Utils } from '@labkey/api';

import type { SchemaQuery } from '../public/SchemaQuery';

import { resolveErrorMessage } from './util/messaging';

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
 *         // ... url, success handler, etc.
 *         failure: handleRequestFailure(reject, 'This optional message is logged to console.error'),
 *     });
 * });
 * ```
 */
export function handleRequestFailure(reject: (error: any) => void, logMsg?: string) {
    return Utils.getCallbackWrapper(
        (error, response) => {
            // Appends the response's status code to the error object
            const errorWithStatus = { ...error, aborted: Ajax.isAborted(response), status: response?.status };
            if (logMsg && !errorWithStatus.aborted) {
                console.error(logMsg, errorWithStatus);
            }
            reject(errorWithStatus);
        },
        undefined,
        true
    );
}

/**
 * Handles a failed query API request (e.g., Query.selectRows): rejects with the error and whether the request was
 * aborted, and logs it unless it was.
 */
export function handleQueryFailure(reject: (error: unknown) => void, schemaQuery?: SchemaQuery) {
    return (data: { exception?: string; exceptionClass?: string }, request: XMLHttpRequest): void => {
        const aborted = Ajax.isAborted(request);
        if (!aborted) {
            console.error('There was a problem retrieving the data', data);
        }
        reject({
            aborted,
            exceptionClass: data.exceptionClass,
            message: data.exception,
            schemaQuery,
            status: request.status,
        });
    };
}

/**
 * Returns true if the rejection came from a request that was aborted, e.g., because the user left the page, rather
 * than one that failed. Such a rejection is not an error to show or log.
 */
export function isAbortedRequest(reason: unknown): boolean {
    return (reason as { aborted?: boolean })?.aborted === true;
}

/**
 * Returns what a helper should reject with when its request fails: an aborted request's reason unchanged, so callers
 * can still tell it apart with isAbortedRequest, or else the logged failure's error message.
 */
export function resolveRequestError(reason: unknown): unknown {
    if (isAbortedRequest(reason)) return reason;
    console.error(reason);
    return resolveErrorMessage(reason);
}

export type SuccessDataResponse<T> = {
    data: T;
    success: boolean;
};

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
