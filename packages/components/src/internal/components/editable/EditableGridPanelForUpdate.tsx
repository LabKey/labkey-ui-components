import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Map } from 'immutable';

import { capitalizeFirstChar } from '../../util/utils';

import { getUniqueIdColumnMetadata } from '../entities/utils';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { Alert } from '../base/Alert';
import { WizardNavButtons } from '../buttons/WizardNavButtons';

import { CommentTextArea } from '../forms/input/CommentTextArea';

import { useDataChangeCommentsRequired } from '../forms/input/useDataChangeCommentsRequired';

import { resolveErrorMessage } from '../../util/messaging';

import { OperationConfirmationData } from '../entities/models';

import { getOperationNotPermittedMessage } from '../samples/utils';

import { EditorModel, EditableGridLoader } from './models';

import { EditableGridPanel, EditableGridPanelProps } from './EditableGridPanel';
import { initEditableGridModel } from './actions';
import { applyEditableGridChangesToModels, getUpdatedDataFromEditableGrid } from './utils';
import { EditableGridChange } from './EditableGrid';

const ERROR_ALERT_ID = 'editable-grid-error';

type Models = {
    dataModel: QueryModel;
    editorModel: EditorModel;
};

type InheritedEditableGridPanelProps = Omit<
    EditableGridPanelProps,
    'columnMetadata' | 'editorModel' | 'forUpdate' | 'model' | 'onChange'
>;

interface EditableGridPanelForUpdateProps extends InheritedEditableGridPanelProps {
    editStatusData?: OperationConfirmationData;
    idField: string;
    loader: EditableGridLoader;
    onCancel: () => void;
    onComplete: () => void;
    pluralNoun: string;
    queryModel: QueryModel;
    selectionData: Map<string, any>;
    singularNoun: string;
    updateRows: (
        schemaQuery: SchemaQuery,
        rows: Array<Record<string, any>>,
        comment: string,
        originalRows: Record<string, any>
    ) => Promise<any>;
}

export const EditableGridPanelForUpdate: FC<EditableGridPanelForUpdateProps> = props => {
    const {
        editStatusData,
        idField,
        loader,
        onCancel,
        onComplete,
        pluralNoun,
        queryModel,
        selectionData,
        singularNoun,
        updateRows,
        getIsDirty,
        setIsDirty,
        ...editableGridProps
    } = props;
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
    const notPermittedText = useMemo(
        () => getOperationNotPermittedMessage(editStatusData, singularNoun, pluralNoun),
        [editStatusData, singularNoun, pluralNoun]
    );

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
            await updateRows(gridData.schemaQuery, gridData.updatedRows, comment, gridData.originalRows);
            setIsSubmitting(false);
            onComplete();
        } catch (e) {
            setError(e?.exception ?? 'There was a problem updating the ' + singularNoun + ' data.');
            setIsSubmitting(false);
            document.querySelector('#' + ERROR_ALERT_ID)?.scrollIntoView({ behavior: 'smooth' });
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
            {notPermittedText && <Alert bsStyle="warning">{notPermittedText}</Alert>}
            <EditableGridPanel
                allowAdd={false}
                allowRemove={false}
                bsStyle="info"
                title={`Edit selected ${pluralNoun}`}
                {...editableGridProps}
                columnMetadata={columnMetadata}
                editorModel={models.editorModel}
                forUpdate
                model={models.dataModel}
                onChange={onGridChange}
            />
            <Alert id={ERROR_ALERT_ID}>{error}</Alert>
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
