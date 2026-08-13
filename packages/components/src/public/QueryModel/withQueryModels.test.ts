/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { RequestManager } from './withQueryModels';

describe('RequestManager', () => {
    let manager: RequestManager;
    let mockXHR: any;

    beforeEach(() => {
        manager = new RequestManager();
        mockXHR = () => ({
            abort: jest.fn(),
            addEventListener: jest.fn(),
        });
    });

    const ID = 'some|model|id|123';
    const REQUEST_TYPE = 'someLoadAction';

    it('should abort an existing request when a new one of the same type starts', () => {
        const handler = manager.getRequestHandler(ID, REQUEST_TYPE);
        const req1 = mockXHR();
        const req2 = mockXHR();

        handler(req1);
        handler(req2);

        expect(req1.abort).toHaveBeenCalledTimes(1);
        expect(manager._requests[ID][REQUEST_TYPE]).toBe(req2);
    });

    it('should clean up references on loadend', () => {
        const handler = manager.getRequestHandler(ID, REQUEST_TYPE);
        const req = mockXHR();

        let cleanup: () => void;
        req.addEventListener.mockImplementation((event: string, cb: () => void) => {
            if (event === 'loadend') cleanup = cb;
        });

        handler(req);
        expect(manager._requests[ID]).toBeDefined();

        // Simulate the request finishing
        cleanup();

        expect(manager._requests[ID]).toBeUndefined();
    });

    it('should not delete a new request if an old request finishes', () => {
        const handler = manager.getRequestHandler(ID, REQUEST_TYPE);

        const req1 = mockXHR();
        let cleanup: () => void;
        req1.addEventListener.mockImplementation((event: string, cb: () => void) => {
            if (event === 'loadend') cleanup = cb;
        });

        handler(req1);

        const req2 = mockXHR();
        handler(req2);

        // Simulate request 1 finally finishing its 'loadend' event
        cleanup();

        // Validate request 2 is still there
        expect(manager._requests[ID][REQUEST_TYPE]).toBe(req2);
    });

    it('should report a tracked request as canceled when a new one of the same type starts', () => {
        const tracked1 = manager.trackRequest(ID, REQUEST_TYPE);
        const req1 = mockXHR();
        tracked1.handler(req1);

        expect(tracked1.wasCancelled()).toBe(false);

        const tracked2 = manager.trackRequest(ID, REQUEST_TYPE);
        tracked2.handler(mockXHR());

        expect(req1.abort).toHaveBeenCalledTimes(1);
        expect(tracked1.wasCancelled()).toBe(true);
        // Only the aborted request was canceled, the one that replaced it was not
        expect(tracked2.wasCancelled()).toBe(false);
    });

    it('should not report a failing request as canceled while it is still registered', () => {
        // GitHub Issue 1364: @labkey/api rejects from the XHR 'readystatechange' handler, which runs before the
        // 'loadend' cleanup, so a request that fails at the transport level is still registered when its failure is
        // handled. Cancellation cannot be inferred from what is registered.
        const tracked = manager.trackRequest(ID, REQUEST_TYPE);
        const req = mockXHR();
        tracked.handler(req);

        expect(manager._requests[ID][REQUEST_TYPE]).toBe(req);
        expect(tracked.wasCancelled()).toBe(false);
    });

    it('should not report a request that was never sent as canceled', () => {
        const tracked = manager.trackRequest(ID, REQUEST_TYPE);
        expect(tracked.wasCancelled()).toBe(false);
    });

    it('should report tracked requests as canceled after cancelAllRequests', () => {
        const tracked = manager.trackRequest(ID, REQUEST_TYPE);
        const req = mockXHR();
        tracked.handler(req);

        manager.cancelAllRequests();

        expect(req.abort).toHaveBeenCalledTimes(1);
        expect(tracked.wasCancelled()).toBe(true);
    });

    it('should handle requests object mutation during abort', () => {
        const manager = new RequestManager();
        const handler = manager.getRequestHandler(ID, REQUEST_TYPE);
        const req1 = mockXHR();
        handler(req1);

        // Mock abort() so that the moment we try to start Req 2,
        // the manager deletes the whole ID entry (simulating a concurrent loadend cleanup).
        req1.abort.mockImplementation(() => {
            delete manager._requests[ID];
        });

        const req2 = mockXHR();

        // The manager should have correctly re-attached the ID to the state
        expect(() => handler(req2)).not.toThrow();
        expect(manager._requests[ID][REQUEST_TYPE]).toBe(req2);
    });
});
