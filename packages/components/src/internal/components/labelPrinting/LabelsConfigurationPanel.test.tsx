/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { waitFor } from '@testing-library/dom';

import { getTestAPIWrapper } from '../../APIWrapper';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { Container } from '../base/models/Container';

import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { getLabelPrintingTestAPIWrapper } from './APIWrapper';
import { LabelsConfigurationPanel, LabelTemplateDetails, LabelTemplatesList } from './LabelsConfigurationPanel';
import { LabelTemplate } from './models';

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
        renderWithAppContext(<LabelsConfigurationPanel {...DEFAULT_PROPS} />, {
            serverContext: { container: new Container({ path: '/Test' }) },
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.choices-list__empty-message')).toHaveLength(1);
        });

        // LabelTemplatesList rendered (with no templates → shows empty message)
        expect(document.querySelectorAll('.choices-list__empty-message')).toHaveLength(1);
        // LabelTemplateDetails rendered (template=null → no empty message, no form)
        expect(document.querySelectorAll('.choices-detail__empty-message')).toHaveLength(0);
        expect(document.querySelectorAll('.choices-container-left-panel')).toHaveLength(1);
    });
});

describe('LabelTemplatesList', () => {
    const DEFAULT_PROPS = {
        onSelect: jest.fn(),
        selected: undefined,
        templates: [],
    };

    test('default props', () => {
        renderWithAppContext(<LabelTemplatesList {...DEFAULT_PROPS} />);
        expect(document.querySelectorAll('.choices-list__empty-message')).toHaveLength(1);
        expect(document.querySelectorAll('.list-group-item')).toHaveLength(0);
        expect(document.querySelectorAll('.badge')).toHaveLength(0);
    });

    test('Single Item', () => {
        renderWithAppContext(
            <LabelTemplatesList
                {...DEFAULT_PROPS}
                templates={[new LabelTemplate({ name: 'T1', path: 'T1_path', rowId: 0 })]}
            />
        );
        expect(document.querySelectorAll('.choices-list__empty-message')).toHaveLength(0);
        expect(document.querySelectorAll('.list-group-item')).toHaveLength(1);
        expect(document.querySelectorAll('.badge')).toHaveLength(0);
    });

    test('Two Items', () => {
        renderWithAppContext(
            <LabelTemplatesList
                {...DEFAULT_PROPS}
                templates={[
                    new LabelTemplate({ name: 'T1', path: 'T1_path', rowId: 0 }),
                    new LabelTemplate({ name: 'T2', path: 'T2_path', rowId: 1 }),
                ]}
            />
        );
        expect(document.querySelectorAll('.choices-list__empty-message')).toHaveLength(0);
        expect(document.querySelectorAll('.list-group-item')).toHaveLength(2);
        expect(document.querySelectorAll('.badge')).toHaveLength(0);
    });

    test('Two Items, with default', () => {
        renderWithAppContext(
            <LabelTemplatesList
                {...DEFAULT_PROPS}
                defaultLabel={0}
                templates={[
                    new LabelTemplate({ name: 'T1', path: 'T1_path', rowId: 0 }),
                    new LabelTemplate({ name: 'T2', path: 'T2_path', rowId: 1 }),
                ]}
            />
        );
        expect(document.querySelectorAll('.choices-list__empty-message')).toHaveLength(0);
        expect(document.querySelectorAll('.list-group-item')).toHaveLength(2);
        expect(document.querySelectorAll('.badge')).toHaveLength(1);
        expect(document.querySelector('.badge')).toHaveTextContent('default');
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
        renderWithAppContext(<LabelTemplateDetails {...DEFAULT_PROPS} />);
        // Don't show anything, use Label List's default message
        expect(document.querySelectorAll('.choices-detail__empty-message')).toHaveLength(0);
        expect(document.querySelectorAll('.form-group')).toHaveLength(0);
        expect(document.querySelectorAll('[name="isDefault"]')).toHaveLength(0);
    });

    test('Nothing selected message', () => {
        renderWithAppContext(<LabelTemplateDetails {...DEFAULT_PROPS} template={undefined} />);
        // Show no selection message
        expect(document.querySelectorAll('.choices-detail__empty-message')).toHaveLength(1);
        expect(document.querySelectorAll('.form-group')).toHaveLength(0);
        expect(document.querySelectorAll('[name="isDefault"]')).toHaveLength(0);
    });

    test('Template Selected, cannot be default', () => {
        renderWithAppContext(
            <LabelTemplateDetails
                {...DEFAULT_PROPS}
                isNew={true}
                template={new LabelTemplate({ name: '', path: '', description: '', container: '' })}
                isDefaultable={false}
            />
        );
        // Show form w/o default selector
        expect(document.querySelectorAll('.choices-detail__empty-message')).toHaveLength(0);
        expect(document.querySelectorAll('.form-group')).toHaveLength(3);
        expect(document.querySelectorAll('[name="isDefault"]')).toHaveLength(0);
    });

    test('Default Template Selected, w/ default selectable', async () => {
        const template = new LabelTemplate({ rowId: 1, name: 'a', path: 'b', description: 'c', container: 'abcd' });
        renderWithAppContext(
            <LabelTemplateDetails
                {...DEFAULT_PROPS}
                isNew={false}
                template={template}
                isDefaultable={true}
                defaultLabel={1}
            />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('[name="isDefault"]')).toHaveLength(1);
        });

        // Show form with default selector and default selected
        expect(document.querySelectorAll('.choices-detail__empty-message')).toHaveLength(0);
        expect(document.querySelectorAll('.form-group')).toHaveLength(4);
        expect(document.querySelectorAll('[name="isDefault"]')).toHaveLength(1);
        expect(document.querySelector('[name="isDefault"]')).toBeChecked();
    });

    test('non-default Template Selected, w/ default selectable', async () => {
        const template = new LabelTemplate({ rowId: 2, name: 'a', path: 'b', description: 'c', container: 'abcd' });
        renderWithAppContext(
            <LabelTemplateDetails
                {...DEFAULT_PROPS}
                isNew={false}
                template={template}
                isDefaultable={true}
                defaultLabel={1}
            />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('[name="isDefault"]')).toHaveLength(1);
        });

        // Show form with default selector and default not selected
        expect(document.querySelectorAll('.choices-detail__empty-message')).toHaveLength(0);
        expect(document.querySelectorAll('.form-group')).toHaveLength(4);
        expect(document.querySelectorAll('[name="isDefault"]')).toHaveLength(1);
        expect(document.querySelector('[name="isDefault"]')).not.toBeChecked();
    });
});
