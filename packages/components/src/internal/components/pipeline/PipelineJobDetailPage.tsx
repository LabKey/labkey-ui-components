import React, { FC, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AppURL } from '../../url/AppURL';
import { useSubNavTabsContext } from '../navigation/hooks';
import { ITab } from '../navigation/types';

import { PipelineStatusDetailPage } from './PipelineStatusDetailPage';

const PARENT_TAB: ITab = {
    text: 'Imports',
    url: AppURL.create('pipeline'),
};

// TODO: this component is not necessary, we can just use PipelineStatusDetailPage directly
export const PipelineJobDetailPage: FC = () => {
    const { clearNav, setNoun, setTabs } = useSubNavTabsContext();
    const id = parseInt(useParams().id, 10);

    useEffect(() => {
        setNoun(PARENT_TAB);
        setTabs([{ text: 'Status', url: AppURL.create('pipeline', id) }]);
        return clearNav;
    }, [clearNav, id, setNoun, setTabs]);

    return <PipelineStatusDetailPage rowId={id} />;
};
