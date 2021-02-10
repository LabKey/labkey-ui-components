import React, {FC, memo} from "react";
import classNames from "classnames";
import {SVGIcon, Theme} from "../base/SVGIcon";

export enum SampleCreationType {
    Independents = "New samples",
    Derivatives = "Derivatives",
    PooledSamples = "Pooled Samples",
    Aliquots = "Aliquots"
}

export interface SampleCreationTypeModel {
    type: SampleCreationType,
    description?: string,
    disabledDescription?: string,
    minParentsPerSample: number,
    iconSrc?: string,
    iconUrl?: string,
    disabled?: boolean,
    selected?: boolean,
}

export const INDEPENDENT_SAMPLE_CREATION : SampleCreationTypeModel = {
    type: SampleCreationType.Independents,
    minParentsPerSample: 0,
}

export const CHILD_SAMPLE_CREATION : SampleCreationTypeModel = {
    type: SampleCreationType.Independents,
    description: "Create multiple output samples per parent.",
    minParentsPerSample: 1,
    iconSrc: 'derivatives'
};

export const DERIVATIVE_CREATION : SampleCreationTypeModel = {
    type: SampleCreationType.Derivatives,
    description: "Create multiple output samples per parent.",
    disabledDescription: "Only one parent sample type is allowed when creating derivative samples.",
    minParentsPerSample: 1,
    iconSrc: 'derivatives'
};

export const POOLED_SAMPLE_CREATION : SampleCreationTypeModel = {
    type: SampleCreationType.PooledSamples,
    description: "Put multiple samples into pooled outputs.",
    minParentsPerSample: 2,
    iconSrc: "pooled"
};

export const ALIQUOT_CREATION : SampleCreationTypeModel = {
    type: SampleCreationType.Aliquots,
    description: "Create aliquot copies from each parent sample.",
    minParentsPerSample: 1,
    iconSrc: "aliquots"
};

interface OptionProps {
    option: SampleCreationTypeModel
    isSelected: boolean
    onChoose: (evt) => void
    showIcon: boolean
}

// exported only for testing and storybook
export const SampleCreationTypeOption: FC<OptionProps> = memo(props => {
    const { option, isSelected, onChoose, showIcon } = props;

    return (
        <div className={classNames('creation-type', {'selected': isSelected})}>
            {showIcon &&
            <div className="creation-type-icon">
                {option.iconUrl && <img src={option.iconUrl} alt={option.type}/>}
                {option.iconSrc && <SVGIcon iconDir="_images" iconSrc={option.iconSrc} theme={isSelected ? Theme.DEFAULT : Theme.GRAY}/>}
            </div>
            }
            <div className={classNames("creation-type-choice", {'selected': isSelected})}>
                <input
                    checked={isSelected}
                    type="radio"
                    name="creationType"
                    value={option.type}
                    onChange={onChoose}/> {option.type}
                <div className="creation-type-choice-description">
                    {option.description}
                </div>
            </div>
        </div>
    )
});
