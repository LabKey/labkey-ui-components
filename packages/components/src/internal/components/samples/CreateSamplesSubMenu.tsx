import React, { FC, memo } from 'react';
import { List } from 'immutable';

import { SchemaQuery } from '../../../public/SchemaQuery';

import {
    App,
    AppURL,
    getMenuItemForSectionKey,
    getMenuItemsForSection,
    MenuOption,
    ProductMenuModel,
    QueryModel,
    SampleCreationType,
} from '../../..';

import { getSampleWizardURL } from './utils';
import { DisableableMenuItem } from './DisableableMenuItem';
import { CreateSamplesSubMenuBase } from './CreateSamplesSubMenuBase';

interface Props {
    allowPooledSamples?: boolean;
    currentProductId?: string;
    disabled?: boolean;
    id?: string;
    inlineItemsCount?: number;
    isSelectingSamples?: (schemaQuery: SchemaQuery) => boolean;
    menu?: ProductMenuModel;
    menuCurrentChoice?: string;
    menuText?: string;
    navigate: (url: string | AppURL) => void;
    parentKey?: string;
    parentQueryModel?: QueryModel;
    parentType?: string;
    selectedItems?: Record<string, any>;
    selectedType?: SampleCreationType;
    subMenuText?: string;
    targetProductId?: string;
}

export const MAX_PARENTS_PER_SAMPLE = 20;

export const CreateSamplesSubMenu: FC<Props> = memo(props => {
    const {
        parentQueryModel,
        subMenuText,
        menuText,
        menuCurrentChoice,
        menu,
        disabled,
        isSelectingSamples,
        currentProductId,
        targetProductId,
    } = props;
    const itemKey = parentQueryModel?.queryInfo?.name;

    const getOptions = (
        useOnClick: boolean,
        disabledMsg: string,
        itemActionFn: (key: string) => any
    ): List<MenuOption> => {
        if (subMenuText) {
            return List.of(
                getMenuItemForSectionKey(itemKey, subMenuText, undefined, useOnClick, itemActionFn, disabledMsg)
            );
        }

        const options = getMenuItemsForSection(menu.getSection(App.SAMPLES_KEY), useOnClick, itemActionFn, disabledMsg);

        if (options?.size === 0) {
            return List.of({ name: 'No sample types defined', disabled: true } as MenuOption);
        }

        return options;
    };

    if (disabled) {
        return <DisableableMenuItem operationPermitted={false}>Create Samples</DisableableMenuItem>;
    }

    return (
        <CreateSamplesSubMenuBase
            {...props}
            getOptions={getOptions}
            menuText={subMenuText ? null : menuText} // using null will render the submenu items inline in this button
            menuCurrentChoice={itemKey ?? menuCurrentChoice}
            maxParentPerSample={MAX_PARENTS_PER_SAMPLE}
            sampleWizardURL={getSampleWizardURL}
            isSelectingSamples={isSelectingSamples}
            inlineItemsCount={0}
            currentProductId={currentProductId}
            targetProductId={targetProductId}
        />
    );
});
