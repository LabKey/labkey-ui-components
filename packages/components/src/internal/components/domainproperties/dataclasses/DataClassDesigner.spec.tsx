import React from 'react';
import { mount } from 'enzyme';

import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';
import getDomainDetailsJSON from '../../../../test/data/dataclass-getDomainDetails.json';
import DomainForm from '../DomainForm';

import { waitForLifecycle } from '../../../testHelpers';
import { initUnitTestMocks } from '../../../../test/testHelperMocks';

import { FileAttachmentForm } from '../../../../public/files/FileAttachmentForm';

import { Alert } from '../../base/Alert';

import { SystemFields } from '../SystemFields';

import { DataClassPropertiesPanel } from './DataClassPropertiesPanel';
import { DataClassModel } from './models';
import { DataClassDesigner } from './DataClassDesigner';

const BASE_PROPS = {
    onComplete: jest.fn(),
    onCancel: jest.fn(),
    loadNameExpressionOptions: jest.fn(async () => ({ prefix: '', allowUserSpecifiedNames: true })),
    testMode: true,
};

beforeAll(() => {
    initUnitTestMocks();
});

describe('DataClassDesigner', () => {
    test('default properties', async () => {
        const form = <DataClassDesigner {...BASE_PROPS} />;

        const tree = mount(form);

        await waitForLifecycle(tree);

        expect(tree).toMatchSnapshot();
    });

    test('custom properties', async () => {
        const form = (
            <DataClassDesigner
                {...BASE_PROPS}
                nounSingular="Source"
                nounPlural="Sources"
                nameExpressionInfoUrl="https://www.labkey.org/Documentation"
                nameExpressionPlaceholder="name expression placeholder test"
                headerText="header text test"
                useTheme={true}
                appPropertiesOnly={true}
                successBsStyle="primary"
                saveBtnText="Finish it up"
            />
        );

        const tree = mount(form);

        await waitForLifecycle(tree);

        expect(tree).toMatchSnapshot();
    });

    test('initModel', async () => {
        const form = <DataClassDesigner {...BASE_PROPS} initModel={DataClassModel.create(getDomainDetailsJSON)} />;
        const wrapped = mount(form);
        await waitForLifecycle(wrapped);

        expect(wrapped.find(DataClassPropertiesPanel)).toHaveLength(1);
        expect(wrapped.find(DomainForm)).toHaveLength(1);
        expect(wrapped.find(FileAttachmentForm)).toHaveLength(0);
        expect(wrapped).toMatchSnapshot();
        wrapped.unmount();
    });

    test('open fields panel', async () => {
        const wrapped = mount(<DataClassDesigner {...BASE_PROPS} />);
        await waitForLifecycle(wrapped);

        const panelHeader = wrapped.find('div#domain-header');
        expect(wrapped.find('#domain-header').at(2).hasClass('domain-panel-header-collapsed')).toBeTruthy();
        panelHeader.simulate('click');
        expect(wrapped.find('#domain-header').at(2).hasClass('domain-panel-header-expanded')).toBeTruthy();
        expect(wrapped.find(FileAttachmentForm)).toHaveLength(1);
        expect(wrapped.find(SystemFields)).toHaveLength(1);

        expect(wrapped.find(Alert)).toHaveLength(2);
        expect(wrapped.find(Alert).at(0).text()).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(wrapped.find(Alert).at(1).text()).toEqual(
            'Please correct errors in the properties panel before saving.'
        );
        wrapped.unmount();
    });
});
