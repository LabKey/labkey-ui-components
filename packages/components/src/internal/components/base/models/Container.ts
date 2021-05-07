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
    declare activeModules: string[];
    declare folderType: string;
    declare hasRestrictedActiveModule: boolean;
    declare id: string;
    declare isContainerTab: boolean;
    declare isWorkbook: boolean;
    declare name: string;
    declare parentId: string;
    declare parentPath: string;
    declare path: string;
    declare sortOrder: number;
    declare title: string;
    declare type: string;

    hasActiveModule(moduleName: string): boolean {
        return this.activeModules?.indexOf(moduleName) > -1;
    }
}
