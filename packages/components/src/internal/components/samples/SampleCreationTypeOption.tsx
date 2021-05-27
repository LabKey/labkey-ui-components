import React, { FC, memo } from "react";
import classNames from "classnames";
import { SVGIcon, Theme } from "../base/SVGIcon";
import { SampleCreationTypeModel } from "./models";

interface OptionProps {
    option: SampleCreationTypeModel
    isSelected: boolean
    onChoose: (option) => void
    showIcon: boolean
}

export const SampleCreationTypeOption: FC<OptionProps> = memo(props => {
    const {option, isSelected, onChoose, showIcon} = props;

    const onClick = () => {
        onChoose(option);
    };

    return (
        <div onClick={onClick} className={classNames('creation-type', {'selected': isSelected})}>
            {showIcon &&
            <div className="creation-type-icon">
                {option.iconUrl && <img src={option.iconUrl} alt={option.type}/>}
                {option.iconSrc &&
                <SVGIcon iconDir="_images" iconSrc={option.iconSrc} theme={isSelected ? Theme.DEFAULT : Theme.GRAY}/>}
            </div>
            }
            <div className={classNames('creation-type-choice', {'selected': isSelected})}>
                <input
                    checked={isSelected}
                    type="radio"
                    name="creationType"
                    value={option.type}
                    onChange={onClick}/> {option.type}
                <div className="creation-type-choice-description">
                    {option.description}
                </div>
            </div>
        </div>
    )
});
