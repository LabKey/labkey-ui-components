import React, { ReactNode } from 'react';
import { List, Map, OrderedMap } from 'immutable';
import { Alert } from 'react-bootstrap';

import { BulkUpdateForm, QueryColumn, QueryGridModel, QueryInfo, QueryModel, SchemaQuery } from '../../..';

import { SamplesSelectionProviderProps, SamplesSelectionResultProps } from './models';

interface OwnProps {
    queryModel?: QueryModel;
    queryGridModel?: QueryGridModel;
    updateRows: (schemaQuery: SchemaQuery, rows: any[]) => Promise<void>;
    hasValidMaxSelection: () => any;
    sampleSetLabel: string;
    onCancel: () => any;
    onBulkUpdateError: (message: string) => any;
    onBulkUpdateComplete: (data: any, submitForEdit) => any;
    editSelectionInGrid: (updateData: any, dataForSelection: Map<string, any>, dataIdsForSelection: List<any>) => any;
}

type Props = OwnProps & SamplesSelectionProviderProps & SamplesSelectionResultProps;

// Usage:
// export const SamplesBulkUpdateForm = connect<any, any, any>(undefined)(SamplesSelectionProvider(SamplesBulkUpdateFormBase));

export class SamplesBulkUpdateFormBase extends React.Component<Props, any> {
    getGridSelectionSize = () => {
        const { queryGridModel, queryModel } = this.props;
        return queryGridModel ? queryGridModel.selectedIds.size : queryModel.selections.size;
    };

    getAliquotHeader() {
        const { aliquots } = this.props;
        if (aliquots && aliquots.length > 0) {
            if (aliquots.length < this.getGridSelectionSize()) {
                return (
                    <Alert bsStyle="info">
                        {aliquots.length} aliquot{aliquots.length > 1 ? 's were' : ' was'} among the selections. Aliquot
                        data is inherited from the original sample and cannot be updated here.
                    </Alert>
                );
            } else {
                return (
                    <Alert bsStyle="info">
                        Aliquot data inherited from the original sample cannot be updated here.
                    </Alert>
                );
            }
        }
    }

    getSelectedNoun = () => {
        const { aliquots } = this.props;
        const allAliquots = aliquots && aliquots.length > 0 && aliquots.length === this.getGridSelectionSize();
        return allAliquots ? 'aliquot' : 'sample';
    };

    getQueryInfo() {
        const { aliquots, queryGridModel, queryModel, sampleTypeDomainFields } = this.props;
        const originalQueryInfo = queryGridModel?.queryInfo ?? queryModel.queryInfo;

        let columns = OrderedMap<string, QueryColumn>();

        // if all are aliquots, only show pk, aliquot specific and description columns
        if (aliquots && aliquots.length === this.getGridSelectionSize()) {
            originalQueryInfo.columns.forEach((column, key) => {
                const isAliquotField = sampleTypeDomainFields.aliquotFields.indexOf(column.fieldKey.toLowerCase()) > -1;
                if (column.fieldKey.toLowerCase() === 'description' || isAliquotField)
                    columns = columns.set(key, column);
            });
            originalQueryInfo.getPkCols().forEach((column, ind) => {
                columns = columns.set(column.fieldKey, column);
            });
        } else {
            // if contains samples, skip aliquot fields
            originalQueryInfo.columns.forEach((column, key) => {
                if (sampleTypeDomainFields.aliquotFields.indexOf(column.fieldKey.toLowerCase()) === -1)
                    columns = columns.set(key, column);
            });
        }

        return originalQueryInfo.merge({ columns }) as QueryInfo;
    }

    render() {
        const {
            updateRows,
            queryGridModel,
            queryModel,
            hasValidMaxSelection,
            sampleSetLabel,
            onCancel,
            onBulkUpdateError,
            onBulkUpdateComplete,
            editSelectionInGrid,
        } = this.props;

        const selectedId = queryGridModel ? queryGridModel.selectedIds.toArray() : [...queryModel.selections];
        const sortString = queryGridModel ? queryGridModel.getSorts() : queryModel.sorts.join(',');
        return (
            <BulkUpdateForm
                singularNoun={this.getSelectedNoun()}
                pluralNoun={this.getSelectedNoun() + 's'}
                itemLabel={sampleSetLabel}
                queryInfo={this.getQueryInfo()}
                selectedIds={selectedId}
                canSubmitForEdit={hasValidMaxSelection()}
                onCancel={onCancel}
                onError={onBulkUpdateError}
                onComplete={onBulkUpdateComplete}
                onSubmitForEdit={editSelectionInGrid}
                sortString={sortString}
                updateRows={updateRows}
                header={this.getAliquotHeader()}
            />
        );
    }
}
