import { List, Map, OrderedMap } from 'immutable';
import { ComponentType } from 'react';
import { Query } from '@labkey/api';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { InjectedQueryModels, RequiresModelAndActions } from '../public/QueryModel/withQueryModels';
import { SchemaQuery } from '../public/SchemaQuery';

import { TabbedGridPanelProps } from '../public/QueryModel/TabbedGridPanel';

import { ComponentsAPIWrapper } from './APIWrapper';
import { User } from './components/base/models/User';
import { EntityDataType } from './components/entities/models';
import { SampleGridButtonProps } from './components/samples/models';
import { ALIQUOT_FILTER_MODE } from './components/samples/constants';

export interface SamplesTabbedGridPanelComponentProps {
    afterSampleActionComplete?: (requiresModelReload?: boolean) => void;
    asPanel?: boolean;
    autoLoad?: boolean;
    containerFilter?: Query.ContainerFilter;
    createBtnParentKey?: string;
    createBtnParentType?: string;
    getIsDirty?: () => boolean;
    gridButtonProps?: any;
    gridButtons?: ComponentType<SampleGridButtonProps & RequiresModelAndActions>;
    initialTabId?: string; // use if you have multiple tabs but want to start on something other than the first one
    isAllSamplesTab?: (schemaQuery: SchemaQuery) => boolean;
    modelId?: string; // if a usage wants to just show a single GridPanel, they should provide a modelId prop
    onEditToggle?: (isEditing: boolean) => void;
    onSampleTabSelect?: (modelId: string) => void;
    sampleAliquotType?: ALIQUOT_FILTER_MODE; // the init sampleAliquotType, requires all query models to have completed loading queryInfo prior to rendering of the component
    samplesEditableGridProps?: Partial<SamplesEditableGridProps>;
    setIsDirty?: (isDirty: boolean) => void;
    showLabelOption?: boolean;
    tabRowCounts?: Record<string, number>;
    tabbedGridPanelProps?: Partial<TabbedGridPanelProps>;
    title?: string;
    user: User;
    withTitle?: boolean;
}

export type SamplesTabbedGridPanel = ComponentType<SamplesTabbedGridPanelComponentProps & InjectedQueryModels>;

export interface SampleStorageLocationComponentProps {
    actionChangeCount?: number;
    currentProductId?: string;
    onUpdate?: () => void;
    sampleId: string | number;
    updateAllowed: boolean;
    user: User;
}

export type SampleStorageLocation = ComponentType<SampleStorageLocationComponentProps>;

export interface SampleStorageMenuComponentProps {
    onUpdate?: (skipChangeCount?: boolean) => void;
    sampleModel: QueryModel;
    sampleUser: User;
}

export type SampleStorageMenu = ComponentType<SampleStorageMenuComponentProps>;

export type SampleGridButton = ComponentType<SampleGridButtonProps & RequiresModelAndActions>;

// This props interface is here to prevent circular dependencies between the main package and the entities sub package.
export interface SamplesEditableGridProps {
    api?: ComponentsAPIWrapper;
    combineParentTypes?: boolean;
    editableGridUpdateData?: OrderedMap<string, any>;
    getIsDirty?: () => boolean;
    invalidateSampleQueries?: (schemaQuery: SchemaQuery) => void;
    onGridEditCancel: () => void;
    onGridEditComplete: () => void;
    parentDataTypes: List<EntityDataType>;
    samplesGridOmittedColumns?: List<string>;
    samplesGridRequiredColumns?: string[];
    selectionData: Map<string, any>;
    setIsDirty?: (isDirty: boolean) => void;
    user: User;
}
