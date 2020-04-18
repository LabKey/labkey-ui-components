import React from 'react';
import renderer from 'react-test-renderer';
import { fromJS, List } from 'immutable';

import { GridColumn } from '../base/Grid';

import { FilePreviewGrid } from './FilePreviewGrid';

const DATA = fromJS([
    {
        col1: 'abc',
        col2: '123',
        col3: '2019-01-01',
    },
    {
        col1: 'def',
        col2: '456',
        col3: '2019-01-02',
    },
    {
        col1: 'ghi',
        col2: '789',
        col3: '2019-01-03',
    },
]);

const COLUMNS = List<GridColumn>([
    new GridColumn({ index: 'col1', title: 'First Column' }),
    new GridColumn({ index: 'col2', title: 'Second Column' }),
    new GridColumn({ index: 'col3', title: 'Third Column' }),
]);

// NOTE that the previewCount prop here is not used by FilePreviewGrid but by FileAttachmentForm

describe('<Cards/>', () => {
    test('no data', () => {
        const component = <FilePreviewGrid data={fromJS([])} previewCount={null} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('one row of data', () => {
        const component = <FilePreviewGrid data={fromJS([{ test: 123 }])} previewCount={null} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('three rows of data', () => {
        const component = <FilePreviewGrid data={DATA} previewCount={null} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom column headers', () => {
        const component = <FilePreviewGrid data={DATA} previewCount={null} columns={COLUMNS} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('error message', () => {
        const component = <FilePreviewGrid data={DATA} previewCount={null} errorMsg="Testing error message" />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom header and info message', () => {
        const component = (
            <FilePreviewGrid data={DATA} previewCount={null} header="Custom Header" infoMsg="Custom info message." />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
