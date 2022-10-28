import { ComponentType } from 'react';

import { User } from '../internal/components/base/models/User';
import { QueryModel } from '../public/QueryModel/QueryModel';

export interface AssaySampleColumnProp {
    fieldKey: string;
    lookupFieldKey: string;
}

interface SampleStorageLocationComponentProps {
    actionChangeCount?: number;
    currentProductId?: string;
    onUpdate?: () => void;
    sampleId: string | number;
    updateAllowed: boolean;
    user: User;
}

export type SampleStorageLocation = ComponentType<SampleStorageLocationComponentProps>;

interface SampleStorageMenuComponentProps {
    onUpdate?: (skipChangeCount?: boolean) => void;
    sampleModel: QueryModel;
}

export type SampleStorageMenu = ComponentType<SampleStorageMenuComponentProps>;

interface ReferencingNotebooksComponentProps {
    label: string;
    queryName: string;
    schemaName: string;
    value: number;
}

export type ReferencingNotebooks = ComponentType<ReferencingNotebooksComponentProps>;
