import React from 'react';
import { List, Map } from 'immutable';

import { getEditorModel } from '../../global';

import { QueryGridModel, SchemaQuery, WizardNavButtons } from '../../..';
import { capitalizeFirstChar, getUpdatedDataFromGrid } from '../../util/utils';

import { getUniqueIdColumnMetadata } from '../entities/utils';

import { EditableGridPanel } from './EditableGridPanel';

interface Props {
    model: QueryGridModel;
    selectionData: Map<string, any>;
    onCancel: () => any;
    onComplete: () => any;
    updateRows: (schemaQuery: SchemaQuery, rows: any[]) => Promise<any>;
    idField: string;
    readOnlyColumns?: List<string>;
    singularNoun?: string;
    pluralNoun?: string;
}

interface State {
    isSubmitting: boolean;
}

export class EditableGridPanelForUpdate extends React.Component<Props, State> {
    static defaultProps = {
        singularNoun: 'row',
        pluralNoun: 'rows',
    };

    constructor(props) {
        super(props);

        this.state = {
            isSubmitting: false,
        };
    }

    updateDataFromGrid = () => {
        const { model, selectionData, readOnlyColumns, onComplete, updateRows, idField } = this.props;

        const editorModel = getEditorModel(model.getId());
        if (!editorModel) {
            onComplete();
            console.error('Grid does not expose an editor. Ensure the grid is properly initialized for editing.');
        } else {
            // Issue 37842: if we have data for the selection, this was the data that came from the display grid and was used
            // to populate the queryInfoForm.  If we don't have this data, we came directly to the editable grid
            // using values from the display grid to initialize the editable grid model, so we use that.
            const initData = selectionData ? selectionData : model.data;
            const editorData = editorModel.getRawData(model, true, true, readOnlyColumns).toArray();
            const updatedRows = getUpdatedDataFromGrid(initData, editorData, idField, model.queryInfo);

            if (updatedRows.length > 0) {
                this.setState(() => ({ isSubmitting: true }));
            }
            updateRows(model.queryInfo.schemaQuery, updatedRows).then(() => {
                this.setState(() => ({ isSubmitting: false }), onComplete());
            });
        }
    };

    render() {
        const { model, readOnlyColumns, onCancel, singularNoun, pluralNoun } = this.props;
        const { isSubmitting } = this.state;

        return (
            <>
                <EditableGridPanel
                    title={`Edit selected ${pluralNoun}`}
                    bsStyle="info"
                    model={model}
                    readOnlyColumns={readOnlyColumns}
                    allowAdd={false}
                    allowRemove={false}
                    bordered={true}
                    striped={true}
                    forUpdate={true}
                    columnMetadata={getUniqueIdColumnMetadata(model.queryInfo)}
                />
                <WizardNavButtons
                    cancel={onCancel}
                    nextStep={this.updateDataFromGrid}
                    finish={true}
                    isFinishing={isSubmitting}
                    isFinishingText="Updating..."
                    isFinishedText="Finished Updating"
                    finishText={
                        'Finish Updating ' +
                        model.data.size +
                        ' ' +
                        (model.data.size === 1 ? capitalizeFirstChar(singularNoun) : capitalizeFirstChar(pluralNoun))
                    }
                />
            </>
        );
    }
}
