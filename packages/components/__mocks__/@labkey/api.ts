const CONTEXT_PATH = '/labkey';
let CONTROLLER = 'samplemanager';
let ACTION = 'app.view';
let CONTAINER = '/DefaultTestContainer';

const actual = jest.requireActual('@labkey/api');

export const ActionURL = {
    ...actual.ActionURL,
    getContextPath: () => CONTEXT_PATH,
    getAction: () => {
        console.log('Returning action:', ACTION);
        return ACTION;
    },
    getController: () => {
        console.log('Returning controller:', CONTROLLER);
        return CONTROLLER;
    },
    getContainer: () => CONTAINER,
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
