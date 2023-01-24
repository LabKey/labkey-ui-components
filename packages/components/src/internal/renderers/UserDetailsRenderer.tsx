import React, { FC, memo } from 'react';
import { Map } from 'immutable';

import { useServerContext } from '../components/base/ServerContext';
import { UserLink } from '../components/user/UserLink';

interface Props {
    data: Map<any, any>;
}

export const UserDetailsRenderer: FC<Props> = memo(({ data }) => {
    const { displayValue, value } = data.toJS();
    const { user } = useServerContext();
    return <UserLink currentUser={user} userId={value} userDisplayValue={displayValue} />;
});
