import React from 'react';
import { mount } from 'enzyme';
import renderer from 'react-test-renderer';

import { Alert, FileAttachmentForm } from '../../../..';
import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';
import getDomainDetailsJSON from '../../../../test/data/dataclass-getDomainDetails.json';
import DomainForm from '../DomainForm';

import { initUnitTestMocks, sleep } from '../../../testHelpers';

import { DataClassPropertiesPanel } from './DataClassPropertiesPanel';
import { DataClassModel } from './models';
import { DataClassDesigner } from './DataClassDesigner';

const BASE_PROPS = {
    onComplete: jest.fn(),
    onCancel: jest.fn(),
    testMode: true,
};

beforeAll(() => {
    initUnitTestMocks();
});

describe('DataClassDesigner', () => {
    test('default properties', () => {
        const form = <DataClassDesigner {...BASE_PROPS} />;

        const tree = renderer.create(form).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom properties', () => {
        const form = (
            <DataClassDesigner
                {...BASE_PROPS}
                nounSingular="Source"
                nounPlural="Sources"
                nameExpressionInfoUrl="https://www.labkey.org/Documentation"
                nameExpressionPlaceholder="name expression placeholder test"
                headerText="header text test"
                useTheme={true}
                containerTop={10}
                appPropertiesOnly={true}
                successBsStyle="primary"
                saveBtnText="Finish it up"
            />
        );

        const tree = renderer.create(form);
        expect(tree).toMatchSnapshot();
    });

    test('initModel', async () => {
        const form = <DataClassDesigner {...BASE_PROPS} initModel={DataClassModel.create(getDomainDetailsJSON)} />;
        const wrapped = mount(form);
        await sleep();

        expect(wrapped.find(DataClassPropertiesPanel)).toHaveLength(1);
        expect(wrapped.find(DomainForm)).toHaveLength(1);
        expect(wrapped.find(FileAttachmentForm)).toHaveLength(0);
        expect(wrapped).toMatchSnapshot();
        wrapped.unmount();
    });

    test('open fields panel', async () => {
        const wrapped = mount(<DataClassDesigner {...BASE_PROPS} />);
        await sleep();

        const panelHeader = wrapped.find('div#domain-header');
        expect(wrapped.find('#domain-header').at(2).hasClass('domain-panel-header-collapsed')).toBeTruthy();
        panelHeader.simulate('click');
        expect(wrapped.find('#domain-header').at(2).hasClass('domain-panel-header-expanded')).toBeTruthy();
        expect(wrapped.find(FileAttachmentForm)).toHaveLength(1);

        expect(wrapped.find(Alert)).toHaveLength(2);
        expect(wrapped.find(Alert).at(0).text()).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(wrapped.find(Alert).at(1).text()).toEqual(
            'Please correct errors in the properties panel before saving.'
        );
        wrapped.unmount();
    });
});
