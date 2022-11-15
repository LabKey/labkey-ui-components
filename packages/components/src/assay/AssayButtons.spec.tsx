import React from 'react';

import { Button, MenuItem } from 'react-bootstrap';

import { AssayContextProvider } from '../internal/components/assay/withAssayModels';

import { mountWithServerContext } from '../internal/testHelpers';
import {
    TEST_USER_ASSAY_DESIGNER,
    TEST_USER_EDITOR,
    TEST_USER_EDITOR_WITHOUT_DELETE,
    TEST_USER_PROJECT_ADMIN,
    TEST_USER_QC_ANALYST,
    TEST_USER_READER,
} from '../internal/userFixtures';
import { AssayProtocolModel } from '../internal/components/domainproperties/assay/models';
import { makeTestActions, makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SchemaQuery } from '../public/SchemaQuery';
import { QueryInfo } from '../public/QueryInfo';
import { CreatedModified } from '../internal/components/base/CreatedModified';

import { DisableableMenuItem } from '../internal/components/samples/DisableableMenuItem';
import { AssayDefinitionModel } from '../internal/AssayDefinitionModel';
import { GENERAL_ASSAY_PROVIDER_NAME } from '../internal/components/assay/constants';
import { RequiresPermission } from '../internal/components/base/Permissions';
import { TEST_LKS_STARTER_MODULE_CONTEXT, TEST_LKSM_STARTER_MODULE_CONTEXT } from '../internal/productFixtures';

import { AssayReimportRunButton } from './AssayReimportRunButton';
import {
    AssayDeleteBatchButton,
    AssayDesignHeaderButtons,
    AssayImportDataButton,
    AssayRunDetailHeaderButtons,
    UpdateQCStatesButton,
} from './AssayButtons';
import { fromJS } from 'immutable';

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

const nonStandardAssayDefinition = AssayDefinitionModel.create({
    id: 2,
    name: 'NAb Test',
    type: 'NAb',
    importAction: 'other',
    importController: 'assay',
    links: {
        import: '/labkey/Sample%20Management%202/assay-other.view?rowId=2',
    },
});

const assayProtocol = AssayProtocolModel.create({
    protocolId: 1,
    name: 'TestProtocol',
    providerName: 'GPAT',
});

describe('AssayDeleteBatchButton', () => {
    test('with batchId, can delete', () => {
        const wrapper = mountWithServerContext(
            <AssayContextProvider value={{ assayDefinition: standardAssayDefinition, assayProtocol }}>
                <AssayDeleteBatchButton batchId="1" />
            </AssayContextProvider>,
            {
                user: TEST_USER_EDITOR,
            }
        );
        const menuItem = wrapper.find(MenuItem);
        expect(menuItem).toHaveLength(1);
        expect(menuItem.prop('href')).toBe(
            '/labkey/experiment/deleteSelectedExperiments.view?singleObjectRowId=1&cancelUrl=%2F%23%2Fassays%2FGeneral%2FTestProtocol%2Fbatches%2F1&successUrl=%2F%23%2Fassays%2FGeneral%2FTestProtocol%2Fbatches'
        );
    });

    test('with batchId, cannot delete', () => {
        const wrapper = mountWithServerContext(
            <AssayContextProvider value={{ assayDefinition: standardAssayDefinition, assayProtocol }}>
                <AssayDeleteBatchButton batchId="1" />
            </AssayContextProvider>,
            {
                user: TEST_USER_EDITOR_WITHOUT_DELETE,
            }
        );
        const menuItem = wrapper.find(MenuItem);
        expect(menuItem).toHaveLength(0);
    });

    test('without batchId', () => {
        const wrapper = mountWithServerContext(
            <AssayContextProvider value={{ assayDefinition: standardAssayDefinition, assayProtocol }}>
                <AssayDeleteBatchButton batchId={undefined} />
            </AssayContextProvider>,
            {
                user: TEST_USER_EDITOR,
            }
        );
        const menuItem = wrapper.find(MenuItem);
        expect(menuItem).toHaveLength(0);
    });
});

describe('AssayRunDetailHeaderButtons', () => {
    const runDetailModel = makeTestQueryModel(
        SchemaQuery.create('test', 'query'),
        QueryInfo.create({ schemaName: 'test', name: 'query' }),
        [
            {
                '0': {
                    RowId: { value: 10 },
                    CreatedBy: { displayValue: 'testUser' },
                    Created: { value: '2022-10-31 10:31' },
                },
            },
        ],
        ['0']
    );

    test('allow reimport and delete', () => {
        const wrapper = mountWithServerContext(
            <AssayContextProvider value={{ assayDefinition: standardAssayDefinition, assayProtocol }}>
                <AssayRunDetailHeaderButtons
                    allowReimport
                    allowDelete
                    navigate={jest.fn()}
                    model={runDetailModel}
                    runId="10"
                />
            </AssayContextProvider>
        );
        expect(wrapper.find(CreatedModified)).toHaveLength(1);
        expect(wrapper.find(AssayReimportRunButton)).toHaveLength(1);
        const deleteRunItem = wrapper.find(DisableableMenuItem);
        expect(deleteRunItem).toHaveLength(1);
        expect(deleteRunItem.text()).toBe('Delete Run');
    });

    test('allow reimport but not delete', () => {
        const wrapper = mountWithServerContext(
            <AssayContextProvider value={{ assayDefinition: standardAssayDefinition, assayProtocol }}>
                <AssayRunDetailHeaderButtons
                    allowReimport
                    allowDelete={false}
                    navigate={jest.fn()}
                    model={runDetailModel}
                    runId="10"
                />
            </AssayContextProvider>
        );
        expect(wrapper.find(CreatedModified)).toHaveLength(1);
        expect(wrapper.find(AssayReimportRunButton)).toHaveLength(1);
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(0);
    });

    test('allow delete but not reimport', () => {
        const wrapper = mountWithServerContext(
            <AssayContextProvider value={{ assayDefinition: standardAssayDefinition, assayProtocol }}>
                <AssayRunDetailHeaderButtons
                    allowReimport={false}
                    allowDelete
                    navigate={jest.fn()}
                    model={runDetailModel}
                    runId="10"
                />
            </AssayContextProvider>
        );
        expect(wrapper.find(CreatedModified)).toHaveLength(1);
        expect(wrapper.find(AssayReimportRunButton)).toHaveLength(0);
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(1);
    });
});

describe('AssayImportDataButton', () => {
    test('with insert permission', () => {
        const wrapper = mountWithServerContext(
            <AssayContextProvider value={{ assayDefinition: standardAssayDefinition, assayProtocol }}>
                <AssayImportDataButton />
            </AssayContextProvider>,
            {
                user: TEST_USER_EDITOR,
            }
        );
        const button = wrapper.find(Button);
        expect(button).toHaveLength(1);
        expect(button.text()).toBe('Import Data');
        expect(button.prop('href')).toBe('#/assays/General/GPAT%201/upload?rowId=1');
    });

    test('non-standard assay', () => {
        const wrapper = mountWithServerContext(
            <AssayContextProvider value={{ assayDefinition: nonStandardAssayDefinition, assayProtocol }}>
                <AssayImportDataButton />
            </AssayContextProvider>,
            {
                user: TEST_USER_EDITOR,
            }
        );
        const button = wrapper.find(Button);
        expect(button).toHaveLength(1);
        expect(button.prop('href')).toBe(
            '/labkey/Sample%20Management%202/assay-other.view?rowId=2&returnUrl=/#/assays/NAb/NAb%20Test/runs'
        );
    });

    test('without insert permission', () => {
        const wrapper = mountWithServerContext(
            <AssayContextProvider value={{ assayDefinition: standardAssayDefinition, assayProtocol }}>
                <AssayImportDataButton />
            </AssayContextProvider>,
            {
                user: TEST_USER_READER,
            }
        );
        expect(wrapper.find(Button)).toHaveLength(0);
    });
});

describe('AssayDesignHeaderButtons', () => {
    test('no assay definition', () => {
        const wrapper = mountWithServerContext(
            <AssayContextProvider value={{ assayDefinition: undefined, assayProtocol }}>
                <AssayDesignHeaderButtons navigate={jest.fn()} menuInit={jest.fn()} />
            </AssayContextProvider>,
            {
                user: TEST_USER_EDITOR,
            }
        );
        expect(wrapper.find(RequiresPermission)).toHaveLength(0);
    });

    test('no assay protocol', () => {
        const wrapper = mountWithServerContext(
            <AssayContextProvider value={{ assayDefinition: standardAssayDefinition, assayProtocol: undefined }}>
                <AssayDesignHeaderButtons navigate={jest.fn()} menuInit={jest.fn()} />
            </AssayContextProvider>,
            {
                user: TEST_USER_PROJECT_ADMIN,
            }
        );
        expect(wrapper.find(RequiresPermission)).toHaveLength(0);
    });

    test('all permissions, LKS Starter', () => {
        LABKEY.moduleContext = { ...TEST_LKS_STARTER_MODULE_CONTEXT };
        const wrapper = mountWithServerContext(
            <AssayContextProvider value={{ assayDefinition: standardAssayDefinition, assayProtocol }}>
                <AssayDesignHeaderButtons navigate={jest.fn()} menuInit={jest.fn()} />
            </AssayContextProvider>,
            {
                user: TEST_USER_PROJECT_ADMIN,
            }
        );
        const menuItems = wrapper.find(MenuItem);
        expect(menuItems).toHaveLength(5);
        expect(menuItems.at(0).text()).toBe('Edit Assay Design');
        expect(menuItems.at(1).text()).toBe('Copy Assay Design');
        expect(menuItems.at(2).text()).toBe('Export Assay Design');
        expect(menuItems.at(3).text()).toBe('Delete Assay Design');
        expect(menuItems.at(4).text()).toBe('View Audit History');
    });

    test('all permissions, LKSM Starter', () => {
        LABKEY.moduleContext = { ...TEST_LKSM_STARTER_MODULE_CONTEXT };
        const wrapper = mountWithServerContext(
            <AssayContextProvider value={{ assayDefinition: standardAssayDefinition, assayProtocol }}>
                <AssayDesignHeaderButtons navigate={jest.fn()} menuInit={jest.fn()} />
            </AssayContextProvider>,
            {
                user: TEST_USER_PROJECT_ADMIN,
            }
        );
        const menuItems = wrapper.find(MenuItem);
        expect(menuItems).toHaveLength(4);
        expect(menuItems.at(0).text()).toBe('Edit Assay Design');
        expect(menuItems.at(1).text()).toBe('Copy Assay Design');
        expect(menuItems.at(2).text()).toBe('Delete Assay Design');
        expect(menuItems.at(3).text()).toBe('View Audit History');
    });

    test('read permissions, LKSM Starter', () => {
        const wrapper = mountWithServerContext(
            <AssayContextProvider value={{ assayDefinition: standardAssayDefinition, assayProtocol }}>
                <AssayDesignHeaderButtons navigate={jest.fn()} menuInit={jest.fn()} />
            </AssayContextProvider>,
            {
                user: TEST_USER_READER,
            }
        );
        expect(wrapper.find(MenuItem)).toHaveLength(0);
    });

    test('read assay permissions, LKS Starter', () => {
        LABKEY.moduleContext = { ...TEST_LKS_STARTER_MODULE_CONTEXT };
        const wrapper = mountWithServerContext(
            <AssayContextProvider value={{ assayDefinition: standardAssayDefinition, assayProtocol }}>
                <AssayDesignHeaderButtons navigate={jest.fn()} menuInit={jest.fn()} />
            </AssayContextProvider>,
            {
                user: TEST_USER_READER,
            }
        );
        const menuItems = wrapper.find(MenuItem);
        expect(menuItems).toHaveLength(1);
        expect(menuItems.at(0).text()).toBe('Export Assay Design');
    });

    test('design assay permissions, LKS Starter', () => {
        LABKEY.moduleContext = { ...TEST_LKS_STARTER_MODULE_CONTEXT };
        const wrapper = mountWithServerContext(
            <AssayContextProvider value={{ assayDefinition: standardAssayDefinition, assayProtocol }}>
                <AssayDesignHeaderButtons navigate={jest.fn()} menuInit={jest.fn()} />
            </AssayContextProvider>,
            {
                user: TEST_USER_ASSAY_DESIGNER,
            }
        );
        const menuItems = wrapper.find(MenuItem);
        expect(menuItems).toHaveLength(3);
        expect(menuItems.at(0).text()).toBe('Edit Assay Design');
        expect(menuItems.at(1).text()).toBe('Copy Assay Design');
        expect(menuItems.at(2).text()).toBe('Delete Assay Design');
    });
});

describe('UpdateQCStatesButton', () => {
    const testModel = makeTestQueryModel(SchemaQuery.create("test", "query"));
    const actions = makeTestActions();
    test('not analyst', () => {
        const wrapper = mountWithServerContext(
            <UpdateQCStatesButton
                assayContainer={"test"}
                model={testModel}
                actions={actions}
            />, {
            user: TEST_USER_READER,
        });
        expect(wrapper.find(Button)).toHaveLength(0);
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(0);
    });

    test('as menu item', () => {
        const wrapper = mountWithServerContext(
            <UpdateQCStatesButton
                assayContainer={"test"}
                model={testModel}
                actions={actions}
                asMenuItem={true}
            />,
            {
                user: TEST_USER_QC_ANALYST,
            }
        );
        expect(wrapper.find(Button)).toHaveLength(0);
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(1);
        expect(wrapper.find(DisableableMenuItem).text()).toBe('Update QC States');
    });

    test('disabled, as menu item', () => {
        const wrapper = mountWithServerContext(
            <UpdateQCStatesButton
                assayContainer={"test"}
                model={testModel}
                actions={actions}
                asMenuItem
                disabled
            />, {
                user: TEST_USER_QC_ANALYST,
            });
        expect(wrapper.find(DisableableMenuItem).prop("operationPermitted")).toBe(false);
    });

    test("with single run", () => {
        const wrapper = mountWithServerContext(
            <UpdateQCStatesButton
                assayContainer={"test"}
                model={testModel}
                actions={actions}
                run={fromJS({"RowId": {"value": "1"}})}
                asMenuItem
                disabled
            />, {
                user: TEST_USER_QC_ANALYST,
            });
        expect(wrapper.find(DisableableMenuItem).text()).toBe("Update QC State");
    });

    test('not as menu item', () => {
        const wrapper = mountWithServerContext(
            <UpdateQCStatesButton
                assayContainer={"test"}
                model={testModel}
                actions={actions}
            />, {
            user: TEST_USER_QC_ANALYST,
        });
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find(Button).text()).toBe('Update QC States');
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(0);
    });

    test('disabled, not as menu item', () => {
        const wrapper = mountWithServerContext(
            <UpdateQCStatesButton
                assayContainer={"test"}
                model={testModel}
                actions={actions}
                disabled={true}
            />, {
                user: TEST_USER_QC_ANALYST,
            });
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find(Button).prop("disabled")).toBe(true);
    });
});
