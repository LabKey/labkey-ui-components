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
