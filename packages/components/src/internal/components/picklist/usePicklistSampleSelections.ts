import { useCallback } from 'react';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { useAppContext } from '../../AppContext';
import { LoadableState, Loader, useLoadableState } from '../../useLoadableState';

type PicklistSelectionState = LoadableState<number[]>;

/**
 * This hook ensures that the selections you have point to Sample rowIds so they can be easily added to new or existing
 * picklists.
 * @param selectedRowIds the selected rowIds (typically sourced from queryModel.getSelectedIds()). These may be actual
 * sample rowIds, or the rowIds in another table (e.g. assay or picklist)
 * @param sampleFieldKey the sampleFieldKey if the selectedRowIds aren't sample rowIds
 * @param schemaQuery the schemaQuery needed to fetch the SampleIds, required if you pass sampleFieldKey.
 */
export function usePicklistSampleSelections(
    selectedRowIds: number[] | string[] | undefined,
    sampleFieldKey: string | undefined,
    schemaQuery: SchemaQuery | undefined
): PicklistSelectionState {
    if (sampleFieldKey !== undefined && schemaQuery === undefined)
        throw new Error('schemaQuery is required if sampleFieldKey is defined');
    const { api } = useAppContext();
    const loader: Loader<number[]> = useCallback(async () => {
        if (sampleFieldKey !== undefined && schemaQuery !== undefined) {
            return await api.samples.getLookupRowIdsFromSelection(
                schemaQuery.schemaName,
                schemaQuery.queryName,
                selectedRowIds,
                sampleFieldKey
            );
        }

        return selectedRowIds?.map(rowId => parseInt(rowId, 10)) ?? [];
    }, []); // eslint-disable-line react-hooks/exhaustive-deps -- We only want this to load on mount

    return useLoadableState(loader);
}
