import React, { FC, memo, useEffect, useMemo, useState } from 'react';
import { List, Map, OrderedMap } from 'immutable';
import { Alert } from 'react-bootstrap';

import { BulkUpdateForm, QueryColumn, QueryInfo, QueryModel, SampleOperation, SchemaQuery } from '../../..';

import { SamplesSelectionProviderProps, SamplesSelectionResultProps } from './models';
import { OperationConfirmationData } from '../entities/actions';
import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

interface OwnProps {
    queryModel: QueryModel;
    updateRows: (schemaQuery: SchemaQuery, rows: any[]) => Promise<void>;
    hasValidMaxSelection: () => any;
    sampleSetLabel: string;
    onCancel: () => any;
    onBulkUpdateError: (message: string) => any;
    onBulkUpdateComplete: (data: any, submitForEdit) => any;
    editSelectionInGrid: (updateData: any, dataForSelection: Map<string, any>, dataIdsForSelection: List<any>) => any;
}

type Props = OwnProps & SamplesSelectionProviderProps & SamplesSelectionResultProps;

interface UpdateAlertProps {
    aliquots: any[],
    queryModel: QueryModel,
    api?: ComponentsAPIWrapper,
}

// exported for jest testing
export const SamplesBulkUpdateAlert: FC<UpdateAlertProps> = memo( (props) => {
    const { queryModel, aliquots, api } = props;

    const [confirmationData, setConfirmationData] = useState<OperationConfirmationData>(undefined);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            try {
                const data = await api.samples.getSampleOperationConfirmationData(SampleOperation.EditMetadata, queryModel.id);
                setConfirmationData(data);
                setError(false);
            }
            catch {
                setError(true);
            }
        })();
    }, []);

    const gridSelectionSize = useMemo(() => {
        return props.queryModel.selections.size;
    }, [queryModel]);

    let aliquotsMsg = undefined;
    if (aliquots && aliquots.length > 0) {
        if (aliquots.length < gridSelectionSize) {
            aliquotsMsg = (
                <p>
                    {aliquots.length} aliquot{aliquots.length > 1 ? 's were' : ' was'} among the selections. Aliquot
                    data is inherited from the original sample and cannot be updated here.
                </p>
            );
        } else {
            aliquotsMsg =  <p>Aliquot data inherited from the original sample cannot be updated here.</p>
        }
    }

    let notAllowedMsg = undefined;

    if (confirmationData) {
        const noneAllowed = confirmationData.notAllowed.length === gridSelectionSize;
        if (noneAllowed)
            notAllowedMsg = (
                <p>
                    All selected samples have a status that prevents updating of their data without also changing the status.
                </p>
            );

        const onlyAliquots = aliquots?.length === gridSelectionSize;
        const noAliquots = !aliquots || aliquots.length == 0;
        let notAllowed = [];
        if (onlyAliquots || noAliquots) {
            notAllowed = confirmationData.notAllowed;
        } else { // some aliquots, some not
            notAllowed = confirmationData.notAllowed.filter(id => aliquots.indexOf(id) < 0);
        }
        if (notAllowed?.length > 0) {
            notAllowedMsg = (
                <p>
                    The current status of {notAllowed.length} selected sample{notAllowed.length ? 's ' : ' '}
                    prevents the updating of {notAllowed.length == 1 ? 'its' : 'their' } data. Either change the status here or remove these samples from your
                    selection.
                </p>
            );
        }
    } else if (error) {
        notAllowedMsg = (
            <p>
                There was a problem retrieving status data for the selected samples. Please verify the status of the samples.
            </p>
        )
    }

    if (!aliquotsMsg && ! notAllowedMsg)
        return null;

    return (
        <Alert bsStyle="info">
            {aliquotsMsg}
            {notAllowedMsg}
        </Alert>
    );
});

SamplesBulkUpdateAlert.defaultProps = {
    api: getDefaultAPIWrapper(),
}

// Usage:
// export const SamplesBulkUpdateForm = connect<any, any, any>(undefined)(SamplesSelectionProvider(SamplesBulkUpdateFormBase));
export class SamplesBulkUpdateFormBase extends React.PureComponent<Props> {

    getGridSelectionSize = (): number => {
        return this.props.queryModel.selections.size;
    };

    getSelectedNoun = (): string => {
        const { aliquots } = this.props;
        const allAliquots = aliquots && aliquots.length > 0 && aliquots.length === this.getGridSelectionSize();
        return allAliquots ? 'aliquot' : 'sample';
    };

    getQueryInfo(): QueryInfo {
        const { aliquots, queryModel, sampleTypeDomainFields } = this.props;
        const originalQueryInfo = queryModel.queryInfo;

        let columns = OrderedMap<string, QueryColumn>();

        // if all are aliquots, only show pk, aliquot specific and description columns
        if (aliquots && aliquots.length === this.getGridSelectionSize()) {
            originalQueryInfo.columns.forEach((column, key) => {
                const isAliquotField = sampleTypeDomainFields.aliquotFields.indexOf(column.fieldKey.toLowerCase()) > -1;
                if (column.fieldKey.toLowerCase() === 'description' || column.fieldKey.toLowerCase() === 'samplestate' || isAliquotField)
                    columns = columns.set(key, column);
            });
            originalQueryInfo.getPkCols().forEach(column => {
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
            aliquots,
            updateRows,
            queryModel,
            hasValidMaxSelection,
            sampleSetLabel,
            onCancel,
            onBulkUpdateError,
            onBulkUpdateComplete,
            editSelectionInGrid,
        } = this.props;

        return (
            <BulkUpdateForm
                singularNoun={this.getSelectedNoun()}
                pluralNoun={this.getSelectedNoun() + 's'}
                itemLabel={sampleSetLabel}
                queryInfo={this.getQueryInfo()}
                selectedIds={[...queryModel.selections]}
                canSubmitForEdit={hasValidMaxSelection()}
                onCancel={onCancel}
                onError={onBulkUpdateError}
                onComplete={onBulkUpdateComplete}
                onSubmitForEdit={editSelectionInGrid}
                sortString={queryModel.sorts.join(',')}
                updateRows={updateRows}
                header={<SamplesBulkUpdateAlert queryModel={queryModel} aliquots={aliquots}/>}
            />
        );
    }
}
