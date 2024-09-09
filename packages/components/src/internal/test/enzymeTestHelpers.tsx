// TODO: technically speaking we can delete this file because the exports are only used by .spec.tsx files, which are
//  no longer run as part of our Jest tests.
import { ReactElement } from 'react';
import { act } from 'react-dom/test-utils';

import { AppContext } from '../AppContext';

import { NotificationsContextState } from '../components/notifications/NotificationsContext';
import { ServerContext } from '../components/base/ServerContext';
import { LabelPrintingContext } from '../components/labelPrinting/LabelPrintingContextProvider';

import { sleep } from './testHelpers';

/**
 * Use this if you're testing a component that requires a wrapping <AppContextProvider/> to provide context.
 * This test method wraps enzyme's mount() method and provides the wrapping component with "initialContext".
 * With this the returned mounted component will still be the component under test
 * (as opposed to <AppContextProvider/>).
 * @param node The React node to mount
 * @param appContext an optional app context object to mount
 * @param serverContext an optional server context object to mount
 * @param notificationContext an optional notification context object to mount
 * @param options Pass through for mount's rendering options
 * @param printLabelsContext an optional label printing context object to mount
 */
export const mountWithAppServerContext = (
    node: ReactElement,
    appContext?: Partial<AppContext>,
    serverContext?: Partial<ServerContext>,
    notificationContext?: Partial<NotificationsContextState>,
    options?: any,
    printLabelsContext?: Partial<LabelPrintingContext>
): ReactElement => {
    return node;
};

/**
 * Use this if you're testing a component that requires a wrapping <ServerContextProvider/> to provide context.
 * This test method wraps enzyme's mount() method and provides the wrapping component with "initialContext".
 * With this the returned mounted component will still be the component under test
 * (as opposed to <ServerContextProvider />).
 * @param node The React node to mount
 * @param initialContext The server context to be provided by the wrapping <ServerContextProvider/>
 * @param options Pass through for mount's rendering options
 */
export const mountWithServerContext = (
    node: ReactElement,
    initialContext?: any,
    options?: any
): ReactElement => {
    return node;
};

/**
 * If you're testing a react component that uses hooks to load data use this method to flush promises and transition
 * your component to the next part of the lifecycle. Example:
 *      const wrapper = mount(<MyComponentThatLoadsStuff />);
 *      // Loading state is expected
 *      expect(wrapper.find(LOADING_SPINNER).exists()).toEqual(true);
 *      await waitForLifecycle(wrapper);
 *      // Items have been loaded and rendered
 *      expect(wrapper.find('.item').length).toEqual(4);
 * @param wrapper: enzyme ReactWrapper or ShallowWrapper
 * @param ms: the amount of time (in ms) to sleep
 */
export const waitForLifecycle = (wrapper: any, ms?: number): Promise<void> => {
    // Wrap in react-dom/utils act so we don't get errors in our test logs
    return act(async () => {
        await sleep(ms);
        wrapper.update();
    });
};
