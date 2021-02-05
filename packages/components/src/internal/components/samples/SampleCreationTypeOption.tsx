import React, {FC, memo} from "react";
import classNames from "classnames";
import {SVGIcon, Theme} from "../base/SVGIcon";

export enum CreationType {
    Independents = "Independent Samples",
    Derivatives = "Derivatives",
    PooledSamples = "Pooled Samples",
    Aliquots = "Aliquots"
}

export interface CreationTypeModel {
    type: CreationType,
    description: string,
    requiresMultipleParents: boolean,
    iconSrc?: string,
    iconUrl?: string
}

export const DERIVATIVE_CREATION = {
    type: CreationType.Derivatives,
    description: "Create multiple output samples per parent.",
    requiresMultipleParents: false,
    iconSrc: 'derivatives'
};

export const POOLED_SAMPLE_CREATION = {
    type: CreationType.PooledSamples,
    description: "Put multiple samples into pooled outputs.",
    requiresMultipleParents: true,
    iconSrc: "pooled"
};

export const ALIQUOT_CREATION = {
    type: CreationType.Aliquots,
    description: "Create aliquot copies from each parent sample.",
    requiresMultipleParents: false,
    iconSrc: "aliquots"
};



interface OptionProps {
    option: CreationTypeModel
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
