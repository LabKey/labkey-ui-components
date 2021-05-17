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
    auditBehavior: AuditBehaviorTypes;
    canUpdate?: boolean;
    detailEditRenderer?: DetailRenderer;
    detailRenderer?: DetailRenderer;
    onEditToggle?: (isEditing: boolean) => void;
    onUpdate: () => void;
    queryGridModel?: QueryGridModel;
    queryModel?: QueryModel;
    sampleSet: string;
    title: string;
}

interface State {
    hasError: boolean;
    sampleTypeDomainFields: GroupedSampleFields;
}

export class SampleDetailEditing extends PureComponent<Props, State> {
    static defaultProps = {
        canUpdate: false,
    };

    state: Readonly<State> = {
        hasError: false,
        sampleTypeDomainFields: undefined,
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
        const {
            actions,
            auditBehavior,
            canUpdate,
            detailEditRenderer,
            detailRenderer,
            onEditToggle,
            onUpdate,
            queryGridModel,
            queryModel,
            title,
        } = this.props;
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
                    canUpdate={canUpdate}
                    detailEditRenderer={detailEditRenderer}
                    detailHeader={detailHeader}
                    detailRenderer={detailRenderer}
                    editColumns={editColumns.toArray()}
                    model={queryModel}
                    onEditToggle={onEditToggle}
                    onUpdate={onUpdate}
                    queryColumns={displayColumns.toArray()}
                />
            );
        }

        return (
            <DetailEditing
                auditBehavior={auditBehavior}
                canUpdate={canUpdate}
                detailEditRenderer={detailEditRenderer}
                detailHeader={detailHeader}
                detailRenderer={detailRenderer}
                editColumns={editColumns}
                onEditToggle={onEditToggle}
                onUpdate={onUpdate}
                queryColumns={displayColumns}
                queryModel={queryGridModel}
            />
        );
    }
}
