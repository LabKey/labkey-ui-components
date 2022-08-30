import React, { FC, memo, useEffect, useState } from 'react';
import { List } from 'immutable';

import { PICKLIST_HOME_HREF, PICKLIST_KEY } from '../../app/constants';

import { ITab, SubNav } from '../navigation/SubNav';
import { useServerContext } from '../base/ServerContext';
import { AppURL } from '../../url/AppURL';

import { getPicklistFromId } from './actions';

const PARENT_TAB: ITab = {
    text: 'Picklists',
    url: PICKLIST_HOME_HREF,
};

interface SubNavProps {
    params: Record<string, any>;
}

export const PicklistSubNav: FC<SubNavProps> = memo(({ params }) => {
    const { id } = params;
    const [tabs, setTabs] = useState<List<ITab>>(List());
    const { user } = useServerContext();

    useEffect(() => {
        setTabs(List());
        (async () => {
            try {
                const picklist = await getPicklistFromId(id, false);

                if (picklist.isValid() && (picklist.isPublic() || picklist.isUserList(user))) {
                    setTabs(
                        List([
                            {
                                text: picklist.name,
                                url: AppURL.create(PICKLIST_KEY, picklist.listId),
                            },
                        ])
                    );
                }
            } catch (e) {
                console.error(`PicklistSubNav: failed to fetch picklist "${id}"`, e);
            }
        })();
    }, [id, user]);

    return <SubNav key={id} noun={PARENT_TAB} tabs={tabs} />;
});

PicklistSubNav.displayName = 'PicklistSubNav';
