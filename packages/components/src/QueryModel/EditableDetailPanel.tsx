import React, { PureComponent, ReactNode } from 'react';
import Formsy from 'formsy-react';
import { fromJS } from 'immutable';
import { Button } from 'react-bootstrap';
import { AuditBehaviorTypes } from '@labkey/api';

import { DetailPanelHeader } from '../components/forms/detail/DetailPanelHeader';
import { extractChanges } from '../components/forms/detail/utils';

import {
    Alert,
    DetailPanel,
    QueryColumn,
    RequiresModelAndActions,
    resolveDetailEditRenderer,
    resolveDetailRenderer,
    resolveErrorMessage,
    titleRenderer,
    updateRows,
} from '..';

interface EditableDetailPanelProps extends RequiresModelAndActions {
    appEditable?: boolean;
    asSubPanel?: boolean;
    auditBehavior?: AuditBehaviorTypes;
    cancelText?: string;
    canUpdate: boolean;
    onEditToggle?: (editing: boolean) => void;
    onUpdate: () => void;
    queryColumns?: QueryColumn[];
    submitText?: string;
    title?: string;
    useEditIcon: boolean;
}

interface EditableDetailPanelState {
    canSubmit?: boolean;
    editing?: boolean;
    error?: string;
    warning?: string;
}

export class EditableDetailPanel extends PureComponent<EditableDetailPanelProps, EditableDetailPanelState> {
    static defaultProps = {
        useEditIcon: true,
        cancelText: 'Cancel',
        submitText: 'Save',
    };

    state: Readonly<EditableDetailPanelState> = {
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
        this.setState(() => ({ canSubmit: false }));
    };

    enableSubmitButton = (): void => {
        this.setState(() => ({ canSubmit: true }));
    };

    handleFormChange = (): void => {
        this.setState(() => ({ warning: undefined }));
    };

    handleSubmit = (values: Record<string, any>): void => {
        const { auditBehavior, model, onEditToggle, onUpdate } = this.props;
        const { queryInfo } = model;
        const row = model.getRow();
        const updatedValues = extractChanges(queryInfo, fromJS(model.getRow()), values);

        if (Object.keys(updatedValues).length === 0) {
            this.setState(() => ({
                canSubmit: false,
                warning: 'No changes detected. Please update the form and click save.',
                error: undefined,
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

        updateRows({ schemaQuery: queryInfo.schemaQuery, rows: [updatedValues], auditBehavior })
            .then(() => {
                this.setState({ editing: false }, () => {
                    onUpdate?.();
                    onEditToggle?.(false);
                });
            })
            .catch(error => {
                console.error(error);
                this.setState(() => ({
                    warning: undefined,
                    error: resolveErrorMessage(error, 'data', undefined, 'update'),
                }));
            });
    };

    render(): ReactNode {
        const {
            actions,
            appEditable,
            asSubPanel,
            cancelText,
            canUpdate,
            model,
            queryColumns,
            submitText,
            title,
            useEditIcon,
        } = this.props;
        const { canSubmit, editing, error, warning } = this.state;
        const panelClass = editing ? 'panel-info' : 'panel-default';
        const renderer = editing ? resolveDetailEditRenderer : resolveDetailRenderer;
        const isEditable = !model.isLoading && model.hasRows && (model.queryInfo?.isAppEditable() || appEditable);

        const panel = (
            <div className={`panel ${panelClass}`}>
                <div className="panel-heading">
                    <DetailPanelHeader
                        useEditIcon={useEditIcon}
                        isEditable={isEditable}
                        canUpdate={canUpdate}
                        editing={editing}
                        title={title}
                        onClickFn={this.toggleEditing}
                        warning={warning}
                    />
                </div>

                <div className="panel-body">
                    {error && <Alert>{error}</Alert>}

                    <DetailPanel
                        actions={actions}
                        detailRenderer={renderer}
                        editingMode={editing}
                        model={model}
                        queryColumns={editing ? undefined : queryColumns}
                        titleRenderer={editing ? titleRenderer : undefined}
                    />
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
