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
    getPathFromLocation: () => ({
        action: ACTION,
        containerPath: CONTAINER,
        contextPath: CONTROLLER,
        controller: CONTROLLER,
    }),
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
