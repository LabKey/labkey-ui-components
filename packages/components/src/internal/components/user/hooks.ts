/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { useEffect, useState } from 'react';

import { User } from '../base/models/User';

import { getUserProperties } from './actions';

export function useUserProperties(user: User): Record<string, any> {
    const { id, isGuest } = user;
    const [userProperties, setUserProperties] = useState<Record<string, any>>();

    useEffect(() => {
        if (isGuest) {
            setUserProperties({});
        } else {
            (async () => {
                try {
                    const response = await getUserProperties(id);
                    setUserProperties(response.props);
                } catch (e) {
                    console.error('Failed to load user properties', e);
                }
            })();
        }
    }, [isGuest, id]);

    return userProperties;
}
