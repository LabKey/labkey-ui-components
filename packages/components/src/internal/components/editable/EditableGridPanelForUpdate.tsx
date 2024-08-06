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
import { initEditorModel } from './actions';
import { applyEditorModelChanges, getUpdatedDataFromEditableGrid } from './utils';
import { EditableGridChange } from './EditableGrid';

const ERROR_ALERT_ID = 'editable-grid-error';

type InheritedEditableGridPanelProps = Omit<
    EditableGridPanelProps,
    'columnMetadata' | 'editorModel' | 'forUpdate' | 'model' | 'onChange'
>;

interface EditableGridPanelForUpdateProps extends InheritedEditableGridPanelProps {
    editStatusData?: OperationConfirmationData;
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
    const [editorModel, setEditorModel] = useState<EditorModel>(undefined);
    const [error, setError] = useState<string>();
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [comment, setComment] = useState<string>();
    const { requiresUserComment } = useDataChangeCommentsRequired();
    const hasValidUserComment = comment?.trim()?.length > 0;
    const notPermittedText = useMemo(
        () => getOperationNotPermittedMessage(editStatusData, singularNoun, pluralNoun),
        [editStatusData, singularNoun, pluralNoun]
    );
    const columnMetadata = useMemo(() => getUniqueIdColumnMetadata(queryModel.queryInfo), [queryModel.queryInfo]);

    useEffect(() => {
        (async (): Promise<void> => {
            try {
                const model = await initEditorModel(queryModel, loader, columnMetadata);
                setEditorModel(model);
            } catch (e) {
                console.error(e);
                setError(resolveErrorMessage(e) ?? 'Failed to initialize editable grid.');
            }
        })();
    }, []);

    const onGridChange: EditableGridChange = useCallback(
        (event, editorModelChanges, index = 0): void => {
            setEditorModel(currentModel => {
                const editorModels = applyEditorModelChanges([currentModel], editorModelChanges, index);
                const [editorModel] = editorModels;
                return editorModel;
            });
            if (EditorModel.isDataChangeEvent(event)) {
                setIsDirty?.(true);
            }
        },
        [setIsDirty]
    );

    const onSubmit = useCallback(async (): Promise<void> => {
        const gridData = getUpdatedDataFromEditableGrid([editorModel], selectionData);

        if (!gridData) {
            onComplete();
            return;
        }

        setIsSubmitting(true);

        try {
            // TODO: I suspect we can skip passing originalRows since getDataForServerUpload appends folder/container
            await updateRows(gridData.schemaQuery, gridData.updatedRows, comment, gridData.originalRows);
            setIsSubmitting(false);
            onComplete();
        } catch (e) {
            setError(e?.exception ?? 'There was a problem updating the ' + singularNoun + ' data.');
            setIsSubmitting(false);
            document.querySelector('#' + ERROR_ALERT_ID)?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [comment, editorModel, onComplete, selectionData, singularNoun, updateRows]);

    const onCommentChange = useCallback((_comment: string): void => {
        setComment(_comment);
    }, []);

    if (editorModel === undefined) {
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
                editorModel={editorModel}
                forUpdate
                model={undefined}
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
                    editorModel.rowCount +
                    ' ' +
                    (editorModel.rowCount === 1 ? capitalizeFirstChar(singularNoun) : capitalizeFirstChar(pluralNoun))
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
