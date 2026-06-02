/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, ReactNode, useCallback, useMemo, useState } from 'react';
import { fromJS } from 'immutable';
import { Query } from '@labkey/api';

import { Formsy } from '../../internal/components/forms/formsy';
import { DetailPanelHeader } from '../../internal/components/forms/detail/DetailPanelHeader';
import { DetailRenderer } from '../../internal/components/forms/detail/DetailDisplay';
import { extractChanges } from '../../internal/components/forms/detail/utils';
import { FormButtons } from '../../internal/FormButtons';

import { QueryColumn } from '../QueryColumn';
import { FileInput } from '../../internal/components/forms/input/FileInput';
import { resolveErrorMessage } from '../../internal/util/messaging';
import { Alert } from '../../internal/components/base/Alert';

import { useDataChangeCommentsRequired } from '../../internal/components/forms/input/useDataChangeCommentsRequired';
import { CommentTextArea } from '../../internal/components/forms/input/CommentTextArea';

import { useAppContext } from '../../internal/AppContext';

import { QueryModel } from './QueryModel';

import { DetailPanel } from './DetailPanel';
import { InjectedQueryModels, withQueryModels } from './withQueryModels';
import { EDIT_METHOD } from '../../internal/constants';
import { useRouteLeave } from '../../internal/util/RouteLeave';

export interface EditableDetailPanelProps {
    appEditable?: boolean;
    asSubPanel?: boolean;
    canUpdate: boolean;
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    detailEditRenderer?: DetailRenderer;
    detailHeader?: ReactNode;
    detailRenderer?: DetailRenderer;
    disabled?: boolean;
    editColumns?: QueryColumn[];
    internalSpacesWarningFieldKeys?: string[];
    model: QueryModel;
    onAdditionalFormDataChange?: (name: string, value: any) => any;
    onBeforeUpdate?: (row: Record<string, any>) => void;
    onCommentChange?: (comment: string) => void;
    onEditToggle?: (editing: boolean) => void;
    onUpdate: () => void;
    queryColumns?: QueryColumn[];
    submitText?: string;
    title?: string;
}

interface EditingFormProps extends Omit<EditableDetailPanelProps, 'detailHeader' | 'queryColumns'> {
    onCancel: () => void;
}

const EditingFormImpl: FC<EditingFormProps & InjectedQueryModels> = props => {
    const {
        asSubPanel,
        canUpdate,
        containerFilter,
        containerPath,
        detailEditRenderer,
        detailRenderer,
        disabled,
        editColumns,
        internalSpacesWarningFieldKeys,
        onAdditionalFormDataChange,
        onBeforeUpdate,
        onCancel,
        onCommentChange,
        onEditToggle,
        onUpdate,
        queryModels,
        submitText = 'Save',
        title,
    } = props;

    const editModel = queryModels.model;
    const { api } = useAppContext();
    const [_, setIsDirty] = useRouteLeave();
    const [canSubmit, setCanSubmit] = useState<boolean>(false);
    const [error, setError] = useState<string>(undefined);
    const [warning, setWarning] = useState<string>(undefined);
    const [comment, setComment] = useState<string>();
    const { requiresUserComment } = useDataChangeCommentsRequired();
    const hasValidUserComment = comment?.trim()?.length > 0;

    const _onCommentChange = useCallback(
        _comment => {
            setComment(_comment);
            onCommentChange?.(_comment);
        },
        [onCommentChange]
    );

    const disableSubmitButton = useCallback((): void => {
        setCanSubmit(false);
    }, []);

    const enableSubmitButton = useCallback((): void => {
        setCanSubmit(true);
    }, []);

    const handleFormChange = useCallback(
        (_: never, isChanged: boolean): void => {
            setWarning(undefined);
            if (isChanged) setIsDirty(true);
        },
        [setIsDirty]
    );

    const fileInputRenderer = useCallback((col: QueryColumn, data: any): ReactNode => {
        return <FileInput formsy initialValue={data} name={col.fieldKey} queryColumn={col} showLabel={false} />;
    }, []);

    const handleSubmit = useCallback(
        async (values: Record<string, any>): Promise<void> => {
            const { queryInfo } = editModel;
            const row = editModel.getRow();
            const updatedValues = extractChanges(queryInfo, fromJS(editModel.getRow()), values);

            if (Object.keys(updatedValues).length === 0) {
                setCanSubmit(false);
                setError(undefined);
                setWarning('No changes detected. Please update the form and click save.');
                setIsDirty(false);
                return;
            }

            // iterate the set of pkCols for this QueryInfo -- include value from queryData
            queryInfo.getPkCols().forEach(pkCol => {
                const pkVal = row[pkCol.fieldKey]?.value;

                if (pkVal !== undefined && pkVal !== null) {
                    updatedValues[pkCol.fieldKey] = pkVal;
                } else {
                    console.warn('Unable to find value for pkCol "' + pkCol.fieldKey + '"');
                }
            });

            try {
                onBeforeUpdate?.(updatedValues);

                await api.query.updateRows({
                    editMethod: EDIT_METHOD.DETAIL_EDIT,
                    containerPath,
                    rows: [updatedValues],
                    schemaQuery: queryInfo.schemaQuery,
                    auditUserComment: comment,
                });

                setIsDirty(false);
                onCancel();
                onUpdate?.();
                onEditToggle?.(false);
            } catch (e) {
                setError(resolveErrorMessage(e, 'data', undefined, 'update'));
                setWarning(undefined);
            }
        },
        [api.query, comment, containerPath, editModel, onBeforeUpdate, onCancel, onEditToggle, onUpdate, setIsDirty]
    );

    return (
        <Formsy
            onChange={handleFormChange}
            onInvalid={disableSubmitButton}
            onValid={enableSubmitButton}
            onValidSubmit={handleSubmit}
        >
            <div className="panel panel-info">
                <DetailPanelHeader editing isEditable={canUpdate} onClick={onCancel} title={title} warning={warning} />

                <div className="panel-body">
                    <div className="detail__editing">
                        {error && <Alert>{error}</Alert>}

                        <DetailPanel
                            containerFilter={containerFilter}
                            containerPath={containerPath}
                            detailEditRenderer={detailEditRenderer}
                            detailRenderer={detailRenderer}
                            editColumns={editColumns}
                            editingMode
                            fileInputRenderer={fileInputRenderer}
                            internalSpacesWarningFieldKeys={internalSpacesWarningFieldKeys}
                            model={editModel}
                            onAdditionalFormDataChange={onAdditionalFormDataChange}
                        />
                    </div>
                </div>
            </div>

            <FormButtons>
                <button className="btn btn-default" onClick={onCancel} type="button">
                    Cancel
                </button>
                <CommentTextArea
                    actionName="Update"
                    containerClassName="inline-comment"
                    inline
                    onChange={_onCommentChange}
                    requiresUserComment={requiresUserComment}
                />
                <button
                    className="btn btn-success"
                    disabled={!canSubmit || (requiresUserComment && !hasValidUserComment) || disabled}
                    type="submit"
                >
                    {submitText}
                </button>
            </FormButtons>

            {asSubPanel && <div className="panel-divider-padding" />}
        </Formsy>
    );
};

const EditingFormWithModels = withQueryModels<EditingFormProps>(EditingFormImpl);

const EditingForm: FC<EditingFormProps> = props => {
    const { model } = props;
    const queryConfig = useMemo(
        () => ({
            ...model.queryConfig,
            // Issue 46478: Include update columns in request columns to ensure values are available
            requiredColumns: model.requiredColumns.concat(model.updateColumns.map(col => col.fieldKey)),
        }),
        [model]
    );
    const queryConfigs = useMemo(() => ({ model: queryConfig }), [queryConfig]);
    const { keyValue, schemaQuery } = queryConfig;
    const { schemaName, queryName } = schemaQuery;
    const key = `${schemaName}.${queryName}.${keyValue}`;

    return <EditingFormWithModels {...props} autoLoad key={key} queryConfigs={queryConfigs} />;
};

export const EditableDetailPanel: FC<EditableDetailPanelProps> = props => {
    const {
        appEditable,
        canUpdate,
        containerFilter,
        containerPath,
        detailHeader,
        detailRenderer,
        model,
        onEditToggle,
        queryColumns,
        title,
    } = props;

    const [_, setIsDirty] = useRouteLeave();
    const [editing, setEditing] = useState<boolean>(false);

    const toggleEditing = useCallback((): void => {
        setEditing(true);
        setIsDirty(false);
        onEditToggle?.(true);
    }, [onEditToggle, setIsDirty]);

    const handleCancel = useCallback((): void => {
        setEditing(false);
        setIsDirty(false);
        onEditToggle?.(false);
    }, [onEditToggle, setIsDirty]);

    const isEditable = !model.isLoading && model.hasRows && (model.queryInfo?.isAppEditable() || appEditable);

    if (editing) {
        return <EditingForm {...props} onCancel={handleCancel} />;
    }

    return (
        <div className="panel panel-default">
            <DetailPanelHeader
                editing={false}
                isEditable={isEditable && canUpdate}
                onClick={toggleEditing}
                title={title}
            />

            <div className="panel-body">
                <div className="detail__editing">
                    {detailHeader ?? null}

                    <DetailPanel
                        containerFilter={containerFilter}
                        containerPath={containerPath}
                        detailRenderer={detailRenderer}
                        editingMode={false}
                        model={model}
                        queryColumns={queryColumns}
                    />
                </div>
            </div>
        </div>
    );
};

EditableDetailPanel.displayName = 'EditableDetailPanel';
