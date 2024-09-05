import React, { Component, createContext, PropsWithChildren } from 'react';
import { List } from 'immutable';
import { Security } from '@labkey/api';

import { fetchContainers, fetchQueries, fetchSchemas, getExcludedSchemaQueryNames } from '../actions';
import { QueryInfoLite } from '../models';
import { Container } from '../../base/models/Container';
import { SchemaDetails } from '../../../SchemaDetails';

export interface ILookupContext {
    activeContainer: Container;
    fetchContainers: () => Promise<List<Container>>;
    fetchQueries: (containerPath: string, schemaName: string) => Promise<QueryInfoLite[]>;
    fetchSchemas: (containerPath: string) => Promise<SchemaDetails[]>;
    getExcludedSchemaQueryNames: (schemaName, queryContainerPath?: string) => Promise<string[]>;
}

const LookupContext = createContext<ILookupContext>(undefined);
export const LookupContextProvider = LookupContext.Provider;
export const LookupContextConsumer = LookupContext.Consumer;

// default provider
export class LookupProvider extends Component<PropsWithChildren, ILookupContext> {
    constructor(props) {
        super(props);

        this.state = {
            activeContainer: new Container(Security.currentContainer),
            fetchContainers,
            fetchQueries,
            fetchSchemas,
            getExcludedSchemaQueryNames,
        };
    }

    render() {
        return <LookupContextProvider value={this.state}>{this.props.children}</LookupContextProvider>;
    }
}
