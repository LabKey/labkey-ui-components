import React from 'react';

import classNames from 'classnames';

import { FormGroup } from 'react-bootstrap';

import { getTestAPIWrapper } from '../../APIWrapper';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';

import { ChoicesListItem } from '../base/ChoicesListItem';

import { Container } from '../base/models/Container';

import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { getLabelPrintingTestAPIWrapper } from './APIWrapper';
import { LabelsConfigurationPanel, LabelTemplateDetails, LabelTemplatesList } from './LabelsConfigurationPanel';
import { LabelTemplate } from './models';

jest.mock('react-bootstrap-toggle', () => {
    return props => {
        return (
            <div
                {...props}
                className={classNames('mock-toggle', { 'toggle-on': props.active, 'toggle-off': !props.active })}
            />
        );
    };
});

describe('LabelsConfigurationPanel', () => {
    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn, {
            labelprinting: getLabelPrintingTestAPIWrapper(jest.fn),
        }),
        defaultLabel: undefined,
        getIsDirty: jest.fn(),
        setIsDirty: jest.fn(),
        container: TEST_PROJECT_CONTAINER,
    };

    test('default props', async () => {
        const wrapper = mountWithAppServerContext(<LabelsConfigurationPanel {...DEFAULT_PROPS} />, undefined, {
            container: new Container({ path: '/Test' }),
        });

        await waitForLifecycle(wrapper);

        expect(wrapper.find(LabelTemplatesList)).toHaveLength(1);
        expect(wrapper.find(LabelTemplateDetails)).toHaveLength(1);
        wrapper.unmount();
    });
});

describe('LabelTemplatesList', () => {
    const DEFAULT_PROPS = {
        onSelect: jest.fn(),
        selected: undefined,
        templates: [],
    };

    test('default props', () => {
        const wrapper = mountWithAppServerContext(<LabelTemplatesList {...DEFAULT_PROPS} />);

        expect(wrapper.find('.choices-list__empty-message')).toHaveLength(1);
        expect(wrapper.find(ChoicesListItem)).toHaveLength(0);
        expect(wrapper.find('.badge')).toHaveLength(0);
        wrapper.unmount();
    });

    test('Single Item', () => {
        const wrapper = mountWithAppServerContext(
            <LabelTemplatesList
                {...DEFAULT_PROPS}
                templates={[
                    new LabelTemplate({
                        name: 'T1',
                        path: 'T1_path',
                        rowId: 0,
                    }),
                ]}
            />
        );

        expect(wrapper.find('.choices-list__empty-message')).toHaveLength(0);
        expect(wrapper.find(ChoicesListItem)).toHaveLength(1);
        expect(wrapper.find('.badge')).toHaveLength(0);
        wrapper.unmount();
    });

    test('Two Items', () => {
        const wrapper = mountWithAppServerContext(
            <LabelTemplatesList
                {...DEFAULT_PROPS}
                templates={[
                    new LabelTemplate({
                        name: 'T1',
                        path: 'T1_path',
                        rowId: 0,
                    }),
                    new LabelTemplate({
                        name: 'T2',
                        path: 'T2_path',
                        rowId: 1,
                    }),
                ]}
            />
        );

        expect(wrapper.find('.choices-list__empty-message')).toHaveLength(0);
        expect(wrapper.find(ChoicesListItem)).toHaveLength(2);
        expect(wrapper.find('.badge')).toHaveLength(0);
        wrapper.unmount();
    });

    test('Two Items, with default', () => {
        const wrapper = mountWithAppServerContext(
            <LabelTemplatesList
                {...DEFAULT_PROPS}
                defaultLabel={0}
                templates={[
                    new LabelTemplate({
                        name: 'T1',
                        path: 'T1_path',
                        rowId: 0,
                    }),
                    new LabelTemplate({
                        name: 'T2',
                        path: 'T2_path',
                        rowId: 1,
                    }),
                ]}
            />
        );

        expect(wrapper.find('.choices-list__empty-message')).toHaveLength(0);
        expect(wrapper.find(ChoicesListItem)).toHaveLength(2);
        expect(wrapper.find('.badge')).toHaveLength(1);
        expect(wrapper.find('.badge').text()).toBe('default');
        wrapper.unmount();
    });
});

const lpAPI = getLabelPrintingTestAPIWrapper(jest.fn);
describe('LabelTemplateDetails', () => {
    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn, {
            labelprinting: lpAPI,
        }),
        defaultLabel: undefined,
        isNew: false,
        onActionCompleted: jest.fn(),
        onDefaultChanged: jest.fn(),
        onChange: jest.fn(),
        template: null,
        isDefaultable: false,
        container: TEST_PROJECT_CONTAINER,
    };

    test('default props', () => {
        const wrapper = mountWithAppServerContext(<LabelTemplateDetails {...DEFAULT_PROPS} />);

        // Don't show anything, use Label List's default message
        expect(wrapper.find('.choices-detail__empty-message')).toHaveLength(0);
        expect(wrapper.find(FormGroup)).toHaveLength(0);
        expect(wrapper.find('.mock-toggle')).toHaveLength(0);
        wrapper.unmount();
    });

    test('Nothing selected message', () => {
        const wrapper = mountWithAppServerContext(<LabelTemplateDetails {...DEFAULT_PROPS} template={undefined} />);

        // Show no selection message
        expect(wrapper.find('.choices-detail__empty-message')).toHaveLength(1);
        expect(wrapper.find(FormGroup)).toHaveLength(0);
        expect(wrapper.find('.mock-toggle')).toHaveLength(0);
        expect(wrapper.find('.toggle-on')).toHaveLength(0);
        expect(wrapper.find('.toggle-off')).toHaveLength(0);
        wrapper.unmount();
    });

    test('Template Selected, cant be default', () => {
        const wrapper = mountWithAppServerContext(
            <LabelTemplateDetails
                {...DEFAULT_PROPS}
                isNew={true}
                template={
                    new LabelTemplate({
                        name: '',
                        path: '',
                        description: '',
                        container: '',
                    })
                }
                isDefaultable={false}
            />
        );

        // Show form w/o default selector
        expect(wrapper.find('.choices-detail__empty-message')).toHaveLength(0);
        expect(wrapper.find(FormGroup)).toHaveLength(3);
        expect(wrapper.find('.mock-toggle')).toHaveLength(0);
        expect(wrapper.find('.toggle-on')).toHaveLength(0);
        expect(wrapper.find('.toggle-off')).toHaveLength(0);
        wrapper.unmount();
    });

    test('Default Template Selected, w/ default selectable', async () => {
        const template = new LabelTemplate({
            rowId: 1,
            name: 'a',
            path: 'b',
            description: 'c',
            container: 'abcd',
        });

        const wrapper = mountWithAppServerContext(
            <LabelTemplateDetails
                {...DEFAULT_PROPS}
                isNew={false}
                template={template}
                isDefaultable={true}
                defaultLabel={1}
            />
        );
        await waitForLifecycle(wrapper);

        // Show form with default selector and default selected
        expect(wrapper.find('.choices-detail__empty-message')).toHaveLength(0);
        expect(wrapper.find(FormGroup)).toHaveLength(4);
        expect(wrapper.find('.mock-toggle')).toHaveLength(1);
        expect(wrapper.find('.toggle-on')).toHaveLength(1);
        expect(wrapper.find('.toggle-off')).toHaveLength(0);
        wrapper.unmount();
    });

    test('non-default Template Selected, w/ default selectable', async () => {
        const template = new LabelTemplate({
            rowId: 2,
            name: 'a',
            path: 'b',
            description: 'c',
            container: 'abcd',
        });

        const wrapper = mountWithAppServerContext(
            <LabelTemplateDetails
                {...DEFAULT_PROPS}
                isNew={false}
                template={template}
                isDefaultable={true}
                defaultLabel={1}
            />
        );
        await waitForLifecycle(wrapper);

        // Show form with default selector and default selected
        expect(wrapper.find('.choices-detail__empty-message')).toHaveLength(0);
        expect(wrapper.find(FormGroup)).toHaveLength(4);
        expect(wrapper.find('.mock-toggle')).toHaveLength(1);
        expect(wrapper.find('.toggle-on')).toHaveLength(0);
        expect(wrapper.find('.toggle-off')).toHaveLength(1);
        wrapper.unmount();
    });
});
