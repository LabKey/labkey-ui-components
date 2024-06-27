import React from 'react';

import { HelpTipRenderer } from './HelpTipRenderer';
import { render } from '@testing-library/react';
import { DOMAIN_FIELD } from './DomainFieldHelpTipContents';
import { QueryColumn } from '../../../public/QueryColumn';

describe('HelpTipRenderer', () => {
    test('SampleStatusLegend', () => {
        render(<HelpTipRenderer type="SampleStatusLegend" />);
        expect(document.querySelector('.fa-spinner')).not.toBeNull();
    });

    test('DomainField', () => {
        const column = new QueryColumn({
            type: 'string',
            phiProtected: true,
            fieldKey: 'Label',
            caption: 'Label',
        });
        render(<HelpTipRenderer type={DOMAIN_FIELD} column={column} />);
        expect(document.querySelector('.sample-status-legend--table')).toBeNull();
        const paragraphs = document.querySelectorAll('p');
        const labels = document.querySelectorAll('strong');
        expect(labels).toHaveLength(1);
        expect(labels.item(0)).toHaveTextContent('Type');
        expect(paragraphs).toHaveLength(2);
        expect(paragraphs.item(0)).toHaveTextContent('Type string');
        expect(paragraphs.item(1)).toHaveTextContent('PHI protected data removed.');
    });

    test('other', () => {
        const { container } = render(<HelpTipRenderer type="Other" />);
        expect(container.firstChild).toBeNull();
    });
});
