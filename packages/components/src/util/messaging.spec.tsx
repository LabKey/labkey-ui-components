import React from 'react';
import { resolveErrorMessage } from './messaging';

describe("resolveErrorMessage", () => {
    test("original is string", () => {
        expect(resolveErrorMessage("error string", "data", 'default message')).toBe("error string");
    });

    test("original is InsertRowsErrorResponse", () => {
        expect(resolveErrorMessage({exception: "exception message"}, "data", "default message")).toBe("exception message");
    });

    test("original is API exception", () => {

    });

    test("duplicate key violation exception", () => {

    });
});
