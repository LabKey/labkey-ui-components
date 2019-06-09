import * as React from "react";
import { List } from "immutable";
import { Container, SchemaDetails} from "@glass/base";

import { ILookupContext, LookupContextProvider } from "../../components/Lookup/Context";
import { processContainers, processQueries, processSchemas } from "../../actions/actions";
import { QueryInfoLite } from "../../models";

import containerData from "../data/project-getContainers.json";
import queryData from "../data/query-getQueries.json";
import schemaData from "../data/query-getSchemas.json";

export class MockLookupProvider extends React.Component<any, ILookupContext> {

    constructor(props) {
        super(props);

        this.state = {
            activeContainer: new Container({
                id: 'E0EA3E55-3420-1035-8057-68FEA9BFB3A0',
                name: 'My Study',
                path: '/StudyVerifyProject/My Study'
            }),
            fetchContainers: () => Promise.resolve<List<Container>>(processContainers(containerData)),
            fetchQueries: (containerPath: string, schemaName: string) => {
                const data = queryData.queriesBySchema[schemaName];
                return Promise.resolve<List<QueryInfoLite>>(processQueries(data));
            },
            fetchSchemas: (containerPath: string) => Promise.resolve<List<SchemaDetails>>(processSchemas(schemaData))
        };
    }

    render() {
        return (
            <LookupContextProvider value={this.state}>
                {this.props.children}
            </LookupContextProvider>
        )
    }
}