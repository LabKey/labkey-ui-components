import React, { FC } from 'react';

export interface Props {
    maxCount: number;
    values: string[];
}

export const ValueList: FC<Props> = ({ values, maxCount = 5 }) => (
    <ul>
        {values.map((value, ind) => {
            if (ind > maxCount) return null;

            if (ind === maxCount) return '...';

            return <li key={ind}>{value}</li>;
        })}
    </ul>
);
