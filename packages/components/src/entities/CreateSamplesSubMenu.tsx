import React, { FC, memo, useEffect, useMemo, useState } from 'react';
import { List } from 'immutable';

import { SchemaQuery } from '../public/SchemaQuery';

import { ProductMenuModel } from '../internal/components/navigation/model';
import { AppURL } from '../internal/url/AppURL';
import { QueryModel } from '../public/QueryModel/QueryModel';

import { MenuOption } from '../internal/components/menus/SubMenu';
import { getMenuItemForSectionKey, getMenuItemsForSection } from '../internal/components/buttons/utils';
import { SAMPLES_KEY } from '../internal/app/constants';

import { SampleCreationType } from '../internal/components/samples/models';
import { CreateSamplesSubMenuBase } from './CreateSamplesSubMenuBase';
import { DisableableMenuItem } from '../internal/components/samples/DisableableMenuItem';
import { getSampleWizardURL } from './utils';
import { QueryInfo } from '../public/QueryInfo';
import { isMediaEnabled } from '../internal/app/utils';
import { getServerContext } from '@labkey/api';
import { naturalSortByProperty } from '../public/sort';
import { loadSampleTypes } from './actions';
import { isSamplesSchema } from '../internal/components/samples/utils';

interface Props {
    allowPooledSamples?: boolean;
    currentProductId?: string;
    disabled?: boolean;
    id?: string;
    inlineItemsCount?: number;
    isSelectingSamples?: (schemaQuery: SchemaQuery) => boolean;
    menu?: ProductMenuModel;
    menuCurrentChoice?: string;
    loadSampleTypes?: (includeMedia: boolean) => Promise<QueryInfo[]>;
    menuText?: string;
    navigate: (url: string | AppURL) => void;
    parentKey?: string;
    parentQueryModel?: QueryModel;
    parentType?: string;
    selectedItems?: Record<string, any>;
    selectedQueryInfo?: QueryInfo;
    selectedType?: SampleCreationType;
    subMenuText?: string;
    targetProductId?: string;
    getWizardUrl?: (targetSampleType?: string, parent?: string) => AppURL; // for media
    mediaOptions?: string[];
}

export const MAX_PARENTS_PER_SAMPLE = 20;

export const CreateSamplesSubMenu: FC<Props> = memo(props => {
    const {
        getWizardUrl,
        loadSampleTypes,
        parentQueryModel,
        subMenuText,
        mediaOptions,
        menuText,
        menuCurrentChoice,
        menu,
        disabled,
        isSelectingSamples,
        currentProductId,
        targetProductId,
        selectedQueryInfo,
    } = props;
    const itemKey = parentQueryModel?.queryInfo?.name;
    const [sampleQueryInfos, setSampleQueryInfos] = useState<QueryInfo[]>(undefined);
    const isSamples = useMemo(() => isSamplesSchema(selectedQueryInfo?.schemaQuery), [selectedQueryInfo]);

    useEffect(() => {
        if (menu)
            return;

        // if we are showing this menu as a subMenu, only include the given selectedQueryInfo
        if (subMenuText && selectedQueryInfo) {
            setSampleQueryInfos([selectedQueryInfo] );
        } else {
            const includeMedia = isMediaEnabled(getServerContext().moduleContext);
            loadSampleTypes(includeMedia).then(allSampleTypes => {
                const queryInfos = allSampleTypes
                    .filter(
                        qi =>
                            (!qi.isMedia || (mediaOptions && mediaOptions.indexOf(qi.name) !== -1)) &&
                            qi.getShowInsertNewButton()
                    )
                    .sort(naturalSortByProperty('queryLabel'));

                setSampleQueryInfos(queryInfos);
            }).catch(error => {
                console.error("Unable to load sample types", error);
            });
        }
    }, [loadSampleTypes, subMenuText, selectedQueryInfo]);

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

        let options;
        if (menu) {
            options = getMenuItemsForSection(menu.getSection(SAMPLES_KEY), useOnClick, itemActionFn, disabledMsg);
        }
        else {
            const qiOptions = sampleQueryInfos?.map(queryInfo => ({
                key: queryInfo.name,
                name: subMenuText ?? queryInfo.queryLabel,
                disabled: disabledMsg !== undefined,
                disabledMsg,
                href: !useOnClick ? itemActionFn?.(queryInfo.name)?.toHref?.() : undefined,
                onClick: useOnClick && !disabledMsg ? itemActionFn?.bind(this, queryInfo.name) : undefined,
            })) ?? [];
            options = List(qiOptions);
        }

        if (options?.size === 0) {
            return List.of({ name: 'No sample types defined', disabled: true } as MenuOption);
        }

        return options;
    };

    if (disabled) {
        return <DisableableMenuItem operationPermitted={false}>{menuText}</DisableableMenuItem>;
    }

    return (
        <CreateSamplesSubMenuBase
            {...props}
            getOptions={getOptions}
            menuText={subMenuText ? null : menuText} // using null will render the submenu items inline in this button
            menuCurrentChoice={isSamples ? selectedQueryInfo.schemaQuery?.queryName ?? menuCurrentChoice : undefined}
            maxParentPerSample={MAX_PARENTS_PER_SAMPLE}
            sampleWizardURL={getWizardUrl ?? getSampleWizardURL}
            isSelectingSamples={isSelectingSamples}
            inlineItemsCount={0}
            currentProductId={currentProductId}
            targetProductId={targetProductId}
            selectionNoun={isSamples ? undefined : 'data'}
            selectionNounPlural={isSamples ? undefined : 'data'}
        />
    );
});

CreateSamplesSubMenu.defaultProps = {
    menuText: 'Create Samples',
    loadSampleTypes: loadSampleTypes,
}
