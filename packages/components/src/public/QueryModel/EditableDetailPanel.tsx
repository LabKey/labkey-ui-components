import React, { PureComponent, ReactNode } from 'react';
import Formsy from 'formsy-react';
import { fromJS } from 'immutable';
import { Button } from 'react-bootstrap';
import { AuditBehaviorTypes } from '@labkey/api';

import { DetailPanelHeader } from '../../internal/components/forms/detail/DetailPanelHeader';
import { DetailRenderer } from '../../internal/components/forms/detail/DetailDisplay';
import { extractChanges } from '../../internal/components/forms/detail/utils';

import {
    Alert,
    DetailPanel,
    FileInput,
    QueryColumn,
    RequiresModelAndActions,
    resolveErrorMessage,
    updateRows,
} from '../..';

export interface EditableDetailPanelProps extends RequiresModelAndActions {
    appEditable?: boolean;
    asSubPanel?: boolean;
    auditBehavior?: AuditBehaviorTypes;
    cancelText?: string;
    canUpdate: boolean;
    containerPath?: string;
    detailEditRenderer?: DetailRenderer;
    detailHeader?: ReactNode;
    detailRenderer?: DetailRenderer;
    editColumns?: QueryColumn[];
    onEditToggle?: (editing: boolean) => void;
    onUpdate: () => void;
    queryColumns?: QueryColumn[];
    submitText?: string;
    title?: string;
    useEditIcon?: boolean;
    usePropsEditing?: boolean;
    propsEditing?: boolean;
    propsError?: string;
    canCompleteSubmit?: (row: any) => boolean;
}

interface State {
    canSubmit: boolean;
    editing: boolean;
    error: string;
    warning: string;
}

export class EditableDetailPanel extends PureComponent<EditableDetailPanelProps, State> {
    static defaultProps = {
        useEditIcon: true,
        cancelText: 'Cancel',
        submitText: 'Save',
    };

    state: Readonly<State> = {
        canSubmit: false,
        editing: false,
        error: undefined,
        warning: undefined,
    };

    toggleEditing = (): void => {
        if (!this.props.usePropsEditing) {
            this.setState(
                state => ({ editing: !state.editing, warning: undefined, error: undefined }),
                () => {
                    this.props.onEditToggle?.(this.state.editing);
                }
            );
        }
        else
            this.props.onEditToggle?.(!this.props.propsEditing);

    };

    disableSubmitButton = (): void => {
        this.setState(() => ({ canSubmit: false }));
    };

    enableSubmitButton = (): void => {
        this.setState(() => ({ canSubmit: true }));
    };

    handleFormChange = (): void => {
        this.setState(() => ({ warning: undefined }));
    };

    fileInputRenderer = (col: QueryColumn, data: any): ReactNode => {
        return <FileInput formsy initialValue={data} name={col.fieldKey} queryColumn={col} />;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSubmit = async (values: Record<string, any>): Promise<void> => {
        const { auditBehavior, containerPath, model, onEditToggle, onUpdate, usePropsEditing, canCompleteSubmit } = this.props;
        const { queryInfo } = model;
        const row = model.getRow();
        const updatedValues = extractChanges(queryInfo, fromJS(model.getRow()), values);

        if (Object.keys(updatedValues).length === 0) {
            this.setState(() => ({
                canSubmit: false,
                error: undefined,
                warning: 'No changes detected. Please update the form and click save.',
            }));

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

        if (canCompleteSubmit && !canCompleteSubmit(updatedValues)) {
            return;
        }

        try {
            await updateRows({
                auditBehavior,
                containerPath,
                rows: [updatedValues],
                schemaQuery: queryInfo.schemaQuery,
            });


            if (!usePropsEditing) {
                this.setState({ editing: false }, () => {
                    onUpdate?.(); // eslint-disable-line no-unused-expressions
                    onEditToggle?.(false); // eslint-disable-line no-unused-expressions
                });
            }
            else
                onUpdate?.();

        } catch (error) {
            this.setState({
                error: resolveErrorMessage(error, 'data', undefined, 'update'),
                warning: undefined,
            });
        }
    };

    render(): ReactNode {
        const {
            actions,
            appEditable,
            detailEditRenderer,
            detailHeader,
            detailRenderer,
            asSubPanel,
            cancelText,
            canUpdate,
            editColumns,
            model,
            queryColumns,
            submitText,
            title,
            useEditIcon,
            usePropsEditing,
            propsEditing,
            propsError,
        } = this.props;
        const { canSubmit, editing, error, warning } = this.state;
        const isEditable = !model.isLoading && model.hasRows && (model.queryInfo?.isAppEditable() || appEditable);

        const isEditing = usePropsEditing ? propsEditing : editing;

        const panel = (
            <div className={`panel ${editing ? 'panel-info' : 'panel-default'}`}>
                <div className="panel-heading">
                    <DetailPanelHeader
                        useEditIcon={useEditIcon}
                        isEditable={isEditable}
                        canUpdate={canUpdate}
                        editing={isEditing}
                        title={title}
                        onClickFn={this.toggleEditing}
                        warning={warning}
                    />
                </div>

                <div className="panel-body">
                    <div className="detail__editing">
                        {(error || propsError) && <Alert>{error ?? propsError}</Alert>}

                        {!isEditing && (detailHeader ?? null)}

                        <DetailPanel
                            actions={actions}
                            detailEditRenderer={detailEditRenderer}
                            detailRenderer={detailRenderer}
                            editColumns={editColumns}
                            editingMode={isEditing}
                            model={model}
                            queryColumns={queryColumns}
                            fileInputRenderer={this.fileInputRenderer}
                        />
                    </div>
                </div>
            </div>
        );

        if (isEditing) {
            return (
                <Formsy
                    onChange={this.handleFormChange}
                    onValidSubmit={this.handleSubmit}
                    onValid={this.enableSubmitButton}
                    onInvalid={this.disableSubmitButton}
                >
                    {panel}

                    <div className="full-width bottom-spacing">
                        <Button className="pull-left" onClick={this.toggleEditing}>
                            {cancelText}
                        </Button>
                        <Button className="pull-right" bsStyle="success" type="submit" disabled={!canSubmit}>
                            {submitText}
                        </Button>
                    </div>

                    {asSubPanel && <div className="panel-divider-spacing" />}
                </Formsy>
            );
        }

        return panel;
    }
}
