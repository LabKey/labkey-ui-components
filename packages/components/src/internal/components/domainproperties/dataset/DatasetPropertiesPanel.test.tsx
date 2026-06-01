/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { act } from 'react';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { NEW_DATASET_MODEL_WITHOUT_DATASPACE } from '../../../../test/data/constants';

import getDatasetDesign from '../../../../test/data/dataset-getDatasetDesign.json';

import { DatasetModel } from './models';

import { DatasetPropertiesPanel } from './DatasetPropertiesPanel';
import { VISIT_TIMEPOINT_TYPE } from './constants';

jest.mock('./actions', () => ({
    ...jest.requireActual('./actions'),
    fetchCohorts: jest.fn().mockResolvedValue([]),
    fetchCategories: jest.fn().mockResolvedValue([]),
}));

describe('Dataset Properties Panel', () => {
    const studyProperties = {
        SubjectColumnName: 'subject',
        SubjectNounSingular: 'Participant',
        SubjectNounPlural: 'Participants',
        TimepointType: VISIT_TIMEPOINT_TYPE,
    };

    test('New dataset', async () => {
        await act(async () => {
            renderWithAppContext(
                <DatasetPropertiesPanel
                    initCollapsed={false}
                    model={DatasetModel.create(NEW_DATASET_MODEL_WITHOUT_DATASPACE)}
                    controlledCollapse={true}
                    panelStatus="COMPLETE"
                    validate={false}
                    studyProperties={studyProperties}
                    onToggle={jest.fn()}
                    onChange={jest.fn()}
                />
            );
        });

        expect(document.getElementById('name')).toHaveValue('');
        expect(document.getElementById('label')).toHaveValue('');
        expect(document.getElementById('description').textContent).toBe('');
    });

    test('Edit existing dataset', async () => {
        await act(async () => {
            renderWithAppContext(
                <DatasetPropertiesPanel
                    initCollapsed={false}
                    model={DatasetModel.create(null, getDatasetDesign)}
                    controlledCollapse={true}
                    panelStatus="COMPLETE"
                    validate={false}
                    studyProperties={studyProperties}
                    onToggle={jest.fn()}
                    onChange={jest.fn()}
                />
            );
        });

        expect(document.getElementById('name')).toHaveValue('Dataset1');
        expect(document.getElementById('label')).toHaveValue('Dataset One');
        expect(document.getElementById('description').textContent).toBe('This is the first dataset');
    });
});
