import { List, Map, OrderedMap } from 'immutable';
import { ComponentType } from 'react';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { RequiresModelAndActions } from '../public/QueryModel/withQueryModels';
import { SchemaQuery } from '../public/SchemaQuery';
import { ComponentsAPIWrapper } from './APIWrapper';
import { User } from './components/base/models/User';
import { EntityDataType } from './components/entities/models';
import { SampleGridButtonProps } from './components/samples/models';

export interface AssaySampleColumnProp {
    fieldKey: string;
    lookupFieldKey: string;
}

// Note: this should stay in sync with the freezermanager/src/components/SampleStorageLocation.tsx props
interface SampleStorageLocationComponentProps {
    actionChangeCount?: number;
    currentProductId?: string;
    onUpdate?: () => void;
    sampleId: string | number;
    updateAllowed: boolean;
    user: User;
}

export type SampleStorageLocation = ComponentType<SampleStorageLocationComponentProps>;

// Note: this should stay in sync with the freezermanager/src/components/SampleStorageMenu.tsx props
interface SampleStorageMenuComponentProps {
    onUpdate?: (skipChangeCount?: boolean) => void;
    sampleModel: QueryModel;
}

export type SampleStorageMenu = ComponentType<SampleStorageMenuComponentProps>;

export type SampleGridButton = ComponentType<SampleGridButtonProps & RequiresModelAndActions>;

// This props interface is here to prevent circular dependencies between the main package and the entities sub package.
export interface SamplesEditableGridProps {
    api?: ComponentsAPIWrapper;
    combineParentTypes?: boolean;
    displayQueryModel: QueryModel;
    editableGridUpdateData?: OrderedMap<string, any>;
    getConvertedStorageUpdateData?: (
        storageRows: any[],
        sampleItems: {},
        sampleTypeUnit: string,
        noStorageSamples: any[],
        selection: List<any>
    ) => any;
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
