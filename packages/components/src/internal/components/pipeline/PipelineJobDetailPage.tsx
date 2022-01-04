import React, { FC } from 'react';

import { PipelineStatusDetailPage } from './PipelineStatusDetailPage';

interface Props {
    params: any;
}

export const PipelineJobDetailPage: FC<Props> = props => {
    return <PipelineStatusDetailPage rowId={props.params.id} />;
};
