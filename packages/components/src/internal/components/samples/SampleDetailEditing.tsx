import React, { PureComponent } from 'react';
import { List, fromJS } from 'immutable';
import { Alert } from 'react-bootstrap';

import { AuditBehaviorTypes } from '@labkey/api';

import {
    Actions,
    caseInsensitive,
    EditableDetailPanel,
    getActionErrorMessage,
    LoadingPage,
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

        if (!props.queryModel) {
            throw new Error('SampleDetailEditing: Requires that a "queryModel" be provided.');
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
        const { queryModel } = this.props;
        return queryModel.getRow() ?? {};
    };

    getUpdateDisplayColumns = (isAliquot: boolean): GroupedSampleDisplayColumns => {
        const {
            queryModel: { detailColumns, updateColumns },
        } = this.props;
        const { sampleTypeDomainFields } = this.state;
        return getGroupedSampleDisplayColumns(detailColumns, updateColumns, sampleTypeDomainFields, isAliquot);
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
            queryModel,
            title,
        } = this.props;
        const { hasError, sampleTypeDomainFields } = this.state;

        if (hasError) {
            return (
                <Alert>
                    {getActionErrorMessage('There was a problem loading the sample type details.', 'sample type')}
                </Alert>
            );
        }

        if (!sampleTypeDomainFields || (queryModel && queryModel.isLoading)) {
            return <LoadingPage title={title} />;
        }

        const row = this.getRow();
        const isAliquot = !!caseInsensitive(row, 'AliquotedFromLSID/Name')?.value;
        const { aliquotHeaderDisplayColumns, displayColumns, editColumns } = this.getUpdateDisplayColumns(isAliquot);
        const detailHeader = isAliquot ? (
            <SampleAliquotDetailHeader
                aliquotHeaderDisplayColumns={List(aliquotHeaderDisplayColumns)}
                row={fromJS(row)}
            />
        ) : null;

        return (
            <EditableDetailPanel
                actions={actions}
                auditBehavior={auditBehavior}
                canUpdate={canUpdate}
                detailEditRenderer={detailEditRenderer}
                detailHeader={detailHeader}
                detailRenderer={detailRenderer}
                editColumns={editColumns}
                model={queryModel}
                onEditToggle={onEditToggle}
                onUpdate={onUpdate}
                queryColumns={displayColumns}
            />
        );
    }
}
