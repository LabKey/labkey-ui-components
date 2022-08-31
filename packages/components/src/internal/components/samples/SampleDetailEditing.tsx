import React, { PureComponent } from 'react';
import { fromJS, List } from 'immutable';
import { Alert, Panel } from 'react-bootstrap';

import { AuditBehaviorTypes, Filter } from '@labkey/api';

import { EditableDetailPanel, EditableDetailPanelProps } from '../../../public/QueryModel/EditableDetailPanel';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { withNotificationsContext, NotificationsContextProps } from '../notifications/NotificationsContext';

import { QueryConfig } from '../../../public/QueryModel/QueryModel';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { SCHEMAS } from '../../schemas';
import { deleteRows } from '../../query/api';
import { getActionErrorMessage, resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { caseInsensitive } from '../../util/utils';

import { DefaultRenderer } from '../../renderers/DefaultRenderer';
import { DetailPanelWithModel } from '../../../public/QueryModel/DetailPanel';

import { SampleAliquotDetailHeader } from './SampleAliquotDetailHeader';
import { DISCARD_CONSUMED_CHECKBOX_FIELD, DISCARD_CONSUMED_COMMENT_FIELD } from './DiscardConsumedSamplesPanel';
import { IS_ALIQUOT_COL, SAMPLE_STATUS_REQUIRED_COLUMNS } from './constants';
import { getGroupedSampleDisplayColumns, getGroupedSampleDomainFields, GroupedSampleDisplayColumns } from './actions';
import { GroupedSampleFields } from './models';

interface Props extends EditableDetailPanelProps {
    api?: ComponentsAPIWrapper;
    noun?: string;
    sampleSet: string;
}

interface State {
    discardComment: string;
    hasError: boolean;
    sampleStorageItemId: number;
    sampleTypeDomainFields: GroupedSampleFields;
    shouldDiscard: boolean;
}

class SampleDetailEditingImpl extends PureComponent<Props & NotificationsContextProps, State> {
    static defaultProps = {
        api: getDefaultAPIWrapper(),
    };

    state: Readonly<State> = {
        hasError: false,
        sampleStorageItemId: undefined,
        sampleTypeDomainFields: undefined,
        shouldDiscard: false,
        discardComment: undefined,
    };

    componentDidMount(): void {
        this.init();
    }

    componentDidUpdate(prevProps: Props): void {
        if (this.props.sampleSet !== prevProps.sampleSet) {
            this.setState(
                () => ({
                    sampleTypeDomainFields: undefined,
                    hasError: false,
                }),
                () => {
                    this.init();
                }
            );
        }
    }

    init = async (): Promise<void> => {
        const { sampleSet, api, model } = this.props;

        try {
            const sampleTypeDomainFields = await getGroupedSampleDomainFields(sampleSet);
            const sampleStorageItemId = await api.samples.getSampleStorageId(model.getRowValue('RowId'));

            this.setState({ sampleTypeDomainFields, sampleStorageItemId, hasError: false });
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
        const rootLsid = model.getRowValue('RootMaterialLSID');

        return {
            schemaQuery: SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleSet),
            baseFilters: [Filter.create('lsid', rootLsid)],
            requiredColumns: ['Name', 'Description', ...SAMPLE_STATUS_REQUIRED_COLUMNS],
            omittedColumns: [IS_ALIQUOT_COL],
        };
    };

    handleSave = async () => {
        const { createNotification } = this.props;
        const { shouldDiscard, discardComment, sampleStorageItemId } = this.state;

        this.props.onUpdate?.();

        if (shouldDiscard) {
            try {
                await deleteRows({
                    schemaQuery: SCHEMAS.INVENTORY.ITEMS,
                    rows: [{ RowId: sampleStorageItemId }],
                    auditBehavior: AuditBehaviorTypes.DETAILED,
                    auditUserComment: discardComment,
                });
                createNotification('Successfully updated and discarded sample from storage.', true);
            } catch (error) {
                const errorMsg = resolveErrorMessage(error, 'sample', 'sample', 'discard');
                createNotification({ message: errorMsg, alertClass: 'danger' }, true);
            }
        }
    };

    onDiscardConsumedPanelChange = (field: string, value: any) => {
        const { sampleStorageItemId } = this.state;

        if (!sampleStorageItemId || sampleStorageItemId <= 0) return false; // if sample is not in storage, skip showing discard panel

        if (field === DISCARD_CONSUMED_CHECKBOX_FIELD) this.setState(() => ({ shouldDiscard: value }));
        else if (field === DISCARD_CONSUMED_COMMENT_FIELD) this.setState(() => ({ discardComment: value }));

        return true;
    };

    render() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { noun, sampleSet, ...editableDetailPanelProps } = this.props;
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
            return <LoadingSpinner />;
        }

        const row = this.getRow();
        const parent = caseInsensitive(row, 'AliquotedFromLSID/Name');
        const root = caseInsensitive(row, 'RootMaterialLSID/Name');
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
                    onAdditionalFormDataChange={this.onDiscardConsumedPanelChange}
                    onUpdate={this.handleSave}
                />
                {isAliquot && (
                    <Panel>
                        <Panel.Heading>{`Original ${noun ?? 'Sample'}`} Details</Panel.Heading>
                        <Panel.Body>
                            {root?.value !== parent?.value && (
                                <table className="table table-responsive table-condensed detail-component--table__fixed sample-aliquots-details-meta-table">
                                    <tbody>
                                        <tr key="originalSample">
                                            <td>{`Original ${noun ?? 'sample'}`}</td>
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

export const SampleDetailEditing = withNotificationsContext(SampleDetailEditingImpl);
