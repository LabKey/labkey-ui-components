import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { List } from 'immutable';

import { AppURL } from '../internal/url/AppURL';

import { MenuOption } from '../internal/components/menus/SubMenu';
import { getMenuItemForSectionKey } from '../internal/components/buttons/utils';

import { DisableableMenuItem } from '../internal/components/samples/DisableableMenuItem';

import { QueryInfo } from '../public/QueryInfo';
import { isMediaEnabled, sampleManagerIsPrimaryApp } from '../internal/app/utils';
import { naturalSortByProperty } from '../public/sort';

import { isSamplesSchema } from '../internal/components/samples/utils';
import { useServerContext } from '../internal/components/base/ServerContext';

import { loadSampleTypes } from './actions';
import { getSampleWizardURL } from './utils';
import { CreateSamplesSubMenuBase, CreateSamplesSubMenuBaseProps } from './CreateSamplesSubMenuBase';

export interface CreateSamplesSubMenuProps
    extends Omit<
        CreateSamplesSubMenuBaseProps,
        | 'getOptions'
        | 'inlineItemsCount'
        | 'maxParentPerSample'
        | 'sampleWizardURL'
        | 'selectionNoun'
        | 'selectionNounPlural'
    > {
    disabled?: boolean;
    getWizardUrl?: (targetSampleType?: string, parent?: string) => AppURL; // for media
    id?: string;
    loadSampleTypes?: (includeMedia: boolean) => Promise<QueryInfo[]>;
    mediaOptions?: string[];
    selectedQueryInfo?: QueryInfo;
    subMenuText?: string;
}

export const MAX_PARENTS_PER_SAMPLE = 100;

export const CreateSamplesSubMenu: FC<CreateSamplesSubMenuProps> = memo(props => {
    const {
        menuCurrentChoice,
        getWizardUrl,
        loadSampleTypes,
        parentQueryModel,
        subMenuText,
        mediaOptions,
        menuText,
        disabled,
        selectedQueryInfo,
    } = props;
    const itemKey = parentQueryModel?.queryInfo?.name;
    const [sampleQueryInfos, setSampleQueryInfos] = useState<QueryInfo[]>(undefined);
    const isSamples = useMemo(() => isSamplesSchema(selectedQueryInfo?.schemaQuery), [selectedQueryInfo]);
    const { moduleContext } = useServerContext();

    useEffect(() => {
        // if we are showing this menu as a subMenu, only include the given selectedQueryInfo
        if (subMenuText && selectedQueryInfo) {
            setSampleQueryInfos([selectedQueryInfo]);
        } else {
            const includeMedia = isMediaEnabled(moduleContext);
            loadSampleTypes(includeMedia)
                .then(allSampleTypes => {
                    const queryInfos = allSampleTypes
                        .filter(
                            qi =>
                                (!qi.isMedia || (mediaOptions && mediaOptions.indexOf(qi.name) !== -1)) &&
                                qi.getShowInsertNewButton()
                        )
                        .sort(naturalSortByProperty('queryLabel'));

                    setSampleQueryInfos(queryInfos);
                })
                .catch(error => {
                    console.error('Unable to load sample types', error);
                });
        }
    }, [loadSampleTypes, moduleContext, subMenuText, selectedQueryInfo]);

    const getOptions = useCallback(
        (useOnClick: boolean, disabledMsg: string, itemActionFn: (key: string) => any): List<MenuOption> => {
            if (subMenuText) {
                return List.of(
                    getMenuItemForSectionKey(itemKey, subMenuText, undefined, useOnClick, itemActionFn, disabledMsg)
                );
            }
            const qiOptions =
                sampleQueryInfos?.map(queryInfo => ({
                    key: queryInfo.name,
                    name: subMenuText ?? queryInfo.queryLabel,
                    disabled: disabledMsg !== undefined,
                    disabledMsg,
                    href: !useOnClick ? itemActionFn?.(queryInfo.name)?.toHref?.() : undefined,
                    onClick: useOnClick && !disabledMsg ? itemActionFn?.bind(this, queryInfo.name) : undefined,
                })) ?? [];
            const options = List(qiOptions);

            if (options?.size === 0) {
                return List.of({ name: 'No sample types defined', disabled: true } as MenuOption);
            }

            return options;
        },
        [itemKey, sampleQueryInfos, subMenuText]
    );

    if (disabled) {
        return <DisableableMenuItem operationPermitted={false}>{menuText}</DisableableMenuItem>;
    }

    let selectionNoun;
    let selectionNounPlural;
    if (!isSamples) {
        if (sampleManagerIsPrimaryApp(moduleContext)) {
            selectionNoun = 'source';
            selectionNounPlural = 'sources';
        } else {
            selectionNoun = 'data';
            selectionNounPlural = 'data';
        }
    }

    return (
        <CreateSamplesSubMenuBase
            {...props}
            getOptions={getOptions}
            menuText={subMenuText ? null : menuText} // using null will render the submenu items inline in this button
            menuCurrentChoice={itemKey ?? menuCurrentChoice ?? selectedQueryInfo?.schemaQuery?.queryName}
            maxParentPerSample={MAX_PARENTS_PER_SAMPLE}
            sampleWizardURL={getWizardUrl ?? getSampleWizardURL}
            inlineItemsCount={0}
            selectionNoun={selectionNoun}
            selectionNounPlural={selectionNounPlural}
        />
    );
});

CreateSamplesSubMenu.defaultProps = {
    menuText: 'Create Samples',
    loadSampleTypes,
};
