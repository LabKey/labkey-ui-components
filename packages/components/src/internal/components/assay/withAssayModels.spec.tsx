import React, { FC, ReactElement } from 'react';
import { mount } from 'enzyme';
import { List } from 'immutable';
import { createMemoryHistory, InjectedRouter, Route, Router } from 'react-router';

import {
    AssayDefinitionModel,
    AssayStateModel,
    AssayProtocolModel,
    InjectedAssayModel,
    LoadingState,
    withAssayModels,
    withAssayModelsFromLocation,
} from '../../..';

import { sleep } from '../../testHelpers';

import { AssayLoader } from './withAssayModels';

const WithAssayModelsComponentImpl: FC<InjectedAssayModel> = () => <div />;

const WithAssayModelsComponent = withAssayModels(WithAssayModelsComponentImpl);

const createMockAssayLoader = (actions?: Partial<AssayLoader>): AssayLoader => {
    return Object.assign(
        {
            clearDefinitionsCache: jest.fn(),
            loadDefinitions: jest.fn().mockResolvedValue(List([])),
            loadProtocol: jest.fn(),
        },
        actions
    );
};

describe('withAssayModels', () => {
    test('load definitions', () => {
        // Arrange
        const assayLoader = createMockAssayLoader();

        // Act
        const wrapper = mount(<WithAssayModelsComponent assayLoader={assayLoader} />);

        // Assert
        expect(assayLoader.loadDefinitions).toHaveBeenCalledTimes(1);
        expect(assayLoader.loadProtocol).toHaveBeenCalledTimes(0);
        wrapper.unmount();
    });
    test('load definition failure', async () => {
        // Arrange
        const expectedError = 'load definitions failed!';
        const loadDefinitions = (): Promise<List<AssayDefinitionModel>> => Promise.reject(expectedError);
        const assayLoader = createMockAssayLoader({ loadDefinitions });
        let injectedAssayModel: AssayStateModel;

        const WrappedTestComponent = withAssayModels(
            ({ assayModel }): ReactElement => {
                injectedAssayModel = assayModel;
                return <div />;
            }
        );

        // Act
        const wrapper = mount(<WrappedTestComponent assayLoader={assayLoader} />);

        // Load definitions
        await sleep();

        // Assert
        expect(injectedAssayModel.definitionsError).toEqual(expectedError);
        expect(injectedAssayModel.definitionsLoadingState).toEqual(LoadingState.LOADED);
        wrapper.unmount();
    });
    test('load protocol', async () => {
        // Arrange
        const expectedAssayId = 456;
        const expectedAssayName = 'WellDefinedAssay';

        const loadDefinitions = (): Promise<List<AssayDefinitionModel>> =>
            Promise.resolve(List([AssayDefinitionModel.create({ id: expectedAssayId, name: expectedAssayName })]));
        const assayLoader = createMockAssayLoader({ loadDefinitions });

        // Act
        const wrapper = mount(<WithAssayModelsComponent assayLoader={assayLoader} assayName={expectedAssayName} />);

        // Load definitions
        await sleep();

        // Assert
        expect(assayLoader.loadProtocol).toHaveBeenCalledWith(expectedAssayId);
        wrapper.unmount();
    });
    test('load protocol does not exist', async () => {
        // Arrange
        const nonExistentAssayName = 'IDoNotExistAssay';
        const assayLoader = createMockAssayLoader();
        let injectedAssayModel: AssayStateModel;

        const WrappedTestComponent = withAssayModels(
            ({ assayModel }): ReactElement => {
                injectedAssayModel = assayModel;
                return <div />;
            }
        );

        // Act
        const wrapper = mount(<WrappedTestComponent assayLoader={assayLoader} assayName={nonExistentAssayName} />);

        // Load definitions
        await sleep();

        // Assert
        // Should not attempt to load the protocol if it is not found in the definitions
        expect(assayLoader.loadProtocol).toHaveBeenCalledTimes(0);

        // Sets protocol error
        expect(injectedAssayModel.protocolError).toEqual(
            `Load protocol failed. Unable to resolve assay definition for assay name "${nonExistentAssayName}".`
        );

        // Sets loading state
        expect(injectedAssayModel.protocolLoadingState).toEqual(LoadingState.LOADED);
        wrapper.unmount();
    });
    test('load protocol failure', async () => {
        // Arrange
        const expectedError = 'load protocol failed!';
        const assayName = 'SomeAssayDefinition';
        const loadDefinitions = (): Promise<List<AssayDefinitionModel>> =>
            Promise.resolve(List([AssayDefinitionModel.create({ id: 123, name: assayName })]));
        const loadProtocol = (): Promise<AssayProtocolModel> => Promise.reject(expectedError);
        const assayLoader = createMockAssayLoader({ loadDefinitions, loadProtocol });
        let injectedAssayModel: AssayStateModel;

        const WrappedTestComponent = withAssayModels(
            ({ assayModel }): ReactElement => {
                injectedAssayModel = assayModel;
                return <div />;
            }
        );

        // Act
        const wrapper = mount(<WrappedTestComponent assayLoader={assayLoader} assayName={assayName} />);

        // Load definitions
        await sleep();

        // Load protocol
        await sleep();

        // Assert
        expect(injectedAssayModel.protocolError).toEqual(expectedError);
        expect(injectedAssayModel.protocolLoadingState).toEqual(LoadingState.LOADED);
        wrapper.unmount();
    });
    test('reload assays', async () => {
        // Arrange
        const assayLoader = createMockAssayLoader();
        let injectedAssayModel: AssayStateModel;
        let injectedReloadAssays: () => void;

        const WrappedTestComponent = withAssayModels(
            ({ assayModel, reloadAssays }): ReactElement => {
                injectedAssayModel = assayModel;
                injectedReloadAssays = reloadAssays;
                return <div />;
            }
        );

        // Act
        const wrapper = mount(<WrappedTestComponent assayLoader={assayLoader} />);

        // Load definitions
        await sleep();
        expect(assayLoader.loadDefinitions).toHaveBeenCalledTimes(1);
        expect(injectedReloadAssays).toBeDefined();

        // Trigger a reload of the injected reload action
        injectedReloadAssays();

        // (Re)load definitions
        await sleep();

        // Assert
        expect(assayLoader.clearDefinitionsCache).toHaveBeenCalledTimes(1);
        expect(assayLoader.loadDefinitions).toHaveBeenCalledTimes(2);
        wrapper.unmount();
    });
});

describe('withAssayModelsFromLocation', () => {
    test('sets "assayName" from location', async () => {
        // Arrange
        const expectedAssayName = 'SomeAssay';
        const expectedAssayDefinition = AssayDefinitionModel.create({ id: 123, name: expectedAssayName });
        const expectedAssayProtocol = AssayProtocolModel.create({ name: 'SomeProtocol' });

        const loadDefinitions = (): Promise<List<AssayDefinitionModel>> =>
            Promise.resolve(List([expectedAssayDefinition]));
        const loadProtocol = (): Promise<AssayProtocolModel> => Promise.resolve(expectedAssayProtocol);

        const assayLoader = createMockAssayLoader({ loadDefinitions, loadProtocol });
        let injectedAssayDefinition: AssayDefinitionModel;
        let injectedAssayModel: AssayStateModel;
        let injectedAssayProtocol: AssayProtocolModel;
        let injectedRouter: InjectedRouter;

        const WrappedTestComponent = withAssayModelsFromLocation(
            ({ assayDefinition, assayModel, assayProtocol }): ReactElement => {
                injectedAssayDefinition = assayDefinition;
                injectedAssayModel = assayModel;
                injectedAssayProtocol = assayProtocol;
                return <div />;
            }
        );

        // Mounts the "/" route and defines the injectedRouter.
        // With this the test can then navigate to the location.
        const RootRouteComponent = ({ children, router }): ReactElement => {
            injectedRouter = router;
            return children;
        };

        // Act
        const wrapper = mount(
            <Router history={createMemoryHistory()}>
                <Route path="/" component={RootRouteComponent}>
                    <Route
                        path=":protocol"
                        component={routeProps => <WrappedTestComponent assayLoader={assayLoader} {...routeProps} />}
                    />
                </Route>
            </Router>
        );

        // Set the ":protocol" via the route
        injectedRouter.replace(`/${expectedAssayName}`);

        // Load definitions
        await sleep();

        // Assert
        expect(injectedAssayModel.protocolLoadingState).toEqual(LoadingState.LOADED);
        expect(injectedAssayDefinition).toEqual(expectedAssayDefinition);
        expect(injectedAssayProtocol).toEqual(expectedAssayProtocol);
        wrapper.unmount();
    });
});
