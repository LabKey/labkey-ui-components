import React, { FC, memo, ReactNode } from 'react';
import { List, Map, OrderedMap } from 'immutable';

import { AuditBehaviorTypes, Filter, Query } from '@labkey/api';

import { OperationConfirmationData } from '../internal/components/entities/models';

import { userCanEditStorageData } from '../internal/app/utils';

import {
    NotificationsContextProps,
    withNotificationsContext,
} from '../internal/components/notifications/NotificationsContext';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { SchemaQuery } from '../public/SchemaQuery';
import { User } from '../internal/components/base/models/User';
import { Alert } from '../internal/components/base/Alert';

import { QueryInfo } from '../public/QueryInfo';
import { QueryColumn } from '../public/QueryColumn';
import { SCHEMAS } from '../internal/schemas';
import { deleteRows } from '../internal/query/api';
import { resolveErrorMessage } from '../internal/util/messaging';
import { BulkUpdateForm } from '../internal/components/forms/BulkUpdateForm';

import { SampleOperation } from '../internal/components/samples/constants';
import { getOperationNotPermittedMessage } from '../internal/components/samples/utils';
import {
    DISCARD_CONSUMED_CHECKBOX_FIELD,
    DISCARD_CONSUMED_COMMENT_FIELD,
} from '../internal/components/samples/DiscardConsumedSamplesPanel';

import { SamplesSelectionProviderProps, SamplesSelectionResultProps } from '../internal/components/samples/models';

import { getAltUnitKeys } from '../internal/util/measurement';

import { SamplesSelectionProvider } from './SamplesSelectionContextProvider';

interface OwnProps {
    containerFilter?: Query.ContainerFilter;
    editSelectionInGrid: (updateData: any, dataForSelection: Map<string, any>, dataIdsForSelection: List<any>) => any;
    hasValidMaxSelection: boolean;
    onBulkUpdateComplete: (data: any, submitForEdit) => void;
    onBulkUpdateError: (message: string) => void;
    onCancel: () => void;
    queryModel: QueryModel;
    sampleSetLabel: string;
    updateRows: (schemaQuery: SchemaQuery, rows: any[]) => Promise<void>;
    user: User;
}

type Props = OwnProps & SamplesSelectionProviderProps & SamplesSelectionResultProps & NotificationsContextProps;

interface UpdateAlertProps {
    aliquots: any[];
    editStatusData: OperationConfirmationData;
    numSelections: number;
}

// exported for jest testing
export const SamplesBulkUpdateAlert: FC<UpdateAlertProps> = memo(props => {
    const { aliquots, editStatusData } = props;

    let aliquotsMsg;
    if (aliquots?.length > 0) {
        aliquotsMsg = (
            <>
                Since {aliquots.length} aliquot{aliquots.length > 1 ? 's were' : ' was'} among the selected samples,
                only the aliquot-editable fields are shown below.{' '}
            </>
        );
    }

    if (!aliquotsMsg && (!editStatusData || editStatusData.allAllowed)) return null;

    return (
        <Alert bsStyle="warning">
            {aliquotsMsg}
            {getOperationNotPermittedMessage(SampleOperation.EditMetadata, editStatusData, aliquots)}
        </Alert>
    );
});

interface State {
    discardComment: string;
    shouldDiscard: boolean;
}

const COMMON_SYSTEM_FIELDS_FOR_UPDATE = ['description', 'samplestate', 'storedamount', 'units', 'materialexpdate'];

// exported for jest testing
export class SamplesBulkUpdateFormBase extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            shouldDiscard: false,
            discardComment: undefined,
        };
    }

    getGridSelectionSize = (): number => {
        return this.props.queryModel.selections?.size ?? 0;
    };

    getSelectedNoun = (): string => {
        const { aliquots } = this.props;
        const allAliquots = aliquots && aliquots.length > 0 && aliquots.length === this.getGridSelectionSize();
        return allAliquots ? 'aliquot' : 'sample';
    };

    getQueryFilters(): Record<string, List<Filter.IFilter>> {
        const { sampleTypeDomainFields } = this.props;
        const { metricUnit } = sampleTypeDomainFields;
        if (!metricUnit) return undefined;

        return {
            Units: List<Filter.IFilter>([Filter.create('value', getAltUnitKeys(metricUnit), Filter.Types.IN)]),
        };
    }

    getQueryInfo(): QueryInfo {
        const { aliquots, queryModel, sampleTypeDomainFields } = this.props;
        const originalQueryInfo = queryModel.queryInfo;

        let columns = OrderedMap<string, QueryColumn>();

        // if the selection includes any aliquots, only show pk, aliquot specific and description/samplestate columns
        if (aliquots?.length > 0) {
            originalQueryInfo.columns.forEach((column, key) => {
                const colLc = column.fieldKey.toLowerCase();
                const isAliquotField = sampleTypeDomainFields.aliquotFields.indexOf(colLc) > -1;
                const isIndependentField = sampleTypeDomainFields.independentFields.indexOf(colLc) > -1;
                if (COMMON_SYSTEM_FIELDS_FOR_UPDATE.indexOf(colLc) >= 0 || isAliquotField || isIndependentField)
                    columns = columns.set(key, column);
            });
            originalQueryInfo.getPkCols().forEach(column => {
                columns = columns.set(column.fieldKey.toLowerCase(), column);
            });
        } else {
            // if contains samples, skip aliquot fields
            originalQueryInfo.columns.forEach((column, key) => {
                const fieldKey = column.fieldKey.toLowerCase();
                if (sampleTypeDomainFields.aliquotFields.indexOf(fieldKey) === -1 && fieldKey !== 'name')
                    columns = columns.set(key, column);
            });
        }

        return originalQueryInfo.merge({ columns }) as QueryInfo;
    }

    onComplete = (data: any, submitForEdit: boolean): void => {
        const { onBulkUpdateComplete, sampleItems, createNotification } = this.props;
        const { shouldDiscard, discardComment } = this.state;

        if (shouldDiscard) {
            const discardStorageRows = [];

            Object.keys(sampleItems).forEach(sampleId => {
                const storageItem = sampleItems[sampleId];
                if (storageItem) {
                    discardStorageRows.push({
                        rowId: storageItem.rowId,
                    });
                }
            });

            deleteRows({
                schemaQuery: SCHEMAS.INVENTORY.ITEMS,
                rows: discardStorageRows,
                auditBehavior: AuditBehaviorTypes.DETAILED,
                auditUserComment: discardComment,
            })
                .then(response => {
                    createNotification(
                        'Successfully discard ' +
                            discardStorageRows.length +
                            ' sample' +
                            (discardStorageRows.length > 1 ? 's' : '') +
                            ' from storage.'
                    );
                    onBulkUpdateComplete?.(data, submitForEdit);
                })
                .catch(error => {
                    const errorMsg = resolveErrorMessage(error, 'sample', 'sample', 'discard');
                    createNotification({ message: errorMsg, alertClass: 'danger' });
                });
        } else {
            onBulkUpdateComplete?.(data, submitForEdit);
        }
    };

    onDiscardConsumedPanelChange = (field: string, value: any): boolean => {
        const { sampleItems, user } = this.props;

        if (!sampleItems || Object.keys(sampleItems).length === 0 || !userCanEditStorageData(user)) {
            return false; // if no samples are in storage or the user can't modify storage data, skip showing discard panel
        }

        if (field === DISCARD_CONSUMED_CHECKBOX_FIELD) {
            this.setState({ shouldDiscard: value });
        } else if (field === DISCARD_CONSUMED_COMMENT_FIELD) {
            this.setState({ discardComment: value });
        }

        return true;
    };

    render(): ReactNode {
        const {
            aliquots,
            containerFilter,
            updateRows,
            queryModel,
            hasValidMaxSelection,
            sampleSetLabel,
            onCancel,
            onBulkUpdateError,
            editSelectionInGrid,
            editStatusData,
        } = this.props;
        const selectedNoun = this.getSelectedNoun();

        return (
            <BulkUpdateForm
                containerFilter={containerFilter}
                displayValueFields={['StoredAmount', 'Units']}
                singularNoun={selectedNoun}
                pluralNoun={`${selectedNoun}s`}
                itemLabel={sampleSetLabel}
                queryFilters={this.getQueryFilters()}
                queryInfo={this.getQueryInfo()}
                selectedIds={queryModel.selections}
                viewName={queryModel.viewName}
                onCancel={onCancel}
                onError={onBulkUpdateError}
                onComplete={this.onComplete}
                onSubmitForEdit={editSelectionInGrid}
                requiredColumns={['lsid']}
                sortString={queryModel.sorts.join(',')}
                updateRows={updateRows}
                header={
                    <SamplesBulkUpdateAlert
                        numSelections={this.getGridSelectionSize()}
                        aliquots={aliquots}
                        editStatusData={editStatusData}
                    />
                }
                onAdditionalFormDataChange={this.onDiscardConsumedPanelChange}
            />
        );
    }
}

export const SamplesBulkUpdateForm = SamplesSelectionProvider<OwnProps & SamplesSelectionProviderProps>(
    withNotificationsContext(SamplesBulkUpdateFormBase)
);
