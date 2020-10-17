import { Record } from 'immutable';
import { Container as IContainer } from '@labkey/api';

const defaultContainer: Partial<IContainer> = {
    activeModules: [],
    folderType: '',
    hasRestrictedActiveModule: false,
    id: '',
    isContainerTab: false,
    isWorkbook: false,
    name: '',
    parentId: '',
    parentPath: '',
    path: '',
    sortOrder: 0,
    title: '',
    type: '',
};

/**
 * Model for org.labkey.api.data.Container as returned by Container.toJSON()
 */
export class Container extends Record(defaultContainer) implements Partial<IContainer> {
    activeModules: string[];
    folderType: string;
    hasRestrictedActiveModule: boolean;
    id: string;
    isContainerTab: boolean;
    isWorkbook: boolean;
    name: string;
    parentId: string;
    parentPath: string;
    path: string;
    sortOrder: number;
    title: string;
    type: string;
}
