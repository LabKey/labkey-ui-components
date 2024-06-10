import React from 'react';

import { act } from '@testing-library/react';

import { ASSAY_WIZARD_MODEL } from '../../../test/data/constants';
import { AssayUploadTabs } from '../../constants';
import { EditorModel } from '../editable/models';
import { TEST_USER_EDITOR } from '../../userFixtures';

import { withFormSteps, WithFormStepsProps } from '../forms/FormStep';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { LoadingState } from '../../../public/LoadingState';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { Operation } from '../../../public/QueryColumn';

import { AssayDefinitionModel, AssayDomainTypes } from '../../AssayDefinitionModel';
import { QueryInfo } from '../../../public/QueryInfo';
import { TEST_LIMS_STARTER_MODULE_CONTEXT } from '../../productFixtures';

import { AssayWizardModel } from './AssayWizardModel';
import { RunDataPanel } from './RunDataPanel';

const MODEL_ID_NOT_LOADED = 'not loaded';
const MODEL_ID_LOADED = 'loaded';

interface OwnProps {
    showTabs?: boolean;
    wizardModel: AssayWizardModel;
}
type Props = OwnProps & WithFormStepsProps;

class RunDataPanelWrapperImpl extends React.Component<Props, any> {
    render() {
        const { currentStep, showTabs, wizardModel } = this.props;
        const queryInfo = wizardModel.queryInfo;
        const queryModel = new QueryModel({
            id: MODEL_ID_LOADED,
            schemaQuery: queryInfo.schemaQuery,
        }).mutate({
            rows: {},
            orderedRows: [],
            rowsLoadingState: LoadingState.LOADED,
            queryInfoLoadingState: LoadingState.LOADED,
            queryInfo,
        });
        const editorModel = new EditorModel({ id: MODEL_ID_LOADED });

        return (
            <RunDataPanel
                currentStep={currentStep}
                editorModel={editorModel}
                onDataFileChange={jest.fn()}
                onDataFileRemoval={jest.fn()}
                onGridChange={jest.fn()}
                onResultsFileChange={jest.fn()}
                onResultsFileRemoval={jest.fn()}
                onTextChange={jest.fn()}
                operation={Operation.insert}
                queryModel={queryModel}
                showTabs={showTabs}
                wizardModel={wizardModel}
            />
        );
    }
}

const RunDataPanelWrapper = withFormSteps(RunDataPanelWrapperImpl, {
    currentStep: AssayUploadTabs.Files,
    furthestStep: AssayUploadTabs.Files,
    hasDependentSteps: false,
});

describe('RunDataPanel', () => {
    test('loading state based on gridModel', () => {
        const queryModel = new QueryModel({
            id: MODEL_ID_LOADED,
            schemaQuery: ASSAY_WIZARD_MODEL.queryInfo.schemaQuery,
        });
        const editorModel = new EditorModel({ id: MODEL_ID_NOT_LOADED });
        const component = (
            <RunDataPanel
                currentStep={AssayUploadTabs.Files}
                editorModel={editorModel}
                onDataFileChange={jest.fn()}
                onDataFileRemoval={jest.fn()}
                onGridChange={jest.fn()}
                onResultsFileChange={jest.fn()}
                onResultsFileRemoval={jest.fn()}
                onTextChange={jest.fn()}
                operation={Operation.insert}
                queryModel={queryModel}
                wizardModel={ASSAY_WIZARD_MODEL}
            />
        );
        renderWithAppContext(component, { serverContext: { user: TEST_USER_EDITOR } });

        expect(document.querySelector('.panel-heading').textContent).toBe('Results');
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(1);
    });

    test('default props', () => {
        renderWithAppContext(<RunDataPanelWrapper wizardModel={ASSAY_WIZARD_MODEL} />, {
            serverContext: { user: TEST_USER_EDITOR },
        });
        expect(document.querySelector('.panel-heading').textContent).toBe('Results');
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(0);

        expect(document.querySelectorAll('.list-group')).toHaveLength(1);
        const tabs = document.querySelectorAll('.form-step-tab');
        expect(tabs).toHaveLength(2);
        expect(tabs[0].textContent).toBe('Enter Data into Grid');
        expect(tabs[1].textContent).toBe('Import Data from File');

        expect(document.querySelectorAll('.assay-data-file-label')).toHaveLength(0);

        expect(document.querySelectorAll('.file-upload--input')).toHaveLength(1);
        expect(document.querySelectorAll('.file-upload--file-entry-listing')).toHaveLength(1);
        expect(document.querySelectorAll('input[name="fileUpload"]')).toHaveLength(1);
        expect(document.querySelectorAll('input[name="fileUpload1"]')).toHaveLength(0);
    });

    test('showsTabs false', () => {
        renderWithAppContext(<RunDataPanelWrapper showTabs={false} wizardModel={ASSAY_WIZARD_MODEL} />, {
            serverContext: { user: TEST_USER_EDITOR },
        });
        expect(document.querySelectorAll('.list-group')).toHaveLength(0);
        expect(document.querySelectorAll('.form-step-tab')).toHaveLength(0);
    });

    test('assay model with results File field types', async () => {
        LABKEY.moduleContext = TEST_LIMS_STARTER_MODULE_CONTEXT;

        const modelWithFiles = AssayDefinitionModel.create({
            domains: {
                'GPAT 1 Batch Fields': [],
                'GPAT 1 Run Fields': [],
                'GPAT 1 Data Fields': [
                    { inputType: 'file', fieldKey: 'f1', name: 'f1' },
                    { inputType: 'text', fieldKey: 'other', name: 'other' },
                    { inputType: 'file', fieldKey: 'f2', name: 'f2' },
                ],
            },
            domainTypes: {
                Run: 'GPAT 1 Run Fields',
                Batch: 'GPAT 1 Batch Fields',
                Result: 'GPAT 1 Data Fields',
            },
        });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: 'assay',
            name: 'Data',
            columns: [
                { inputType: 'file', fieldKey: 'f1', name: 'f1' },
                { inputType: 'text', fieldKey: 'other', name: 'other' },
                { inputType: 'file', fieldKey: 'f2', name: 'f2' },
            ],
        });
        const wizardModel = new AssayWizardModel({
            isInit: true,
            assayDef: modelWithFiles,
            batchColumns: modelWithFiles.getDomainColumns(AssayDomainTypes.BATCH),
            runColumns: modelWithFiles.getDomainColumns(AssayDomainTypes.RUN),
            queryInfo,
        });

        let container;
        await act(async () => {
            container = renderWithAppContext(<RunDataPanelWrapper wizardModel={wizardModel} />, {
                serverContext: {
                    user: TEST_USER_EDITOR,
                },
            }).container;
        });
        expect(container).toMatchSnapshot();

        const fileDropLabels = document.querySelectorAll('.assay-data-file-label');
        expect(fileDropLabels).toHaveLength(2);
        expect(fileDropLabels[0].textContent).toBe('Results Data ');
        expect(fileDropLabels[1].textContent).toBe('File Fields Data ');

        expect(document.querySelectorAll('.file-upload--input')).toHaveLength(2);
        expect(document.querySelectorAll('.file-upload--file-entry-listing')).toHaveLength(2);
        expect(document.querySelectorAll('input[name="fileUpload"]')).toHaveLength(1);
        expect(document.querySelectorAll('input[name="fileUpload1"]')).toHaveLength(1);
    });
});
