import { QueryInfo } from '../public/QueryInfo';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { AppURL } from '../internal/url/AppURL';
import { SampleCreationType } from '../internal/components/samples/models';
import React, { PureComponent } from 'react';
import { isMediaEnabled } from '../internal/app/utils';
import { getServerContext } from '@labkey/api';
import { naturalSortByProperty } from '../public/sort';
import { SCHEMAS } from '../internal/schemas';
import { List } from 'immutable';
import { getMenuItemForSectionKey } from '../internal/components/buttons/utils';
import { MenuOption } from '../internal/components/menus/SubMenu';
import { DisableableMenuItem } from '../internal/components/samples/DisableableMenuItem';
import { CreateSamplesSubMenuBase } from './CreateSamplesSubMenuBase';
import { getSampleWizardURL } from './utils';
import { loadSampleTypes } from './actions';

interface Props {
    id?: string;
    menuCurrentChoice?: string;
    menuText?: string;
    subMenuText?: string;
    loadSampleTypes?: (includeMedia: boolean) => Promise<QueryInfo[]>;
    parentKey?: string;
    parentQueryModel?: QueryModel;
    selectedQueryInfo?: QueryInfo;
    disabled?: boolean;
    navigate: (url: string | AppURL) => void;
    selectedType?: SampleCreationType;
    inlineItemsCount?: number;
    getWizardUrl?: (targetSampleType?: string, parent?: string) => AppURL;
    mediaOptions?: string[];
}

interface State {
    sampleQueryInfos: QueryInfo[];
}

export const MAX_PARENTS_PER_SAMPLE = 20;

export class CreateSamplesMenuItem extends PureComponent<Props, State> {
    static defaultProps = {
        loadSampleTypes,
        menuText: 'Create Samples',
    };

    state: Readonly<State> = {
        sampleQueryInfos: undefined,
    };

    componentDidMount = async (): Promise<void> => {
        const { loadSampleTypes, subMenuText, selectedQueryInfo, mediaOptions } = this.props;

        // if we are showing this menu as a subMenu, only include the given selectedQueryInfo
        if (subMenuText && selectedQueryInfo) {
            this.setState({ sampleQueryInfos: [selectedQueryInfo] });
        } else {
            const includeMedia = isMediaEnabled(getServerContext().moduleContext);
            const allSampleTypes = await loadSampleTypes(includeMedia);

            const sampleQueryInfos = allSampleTypes
                .filter(
                    qi =>
                        (!qi.isMedia || (mediaOptions && mediaOptions.indexOf(qi.name) !== -1)) &&
                        qi.getShowInsertNewButton()
                )
                .sort(naturalSortByProperty('queryLabel'));

            this.setState({ sampleQueryInfos });
        }
    };

    isSampleModel = (): boolean => {
        return this.props.selectedQueryInfo?.schemaName.toLowerCase() === SCHEMAS.SAMPLE_SETS.SCHEMA;
    };

    getItems = (useOnClick: boolean, disabledMsg: string, itemActionFn: (key: string) => any): List<MenuOption> => {
        const { subMenuText, parentQueryModel } = this.props;

        if (subMenuText) {
            return List.of(
                getMenuItemForSectionKey(
                    parentQueryModel?.queryInfo?.name,
                    subMenuText,
                    undefined,
                    useOnClick,
                    itemActionFn,
                    disabledMsg
                )
            );
        }

        const items =
            this.state.sampleQueryInfos?.map(queryInfo => ({
                key: queryInfo.name,
                name: subMenuText ?? queryInfo.queryLabel,
                disabled: disabledMsg !== undefined,
                disabledMsg,
                href: !useOnClick ? itemActionFn?.(queryInfo.name)?.toHref?.() : undefined,
                onClick: useOnClick && !disabledMsg ? itemActionFn?.bind(this, queryInfo.name) : undefined,
            })) ?? [];

        if (items.length === 0) {
            return List.of({ name: 'No sample types defined', disabled: true } as MenuOption);
        }

        return List(items);
    };

    render() {
        const { selectedQueryInfo, disabled, menuText, subMenuText, getWizardUrl } = this.props;
        const { sampleQueryInfos } = this.state;

        if (sampleQueryInfos === undefined) {
            return null;
        }

        if (disabled) {
            return <DisableableMenuItem operationPermitted={false}>{menuText}</DisableableMenuItem>;
        }

        return (
            <CreateSamplesSubMenuBase
                {...this.props}
                menuCurrentChoice={this.isSampleModel() ? selectedQueryInfo.schemaQuery?.queryName : undefined}
                menuText={subMenuText ? null : menuText} // using null will render the submenu items inline in this button
                getOptions={this.getItems}
                maxParentPerSample={MAX_PARENTS_PER_SAMPLE}
                sampleWizardURL={getWizardUrl ?? getSampleWizardURL}
                inlineItemsCount={0}
                selectionNoun={this.isSampleModel() ? undefined : 'data'}
                selectionNounPlural={this.isSampleModel() ? undefined : 'data'}
            />
        );
    }
}
