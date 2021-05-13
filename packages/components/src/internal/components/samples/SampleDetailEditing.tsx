import React, { PureComponent } from 'react';
import { List } from 'immutable';
import { Alert } from 'react-bootstrap';

import { AuditBehaviorTypes } from '@labkey/api';

import { QueryGridModel } from '../../QueryGridModel';

import { DetailEditing, getActionErrorMessage, LoadingPage, QueryColumn, SampleAliquotDetailHeader } from '../../..';

import { DetailRenderer } from '../forms/detail/DetailDisplay';

import { GroupedSampleFields } from './models';
import { getGroupedSampleDisplayColumns, getGroupedSampleDomainFields } from './actions';

interface Props {
    sampleSet: string;
    onUpdate: (skipChangeCount?: boolean) => any;
    canUpdate: (panelName: string) => boolean;
    title: string;
    sampleModel: QueryGridModel;
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

    loadSampleType() {
        const { sampleSet } = this.props;

        getGroupedSampleDomainFields(sampleSet)
            .then(sampleTypeDomainFields => {
                this.setState(() => ({ sampleTypeDomainFields, hasError: false }));
            })
            .catch(reason => {
                this.setState(() => ({ hasError: true }));
            });
    }

    onEditToggle = (isEditing: boolean) => {
        const { onEditToggle } = this.props;
        if (onEditToggle) onEditToggle('details', isEditing);
    };

    canEdit(panelName: string): boolean {
        const { canUpdate } = this.props;
        if (canUpdate) return canUpdate(panelName);
        return false;
    }

    getUpdateDisplayColumns = (isAliquot: boolean): any => {
        const { sampleModel } = this.props;
        const { sampleTypeDomainFields } = this.state;

        const allDisplayColumns = sampleModel.getDetailsDisplayColumns();
        const allUpdateColumns = sampleModel.getUpdateDisplayColumns();

        return getGroupedSampleDisplayColumns(allDisplayColumns, allUpdateColumns, sampleTypeDomainFields, isAliquot);
    };

    renderAliquotDetailHeader = (row: any, aliquotHeaderDisplayColumns: List<QueryColumn>) => {
        return <SampleAliquotDetailHeader row={row} aliquotHeaderDisplayColumns={aliquotHeaderDisplayColumns} />;
    };

    render() {
        const { title, onUpdate, sampleModel, auditBehavior, detailRenderer } = this.props;
        const { hasError, sampleTypeDomainFields } = this.state;

        if (!sampleModel || !sampleModel.isLoaded) {
            return <LoadingPage title={title} />;
        }

        const row = sampleModel.getRow();
        const aliquotedFrom = row.getIn(['AliquotedFromLSID/Name', 'value']);

        const isAliquot = aliquotedFrom != null;

        if (hasError)
            return (
                <Alert>
                    {getActionErrorMessage('There was a problem loading the sample type details.', 'sample type')}
                </Alert>
            );

        if (!sampleTypeDomainFields) return <LoadingPage title={title} />;

        const { displayColumns, editColumns, aliquotHeaderDisplayColumns } = this.getUpdateDisplayColumns(isAliquot);
        return (
            <DetailEditing
                queryModel={sampleModel}
                onUpdate={onUpdate}
                canUpdate={this.canEdit('details')}
                onEditToggle={this.onEditToggle}
                auditBehavior={auditBehavior}
                queryColumns={displayColumns}
                editColumns={editColumns}
                detailHeader={isAliquot ? this.renderAliquotDetailHeader(row, aliquotHeaderDisplayColumns) : undefined}
                detailRenderer={detailRenderer}
            />
        );
    }
}
