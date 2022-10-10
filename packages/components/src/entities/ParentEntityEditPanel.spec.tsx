import React from 'react';
import { mount } from 'enzyme';
import PanelBody from 'react-bootstrap/lib/PanelBody';
import { List } from 'immutable';
import { Button } from 'react-bootstrap';

import PanelHeading from 'react-bootstrap/lib/PanelHeading';

import { DetailPanelHeader } from '../internal/components/forms/detail/DetailPanelHeader';
import { initUnitTestMocks } from '../test/testHelperMocks';

import { SchemaQuery } from '../public/SchemaQuery';
import { QueryInfo } from '../public/QueryInfo';

import { Alert } from '../internal/components/base/Alert';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

import { DataClassDataType } from '../internal/components/entities/constants';
import { ParentEntityEditPanel } from './ParentEntityEditPanel';
import { EntityChoice } from '../internal/components/entities/models';

beforeAll(() => {
    initUnitTestMocks();
});

describe('ParentEntityEditPanel', () => {
    const schemaQuery = SchemaQuery.create('samples', 'example');
    const queryInfo = QueryInfo.create({
        schemaName: schemaQuery.schemaName,
        queryName: schemaQuery.queryName,
    });

    test('error state', () => {
        const panel = mount(
            <ParentEntityEditPanel
                canUpdate={false}
                childNounSingular="Testing"
                childSchemaQuery={schemaQuery}
                title="Test 123"
                parentDataTypes={[DataClassDataType]}
            />
        );

        panel.setState({
            childData: {},
            childQueryInfo: queryInfo,
            childName: 'Test',
            error: 'My error message',
            loading: false,
        });

        const header = panel.find(DetailPanelHeader);
        expect(header).toHaveLength(1);
        expect(header.text()).toContain('Test 123');
        expect(panel.find(Alert)).toHaveLength(1);
        expect(panel.find(PanelBody).text()).toContain('Data for Test');
        expect(panel).toMatchSnapshot();
        panel.unmount();
    });

    test('loading state', () => {
        const panel = mount(
            <ParentEntityEditPanel
                canUpdate={false}
                childNounSingular="Testing"
                childSchemaQuery={schemaQuery}
                title="Test 123"
                parentDataTypes={[DataClassDataType]}
            />
        );
        panel.setState({ childName: 'Test', loading: true });
        expect(panel.find(LoadingSpinner)).toHaveLength(1);
        expect(panel).toMatchSnapshot();
        panel.unmount();
    });

    test('editing, no data', () => {
        const panel = mount(
            <ParentEntityEditPanel
                canUpdate={false}
                childNounSingular="Testing"
                childSchemaQuery={schemaQuery}
                title="Test 123"
                parentDataTypes={[DataClassDataType]}
            />
        );
        panel.setState({
            childName: 'Test',
            loading: false,
            editing: true,
            originalParents: List<EntityChoice>(),
            currentParents: List<EntityChoice>(),
        });
        const header = panel.find(DetailPanelHeader);
        expect(header.text()).toContain('Editing Test 123');
        expect(panel.find(Button)).toHaveLength(2);
        expect(panel).toMatchSnapshot();
        panel.unmount();
    });

    test('hideButtons', () => {
        const panel = mount(
            <ParentEntityEditPanel
                canUpdate={true}
                childNounSingular="Testing"
                childSchemaQuery={schemaQuery}
                title="Test 123"
                hideButtons={true}
                parentDataTypes={[DataClassDataType]}
            />
        );
        panel.setState({
            childName: 'Test',
            loading: false,
            editing: true,
            originalParents: List<EntityChoice>(),
            currentParents: List<EntityChoice>(),
        });
        expect(panel.find(Button)).toHaveLength(0);
    });

    test('excludePanelHeader', () => {
        const panel = mount(
            <ParentEntityEditPanel
                canUpdate={true}
                childNounSingular="Testing"
                childSchemaQuery={schemaQuery}
                title="Test 123"
                includePanelHeader={false}
                parentDataTypes={[DataClassDataType]}
            />
        );
        panel.setState({
            childName: 'Test',
            loading: false,
            originalParents: List<EntityChoice>(),
            currentParents: List<EntityChoice>(),
        });
        expect(panel.find(PanelHeading)).toHaveLength(0);
    });
});
