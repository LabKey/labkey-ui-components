import { SchemaQuery } from '../public/SchemaQuery';

import { EntityDataType } from './components/entities/models';

// This interface stores app-wide settings passed to the LineageEditableGrid
export interface LineageEditableGridProps {
    omitParentAliases?: (schemaQuery: SchemaQuery) => boolean;
    parentDataTypes: EntityDataType[];
}

// This interface stores app-wide settings that get passed to our SamplesEditableGrid. It extends
// LineageEditableGridProps because the settings are passed to SamplesTabbedGridPanel as one object.
export interface SamplesEditableGridProps extends LineageEditableGridProps {
    samplesGridRequiredColumns?: string[];
}
