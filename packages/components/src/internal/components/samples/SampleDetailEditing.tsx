import React, { PureComponent } from 'react';
import { fromJS, List } from 'immutable';
import { Alert, Panel } from 'react-bootstrap';

import { Filter } from '@labkey/api';

import {
    caseInsensitive,
    DefaultRenderer,
    DetailPanelWithModel,
    getActionErrorMessage,
    LoadingPage,
    QueryConfig,
    SAMPLE_STATUS_REQUIRED_COLUMNS,
    SampleAliquotDetailHeader,
    SchemaQuery,
    SCHEMAS,
} from '../../..';

import { EditableDetailPanel, EditableDetailPanelProps } from '../../../public/QueryModel/EditableDetailPanel';

import { GroupedSampleFields } from './models';
import { getGroupedSampleDisplayColumns, getGroupedSampleDomainFields, GroupedSampleDisplayColumns } from './actions';
import { IS_ALIQUOT_COL } from './constants';

interface Props extends EditableDetailPanelProps {
    sampleSet: string;
}

interface State {
    hasError: boolean;
    sampleTypeDomainFields: GroupedSampleFields;
}

export class SampleDetailEditing extends PureComponent<Props, State> {
    state: Readonly<State> = {
        hasError: false,
        sampleTypeDomainFields: undefined,
    };

    componentDidMount(): void {
        this.loadSampleType();
    }

    componentDidUpdate(prevProps: Props): void {
        if (this.props.sampleSet !== prevProps.sampleSet) {
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
        return this.props.model.getRow() ?? {};
    };

    getUpdateDisplayColumns = (isAliquot: boolean): GroupedSampleDisplayColumns => {
        const {
            model: { detailColumns, updateColumns },
        } = this.props;
        const { sampleTypeDomainFields } = this.state;
        return getGroupedSampleDisplayColumns(detailColumns, updateColumns, sampleTypeDomainFields, isAliquot);
    };

    getAliquotRootSampleQueryConfig = (): QueryConfig => {
        const { model, sampleSet } = this.props;

        const rootLsid = caseInsensitive(model.getRow(), 'RootMaterialLSID')?.value;

        return {
            schemaQuery: SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleSet),
            baseFilters: [Filter.create('lsid', rootLsid)],
            requiredColumns: ['Name', 'Description', ...SAMPLE_STATUS_REQUIRED_COLUMNS],
            omittedColumns: [IS_ALIQUOT_COL],
        };
    };

    render() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sampleSet, ...editableDetailPanelProps } = this.props;
        const { hasError, sampleTypeDomainFields } = this.state;
        const { model, title } = editableDetailPanelProps;
        let { detailHeader } = editableDetailPanelProps;

        if (hasError) {
            return (
                <Alert>
                    {getActionErrorMessage('There was a problem loading the sample type details.', 'sample type')}
                </Alert>
            );
        }

        if (!sampleTypeDomainFields || model.isLoading) {
            return <LoadingPage title={title} />;
        }

        const row = this.getRow();

        const parent = caseInsensitive(row, 'AliquotedFromLSID/Name');
        const root = caseInsensitive(row, 'rootmateriallsid/name');
        const isAliquot = !!parent?.value;

        const { aliquotHeaderDisplayColumns, displayColumns, editColumns } = this.getUpdateDisplayColumns(isAliquot);

        if (!detailHeader && isAliquot) {
            detailHeader = (
                <SampleAliquotDetailHeader
                    aliquotHeaderDisplayColumns={List(aliquotHeaderDisplayColumns)}
                    row={fromJS(row)}
                />
            );
        }

        return (
            <>
                <EditableDetailPanel
                    {...editableDetailPanelProps}
                    detailHeader={detailHeader}
                    editColumns={editColumns}
                    queryColumns={displayColumns}
                    title={title ?? (isAliquot ? 'Aliquot Details' : undefined)}
                />
                {isAliquot && (
                    <Panel>
                        <Panel.Heading>Original Sample Details</Panel.Heading>
                        <Panel.Body>
                            {root?.value !== parent?.value && (
                                <table className="table table-responsive table-condensed detail-component--table__fixed sample-aliquots-details-meta-table">
                                    <tbody>
                                        <tr key="originalSample">
                                            <td>Original sample</td>
                                            <td>
                                                <DefaultRenderer data={fromJS(root)} />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                            <DetailPanelWithModel
                                key={root?.value}
                                queryConfig={this.getAliquotRootSampleQueryConfig()}
                            />
                        </Panel.Body>
                    </Panel>
                )}
            </>
        );
    }
}
