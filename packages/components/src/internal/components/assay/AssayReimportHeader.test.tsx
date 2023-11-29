import React from 'react';
import { render } from '@testing-library/react';

import assayDefJSON from '../../../test/data/assayDefinitionModel.json';

import { AssayDefinitionModel } from '../../AssayDefinitionModel';

import { AssayReimportHeader } from './AssayReimportHeader';

describe('<AssayReimportHeader/>', () => {
    const assay = AssayDefinitionModel.create(assayDefJSON);

    const runData = {
        RowId: { value: 10 },
        Name: { value: 'Test Name' },
    };

    test('has batch properties', () => {
        const component = (
            <AssayReimportHeader hasBatchProperties={true} assay={assay} replacedRunProperties={runData} />
        );
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('no batch properties', () => {
        const component = (
            <AssayReimportHeader hasBatchProperties={false} assay={assay} replacedRunProperties={runData} />
        );
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });
});
