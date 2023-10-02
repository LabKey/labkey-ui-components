import React from 'react';
import { mount, shallow } from 'enzyme';

import { List } from 'immutable';
import { getTestAPIWrapper } from '../../../APIWrapper';

import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';
import getDomainDetailsJSON from '../../../../test/data/dataclass-getDomainDetails.json';
import DomainForm from '../DomainForm';

import { waitForLifecycle } from '../../../test/enzymeTestHelpers';

import { FileAttachmentForm } from '../../../../public/files/FileAttachmentForm';

import { Alert } from '../../base/Alert';

import { SystemFields } from '../SystemFields';

import { DataClassPropertiesPanel } from './DataClassPropertiesPanel';
import { DataClassModel } from './models';
import { DataClassDesigner, DataClassDesignerImpl } from './DataClassDesigner';

const BASE_PROPS = {
    api: getTestAPIWrapper(jest.fn),
    onComplete: jest.fn(),
    onCancel: jest.fn(),
    loadNameExpressionOptions: jest.fn(async () => ({ prefix: '', allowUserSpecifiedNames: true })),
    testMode: true,
};

describe('DataClassDesigner', () => {
    test('default properties', async () => {
        const form = (
            <DataClassDesignerImpl
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

        const tree = shallow(form);

        await waitForLifecycle(tree);

        expect(tree).toMatchSnapshot();
    });

    test('custom properties', async () => {
        const form = (
            <DataClassDesignerImpl
                {...BASE_PROPS}
                nounSingular="Source"
                nounPlural="Sources"
                nameExpressionInfoUrl="https://www.labkey.org/Documentation"
                nameExpressionPlaceholder="name expression placeholder test"
                headerText="header text test"
                appPropertiesOnly={true}
                saveBtnText="Finish it up"
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

        const tree = shallow(form);

        await waitForLifecycle(tree);

        expect(tree).toMatchSnapshot();
    });

    test('initModel', async () => {
        const form = (
            <DataClassDesignerImpl
                {...BASE_PROPS}
                initModel={DataClassModel.create(getDomainDetailsJSON)}
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
        expect(wrapped.find('#domain-header').at(1).hasClass('domain-panel-header-collapsed')).toBeTruthy();
        panelHeader.simulate('click');
        expect(wrapped.find('#domain-header').at(1).hasClass('domain-panel-header-expanded')).toBeTruthy();
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
