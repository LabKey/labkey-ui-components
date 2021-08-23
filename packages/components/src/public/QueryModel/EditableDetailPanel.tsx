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

interface Props extends RequiresModelAndActions {
    appEditable?: boolean;
    asSubPanel?: boolean;
    auditBehavior?: AuditBehaviorTypes;
    cancelText?: string;
    canUpdate: boolean;
    detailEditRenderer?: DetailRenderer;
    detailHeader?: ReactNode;
    detailRenderer?: DetailRenderer;
    editColumns?: QueryColumn[];
    onEditToggle?: (editing: boolean) => void;
    onUpdate: () => void;
    queryColumns?: QueryColumn[];
    submitText?: string;
    title?: string;
    useEditIcon: boolean;
}

interface State {
    canSubmit: boolean;
    editing: boolean;
    error: string;
    warning: string;
}

export class EditableDetailPanel extends PureComponent<Props, State> {
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

    fileInputRenderer = (col: QueryColumn, data: any): ReactNode => {
        return <FileInput formsy initialValue={data} name={col.fieldKey} queryColumn={col} />;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSubmit = async (values: Record<string, any>): Promise<void> => {
        const { auditBehavior, model, onEditToggle, onUpdate } = this.props;
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

        try {
            await updateRows({ auditBehavior, rows: [updatedValues], schemaQuery: queryInfo.schemaQuery });

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
        } = this.props;
        const { canSubmit, editing, error, warning } = this.state;
        const isEditable = !model.isLoading && model.hasRows && (model.queryInfo?.isAppEditable() || appEditable);

        const panel = (
            <div className={`panel ${editing ? 'panel-info' : 'panel-default'}`}>
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
                    <div className="detail__editing">
                        {error && <Alert>{error}</Alert>}

                        {!editing && (detailHeader ?? null)}

                        <DetailPanel
                            actions={actions}
                            detailEditRenderer={detailEditRenderer}
                            detailRenderer={detailRenderer}
                            editColumns={editColumns}
                            editingMode={editing}
                            model={model}
                            queryColumns={queryColumns}
                            fileInputRenderer={this.fileInputRenderer}
                        />
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
