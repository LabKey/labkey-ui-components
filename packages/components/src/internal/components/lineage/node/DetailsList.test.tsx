/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

import lineageSampleData from '../../../../test/data/experiment-lineage-runSteps.json';

import { LineageNode } from '../models';
import { LineageDataLink } from '../LineageDataLink';

import { DetailsListSteps } from './DetailsList';

// Mock LineageDataLink component since we only need to verify it's rendered
jest.mock('../LineageDataLink', () => ({
    LineageDataLink: jest.fn(() => null),
}));

describe('DetailsListSteps', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    function validateSteps(stepCount: number): void {
        // Check DetailsList presence
        const detailsList = screen.queryByTestId('details-list');
        expect(detailsList).toBeInTheDocument();

        // Check step icons and names
        const icons = screen.queryAllByTestId('lineage-step-icon');
        expect(icons).toHaveLength(stepCount);

        const names = screen.queryAllByTestId('lineage-step-name');
        expect(names).toHaveLength(stepCount);

        // Check LineageDataLink renders
        expect(LineageDataLink).toHaveBeenCalledTimes(stepCount);
    }

    test('not exp run', () => {
        render(
            <DetailsListSteps
                node={LineageNode.create('abc:123', { expType: 'ProtocolApplication' })}
                onSelect={jest.fn()}
            />
        );

        expect(screen.queryByTestId('details-list')).not.toBeInTheDocument();
    });

    test('no run steps', () => {
        render(
            <DetailsListSteps node={LineageNode.create('abc:123', { expType: 'ExperimentRun' })} onSelect={jest.fn()} />
        );

        validateSteps(0);
    });

    test('with run steps', () => {
        render(
            <DetailsListSteps
                node={LineageNode.create('abc:123', lineageSampleData.nodes[lineageSampleData.seed])}
                onSelect={jest.fn()}
            />
        );

        validateSteps(2);

        const stepNames = screen.getAllByTestId('lineage-step-name');
        expect(stepNames[0]).toHaveTextContent('RecordingOneStepOne');
        expect(stepNames[1]).toHaveTextContent('RecordingOneStepTwo');
    });
});
