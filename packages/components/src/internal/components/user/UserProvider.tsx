/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { useEffect, useState } from 'react';

import { User } from '../base/models/User';

import { LoadingPage } from '../base/LoadingPage';

import { getUserProperties } from './actions';

interface Props {
    user: User;
}

interface State {
    userProperties: Record<string, any>;
}

const Context = React.createContext<State>(undefined);
const UserContextProvider = Context.Provider;
export const UserContextConsumer = Context.Consumer;

/** @deprecated Consider calling getUserProperties() or using useUserProperties hook instead. */
export const UserProvider = (Component: React.ComponentType) => {
    return class UserProviderImpl extends React.Component<Props, State> {
        constructor(props: Props) {
            super(props);

            this.state = {
                userProperties: undefined,
            };
        }

        componentDidMount = async (): Promise<void> => {
            const { user } = this.props;

            if (!user.isGuest) {
                try {
                    const response = await getUserProperties(user.id);
                    this.setState({ userProperties: response.props });
                    return;
                } catch (e) {
                    console.error('Failed to load user properties', e);
                }
            }

            this.setState({ userProperties: {} });
        };

        render() {
            if (this.state.userProperties) {
                return (
                    <UserContextProvider value={this.state}>
                        <Component {...this.props} {...this.state} />
                    </UserContextProvider>
                );
            } else {
                return <LoadingPage />;
            }
        }
    };
};

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
