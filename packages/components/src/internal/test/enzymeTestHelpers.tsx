import React, { ReactElement } from 'react';
import { act } from 'react-dom/test-utils';
import { mount, MountRendererProps, ReactWrapper, shallow, ShallowWrapper } from 'enzyme';

import { AppContext } from '../AppContext';

import { NotificationsContextState } from '../components/notifications/NotificationsContext';
import { ServerContext, ServerContextProvider } from '../components/base/ServerContext';
import { LabelPrintingContext } from '../components/labelPrinting/LabelPrintingContextProvider';

import { AppContextTestProvider, sleep } from './testHelpers';

/**
 * Use this if you're testing a component that requires a wrapping <AppContextProvider/> to provide context.
 * This utility method provides the `MountRenderProps` that can be supplied to enzyme's mount() method. The specified
 * `appContext` will be provided to the wrapped component under test. Additionally, with these options supplied
 * the returned mounted component will still be the component under test (as opposed to <AppContextProvider/>).
 * @param appContext The app context to be provided by the wrapping <AppContextProvider/>.
 * @param serverContext The server context to be provided by the wrapping <ServerContextProvider/>.
 * @param notificationContext The notification context to be provided by the wrapping <NotificationProvider/>.
 * @param options Pass through for mount's rendering options.
 * @param printLabelsContext The server context to be provided by the wrapping <PrintLabelsContext/>.
 */
export const mountWithAppServerContextOptions = (
    appContext?: Partial<AppContext>,
    serverContext?: Partial<ServerContext>,
    notificationContext?: Partial<NotificationsContextState>,
    options?: MountRendererProps,
    printLabelsContext?: Partial<LabelPrintingContext>
): MountRendererProps => {
    return {
        wrappingComponent: AppContextTestProvider,
        wrappingComponentProps: {
            appContext,
            serverContext,
            notificationContext,
            printLabelsContext,
        },
        ...options,
    };
};

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
    options?: MountRendererProps,
    printLabelsContext?: Partial<LabelPrintingContext>
): ReactWrapper => {
    return mount(
        node,
        mountWithAppServerContextOptions(appContext, serverContext, notificationContext, options, printLabelsContext)
    );
};

/**
 * Use this if you're testing a component that requires a wrapping <ServerContextProvider/> to provide context.
 * This utility method provides the `MountRenderProps` that can be supplied to enzyme's mount() method. The specified
 * `initialContext` will be provided to the wrapped component under test. Additionally, with these options supplied
 * the returned mounted component will still be the component under test (as opposed to <ServerContextProvider />).
 * Example:
 * ```ts
 * import { mount } from 'enzyme';
 * import { mountWithServerContextOptions } from '@labkey/components';
 *
 * describe('a test suite', () => {
 *     test('test with default context', () => {
 *         const wrapper = mount(<MyReactComponent />, mountWithServerContextOptions());
 *     });
 *     test('test with specified context, () => {
 *         const wrapper = mount(<MyReactComponent />, mountWithServerContextOptions({
 *             user: MY_TEST_USER,
 *         }));
 *     });
 * });
 * ```
 * @param initialContext The server context to be provided by the wrapping <ServerContextProvider/>
 * @param options Pass through for mount's rendering options
 */
export const mountWithServerContextOptions = (
    initialContext: any = {},
    options?: MountRendererProps
): MountRendererProps => {
    return {
        wrappingComponent: ServerContextProvider,
        wrappingComponentProps: { initialContext },
        ...options,
    };
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
    options?: MountRendererProps
): ReactWrapper => {
    return mount(node, mountWithServerContextOptions(initialContext, options));
};

/**
 * Shallow version of mountWithServerContext.
 */
export const shallowWithServerContext = (
    node: ReactElement,
    initialContext?: any,
    options?: MountRendererProps
): ShallowWrapper<any, React.Component['state'], React.Component> => {
    return shallow(node, mountWithServerContextOptions(initialContext, options));
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
export const waitForLifecycle = (wrapper: ReactWrapper | ShallowWrapper, ms?: number): Promise<undefined> => {
    // Wrap in react-dom/utils act so we don't get errors in our test logs
    return act(async () => {
        await sleep(ms);
        wrapper.update();
    });
};
