/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
const files = new Map<string, Buffer>();

/** Registers in-memory file contents by path, replacing any earlier set; attach them with {@link mockFile}. */
export const mockFiles = Object.assign(
    (contents: Record<string, Buffer | string>): void => {
        files.clear();
        Object.entries(contents).forEach(([path, data]) => files.set(path, Buffer.from(data)));
    },
    { restore: (): void => files.clear() }
);

/**
 * Spread into superagent's attach(), which needs the file name passed alongside a Buffer:
 * `.attach('file', ...mockFile('some/dir/file.txt'))`
 */
export const mockFile = (path: string): [Buffer, string] => {
    const data = files.get(path);
    if (!data) throw new Error(`No mock file registered for "${path}"`);
    return [data, path.slice(path.lastIndexOf('/') + 1)];
};
