import React from 'react';
import { List } from 'immutable';
import { Security } from '@labkey/api';

import { fetchContainers, fetchQueries, fetchSchemas } from '../actions';
import { QueryInfoLite } from '../models';
import { Container, SchemaDetails } from '../../base/models/model';

export interface ILookupContext {
    activeContainer: Container;
    fetchContainers: () => Promise<List<Container>>;
    fetchQueries: (containerPath: string, schemaName: string) => Promise<List<QueryInfoLite>>;
    fetchSchemas: (containerPath: string) => Promise<List<SchemaDetails>>;
}

const LookupContext = React.createContext<ILookupContext>(undefined);
export const LookupContextProvider = LookupContext.Provider;
export const LookupContextConsumer = LookupContext.Consumer;

// default provider
export class LookupProvider extends React.Component<any, ILookupContext> {
    constructor(props) {
        super(props);

        this.state = {
            activeContainer: new Container(Security.currentContainer),
            fetchContainers,
            fetchQueries,
            fetchSchemas,
        };
    }

    render() {
        return <LookupContextProvider value={this.state}>{this.props.children}</LookupContextProvider>;
    }
}
