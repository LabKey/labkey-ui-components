import React from 'react';
import renderer from 'react-test-renderer';

import { fromJS } from 'immutable';

import assayDefJSON from '../../../test/data/assayDefinitionModel.json';

import { AssayDefinitionModel } from '../../AssayDefinitionModel';

import { AssayReimportHeader } from './AssayReimportHeader';

describe('<AssayReimportHeader/>', () => {
    const assay = AssayDefinitionModel.create(assayDefJSON);

    const runData = fromJS({
        RowId: 10,
        Name: 'Test Name',
    });
    test('has batch properties', () => {
        const component = (
            <AssayReimportHeader hasBatchProperties={true} assay={assay} replacedRunProperties={runData} />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('no batch properties', () => {
        const component = (
            <AssayReimportHeader hasBatchProperties={false} assay={assay} replacedRunProperties={runData} />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
