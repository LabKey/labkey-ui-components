import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Map } from 'immutable';

import { capitalizeFirstChar } from '../../util/utils';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { Alert } from '../base/Alert';
import { WizardNavButtons } from '../buttons/WizardNavButtons';

import { CommentTextArea } from '../forms/input/CommentTextArea';

import { useDataChangeCommentsRequired } from '../forms/input/useDataChangeCommentsRequired';

import { resolveErrorMessage } from '../../util/messaging';

import { OperationConfirmationData } from '../entities/models';

import { getOperationNotPermittedMessage } from '../samples/utils';

import { EditorModel, EditableGridLoader, EditableColumnMetadata } from './models';

import { EditableGridPanel, EditableGridPanelProps } from './EditableGridPanel';
import { initEditorModel } from './actions';
import { incrementRowCountMetric } from './utils';
import { EditableGridChange } from './EditableGrid';

const ERROR_ALERT_ID = 'editable-grid-error';

type InheritedEditableGridPanelProps = Omit<
    EditableGridPanelProps,
    'columnMetadata' | 'editorModel' | 'forUpdate' | 'model' | 'onChange'
>;

interface EditableGridPanelForUpdateProps extends InheritedEditableGridPanelProps {
    columnMetadata?: Map<string, EditableColumnMetadata>;
    editStatusData?: OperationConfirmationData;
    getIsDirty: () => boolean;
    loader: EditableGridLoader;
    metricFeatureArea?: string;
    onCancel: () => void;
    onComplete: () => void;
    pluralNoun: string;
    queryModel: QueryModel;
    selectionData: Map<string, any>;
    setIsDirty: (isDirty: boolean) => void;
    singularNoun: string;
    updateRows: (rows: Array<Record<string, any>>, comment: string) => Promise<any>;
}

// Note: presently this is only used by AssayGridPanel. We should consider moving it to premium and integrating it into
// the AssayGridPanel component.
export const EditableGridPanelForUpdate: FC<EditableGridPanelForUpdateProps> = props => {
    const {
        columnMetadata,
        editStatusData,
        loader,
        metricFeatureArea,
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
        (event, editorModelChanges): void => {
            setEditorModel(currentModel => currentModel.applyChanges(editorModelChanges));

            if (EditorModel.isDataChangeEvent(event)) {
                setIsDirty?.(true);
            }
        },
        [setIsDirty]
    );

    const onSubmit = useCallback(async (): Promise<void> => {
        const updatedRows = editorModel.getUpdatedData(selectionData);
        setIsSubmitting(true);

        try {
            await updateRows(updatedRows, comment);
            incrementRowCountMetric(metricFeatureArea, editorModel.rowCount, true);
            setIsSubmitting(false);
            onComplete();
        } catch (e) {
            setError(e?.exception ?? 'There was a problem updating the ' + singularNoun + ' data.');
            setIsSubmitting(false);
            document.querySelector('#' + ERROR_ALERT_ID)?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [comment, editorModel, metricFeatureArea, onComplete, selectionData, singularNoun, updateRows]);

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
                bsStyle="info"
                title={`Edit selected ${pluralNoun}`}
                {...editableGridProps}
                editorModel={editorModel}
                forUpdate
                onChange={onGridChange}
            />
            <Alert id={ERROR_ALERT_ID}>{error}</Alert>
            <WizardNavButtons
                cancel={onCancel}
                canFinish={getIsDirty?.() && !editorModel.hasErrors && (!requiresUserComment || hasValidUserComment)}
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
