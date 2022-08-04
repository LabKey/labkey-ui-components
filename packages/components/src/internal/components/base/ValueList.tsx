import React, { FC } from 'react';

export interface Props {
    values: string[];
    maxCount: number;
}

export const ValueList: FC<Props> = ({ values, maxCount= 5 }) => (
    <ul>
        {values.map((value, ind) => {
            if (ind > maxCount)
                return null;

            if (ind === maxCount)
                return '...';

            return <li key={ind}>{value}</li>;
        })}
    </ul>
);
