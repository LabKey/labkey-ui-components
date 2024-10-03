import React, { act } from 'react';

import { render } from '@testing-library/react';

import { waitFor } from '@testing-library/dom';

import { QueryColumn } from '../../../public/QueryColumn';

import { createMockGetQueryDetails } from '../../../test/MockUtils';

import { HelpTipRenderer } from './HelpTipRenderer';
import { DOMAIN_FIELD } from './DomainFieldHelpTipContents';

jest.mock('../../query/api', () => ({
    ...jest.requireActual('../../query/api'),
    getQueryDetails: () => createMockGetQueryDetails(),
}));

describe('HelpTipRenderer', () => {
    test('SampleStatusLegend', async () => {
        act(() => {
            render(<HelpTipRenderer type="SampleStatusLegend" />);
        });
        await waitFor(() => {
            expect(document.querySelector('.fa-spinner')).not.toBeNull();
        });
    });

    test('DomainField', async () => {
        const column = new QueryColumn({
            type: 'string',
            phiProtected: true,
            fieldKey: 'Label',
            caption: 'Label',
        });
        act(() => {
            render(<HelpTipRenderer type={DOMAIN_FIELD} column={column} />);
        });
        await waitFor(() => {
            expect(document.querySelector('.sample-status-legend--table')).toBeNull();
            const paragraphs = document.querySelectorAll('p');
            const labels = document.querySelectorAll('strong');
            expect(labels).toHaveLength(1);
            expect(labels.item(0)).toHaveTextContent('Type');
            expect(paragraphs).toHaveLength(2);
            expect(paragraphs.item(0)).toHaveTextContent('Type string');
            expect(paragraphs.item(1)).toHaveTextContent('PHI protected data removed.');
        });
    });

    test('other', async () => {
        let container;
        act(() => {
            container = render(<HelpTipRenderer type="other" />).container;
        });
        await waitFor(() => {
            expect(container.firstChild).toBeNull();
        });
    });
});
