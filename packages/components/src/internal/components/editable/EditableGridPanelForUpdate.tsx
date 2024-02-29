import React, { FC, useCallback, useEffect, useState } from 'react';
import { Map } from 'immutable';
import { Query } from '@labkey/api';

import { capitalizeFirstChar } from '../../util/utils';

import { getUniqueIdColumnMetadata } from '../entities/utils';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { Alert } from '../base/Alert';
import { WizardNavButtons } from '../buttons/WizardNavButtons';

import { EditorModel, EditableGridLoader } from './models';

import { EditableGridPanel } from './EditableGridPanel';
import { initEditableGridModels } from './actions';
import { applyEditableGridChangesToModels, getUpdatedDataFromEditableGrid } from './utils';
import { EditableGridChange } from './EditableGrid';
import { CommentTextArea } from '../forms/input/CommentTextArea';
import { useDataChangeCommentsRequired } from '../forms/input/useDataChangeCommentsRequired';

interface Props {
    containerFilter?: Query.ContainerFilter;
    getIsDirty?: () => boolean;
    idField: string;
    loader: EditableGridLoader;
    onCancel: () => void;
    onComplete: () => void;
    pluralNoun?: string;
    queryModel: QueryModel;
    selectionData: Map<string, any>;
    setIsDirty?: (isDirty: boolean) => void;
    singularNoun?: string;
    updateRows: (schemaQuery: SchemaQuery, rows: any[], comment: string) => Promise<any>;
}

export const EditableGridPanelForUpdate: FC<Props> = props => {
    const { containerFilter, onCancel, singularNoun, pluralNoun, ...editableGridProps } = props;
    const { idField, loader, queryModel, selectionData, getIsDirty, setIsDirty, updateRows, onComplete, } = editableGridProps;
    const id = loader.id;

    const [dataModels, setDataModels] = useState<QueryModel[]>([new QueryModel({ id, schemaQuery: props.queryModel.schemaQuery })]);
    const [editorModels, setEditorModels] = useState<EditorModel[]>([new EditorModel({ id })]);
    const [error, setError] = useState<string>(undefined);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    // const [loaders, setLoaders] = useState<EditableGridLoader[]>([loader]);
    const [comment, setComment] = useState<string>(undefined);
    const { requiresUserComment } = useDataChangeCommentsRequired();

    const hasValidUserComment = comment?.trim()?.length > 0;

    useEffect(() => {
        (async (): Promise<void> => {
            const models = await initEditableGridModels(dataModels, editorModels, [loader], queryModel);
            setDataModels(models.dataModels);
            setEditorModels(models.editorModels);
        })();
    }, []);

    const onGridChange: EditableGridChange = useCallback(
        (event, editorModelChanges, dataKeys, data, index = 0): void => {
            const modelUpdates = applyEditableGridChangesToModels(
                dataModels,
                editorModels,
                editorModelChanges,
                undefined,
                dataKeys,
                data,
                index
            );
            setDataModels(modelUpdates.dataModels);
            setEditorModels(modelUpdates.editorModels);
            setIsDirty?.(true);
        },
        [dataModels, editorModels, setIsDirty]
    );

    const onSubmit = useCallback((): void => {
        const gridDataAllTabs = [];
        dataModels.forEach((model, ind) => {
            const gridData = getUpdatedDataFromEditableGrid(dataModels, editorModels, idField, selectionData, ind);
            if (gridData) {
                gridDataAllTabs.push(gridData);
            }
        });

        if (gridDataAllTabs.length > 0) {
            setIsSubmitting(true);
            Promise.all(gridDataAllTabs.map(data => updateRows(data.schemaQuery, data.updatedRows, comment)))
                .then(() => {
                    setIsSubmitting(false);
                    onComplete();
                })
                .catch(e => {
                    setError(e?.exception ?? 'There was a problem updating the ' + singularNoun + ' data.');
                    setIsSubmitting(false);
                });
        } else {
            setIsSubmitting(false);
            onComplete();
        }
    }, [comment, dataModels, editorModels, idField, onComplete, selectionData, singularNoun, updateRows]);

    const onCommentChange = useCallback((_comment: string): void => {
        setComment(_comment);
    }, []);

    const firstModel = dataModels[0];
    const columnMetadata = getUniqueIdColumnMetadata(firstModel.queryInfo);

    if (firstModel.isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <>
            <EditableGridPanel
                {...editableGridProps}
                allowAdd={false}
                allowRemove={false}
                bordered
                bsStyle="info"
                columnMetadata={columnMetadata}
                containerFilter={containerFilter}
                editorModel={editorModels}
                forUpdate
                model={dataModels}
                onChange={onGridChange}
                striped
                title={`Edit selected ${pluralNoun}`}
            />
            <Alert>{error}</Alert>
            <WizardNavButtons
                cancel={onCancel}
                canFinish={getIsDirty?.() && (!requiresUserComment || hasValidUserComment)}
                nextStep={onSubmit}
                finish
                isFinishing={isSubmitting}
                isFinishingText="Updating..."
                isFinishedText="Finished Updating"
                finishText={
                    'Finish Updating ' +
                    firstModel.orderedRows.length +
                    ' ' +
                    (firstModel.orderedRows.length === 1
                        ? capitalizeFirstChar(singularNoun)
                        : capitalizeFirstChar(pluralNoun))
                }
            >
                <CommentTextArea
                    actionName="Update"
                    containerClassName="inline-comment"
                    onChange={onCommentChange}
                    requiresUserComment={requiresUserComment}
                    inline
                />
            </WizardNavButtons>
        </>
    );
};

EditableGridPanelForUpdate.defaultProps = {
    singularNoun: 'row',
    pluralNoun: 'rows',
};
