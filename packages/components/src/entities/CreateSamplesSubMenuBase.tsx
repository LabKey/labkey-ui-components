import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { List } from 'immutable';

import { MenuOption, SubMenu } from '../internal/components/menus/SubMenu';
import { AppURL } from '../internal/url/AppURL';
import { SchemaQuery } from '../public/SchemaQuery';
import { QueryModel } from '../public/QueryModel/QueryModel';

import { SAMPLES_KEY, SOURCES_KEY } from '../internal/app/constants';

import { SCHEMAS } from '../internal/schemas';

import { getCrossFolderSelectionResult } from '../internal/components/entities/actions';

import { EntityCrossProjectSelectionConfirmModal } from '../internal/components/entities/EntityCrossProjectSelectionConfirmModal';

import { isSamplesSchema } from '../internal/components/samples/utils';

import {
    ALIQUOT_CREATION,
    CHILD_SAMPLE_CREATION,
    DERIVATIVE_CREATION,
    POOLED_SAMPLE_CREATION,
    SampleCreationType,
    SampleCreationTypeModel,
} from '../internal/components/samples/models';

import { SampleCreationTypeModal } from './SampleCreationTypeModal';

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
    selectionNoun?: string;
    selectionNounPlural?: string;
    skipCrossFolderCheck?: boolean;
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
        selectionNoun = 'sample',
        selectionNounPlural = 'samples',
        skipCrossFolderCheck,
    } = props;

    const [sampleCreationURL, setSampleCreationURL] = useState<string | AppURL>();
    const [selectedOption, setSelectedOption] = useState<string>();
    const [crossFolderSelectionResult, setCrossFolderSelectionResult] = useState(undefined);

    const selectedQuantity = parentQueryModel ? parentQueryModel.selections?.size ?? 0 : 1;
    const schemaQuery = parentQueryModel?.schemaQuery;

    const selectingSampleParents = useMemo(() => {
        return isSelectingSamples
            ? isSelectingSamples(schemaQuery)
            : isSamplesSchema(schemaQuery) || schemaQuery?.schemaName === SCHEMAS.DATA_CLASSES.SCHEMA;
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

    const useOnClick = parentKey !== undefined || (parentQueryModel && selectedQuantity > 0 && selectingSampleParents);

    const selectionKey = useMemo(() => {
        return parentQueryModel?.hasSelections ? parentQueryModel.selectionKey : null;
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

    const onSampleCreationMenuSelectOnClick = useCallback(
        async (key: string) => {
            // check cross folder selection
            if (parentQueryModel && selectedQuantity > 0 && selectingSampleParents && !skipCrossFolderCheck) {
                const dataType = parentQueryModel.schemaName === SCHEMAS.DATA_CLASSES.SCHEMA ? 'data' : 'sample';
                setCrossFolderSelectionResult(undefined);
                const result = await getCrossFolderSelectionResult(parentQueryModel.id, dataType);

                if (result.crossFolderSelectionCount > 0) {
                    let verb = 'Create';
                    if (selectedType === SampleCreationType.PooledSamples) {
                        verb = 'Pool';
                    } else if (selectedType === SampleCreationType.Aliquots) {
                        verb = 'Aliquot';
                    } else if (selectedType === SampleCreationType.Derivatives) {
                        verb = 'Derive';
                    }

                    const totalSelectionCount = result.crossFolderSelectionCount + result.currentFolderSelectionCount;
                    setCrossFolderSelectionResult({
                        ...result,
                        title: 'Cannot ' + verb + (totalSelectionCount > 1 ? ' Samples' : ' Sample'),
                    });
                    return;
                }
            }

            return onSampleCreationMenuSelect(key);
        },
        [
            sampleWizardURL,
            getProductSampleWizardURL,
            useOnClick,
            parentKey,
            currentProductId,
            targetProductId,
            selectionKey,
            menuText,
            selectedType,
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

    const dismissCrossFolderError = useCallback(() => {
        setCrossFolderSelectionResult(undefined);
    }, []);

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
                        ? getOptions(
                              useOnClick,
                              disabledMsg,
                              disabledMsg
                                  ? undefined
                                  : useOnClick
                                  ? onSampleCreationMenuSelectOnClick
                                  : onSampleCreationMenuSelect
                          )
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
            {crossFolderSelectionResult && (
                <EntityCrossProjectSelectionConfirmModal
                    crossFolderSelectionCount={crossFolderSelectionResult.crossFolderSelectionCount}
                    currentFolderSelectionCount={crossFolderSelectionResult.currentFolderSelectionCount}
                    onDismiss={dismissCrossFolderError}
                    title={crossFolderSelectionResult.title}
                    noun={selectionNoun}
                    nounPlural={selectionNounPlural}
                />
            )}
        </>
    );
});
