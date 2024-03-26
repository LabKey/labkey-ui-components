import React from 'react';
import { List, Map } from 'immutable';
import { shallow } from 'enzyme';

import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';
import DomainForm from '../DomainForm';

import { DomainDetails } from '../models';

import { mountWithAppServerContext, waitForLifecycle } from '../../../test/enzymeTestHelpers';

import { FileAttachmentForm } from '../../../../public/files/FileAttachmentForm';

import { Alert } from '../../base/Alert';

import { getTestAPIWrapper } from '../../../APIWrapper';

import { getEntityTestAPIWrapper } from '../../entities/APIWrapper';

import { SampleTypePropertiesPanel } from './SampleTypePropertiesPanel';
import { SampleTypeDesigner, SampleTypeDesignerImpl } from './SampleTypeDesigner';

const PARENT_OPTIONS = [
    {
        label: '(Current Sample Type)',
        schema: 'samples',
        value: '{{this_sample_set}}',
    },
    {
        label: 'Fruits',
        query: 'Fruits',
        schema: 'samples',
        value: 'materialInputs/Fruits',
    },
    {
        label: 'Name Expression Set',
        query: 'Name Expression Set',
        schema: 'samples',
        value: 'materialInputs/Name Expression Set',
    },
    {
        label: 'Sample Set 2',
        query: 'Sample Set 2',
        schema: 'samples',
        value: 'materialInputs/Sample Set 2',
    },
    {
        label: 'Sample Set Error',
        query: 'Sample Set Error',
        schema: 'samples',
        value: 'materialInputs/Sample Set Error',
    },
];

const BASE_PROPS = {
    appPropertiesOnly: true,
    initModel: undefined,
    onComplete: jest.fn(),
    onCancel: jest.fn(),
    testMode: true,
    api: getTestAPIWrapper(jest.fn, {
        entity: getEntityTestAPIWrapper(jest.fn, {
            initParentOptionsSelects: () =>
                Promise.resolve({
                    parentOptions: PARENT_OPTIONS,
                    parentAliases: Map(),
                }),
        }),
    }),
};

describe('SampleTypeDesigner', () => {
    test('default properties', async () => {
        const form = (
            <SampleTypeDesignerImpl
                {...BASE_PROPS}
                currentPanelIndex={0}
                firstState={true}
                onFinish={jest.fn()}
                onTogglePanel={jest.fn()}
                setSubmitting={jest.fn()}
                submitting={false}
                validatePanel={0}
                visitedPanels={List()}
            />
        );

        const wrapped = shallow(form);

        await waitForLifecycle(wrapped);

        expect(wrapped.find(SampleTypePropertiesPanel)).toHaveLength(1);
        expect(wrapped.find(DomainForm)).toHaveLength(1);
        expect(wrapped.find(FileAttachmentForm)).toHaveLength(0);

        wrapped.unmount();
    });

    test('initModel with name URL props', async () => {
        const form = (
            <SampleTypeDesignerImpl
                {...BASE_PROPS}
                domainFormDisplayOptions={{
                    hideConditionalFormatting: true,
                }}
                initModel={DomainDetails.create(
                    Map<string, any>({
                        domainDesign: {
                            name: 'Test Name',
                            fields: [{ name: 'testfield' }],
                        },
                        nameReadOnly: true,
                    })
                )}
                currentPanelIndex={0}
                firstState={true}
                onFinish={jest.fn()}
                onTogglePanel={jest.fn()}
                setSubmitting={jest.fn()}
                submitting={false}
                validatePanel={0}
                visitedPanels={List()}
            />
        );
        const wrapped = shallow(form);
        await waitForLifecycle(wrapped);

        expect(wrapped.find(SampleTypePropertiesPanel)).toHaveLength(1);
        expect(wrapped.find(DomainForm)).toHaveLength(1);
        expect(wrapped.find(FileAttachmentForm)).toHaveLength(0);
        wrapped.unmount();
    });

    test('open fields panel', async () => {
        const wrapped = mountWithAppServerContext(<SampleTypeDesigner {...BASE_PROPS} />);
        await waitForLifecycle(wrapped);

        const panelHeader = wrapped.find('div#domain-header');
        expect(wrapped.find('#domain-header').at(1).hasClass('domain-panel-header-collapsed')).toBeTruthy();
        panelHeader.simulate('click');
        expect(wrapped.find('#domain-header').at(1).hasClass('domain-panel-header-expanded')).toBeTruthy();
        expect(wrapped.find(FileAttachmentForm)).toHaveLength(1);

        const alerts = wrapped.find(Alert);
        expect(alerts).toHaveLength(2);
        expect(alerts.at(0).text()).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(alerts.at(1).text()).toEqual('Please correct errors in the properties panel before saving.');
        wrapped.unmount();
    });

    test('open fields panel, with barcodes', async () => {
        LABKEY.moduleContext = { api: { moduleNames: ['samplemanagement', 'api', 'core', 'premium'] } };
        const wrapped = mountWithAppServerContext(<SampleTypeDesigner {...BASE_PROPS} />);
        await waitForLifecycle(wrapped);

        const panelHeader = wrapped.find('div#domain-header');
        panelHeader.simulate('click');
        const alerts = wrapped.find(Alert);
        // still expect to have only two alerts.  We don't show the Barcode header in the file import panel.
        // Jest doesn't want to switch to that panel.
        expect(alerts).toHaveLength(2);
        expect(alerts.at(0).text()).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(alerts.at(1).text()).toEqual('Please correct errors in the properties panel before saving.');
        wrapped.unmount();
    });
});
