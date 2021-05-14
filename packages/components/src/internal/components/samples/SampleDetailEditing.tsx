import React, { PureComponent } from 'react';
import { List, Map } from 'immutable';
import { Alert } from 'react-bootstrap';

import { AuditBehaviorTypes } from '@labkey/api';

import { QueryGridModel } from '../../QueryGridModel';

import {
    Actions,
    caseInsensitive,
    DetailEditing,
    EditableDetailPanel,
    getActionErrorMessage,
    LoadingPage,
    QueryColumn,
    QueryModel,
    SampleAliquotDetailHeader,
} from '../../..';

import { DetailRenderer } from '../forms/detail/DetailDisplay';

import { GroupedSampleFields } from './models';
import { GroupedSampleDisplayColumns, getGroupedSampleDisplayColumns, getGroupedSampleDomainFields } from './actions';

interface Props {
    actions?: Actions;
    sampleSet: string;
    onUpdate: (skipChangeCount?: boolean) => any;
    canUpdate: (panelName: string) => boolean;
    title: string;
    queryModel?: QueryModel;
    queryGridModel?: QueryGridModel;
    auditBehavior: AuditBehaviorTypes;
    onEditToggle?: (panelName: string, isEditing: boolean) => void;
    detailRenderer?: DetailRenderer;
}

interface State {
    sampleTypeDomainFields: GroupedSampleFields;
    hasError: boolean;
}

export class SampleDetailEditing extends PureComponent<Props, State> {
    state: Readonly<State> = {
        sampleTypeDomainFields: undefined,
        hasError: false,
    };

    constructor(props: Props) {
        super(props);

        if (!props.queryModel && !props.queryGridModel) {
            throw new Error(
                'SampleDetailEditing: Requires that either a "queryModel" or "queryGridModel" is provided.'
            );
        } else if (props.queryModel && !props.actions) {
            throw new Error('SampleDetailEditing: If a "queryModel" is specified, then "actions" are required.');
        }
    }

    componentDidMount(): void {
        this.loadSampleType();
    }

    componentDidUpdate(prevProps: Props): void {
        const { sampleSet } = this.props;

        if (sampleSet !== prevProps.sampleSet) {
            this.setState(
                () => ({
                    sampleTypeDomainFields: undefined,
                    hasError: false,
                }),
                () => {
                    this.loadSampleType();
                }
            );
        }
    }

    loadSampleType = async (): Promise<void> => {
        const { sampleSet } = this.props;

        try {
            const sampleTypeDomainFields = await getGroupedSampleDomainFields(sampleSet);
            this.setState({ sampleTypeDomainFields, hasError: false });
        } catch (e) {
            this.setState({ hasError: true });
        }
    };

    onEditToggle = (isEditing: boolean): void => {
        this.props.onEditToggle?.('details', isEditing);
    };

    canEdit = (): boolean => {
        this.props.canUpdate?.('details');
        return false;
    };

    getRow = (): Record<string, any> => {
        const { queryGridModel, queryModel } = this.props;

        if (queryModel) {
            return queryModel.getRow();
        } else {
            return queryGridModel.getRow().toJS();
        }
    };

    getUpdateDisplayColumns = (isAliquot: boolean): GroupedSampleDisplayColumns => {
        const { queryGridModel, queryModel } = this.props;
        const { sampleTypeDomainFields } = this.state;

        let displayColumns: List<QueryColumn>;
        let updateColumns: List<QueryColumn>;

        if (queryModel) {
            displayColumns = List(queryModel.detailColumns);
            updateColumns = List(queryModel.updateColumns);
        } else {
            displayColumns = queryGridModel.getDetailsDisplayColumns();
            updateColumns = queryGridModel.getUpdateDisplayColumns();
        }

        return getGroupedSampleDisplayColumns(displayColumns, updateColumns, sampleTypeDomainFields, isAliquot);
    };

    render() {
        const { actions, title, onUpdate, queryGridModel, queryModel, auditBehavior, detailRenderer } = this.props;
        const { hasError, sampleTypeDomainFields } = this.state;

        if (
            !sampleTypeDomainFields ||
            (queryModel && queryModel.isLoading) ||
            (queryGridModel && !queryGridModel.isLoaded)
        ) {
            return <LoadingPage title={title} />;
        }

        if (hasError) {
            return (
                <Alert>
                    {getActionErrorMessage('There was a problem loading the sample type details.', 'sample type')}
                </Alert>
            );
        }

        const row = this.getRow();
        const isAliquot = !!caseInsensitive(row, 'AliquotedFromLSID/Name')?.value;
        const { aliquotHeaderDisplayColumns, displayColumns, editColumns } = this.getUpdateDisplayColumns(isAliquot);
        const detailHeader = isAliquot ? (
            <SampleAliquotDetailHeader aliquotHeaderDisplayColumns={aliquotHeaderDisplayColumns} row={Map(row)} />
        ) : null;

        if (queryModel) {
            return (
                <EditableDetailPanel
                    actions={actions}
                    auditBehavior={auditBehavior}
                    canUpdate={this.canEdit()}
                    detailHeader={detailHeader}
                    detailRenderer={detailRenderer}
                    editColumns={editColumns.toArray()}
                    model={queryModel}
                    onEditToggle={this.onEditToggle}
                    onUpdate={onUpdate}
                    queryColumns={displayColumns.toArray()}
                />
            );
        }

        return (
            <DetailEditing
                auditBehavior={auditBehavior}
                canUpdate={this.canEdit()}
                detailHeader={detailHeader}
                detailRenderer={detailRenderer}
                editColumns={editColumns}
                onEditToggle={this.onEditToggle}
                onUpdate={onUpdate}
                queryColumns={displayColumns}
                queryModel={queryGridModel}
            />
        );
    }
}
