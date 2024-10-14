import { SCHEMAS } from '../../schemas';

export const GENERAL_ASSAY_PROVIDER_NAME = 'General';

// Columns are required for us to render the WorkflowTask in EditableDetails components
export const WORKFLOW_TASK_PROPERTIES_REQUIRED_COLUMNS = ['WorkflowTask', 'WorkflowTask/Run', 'Protocol/RowId'];

export const RUN_PROPERTIES_REQUIRED_COLUMNS = SCHEMAS.CBMB.concat(
    'Name',
    'RowId',
    'ReplacesRun',
    'ReplacedByRun',
    'DataOutputs',
    'DataOutputs/DataFileUrl',
    'Batch',
    'Folder'
)
    .concat(WORKFLOW_TASK_PROPERTIES_REQUIRED_COLUMNS)
    .toList();
