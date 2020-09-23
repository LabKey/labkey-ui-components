import { SCHEMAS } from '../../..';

export const RUN_PROPERTIES_GRID_ID = 'assay-run-details';

export const RUN_PROPERTIES_REQUIRED_COLUMNS = SCHEMAS.CBMB.concat(
    'Name',
    'RowId',
    'ReplacesRun',
    'ReplacedByRun',
    'DataOutputs',
    'DataOutputs/DataFileUrl',
    'Batch'
).toList();
