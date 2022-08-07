import React, { FC } from 'react';

export interface Props {
    maxCount: number;
    values: string[];
    vertical?: boolean;
}

export const ValueList: FC<Props> = ({ values, maxCount = 5 , vertical = false}) => {
    if (vertical) {
        return (
            <ul>
                {values.map((value, ind) => {
                    if (ind > maxCount) return null;

                    if (ind === maxCount) return '...';

                    return <li key={ind}>{value}</li>;
                })}
            </ul>
        );
    }

    let valueDisplay;
    if (values.length <= maxCount)
        valueDisplay = values.join(", ");
    else
        valueDisplay = values.slice(0, maxCount).join(", ") + ` and ${values.length - maxCount} more`;

    return <ul><li>{valueDisplay}</li></ul>;
};

