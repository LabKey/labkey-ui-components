import React, { FC, ReactElement } from 'react';
import { mount } from 'enzyme';

import { TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT } from '../../productFixtures';
import { AssayDefinitionModel } from '../../AssayDefinitionModel';

import { LoadingState } from '../../../public/LoadingState';
import { AssayProtocolModel } from '../domainproperties/assay/models';

import { ComponentsAPIWrapper, getTestAPIWrapper } from '../../APIWrapper';

import { waitForLifecycle } from '../../test/enzymeTestHelpers';

import { AssayStateModel } from './models';
import { InjectedAssayModel, withAssayModels, withAssayModelsFromLocation } from './withAssayModels';
import { AssayAPIWrapper } from './APIWrapper';

const WithAssayModelsComponentImpl: FC<InjectedAssayModel> = () => <div />;

const WithAssayModelsComponent = withAssayModels(WithAssayModelsComponentImpl);

function createAPIWrapper(overrides: Partial<AssayAPIWrapper> = {}): ComponentsAPIWrapper {
    return getTestAPIWrapper(jest.fn, {
        assay: {
            ...getTestAPIWrapper(jest.fn).assay,
            getAssayDefinitions: jest.fn().mockResolvedValue([]),
            ...overrides,
        },
    });
}

describe('withAssayModels', () => {
    test('load definitions', () => {
        // Arrange
        const api = createAPIWrapper();

        // Act
        const wrapper = mount(
            <WithAssayModelsComponent api={api} moduleContext={TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT} />
        );

        // Assert
        expect(api.assay.getAssayDefinitions).toHaveBeenCalledTimes(1);
        expect(api.assay.getProtocol).not.toHaveBeenCalled();
        wrapper.unmount();
    });
    test('load definition failure', async () => {
        // Arrange
        const expectedError = 'load definitions failed!';
        const api = createAPIWrapper({
            getAssayDefinitions: jest.fn().mockRejectedValue(expectedError),
        });
        let injectedAssayModel: AssayStateModel;

        const WrappedTestComponent = withAssayModels(({ assayModel }): ReactElement => {
            injectedAssayModel = assayModel;
            return <div />;
        });

        // Act
        const wrapper = mount(<WrappedTestComponent api={api} moduleContext={TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT} />);

        // Load definitions
        await waitForLifecycle(wrapper);

        // Assert
        expect(injectedAssayModel.definitionsError).toEqual(expectedError);
        expect(injectedAssayModel.definitionsLoadingState).toEqual(LoadingState.LOADED);
        wrapper.unmount();
    });
    test('load protocol', async () => {
        // Arrange
        const expectedAssayContainerPath = '/My/Assay/Container';
        const expectedAssayId = 456;
        const expectedAssayName = 'WellDefinedAssay';

        const api = createAPIWrapper({
            getAssayDefinitions: jest
                .fn()
                .mockResolvedValue([AssayDefinitionModel.create({ id: expectedAssayId, name: expectedAssayName })]),
        });

        // Act
        const wrapper = mount(
            <WithAssayModelsComponent
                api={api}
                assayContainerPath={expectedAssayContainerPath}
                assayName={expectedAssayName}
                moduleContext={TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT}
            />
        );

        // Load definitions
        await waitForLifecycle(wrapper);

        // Assert
        expect(api.assay.getProtocol).toHaveBeenCalledWith({
            containerPath: expectedAssayContainerPath,
            protocolId: expectedAssayId,
        });
        wrapper.unmount();
    });
    test('load protocol does not exist', async () => {
        // Arrange
        const nonExistentAssayName = 'IDoNotExistAssay';
        const api = createAPIWrapper();
        let injectedAssayModel: AssayStateModel;

        const WrappedTestComponent = withAssayModels(({ assayModel }): ReactElement => {
            injectedAssayModel = assayModel;
            return <div />;
        });

        // Act
        const wrapper = mount(
            <WrappedTestComponent
                api={api}
                assayName={nonExistentAssayName}
                moduleContext={TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT}
            />
        );

        // Load definitions
        await waitForLifecycle(wrapper);

        // Assert
        // Should not attempt to load the protocol if it is not found in the definitions
        expect(api.assay.getProtocol).not.toHaveBeenCalled();

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
        const api = createAPIWrapper({
            getAssayDefinitions: jest
                .fn()
                .mockResolvedValue([AssayDefinitionModel.create({ id: 123, name: assayName })]),
            getProtocol: jest.fn().mockRejectedValue(expectedError),
        });
        let injectedAssayModel: AssayStateModel;

        const WrappedTestComponent = withAssayModels(({ assayModel }): ReactElement => {
            injectedAssayModel = assayModel;
            return <div />;
        });

        // Act
        const wrapper = mount(
            <WrappedTestComponent
                api={api}
                assayName={assayName}
                moduleContext={TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT}
            />
        );

        // Load definitions + protocols
        await waitForLifecycle(wrapper);

        // Assert
        expect(injectedAssayModel.protocolError).toEqual(expectedError);
        expect(injectedAssayModel.protocolLoadingState).toEqual(LoadingState.LOADED);
        wrapper.unmount();
    });
    test('reload assays', async () => {
        // Arrange
        const api = createAPIWrapper();
        let injectedReloadAssays: () => void;

        const WrappedTestComponent = withAssayModels(({ reloadAssays }): ReactElement => {
            injectedReloadAssays = reloadAssays;
            return <div />;
        });

        // Act
        const wrapper = mount(<WrappedTestComponent api={api} moduleContext={TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT} />);

        // Load definitions
        await waitForLifecycle(wrapper);
        expect(api.assay.getAssayDefinitions).toHaveBeenCalledTimes(1);
        expect(injectedReloadAssays).toBeDefined();

        // Trigger a reload of the injected reload action
        injectedReloadAssays();

        // (Re)load definitions
        await waitForLifecycle(wrapper);

        // Assert
        expect(api.assay.clearAssayDefinitionCache).toHaveBeenCalledTimes(1);
        expect(api.assay.getAssayDefinitions).toHaveBeenCalledTimes(2);
        wrapper.unmount();
    });
});

describe('withAssayModelsFromLocation', () => {
    test('sets "assayName" from location', async () => {
        const expectedAssayName = 'SomeAssay';
        const rrd = require('react-router-dom') as any;
        rrd.__setParams({ protocol: expectedAssayName });
        // Arrange
        const expectedAssayDefinition = AssayDefinitionModel.create({ id: 123, name: expectedAssayName });
        const expectedAssayProtocol = AssayProtocolModel.create({ name: 'SomeProtocol' });

        const api = createAPIWrapper({
            getAssayDefinitions: jest.fn().mockResolvedValue([expectedAssayDefinition]),
            getProtocol: jest.fn().mockResolvedValue(expectedAssayProtocol),
        });
        let injectedAssayDefinition: AssayDefinitionModel;
        let injectedAssayModel: AssayStateModel;
        let injectedAssayProtocol: AssayProtocolModel;

        const WrappedTestComponent = withAssayModelsFromLocation(
            ({ assayDefinition, assayModel, assayProtocol }): ReactElement => {
                injectedAssayDefinition = assayDefinition;
                injectedAssayModel = assayModel;
                injectedAssayProtocol = assayProtocol;
                return <div />;
            }
        );

        // Act
        const wrapper = mount(<WrappedTestComponent api={api} moduleContext={TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT} />);

        // Load definitions
        await waitForLifecycle(wrapper);

        // Assert
        expect(injectedAssayModel.protocolLoadingState).toEqual(LoadingState.LOADED);
        expect(injectedAssayDefinition).toEqual(expectedAssayDefinition);
        expect(injectedAssayProtocol).toEqual(expectedAssayProtocol);
        wrapper.unmount();
    });
});
