import { ComponentType } from 'react';

import { User } from '../internal/components/base/models/User';
import { SampleGridButtonProps } from '../internal/components/samples/models';
import { QueryModel } from '../public/QueryModel/QueryModel';
import {RequiresModelAndActions} from "../public/QueryModel/withQueryModels";

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

// Note: this should stay in sync with the eln/src/ReferencingNotebooks.tsx props
interface ReferencingNotebooksComponentProps {
    label: string;
    queryName: string;
    schemaName: string;
    value: number;
}

export type ReferencingNotebooks = ComponentType<ReferencingNotebooksComponentProps>;

export type SampleGridButton = ComponentType<SampleGridButtonProps & RequiresModelAndActions>;
