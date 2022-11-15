import React from 'react';

import { ReactWrapper } from 'enzyme';

import { MenuItem } from 'react-bootstrap';

import { QueryColumn, QueryLookup } from '../public/QueryColumn';
import { SAMPLE_TYPE_CONCEPT_URI } from '../internal/components/domainproperties/constants';
import { fromJS } from 'immutable';
import { mountWithAppServerContext } from '../internal/testHelpers';
import { ManageDropdownButton } from '../internal/components/buttons/ManageDropdownButton';
import { DisableableButton } from '../internal/components/buttons/DisableableButton';
import { TEST_USER_AUTHOR, TEST_USER_EDITOR, TEST_USER_READER } from '../internal/userFixtures';
import { SCHEMAS } from '../internal/schemas';
import { SchemaQuery } from '../public/SchemaQuery';
import { makeTestActions, makeTestQueryModel } from '../public/QueryModel/testUtils';
import { ViewInfo } from '../internal/ViewInfo';
import { QueryInfo } from '../public/QueryInfo';

import { AssayDefinitionModel } from '../internal/AssayDefinitionModel';
import { GENERAL_ASSAY_PROVIDER_NAME } from '../internal/components/assay/constants';
import { AssayProtocolModel } from '../internal/components/domainproperties/assay/models';
import { AssayGridButtons } from './AssayGridPanel';

import { AssayImportDataButton } from './AssayButtons';

import { AssayAppContext } from './AssayAppContext';
import { SampleActionsButton } from './SampleActionsButton';

const standardAssayDefinition = AssayDefinitionModel.create({
    id: 1,
    name: 'GPAT 1',
    type: GENERAL_ASSAY_PROVIDER_NAME,
    importAction: 'uploadWizard',
    importController: 'assay',
    links: {
        import: '/labkey/Sample%20Management%202/assay-uploadWizard.view?rowId=1',
    },
});

const assayProtocol = AssayProtocolModel.create({
    protocolId: 1,
    name: 'TestProtocol',
    providerName: 'GPAT',
});

describe('AssayGridButtons', () => {
    const DEFAULT_PROPS = {
        model: makeTestQueryModel(SchemaQuery.create('schema', 'query')),
        actions: makeTestActions(),
        user: TEST_USER_EDITOR,
        canDelete: false,
        canUpdate: false,
        nounPlural: 'samples',
        onDelete: jest.fn(),
        queryName: SCHEMAS.ASSAY_TABLES.RESULTS_QUERYNAME,
        showBulkUpdate: jest.fn(),
        showImport: false,
        toggleEditWithGridUpdate: jest.fn(),
        assayDefinition: standardAssayDefinition,
        protocol: assayProtocol,
    };

    const ASSAY_APP_CONTEXT = {
        requireSampleField: true,
        showProviderName: false,
        jobNotificationProvider: 'test',
        ReferencingNotebooksComponent: () => (<div>Test</div>),
        JobsMenuOptionsComponent: () => (
            <div className="jobs-menu-test">
                {' '}
                <MenuItem className="add-to-job">Add to Job</MenuItem>{' '}
                <MenuItem className="start-a-job">Start a New Job</MenuItem>{' '}
            </div>
        ),
    } as AssayAppContext;

    function validate(
        wrapper: ReactWrapper,
        rendered = false,
        allowDelete = false,
        allowEdit = false,
        showSamples = false,
        showJobs = false,
        showReports = false
    ): void {
        let menuItemCount = 0;
        if (allowEdit) menuItemCount += 2;
        if (allowDelete) menuItemCount += 2;
        if (showSamples) menuItemCount += 3;
        if (showJobs) menuItemCount += 3;
        if (showReports) menuItemCount += 3;

        expect(wrapper.find(AssayImportDataButton)).toHaveLength(0);
        expect(wrapper.find(DisableableButton)).toHaveLength(allowDelete && !allowEdit ? 1 : 0);
        expect(wrapper.find(ManageDropdownButton)).toHaveLength(allowDelete && allowEdit ? 1 : 0);
        expect(wrapper.find(MenuItem)).toHaveLength(menuItemCount);
        expect(wrapper.find(SampleActionsButton)).toHaveLength(showSamples ? 1 : 0);
    }

    test('default props', () => {
        const wrapper = mountWithAppServerContext(
            <AssayGridButtons {...DEFAULT_PROPS} />,
            {
                assay: ASSAY_APP_CONTEXT,
            },
            {
                user: TEST_USER_EDITOR,
            }
        );
        validate(wrapper);
        wrapper.unmount();
    });

    test('can delete and update', () => {
        const wrapper = mountWithAppServerContext(
            <AssayGridButtons {...DEFAULT_PROPS} canDelete canUpdate />,
            {
                assay: ASSAY_APP_CONTEXT,
            },
            {
                user: TEST_USER_EDITOR,
            }
        );
        validate(wrapper, true, true, true);
        wrapper.unmount();
    });

    test('reader', () => {
        const wrapper = mountWithAppServerContext(
            <AssayGridButtons {...DEFAULT_PROPS} canDelete canUpdate />,
            {
                assay: ASSAY_APP_CONTEXT,
            },
            { user: TEST_USER_READER }
        );
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('author', () => {
        const wrapper = mountWithAppServerContext(
            <AssayGridButtons {...DEFAULT_PROPS} canDelete canUpdate />,
            {
                assay: ASSAY_APP_CONTEXT,
            },
            { user: TEST_USER_AUTHOR }
        );
        validate(wrapper, true);
        wrapper.unmount();
    });

    const TEXT_COL = new QueryColumn({
        name: 'textCol',
        fieldKey: 'textCol',
        fieldKeyArray: ['textCol'],
        fieldKeyPath: 'textCol',
        selectable: true,
        title: 'textCol',
    });
    const SAMPLE_COL = new QueryColumn({
        name: 'sampleId',
        fieldKey: 'sampleId',
        fieldKeyArray: ['sampleId'],
        fieldKeyPath: 'sampleId',
        title: 'sampleId',
        selectable: true,
        lookup: QueryLookup.create({ conceptURI: SAMPLE_TYPE_CONCEPT_URI, schemaName: 'samples', queryName: 'test"' }),
    });
    const columns = fromJS({
        textcol: TEXT_COL,
        sampleid: SAMPLE_COL,
    });
    const view = ViewInfo.create({
        name: ViewInfo.DEFAULT_NAME,
        columns: [TEXT_COL, SAMPLE_COL],
    });

    test('showSamplesButton with jobs', () => {
        LABKEY.moduleContext = {
            samplemanagement: {},
            api: { moduleNames: ['samplemanagement'] },
            core: { productFeatures: ['Workflow', 'ELN', 'Assay'] },
        };
        const schemaQuery = SchemaQuery.create('schema', SCHEMAS.ASSAY_TABLES.RESULTS_QUERYNAME);
        const queryInfo = QueryInfo.create({
            schemaName: schemaQuery.getSchema(),
            name: schemaQuery.getQuery(),
            views: fromJS({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
            columns,
        });
        const model = makeTestQueryModel(schemaQuery, queryInfo);
        const wrapper = mountWithAppServerContext(
            <AssayGridButtons {...{ ...DEFAULT_PROPS, model }} canDelete canUpdate />,
            {
                assay: ASSAY_APP_CONTEXT,
            },
            {
                user: TEST_USER_EDITOR,
            }
        );

        validate(wrapper, true, true, true, true, true, true);
    });

    test('showSamplesButton without jobs', () => {
        LABKEY.moduleContext = {
            samplemanagement: {},
            api: { moduleNames: ['samplemanagement'] },
            core: { productFeatures: ['Assay'] },
        };

        const schemaQuery = SchemaQuery.create('schema', SCHEMAS.ASSAY_TABLES.RESULTS_QUERYNAME);
        const queryInfo = QueryInfo.create({
            schemaName: schemaQuery.getSchema(),
            name: schemaQuery.getQuery(),
            views: fromJS({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
            columns,
        });
        const model = makeTestQueryModel(schemaQuery, queryInfo);
        const wrapper = mountWithAppServerContext(
            <AssayGridButtons {...{ ...DEFAULT_PROPS, model }} canDelete canUpdate />,
            {
                assay: ASSAY_APP_CONTEXT,
            },
            {
                user: TEST_USER_EDITOR,
            }
        );
        validate(wrapper, true, true, true, true, false, true);
    });
});
