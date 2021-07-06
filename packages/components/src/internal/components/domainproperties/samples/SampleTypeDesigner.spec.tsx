import React from 'react';
import { Map } from 'immutable';
import { mount } from 'enzyme';
import renderer from 'react-test-renderer';

import { Alert, FileAttachmentForm } from '../../../..';
import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';
import DomainForm from '../DomainForm';

import { DomainDetails } from '../models';

import { sleep } from '../../../testHelpers';
import { initUnitTestMocks } from '../../../testHelperMocks';

import { SampleTypePropertiesPanel } from './SampleTypePropertiesPanel';
import { SampleTypeDesigner } from './SampleTypeDesigner';

const BASE_PROPS = {
    appPropertiesOnly: true,
    initModel: undefined,
    onComplete: jest.fn(),
    onCancel: jest.fn(),
    testMode: true,
};

beforeAll(() => {
    initUnitTestMocks();
});

describe('SampleTypeDesigner', () => {
    test('default properties', () => {
        const form = <SampleTypeDesigner {...BASE_PROPS} />;

        const tree = renderer.create(form).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom properties', () => {
        const form = (
            <SampleTypeDesigner
                {...BASE_PROPS}
                nounSingular="Some Sample"
                nounPlural="Some Samples"
                nameExpressionInfoUrl="https://www.labkey.org/Documentation"
                nameExpressionPlaceholder="name expression placeholder test"
                headerText="header text test"
                useTheme={true}
                containerTop={10}
                appPropertiesOnly={false}
                successBsStyle="primary"
                saveBtnText="Finish it up"
            />
        );

        const tree = renderer.create(form).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('initModel with name URL props', async () => {
        const form = (
            <SampleTypeDesigner
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
            />
        );
        const wrapped = mount(form);
        await sleep();

        expect(wrapped.find(SampleTypePropertiesPanel)).toHaveLength(1);
        expect(wrapped.find(DomainForm)).toHaveLength(1);
        expect(wrapped.find(FileAttachmentForm)).toHaveLength(0);
        expect(wrapped).toMatchSnapshot();
        wrapped.unmount();
    });

    test('open fields panel', async () => {
        const wrapped = mount(<SampleTypeDesigner {...BASE_PROPS} />);
        await sleep();

        const panelHeader = wrapped.find('div#domain-header');
        expect(wrapped.find('#domain-header').at(2).hasClass('domain-panel-header-collapsed')).toBeTruthy();
        panelHeader.simulate('click');
        expect(wrapped.find('#domain-header').at(2).hasClass('domain-panel-header-expanded')).toBeTruthy();
        expect(wrapped.find(FileAttachmentForm)).toHaveLength(1);

        const alerts = wrapped.find(Alert);
        expect(alerts).toHaveLength(2);
        expect(alerts.at(0).text()).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(alerts.at(1).text()).toEqual('Please correct errors in the properties panel before saving.');
        wrapped.unmount();
    });

    test('open fields panel, with barcodes', async () => {
        LABKEY.moduleContext = { api: { moduleNames: ['sampleManagement', 'api', 'core', 'premium'] } };
        const wrapped = mount(<SampleTypeDesigner {...BASE_PROPS} />);
        await sleep();

        const panelHeader = wrapped.find('div#domain-header');
        panelHeader.simulate('click');
        const alerts = wrapped.find(Alert);
        // still expect to have only two alerts.  We don't show the Barcode header in the file import panel.
        // Jest doesn't wnat to switch to that panel.
        expect(alerts).toHaveLength(2);
        expect(alerts.at(0).text()).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(alerts.at(1).text()).toEqual('Please correct errors in the properties panel before saving.');
        wrapped.unmount();
    });
});
