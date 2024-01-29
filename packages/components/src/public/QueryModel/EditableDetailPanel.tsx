import React, { PureComponent, ReactNode } from 'react';
import Formsy from 'formsy-react';
import { fromJS } from 'immutable';
import { AuditBehaviorTypes, Query } from '@labkey/api';

import { DetailPanelHeader } from '../../internal/components/forms/detail/DetailPanelHeader';
import { DetailRenderer } from '../../internal/components/forms/detail/DetailDisplay';
import { extractChanges } from '../../internal/components/forms/detail/utils';
import { FormButtons } from '../../internal/FormButtons';

import { QueryColumn } from '../QueryColumn';
import { FileInput } from '../../internal/components/forms/input/FileInput';
import { resolveErrorMessage } from '../../internal/util/messaging';
import { Alert } from '../../internal/components/base/Alert';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../internal/APIWrapper';

import { QueryModel } from './QueryModel';

import { DetailPanel, DetailPanelWithModel } from './DetailPanel';

export interface EditableDetailPanelProps {
    api?: ComponentsAPIWrapper;
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
    model: QueryModel;
    onAdditionalFormDataChange?: (name: string, value: any) => any;
    onBeforeUpdate?: (row: Record<string, any>) => void;
    onEditToggle?: (editing: boolean) => void;
    onUpdate: () => void;
    queryColumns?: QueryColumn[];
    submitText?: string;
    title?: string;
}

interface State {
    canSubmit: boolean;
    editing: boolean;
    error: string;
    warning: string;
}

export class EditableDetailPanel extends PureComponent<EditableDetailPanelProps, State> {
    static defaultProps = {
        api: getDefaultAPIWrapper(),
        submitText: 'Save',
    };

    state: Readonly<State> = {
        canSubmit: false,
        editing: false,
        error: undefined,
        warning: undefined,
    };

    toggleEditing = (): void => {
        this.setState(
            state => ({ editing: !state.editing, warning: undefined, error: undefined }),
            () => {
                this.props.onEditToggle?.(this.state.editing);
            }
        );
    };

    disableSubmitButton = (): void => {
        this.setState({ canSubmit: false });
    };

    enableSubmitButton = (): void => {
        this.setState({ canSubmit: true });
    };

    handleFormChange = (): void => {
        this.setState({ warning: undefined });
    };

    fileInputRenderer = (col: QueryColumn, data: any): ReactNode => {
        return <FileInput formsy initialValue={data} name={col.fieldKey} queryColumn={col} showLabel={false} />;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSubmit = async (values: Record<string, any>): Promise<void> => {
        const { api, containerPath, model, onBeforeUpdate, onEditToggle, onUpdate } = this.props;
        const { queryInfo } = model;
        const row = model.getRow();
        const updatedValues = extractChanges(queryInfo, fromJS(model.getRow()), values);

        if (Object.keys(updatedValues).length === 0) {
            this.setState({
                canSubmit: false,
                error: undefined,
                warning: 'No changes detected. Please update the form and click save.',
            });

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
                auditBehavior: AuditBehaviorTypes.DETAILED,
                containerPath,
                rows: [updatedValues],
                schemaQuery: queryInfo.schemaQuery,
            });

            this.setState({ editing: false }, () => {
                onUpdate?.(); // eslint-disable-line no-unused-expressions
                onEditToggle?.(false); // eslint-disable-line no-unused-expressions
            });
        } catch (error) {
            this.setState({
                error: resolveErrorMessage(error, 'data', undefined, 'update'),
                warning: undefined,
            });
        }
    };

    render(): ReactNode {
        const {
            appEditable,
            containerFilter,
            containerPath,
            disabled,
            detailEditRenderer,
            detailHeader,
            detailRenderer,
            asSubPanel,
            canUpdate,
            editColumns,
            model,
            queryColumns,
            submitText,
            title,
            onAdditionalFormDataChange,
        } = this.props;
        const { canSubmit, editing, error, warning } = this.state;
        const isEditable = !model.isLoading && model.hasRows && (model.queryInfo?.isAppEditable() || appEditable);

        const panel = (
            <div className={`panel ${editing ? 'panel-info' : 'panel-default'}`}>
                <DetailPanelHeader
                    isEditable={isEditable && canUpdate}
                    editing={editing}
                    title={title}
                    onClick={this.toggleEditing}
                    warning={warning}
                />

                <div className="panel-body">
                    <div className="detail__editing">
                        {error && <Alert>{error}</Alert>}

                        {!editing && (detailHeader ?? null)}

                        {!editing && (
                            <DetailPanel
                                containerFilter={containerFilter}
                                containerPath={containerPath}
                                detailRenderer={detailRenderer}
                                editingMode={false}
                                model={model}
                                queryColumns={queryColumns}
                            />
                        )}

                        {/* When editing load a model that includes the update columns and editing mode rendering */}
                        {editing && (
                            <DetailPanelWithModel
                                containerFilter={containerFilter}
                                containerPath={containerPath}
                                detailEditRenderer={detailEditRenderer}
                                detailRenderer={detailRenderer}
                                editColumns={editColumns}
                                editingMode
                                fileInputRenderer={this.fileInputRenderer}
                                onAdditionalFormDataChange={onAdditionalFormDataChange}
                                queryConfig={{
                                    ...model.queryConfig,
                                    // Issue 46478: Include update columns in request columns to ensure values are available
                                    requiredColumns: model.requiredColumns.concat(
                                        model.updateColumns.map(col => col.fieldKey)
                                    ),
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        );

        if (editing) {
            return (
                <Formsy
                    onChange={this.handleFormChange}
                    onValidSubmit={this.handleSubmit}
                    onValid={this.enableSubmitButton}
                    onInvalid={this.disableSubmitButton}
                >
                    {panel}

                    <FormButtons>
                        <button className="btn btn-default" type="button" onClick={this.toggleEditing}>
                            Cancel
                        </button>
                        <button className="btn btn-success" type="submit" disabled={!canSubmit || disabled}>
                            {submitText}
                        </button>
                    </FormButtons>

                    {asSubPanel && <div className="panel-divider-spacing" />}
                </Formsy>
            );
        }

        return panel;
    }
}
