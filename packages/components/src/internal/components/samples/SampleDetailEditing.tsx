import React, { PureComponent } from 'react';
import { fromJS, List } from 'immutable';
import { Alert, Panel } from 'react-bootstrap';

import { AuditBehaviorTypes, Filter } from '@labkey/api';

import {
    caseInsensitive,
    DefaultRenderer,
    deleteRows,
    DetailPanelWithModel,
    getActionErrorMessage,
    LoadingPage,
    QueryConfig,
    resolveErrorMessage,
    SAMPLE_STATUS_REQUIRED_COLUMNS,
    SampleAliquotDetailHeader,
    SampleStateType,
    SchemaQuery,
    SCHEMAS,
    updateRows,
} from '../../..';

import { EditableDetailPanel, EditableDetailPanelProps } from '../../../public/QueryModel/EditableDetailPanel';

import { GroupedSampleFields } from './models';
import { getGroupedSampleDisplayColumns, getGroupedSampleDomainFields, GroupedSampleDisplayColumns } from './actions';
import { IS_ALIQUOT_COL } from './constants';
import { DiscardConsumedSamplesModal } from "./DiscardConsumedSamplesModal";
import { ComponentsAPIWrapper, getDefaultAPIWrapper } from "../../APIWrapper";

interface Props extends EditableDetailPanelProps {
    api?: ComponentsAPIWrapper;
    sampleSet: string;
}

interface State {
    hasError: boolean;
    sampleTypeDomainFields: GroupedSampleFields;
    showDiscardDialog: boolean;
    editing: boolean;
    consumedStatusIds: number[];
    error: string;
    pendingUpdatedValues: any;
}

export class SampleDetailEditing extends PureComponent<Props, State> {
    static defaultProps = {
        api: getDefaultAPIWrapper(),
    };

    state: Readonly<State> = {
        hasError: false,
        sampleTypeDomainFields: undefined,
        showDiscardDialog: false,
        editing: false,
        consumedStatusIds: undefined,
        pendingUpdatedValues: undefined,
        error: undefined,
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
        const { sampleSet, api } = this.props;

        try {
            const sampleTypeDomainFields = await getGroupedSampleDomainFields(sampleSet);
            const statuses = await api.samples.getSampleStatuses();

            let consumedStatusIds = [];
            statuses.forEach(status => {
                if (status.stateType == SampleStateType.Consumed)
                    consumedStatusIds.push(status.rowId);
            })
            this.setState({
                consumedStatusIds
            })

            this.setState({
                sampleTypeDomainFields,
                consumedStatusIds,
                hasError: false
            });
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

    checkCanCompleteSubmit = (row: any) : boolean => {
        const { consumedStatusIds } = this.state;

        if (consumedStatusIds.indexOf(caseInsensitive(row, 'SampleState')) > -1) {
            this.setState({
                pendingUpdatedValues: row,
                showDiscardDialog: true,
                error: undefined,
            });
            return false;
        }

        return true;
    };

    onDismissConsumedSamplesDialog = () : any => {
        this.setState({
            showDiscardDialog: false,
            editing: false,
            error: undefined,
        });
    };

    onConfirmConsumedSamplesDialog = async (shouldDiscard: boolean, comment: string) => {
        const { auditBehavior, containerPath, model, onUpdate } = this.props;
        const { queryInfo } = model;
        const { pendingUpdatedValues } = this.state;

        try {
            await updateRows({
                auditBehavior,
                containerPath,
                rows: [pendingUpdatedValues],
                schemaQuery: queryInfo.schemaQuery,
            });


        }
        catch (error) {
            this.setState({
                error: resolveErrorMessage(error, 'data', undefined, 'update'),
            });
            return;
        }

        if (shouldDiscard) {
            try {
                const sampleItemId = -1; //TODO query for itemId
                await deleteRows({
                    schemaQuery: SCHEMAS.INVENTORY.ITEMS,
                    rows: [{RowId: sampleItemId}],
                    auditBehavior: AuditBehaviorTypes.DETAILED,
                    auditUserComment: comment
                })
            }
            catch (error) {
                this.setState({
                    error: resolveErrorMessage(error, 'data', undefined, 'discard'),
                });
                return;
            }
        }

        onUpdate?.()

        this.setState({
            showDiscardDialog: false,
            editing: false,
            error: undefined,
        });

    };

    onEditToggle = () => {
        this.setState(state => ({ editing: !state.editing}));
    };

    render() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sampleSet, ...editableDetailPanelProps } = this.props;
        const { hasError, sampleTypeDomainFields, showDiscardDialog, editing, error } = this.state;
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
        const root = caseInsensitive(row, 'RootMaterialLSID/Name');
        const isAliquot = !!parent?.value;

        const notInStorage = caseInsensitive(row, 'StorageStatus') === 'Not in storage';

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
                {showDiscardDialog &&
                    <DiscardConsumedSamplesModal
                        consumedSampleCount={1}
                        totalSampleCount={1}
                        onConfirm={this.onConfirmConsumedSamplesDialog}
                        onCancel={this.onDismissConsumedSamplesDialog}
                    />
                }
                <EditableDetailPanel
                    {...editableDetailPanelProps}
                    detailHeader={detailHeader}
                    editColumns={editColumns}
                    queryColumns={displayColumns}
                    title={title ?? (isAliquot ? 'Aliquot Details' : undefined)}
                    canCompleteSubmit={notInStorage ? undefined : this.checkCanCompleteSubmit}
                    onEditToggle={this.onEditToggle}
                    propsEditing={editing}
                    propsError={error}
                    usePropsEditing={!notInStorage}
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
