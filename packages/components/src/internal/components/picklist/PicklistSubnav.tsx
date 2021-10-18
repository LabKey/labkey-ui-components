import React, { FC, useEffect, useState } from 'react';
import { List } from 'immutable';

import { AppURL, getListProperties, ITab, ListModel, SubNav } from '../../..';
import { PICKLIST_HOME_HREF, PICKLIST_KEY } from '../../app/constants';

const PARENT_TAB: ITab = {
    text: 'Picklists',
    url: PICKLIST_HOME_HREF,
};

interface SubNavProps {
    params?: any;
}

export const PicklistSubNav: FC<SubNavProps> = props => {
    const { params } = props;
    const [listModel, setListModel] = useState<ListModel>(undefined);

    useEffect(() => {
        const { id } = params;
        getListProperties(id).then(listModel => setListModel(listModel));
    }, [params]);

    const generateTabs = (): List<ITab> => {
        return List<ITab>([
            {
                text: listModel.name,
                url: AppURL.create(PICKLIST_KEY, listModel.listId),
            },
        ]);
    };

    if (!listModel) return null;

    return <SubNav tabs={generateTabs()} noun={PARENT_TAB} />;
};
