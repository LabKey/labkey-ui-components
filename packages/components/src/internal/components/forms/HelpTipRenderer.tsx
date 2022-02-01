import React, { FC, memo } from 'react';

import { SampleStatusLegend, SAMPLE_STATUS_LEGEND } from '../samples/SampleStatusLegend';

interface Props {
    type: string;
}

export const HelpTipRenderer: FC<Props> = memo(props => {
    const { type } = props;
    if (type === SAMPLE_STATUS_LEGEND) {
        return <SampleStatusLegend />;
    }

    return null;
});
