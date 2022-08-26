import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { List } from 'immutable';

import {
    ALIQUOT_CREATION,
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
    SCHEMAS,
    SubMenu,
} from '../../..';
import { SAMPLES_KEY, SOURCES_KEY } from '../../app/constants';

interface CreateSamplesSubMenuProps {
    allowPooledSamples?: boolean;
    currentProductId?: string;
    getOptions: (useOnClick: boolean, disabledMsg: string, itemActionFn: (key: string) => any) => List<MenuOption>;
    getProductSampleWizardURL?: (targetSampleType?: string, parent?: string, selectionKey?: string) => string | AppURL;
    inlineItemsCount?: number;
    isSelectingSamples?: (schemaQuery: SchemaQuery) => boolean;
    maxParentPerSample: number;
    menuCurrentChoice?: string;
    menuText?: string;
    navigate: (url: string | AppURL) => any;
    parentKey?: string;
    parentQueryModel?: QueryModel;
    parentType?: string;
    sampleWizardURL?: (
        targetSampleType?: string,
        parent?: string,
        currentProductId?: string,
        targetProductId?: string,
        selectionKey?: string
    ) => string | AppURL;
    selectedItems?: Record<string, any>;
    selectedType?: SampleCreationType;
    targetProductId?: string;
}

export const CreateSamplesSubMenuBase: FC<CreateSamplesSubMenuProps> = memo(props => {
    const {
        allowPooledSamples = true,
        menuCurrentChoice,
        menuText = 'Create Samples',
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
        inlineItemsCount,
        currentProductId,
        targetProductId,
    } = props;

    const [sampleCreationURL, setSampleCreationURL] = useState<string | AppURL>();
    const [selectedOption, setSelectedOption] = useState<string>();

    const selectedQuantity = parentQueryModel ? parentQueryModel.selections?.size ?? 0 : 1;
    const schemaQuery = parentQueryModel?.schemaQuery;

    const selectingSampleParents = useMemo(() => {
        return isSelectingSamples ? isSelectingSamples(schemaQuery) : true;
    }, [isSelectingSamples, schemaQuery]);

    let disabledMsg: string;
    if (selectedType === SampleCreationType.PooledSamples && selectedQuantity < 2) {
        disabledMsg = `Select two or more ${isSamplesSchema(schemaQuery) ? 'samples' : 'items'}.`;
    } else if (selectedQuantity === 0) {
        disabledMsg = `Select one or more ${isSamplesSchema(schemaQuery) ? 'samples' : 'items'}.`;
    } else if (selectedQuantity > maxParentPerSample) {
        disabledMsg = `At most ${maxParentPerSample} ${
            isSamplesSchema(schemaQuery) ? 'samples' : 'items'
        } can be selected`;
    }

    const useOnClick = parentKey !== undefined || (selectingSampleParents && selectedQuantity > 0);

    const selectionKey = useMemo(() => {
        return parentQueryModel?.hasSelections ? parentQueryModel.id : null;
    }, [parentQueryModel]);

    const onSampleCreationMenuSelect = useCallback(
        (key: string) => {
            let appURL: string | AppURL;

            if (sampleWizardURL) {
                appURL = sampleWizardURL(key, parentKey, selectionKey, currentProductId, targetProductId);
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
        [
            sampleWizardURL,
            getProductSampleWizardURL,
            useOnClick,
            parentKey,
            currentProductId,
            targetProductId,
            selectionKey,
        ]
    );

    const onCancel = useCallback(() => {
        setSampleCreationURL(undefined);
        setSelectedOption(undefined);
    }, []);

    const onSampleCreationSubmit = useCallback(
        (creationType: SampleCreationType, numPerParent?: number) => {
            if (sampleCreationURL instanceof AppURL) {
                navigate(sampleCreationURL.addParams({ creationType, numPerParent }));
            } else {
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

    let noun = 'Sample';
    let nounPlural = 'Samples';

    if (selectedOption?.toLowerCase() === SCHEMAS.SAMPLE_SETS.MIXTURE_BATCHES.queryName.toLowerCase()) {
        noun = 'Mixture Batch';
        nounPlural = 'Mixture Batches';
    } else if (selectedOption?.toLowerCase() === SCHEMAS.SAMPLE_SETS.RAW_MATERIALS.queryName.toLowerCase()) {
        noun = 'Raw Material';
        nounPlural = 'Raw Materials';
    }

    return (
        <>
            <SubMenu
                currentMenuChoice={menuCurrentChoice}
                extractCurrentMenuChoice={false}
                key={SAMPLES_KEY}
                options={
                    getOptions
                        ? getOptions(useOnClick, disabledMsg, disabledMsg ? undefined : onSampleCreationMenuSelect)
                        : undefined
                }
                text={menuText}
                inlineItemsCount={inlineItemsCount}
            />
            {sampleCreationURL && (
                <SampleCreationTypeModal
                    show={true}
                    showIcons={true}
                    parentCount={selectedQuantity}
                    options={parentType === SOURCES_KEY ? [CHILD_SAMPLE_CREATION] : sampleOptions}
                    onCancel={onCancel}
                    onSubmit={onSampleCreationSubmit}
                    selectionKey={selectedItems ? undefined : selectionKey}
                    selectedItems={selectedItems}
                    noun={noun}
                    nounPlural={nounPlural}
                />
            )}
        </>
    );
});
