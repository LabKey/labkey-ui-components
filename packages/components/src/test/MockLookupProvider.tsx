import React, { Component, PropsWithChildren } from 'react';
import { List } from 'immutable';

import { ILookupContext, LookupContextProvider } from '../internal/components/domainproperties/Lookup/Context';
import { handleSchemas, processContainers, processQueries } from '../internal/components/domainproperties/actions';
import { QueryInfoLite } from '../internal/components/domainproperties/models';

import containerData from './data/project-getContainers.json';
import queryData from './data/query-getQueries.json';
import schemaData from './data/query-getSchemas.json';
import { Container } from '../internal/components/base/models/Container';
import { SchemaDetails } from '../internal/SchemaDetails';

export class MockLookupProvider extends Component<PropsWithChildren, ILookupContext> {
    constructor(props) {
        super(props);

        this.state = {
            activeContainer: new Container({
                id: 'e0ea3e55-3420-1035-8057-68fea9bfb3a0',
                name: 'My Study',
                path: '/StudyVerifyProject/My Study',
            }),
            fetchContainers: () => Promise.resolve<List<Container>>(processContainers(containerData)),
            fetchQueries: (containerPath: string, schemaName: string) => {
                const data = queryData.queriesBySchema[schemaName];
                return Promise.resolve<QueryInfoLite[]>(processQueries(data));
            },
            fetchSchemas: (containerPath: string) => {
                const path = containerPath ? containerPath : this.state.activeContainer.path;
                const data = schemaData.schemasByContainerPath[path];
                return Promise.resolve<SchemaDetails[]>(handleSchemas(data));
            },
            getExcludedSchemaQueryNames: () => {
                return Promise.resolve<string[]>([]);
            },
        };
    }

    render() {
        return <LookupContextProvider value={this.state}>{this.props.children}</LookupContextProvider>;
    }
}
