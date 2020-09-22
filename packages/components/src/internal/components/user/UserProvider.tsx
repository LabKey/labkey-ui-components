/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { Map, fromJS } from 'immutable';

import { getUserProperties, LoadingPage, User } from '../../../index';

interface Props {
    user: User;
}

interface State {
    userProperties: Map<string, any>;
}

export type UserProviderProps = Props & State;

const Context = React.createContext<State>(undefined);
const UserContextProvider = Context.Provider;
export const UserContextConsumer = Context.Consumer;

export const UserProvider = (Component: React.ComponentType) => {
    return class UserProviderImpl extends React.Component<Props, State> {
        constructor(props: Props) {
            super(props);

            this.state = {
                userProperties: undefined,
            };
        }

        componentDidMount(): void {
            const { user } = this.props;

            if (!user.isGuest) {
                getUserProperties(user.id)
                    .then(response => {
                        if (response && response.props) {
                            this.setState(() => ({ userProperties: fromJS(response.props) }));
                        } else {
                            this.setEmptyUserProperties();
                        }
                    })
                    .catch(reason => {
                        console.error(reason);
                        this.setEmptyUserProperties();
                    });
            } else {
                this.setEmptyUserProperties();
            }
        }

        setEmptyUserProperties() {
            this.setState(() => ({ userProperties: Map<string, any>() }));
        }

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
