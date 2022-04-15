import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { List } from 'immutable';

import {
    ALIQUOT_CREATION,
    App,
    AppURL,
    CHILD_SAMPLE_CREATION,
    DERIVATIVE_CREATION,
    isSamplesSchema,
    MenuOption,
    POOLED_SAMPLE_CREATION,
    QueryModel,
    SampleCreationType,
    SampleCreationTypeModal,
    SampleCreationTypeModel,
    SchemaQuery,
    SubMenu,
} from '../../..';

interface CreateSamplesSubMenuProps {
    getOptions: (useOnClick: boolean, disabledMsg: string, itemActionFn: (key: string) => any) => List<MenuOption>;
    maxParentPerSample: number;
    isSelectingSamples: (schemaQuery: SchemaQuery) => boolean;
    navigate: (url: string | AppURL) => any;
    menuCurrentChoice?: string;
    menuText?: string;
    parentType?: string;
    parentKey?: string;
    parentQueryModel?: QueryModel;
    sampleWizardURL?: (targetSampleType?: string, parent?: string) => AppURL;
    getProductSampleWizardURL?: (targetSampleType?: string, parent?: string, selectionKey?: string) => string | AppURL;
    allowPooledSamples?: boolean;
    selectedItems?: Record<string, any>;
    selectedType?: SampleCreationType;
}

export const CreateSamplesSubMenuBase: FC<CreateSamplesSubMenuProps> = memo(props => {
    const {
        allowPooledSamples,
        menuCurrentChoice,
        menuText,
        parentType,
        parentKey,
        parentQueryModel,
        navigate,
        getOptions,
        maxParentPerSample,
        sampleWizardURL,
        getProductSampleWizardURL,
        isSelectingSamples,
        selectedItems,
        selectedType,
    } = props;

    const [sampleCreationURL, setSampleCreationURL] = useState<string | AppURL>();
    const [selectedOption, setSelectedOption] = useState<string>();

    const selectedQuantity = parentQueryModel ? parentQueryModel.selections?.size ?? 0 : 1;
    const schemaQuery = parentQueryModel?.schemaQuery;

    const selectingSampleParents = useMemo(() => {
        return isSelectingSamples(schemaQuery);
    }, [isSelectingSamples, schemaQuery]);

    let disabledMsg: string;
    if (selectedQuantity === 0) {
        disabledMsg = `Select one or more ${isSamplesSchema(schemaQuery) ? 'samples' : 'items'}.`;
    }
    if (selectedQuantity > maxParentPerSample) {
        disabledMsg = `At most ${maxParentPerSample} ${isSamplesSchema(schemaQuery) ? 'samples' : 'items'} can be selected`;
    }

    const useOnClick = parentKey !== undefined || (selectingSampleParents && selectedQuantity > 0);

    const selectionKey = useMemo(() => {
        return parentQueryModel?.hasSelections ? parentQueryModel.id : null;
    }, [parentQueryModel]);

    const onSampleCreationMenuSelect = useCallback(
        (key: string) => {
            let appURL: string | AppURL;

            if (sampleWizardURL) {
                appURL = sampleWizardURL(key, parentKey);
                if (selectionKey) appURL = appURL.addParam('selectionKey', selectionKey);
            } else if (getProductSampleWizardURL) {
                appURL = getProductSampleWizardURL(key, parentKey, selectionKey);
            }

            if (useOnClick) {
                setSelectedOption(key);
                setSampleCreationURL(appURL);
            } else {
                return appURL;
            }
        },
        [useOnClick, parentKey, selectionKey, setSampleCreationURL, setSelectedOption]
    );

    const onCancel = useCallback(() => {
        setSampleCreationURL(undefined);
        setSelectedOption(undefined);
    }, [setSampleCreationURL, setSelectedOption]);

    const onSampleCreationSubmit = useCallback(
        (creationType: SampleCreationType, numPerParent?: number) => {
            if (sampleCreationURL instanceof AppURL)
                navigate(sampleCreationURL.addParams({ creationType, numPerParent }));
            else {
                window.location.href = sampleCreationURL + `&creationType=${creationType}&numPerParent=${numPerParent}`;
            }
        },
        [navigate, sampleCreationURL]
    );

    const sampleOptions = [
        {
            ...DERIVATIVE_CREATION,
            selected: selectedType === SampleCreationType.Derivatives,
        } as SampleCreationTypeModel,
    ];
    if (selectedOption && selectedOption === menuCurrentChoice) {
        if (allowPooledSamples) {
            sampleOptions.push({
                ...POOLED_SAMPLE_CREATION,
                selected: selectedType === SampleCreationType.PooledSamples,
            });
        }
        sampleOptions.push({
            ...ALIQUOT_CREATION,
            selected: !selectedType || selectedType === SampleCreationType.Aliquots,
        });
    }

    return (
        <>
            <SubMenu
                currentMenuChoice={menuCurrentChoice}
                extractCurrentMenuChoice={false}
                key={App.SAMPLES_KEY}
                options={
                    getOptions
                        ? getOptions(useOnClick, disabledMsg, disabledMsg ? undefined : onSampleCreationMenuSelect)
                        : undefined
                }
                text={menuText}
            />
            {sampleCreationURL && (
                <SampleCreationTypeModal
                    show={true}
                    showIcons={true}
                    parentCount={selectedQuantity}
                    options={parentType === App.SOURCES_KEY ? [CHILD_SAMPLE_CREATION] : sampleOptions}
                    onCancel={onCancel}
                    onSubmit={onSampleCreationSubmit}
                    selectionKey={selectedItems ? undefined : selectionKey}
                    selectedItems={selectedItems}
                />
            )}
        </>
    );
});

CreateSamplesSubMenuBase.defaultProps = {
    allowPooledSamples: true,
    menuText: 'Create Samples',
};
