import { ComponentType } from 'react';
import { Query } from '@labkey/api';

import { SchemaQuery } from '../public/SchemaQuery';

import { TabbedGridPanelProps } from '../public/QueryModel/TabbedGridPanel';

import { User } from './components/base/models/User';
import { EntityDataType } from './components/entities/models';
import { ALIQUOT_FILTER_MODE } from './components/samples/constants';

// This interface stores app-wide settings passed to the LineageEditableGrid
export interface LineageEditableGridProps {
    parentDataTypes: EntityDataType[];
    omitParentAliases?: (schemaQuery: SchemaQuery) => boolean;
}

// This interface stores app-wide settings that get passed to our SamplesEditableGrid. It extends
// LineageEditableGridProps because the settings are passed to SamplesTabbedGridPanel as one object.
export interface SamplesEditableGridProps extends LineageEditableGridProps {
    samplesGridRequiredColumns?: string[];
}
