/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { List } from 'immutable';
import { render, screen } from '@testing-library/react';

import { makeQueryInfo } from '../../test/testHelpers';
import assayGpatDataQueryInfo from '../../../test/data/assayGpatData-getQueryDetails.json';
import { QueryColumn } from '../../../public/QueryColumn';

import { Formsy } from './formsy';
import { QueryFormInputs } from './QueryFormInputs';

const QUERY_INFO = makeQueryInfo(assayGpatDataQueryInfo);

describe('QueryFormInputs', () => {
    test('default properties with queryInfo', () => {
        const { container } = render(
            <Formsy>
                <QueryFormInputs queryInfo={QUERY_INFO} />
            </Formsy>
        );

        expect(document.querySelectorAll('input')).toHaveLength(9);
        expect(container.querySelectorAll('input:disabled')).toHaveLength(0);

        // Verify presence of expected fields
        expect(screen.getByLabelText('Participant ID')).toBeInTheDocument();
        expect(screen.getByLabelText('Visit ID')).toBeInTheDocument();

        // Check types where possible
        expect(screen.getByLabelText('Healthy')).toHaveAttribute('type', 'checkbox');

        // default properties don't render file inputs
        expect(container.querySelectorAll('input[type="file"]')).toHaveLength(0);
    });

    test('renderFieldLabel', () => {
        const { container } = render(
            <Formsy>
                <QueryFormInputs
                    queryInfo={QUERY_INFO}
                    renderFieldLabel={(queryColumn: QueryColumn, label: string) => {
                        return <div className="jest-field-label-test">{queryColumn?.name || label}</div>;
                    }}
                />
            </Formsy>
        );

        expect(container.querySelectorAll('.jest-field-label-test')).toHaveLength(9);
    });

    test('render file inputs', () => {
        const { container } = render(
            <Formsy>
                <QueryFormInputs queryInfo={QUERY_INFO} renderFileInputs={true} />
            </Formsy>
        );

        expect(container.querySelectorAll('input[type="file"]')).toHaveLength(1);
    });

    test('custom columnFilter', () => {
        const filter = (col: QueryColumn) => {
            return col.name === 'Healthy';
        };

        render(
            <Formsy>
                <QueryFormInputs columnFilter={filter} queryInfo={QUERY_INFO} />
            </Formsy>
        );

        expect(screen.getByLabelText('Healthy')).toBeInTheDocument();
        expect(screen.queryByLabelText('Participant ID')).not.toBeInTheDocument();
    });

    test('disabledFields', () => {
        render(
            <Formsy>
                <QueryFormInputs
                    disabledFields={List<string>(['date', 'ParticipantID', 'textarea'])}
                    queryInfo={QUERY_INFO}
                />
            </Formsy>
        );

        const inputs = document.querySelectorAll('input');
        expect(inputs).toHaveLength(9);
        expect(inputs[4].getAttribute('type')).toBe('text');
        expect(inputs[4].getAttribute('name')).toBe('Date');
        expect(inputs[4].getAttribute('value')).toBe('');
        expect(inputs[4].getAttribute('disabled')).toBe('');
    });

    test('disabledFields, with fieldWithMixedValues', () => {
        render(
            <Formsy>
                <QueryFormInputs
                    disabledFields={List<string>(['date', 'healthy'])}
                    fieldWithMixedValues={['date', 'healthy', 'ParticipantID']}
                    queryInfo={QUERY_INFO}
                />
            </Formsy>
        );

        const inputs = document.querySelectorAll('input');
        expect(inputs).toHaveLength(9);
        expect(inputs[2].getAttribute('name')).toBe('ParticipantID');
        expect(inputs[2].getAttribute('disabled')).toBeNull();
        expect(inputs[2].getAttribute('placeholder')).toBe('Enter participant id'); // not disabled, show don't show Mixed placeholder
        expect(inputs[4].getAttribute('name')).toBe('Date');
        expect(inputs[4].getAttribute('disabled')).toBe(''); // disabled
        expect(inputs[4].getAttribute('placeholder')).toBe('[Mixed]'); // disabled and has mix value
        expect(inputs[5].getAttribute('name')).toBe('DateOnly');
        expect(inputs[5].getAttribute('placeholder')).toBe('Select dateonly');
        expect(inputs[6].getAttribute('name')).toBe('TimeOnly');
        expect(inputs[6].getAttribute('placeholder')).toBe('Select timeonly');
        expect(inputs[7].getAttribute('placeholder')).toBeNull();
        expect(inputs[7].getAttribute('title')).toBe('[Mixed]'); // disabled and has mix value, boolean
    });
});
