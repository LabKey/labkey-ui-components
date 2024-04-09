import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
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
import { initEditableGridModel } from './actions';
import { applyEditableGridChangesToModels, getUpdatedDataFromEditableGrid } from './utils';
import { EditableGridChange } from './EditableGrid';
import { CommentTextArea } from '../forms/input/CommentTextArea';
import { useDataChangeCommentsRequired } from '../forms/input/useDataChangeCommentsRequired';
import { resolveErrorMessage } from '../../util/messaging';
import {QueryColumn} from "../../../public/QueryColumn";

type Models = {
    dataModel: QueryModel;
    editorModel: EditorModel;
};

interface Props {
    containerFilter?: Query.ContainerFilter;
    getIsDirty?: () => boolean;
    idField: string;
    loader: EditableGridLoader;
    onCancel: () => void;
    onComplete: () => void;
    pluralNoun?: string;
    queryModel: QueryModel;
    readOnlyColumns?: string[];
    selectionData: Map<string, any>;
    setIsDirty?: (isDirty: boolean) => void;
    singularNoun?: string;
    updateColumns?: QueryColumn[];
    updateRows: (schemaQuery: SchemaQuery, rows: any[], comment: string) => Promise<any>;
}

export const EditableGridPanelForUpdate: FC<Props> = props => {
    const { containerFilter, onCancel, singularNoun, pluralNoun, ...editableGridProps } = props;
    const { idField, loader, queryModel, selectionData, getIsDirty, setIsDirty, updateRows, onComplete } =
        editableGridProps;
    const id = loader.id;

    const [models, setModels] = useState<Models>(() => ({
        dataModel: new QueryModel({ id, schemaQuery: queryModel.schemaQuery }),
        editorModel: new EditorModel({ id }),
    }));
    const [error, setError] = useState<string>();
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [comment, setComment] = useState<string>();
    const { requiresUserComment } = useDataChangeCommentsRequired();

    const hasValidUserComment = comment?.trim()?.length > 0;

    useEffect(() => {
        (async (): Promise<void> => {
            try {
                const models_ = await initEditableGridModel(models.dataModel, models.editorModel, loader, queryModel);
                setModels(models_);
            } catch (e) {
                console.error(e);
                setError(resolveErrorMessage(e) ?? 'Failed to initialize editable grid.');
            }
        })();
    }, []);

    const onGridChange: EditableGridChange = useCallback(
        (event, editorModelChanges, dataKeys, data, index = 0): void => {
            setModels(_models => {
                const { dataModels, editorModels } = applyEditableGridChangesToModels(
                    [_models.dataModel],
                    [_models.editorModel],
                    editorModelChanges,
                    undefined,
                    dataKeys,
                    data,
                    index
                );
                const [dataModel] = dataModels;
                const [editorModel] = editorModels;
                return { dataModel, editorModel };
            });
            if (EditorModel.isDataChangeEvent(event)) {
                setIsDirty?.(true);
            }
        },
        [setIsDirty]
    );

    const onSubmit = useCallback(async (): Promise<void> => {
        const gridData = getUpdatedDataFromEditableGrid(
            [models.dataModel],
            [models.editorModel],
            idField,
            selectionData
        );

        if (!gridData) {
            onComplete();
            return;
        }

        setIsSubmitting(true);

        try {
            await updateRows(gridData.schemaQuery, gridData.updatedRows, comment);
            setIsSubmitting(false);
            onComplete();
        } catch (e) {
            setError(e?.exception ?? 'There was a problem updating the ' + singularNoun + ' data.');
            setIsSubmitting(false);
        }
    }, [comment, models, idField, onComplete, selectionData, singularNoun, updateRows]);

    const onCommentChange = useCallback((_comment: string): void => {
        setComment(_comment);
    }, []);

    const columnMetadata = useMemo(
        () => getUniqueIdColumnMetadata(models.dataModel.queryInfo),
        [models.dataModel.queryInfo]
    );

    if (models.dataModel.isLoading) {
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
                editorModel={models.editorModel}
                forUpdate
                model={models.dataModel}
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
                    models.dataModel.orderedRows.length +
                    ' ' +
                    (models.dataModel.orderedRows.length === 1
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
