import React, { FC, memo } from 'react';
import { Map } from 'immutable';

import { UserLink } from '../components/user/UserLink';

interface Props {
    data: Map<any, any>;
}

export const UserDetailsRenderer: FC<Props> = memo(({ data }) => {
    if (!data) return null;

    const { displayValue, value } = data.toJS();
    return <UserLink userId={value} userDisplayValue={displayValue} />;
});
