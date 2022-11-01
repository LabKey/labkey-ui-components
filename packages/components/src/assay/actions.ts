import { invalidateLineageResults } from '../internal/components/lineage/actions';
import { clearSelected } from '../internal/actions';
import { getServerContext } from '@labkey/api';
import { invalidateQueryDetailsCacheKey } from '../internal/query/api';
import { resolveKey } from '../public/SchemaQuery';

export function onAssayRunChange(schemaName: string) {
    invalidateLineageResults();
    clearSelected(`${schemaName}.Runs`, undefined, undefined, undefined, getServerContext().container.id);
}

export function onAssayDesignChange(schemaName: string) {
    onAssayRunChange(schemaName);
    ['Batches', 'Runs', 'Data'].forEach(queryName => {
        invalidateQueryDetailsCacheKey(resolveKey(schemaName, queryName));
    });
}
