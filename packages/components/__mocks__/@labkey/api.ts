/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
const CONTEXT_PATH = '/labkey';
let CONTROLLER = 'samplemanager';
let ACTION = 'app';
let CONTAINER = '/DefaultTestContainer';

const actual = jest.requireActual('@labkey/api');

export const ActionURL = {
    ...actual.ActionURL,
    getContextPath: () => CONTEXT_PATH,
    getAction: () => ACTION,
    getController: () => CONTROLLER,
    getContainer: () => CONTAINER,
    getPathFromLocation: (url: string) => {
        if (url) return actual.ActionURL.getPathFromLocation(url, CONTEXT_PATH);
        return {
            action: ACTION,
            containerPath: CONTAINER,
            contextPath: CONTROLLER,
            controller: CONTROLLER,
        };
    },
};

export const __setAction = (action: string) => (ACTION = action);
export const __setContainerPath = (containerPath: string) => (CONTAINER = containerPath);
export const __setController = (controller: string) => (CONTROLLER = controller);

module.exports = {
    ...actual,
    ActionURL,
    __setAction,
    __setContainerPath,
    __setController,
};
