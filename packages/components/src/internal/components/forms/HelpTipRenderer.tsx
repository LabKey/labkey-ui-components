import React, { FC, memo } from 'react';

import { SampleStatusLegend, SAMPLE_STATUS_LEGEND } from '../samples/SampleStatusLegend';
import { QueryColumn } from '../../../public/QueryColumn';
import { DOMAIN_FIELD, DomainFieldHelpTipContents } from './DomainFieldHelpTipContents';

interface Props {
    column?: QueryColumn;
    type: string;
}

export const HelpTipRenderer: FC<Props> = memo(props => {
    const { type, children, column } = props;
    if (type === SAMPLE_STATUS_LEGEND) {
        return <SampleStatusLegend />;
    } else if (type === DOMAIN_FIELD) {
        return <DomainFieldHelpTipContents column={column}>{children}</DomainFieldHelpTipContents>;
    }

    return null;
});
