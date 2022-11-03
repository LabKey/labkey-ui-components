import { invalidateLineageResults } from '../internal/components/lineage/actions';
import { clearSelected } from '../internal/actions';
import { getServerContext } from '@labkey/api';
import { invalidateQueryDetailsCache } from '../internal/query/api';
import { SchemaQuery } from '../public/SchemaQuery';

export function onAssayRunChange(schemaName?: string) {
    invalidateLineageResults();
    if (schemaName) {
        clearSelected(`${schemaName}.Runs`, undefined, undefined, undefined, getServerContext().container.id);
    }
}

export function onAssayDesignChange(schemaName: string) {
    onAssayRunChange(schemaName);
    ['Batches', 'Runs', 'Data'].forEach(queryName => {
        invalidateQueryDetailsCache(SchemaQuery.create(schemaName, queryName));
    });
}
