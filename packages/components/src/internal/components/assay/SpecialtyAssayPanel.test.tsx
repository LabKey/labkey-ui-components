import React, { act } from 'react';
import { render } from '@testing-library/react';

import { SpecialtyAssayPanel } from './SpecialtyAssayPanel';

describe('SpecialtyAssayPanel', () => {
    const first = { name: 'General', fileTypes: ['txt'], description: 'General Assay' };
    const second = { name: 'Other One', fileTypes: ['xls', 'xlsx'], description: 'Other One Assay' };
    const third = { name: 'Other Two', fileTypes: ['other'], description: 'Other Two Assay' };

    test('with AssayProvider values and selected prop', async () => {
        await act(async () => {
            render(
                <SpecialtyAssayPanel values={[first, second, third]} selected={second} hasPremium onChange={jest.fn} />
            );
        });

        // verify the options for the select
        expect(document.querySelector('select')).toHaveTextContent('Other One');
        const options = document.querySelectorAll('option');
        expect(options.length).toBe(2);
        expect(options[0]).toHaveTextContent('Other One');
        expect(options[1]).toHaveTextContent('Other Two');

        // verify that General is filtered out
        expect(document.body).not.toHaveTextContent('General');

        // verify supported file types for selected
        expect(document.body).toHaveTextContent('xls, xlsx');

        // verify description for selected
        expect(document.body).toHaveTextContent('Other One Assay');

        // verify that the warning is not displayed
        expect(document.body).not.toHaveTextContent('This server does not have any specialty or custom assay types.');

        // verify that the premium info is not displayed
        expect(document.body).not.toHaveTextContent('Premium Feature');
    });

    test('without hasPremium prop', async () => {
        await act(async () => {
            render(
                <SpecialtyAssayPanel
                    values={[first, second, third]}
                    selected={second}
                    onChange={jest.fn}
                    hasPremium={false}
                >
                    <div>child</div>
                </SpecialtyAssayPanel>
            );
        });

        // verify that the premium info is displayed
        expect(document.body).toHaveTextContent('Premium Feature');
        // verify premiumInfoClass
        expect(document.querySelector('.large-margin-top')).toBeInTheDocument();
    });

    test('without options', async () => {
        await act(async () => {
            render(<SpecialtyAssayPanel values={[]} selected={second} onChange={jest.fn} hasPremium />);
        });

        // verify that the warning is displayed
        expect(document.body).toHaveTextContent('This server does not have any specialty or custom assay types.');

        // verify that no select or options are displayed
        expect(document.querySelector('select')).not.toBeInTheDocument();
        expect(document.querySelector('option')).not.toBeInTheDocument();
    });
});
