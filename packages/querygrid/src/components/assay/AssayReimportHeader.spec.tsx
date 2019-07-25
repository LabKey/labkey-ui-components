import * as React from 'react';
import renderer from 'react-test-renderer'

import { AssayDefinitionModel } from '@glass/base';
import { fromJS } from 'immutable';
import { AssayReimportHeader } from './AssayReimportHeader';
import assayDefJSON from '../../test/data/assayDefinitionModel.json';


describe("<AssayReimportHeader/>", () => {
    const assay = AssayDefinitionModel.create(assayDefJSON);

    const runData = fromJS({
        'RowId': {
            'value': 10
        },
        'Name': {
            'value': 'Test Name'
        }
    });
    test("has batch properties", () => {
        const component = <AssayReimportHeader hasBatchProperties={true} assay={assay} replacedRunData={runData}/>
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("no batch properties", () => {
        const component = <AssayReimportHeader hasBatchProperties={false} assay={assay} replacedRunData={runData}/>
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    })
});