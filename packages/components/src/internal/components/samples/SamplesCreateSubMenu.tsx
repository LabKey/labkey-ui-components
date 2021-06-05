import React, {FC, memo, useCallback, useMemo, useState} from "react";
import { List } from "immutable";

import {
    ALIQUOT_CREATION,
    App,
    AppURL,
    CHILD_SAMPLE_CREATION,
    DERIVATIVE_CREATION,
    MenuOption,
    POOLED_SAMPLE_CREATION,
    QueryGridModel,
    QueryModel,
    SampleCreationType,
    SampleCreationTypeModal,
    SubMenu
} from "../../..";

interface SamplesCreateSubMenuProps {
    menuCurrentChoice?: string;
    menuText?: string;
    navigate: (url: string | AppURL) => any;
    parentType?: string;
    parentKey?: string;
    parentModel?: QueryGridModel;
    parentQueryModel?: QueryModel;
    getOptions: (useOnClick: boolean, disabledMsg: string, itemActionFn: (key: string) => any) => List<MenuOption>;
    maxParentPerSample: number;
    sampleWizardURL?: (targetSampleType?: string, parent?: string) => AppURL;
    getProductSampleWizardURL?: (targetSampleType?: string, parent?: string, selectionKey?: string) => string | AppURL;
    isSelectingSamples: (schemaName: string) => boolean;
}

export const SamplesCreateSubMenu: FC<SamplesCreateSubMenuProps> = memo((props) => {
    const { menuCurrentChoice, menuText, parentType, parentKey, parentModel, parentQueryModel,
        navigate, getOptions, maxParentPerSample, sampleWizardURL, getProductSampleWizardURL, isSelectingSamples } = props;

    const [sampleCreationURL, setSampleCreationURL] = useState<string | AppURL>();
    const [selectedOption, setSelectedOption] = useState<string>();

    const selectedQuantity = parentModel?.selectedQuantity ?? parentQueryModel?.selections.size ?? 1

    const schemaName = parentModel?.schema?.toLowerCase() ?? parentQueryModel?.schemaName?.toLowerCase();

    const selectingSampleParents = useMemo(() => {
        return isSelectingSamples(schemaName);
    }, [isSelectingSamples, schemaName]);

    let disabledMsg: string;
    if (selectingSampleParents && selectedQuantity > maxParentPerSample) {
        disabledMsg = "At most " + maxParentPerSample + " samples can be selected";
    }
    const useOnClick = parentKey !== undefined || (selectingSampleParents && selectedQuantity > 0);

    const onSampleCreationMenuSelect = useCallback((key: string) => {
        let selectionKey : string = null;
        if ((parentModel?.allowSelection && parentModel.selectedIds.size > 0) ||
            parentQueryModel?.hasSelections) {
            selectionKey = parentModel?.getId() || parentQueryModel?.id;
        }

        let appURL : string | AppURL = undefined;

        if (sampleWizardURL) {
            appURL = sampleWizardURL(key, parentKey);
            if (selectionKey)
                appURL = appURL.addParam('selectionKey', selectionKey);
        }
        else if (getProductSampleWizardURL) {
            appURL = getProductSampleWizardURL(key, parentKey, selectionKey);
        }

        if (useOnClick) {
            setSelectedOption(key);
            setSampleCreationURL(appURL);
        } else {
            return appURL;
        }
    }, [useOnClick, parentKey, parentModel, parentQueryModel, setSampleCreationURL, setSelectedOption]);

    const onCancel = useCallback(() => {
        setSampleCreationURL(undefined);
        setSelectedOption(undefined);
    }, [setSampleCreationURL, setSelectedOption]);

    const onSampleCreationSubmit = useCallback((creationType: SampleCreationType, numPerParent?: number) => {
        if (sampleCreationURL instanceof AppURL)
            navigate(sampleCreationURL.addParams({creationType, numPerParent}));
        else {
            navigate(sampleCreationURL + `&creationType=${creationType}&numPerParent=${numPerParent}`);
        }
    }, [navigate, sampleCreationURL]);

    const sampleOptions = [DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION];
    if (selectedOption && selectedOption === menuCurrentChoice)
        sampleOptions.push(ALIQUOT_CREATION);

    return (
        <>
            <SubMenu
                currentMenuChoice={menuCurrentChoice}
                key={App.SAMPLES_KEY}
                options={getOptions ? getOptions(useOnClick, disabledMsg, disabledMsg ? undefined : onSampleCreationMenuSelect) : undefined}
                text={menuText ?? 'Create Samples'}
            />
            {sampleCreationURL && (
                <SampleCreationTypeModal
                    show={true}
                    showIcons={true}
                    parentCount={selectedQuantity}
                    options={parentType === App.SOURCES_KEY ? [CHILD_SAMPLE_CREATION] : sampleOptions}
                    onCancel={onCancel}
                    onSubmit={onSampleCreationSubmit}
                />
            )}
        </>
    )
});
