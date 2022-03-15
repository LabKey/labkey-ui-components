import React, { ReactNode } from 'react';
import { TemplateDownloadButton } from '../../public/files/TemplateDownloadButton';
import { Map } from 'immutable';
import { getSampleTypeTemplateUrl } from '../components/samples/utils';
import { getQueryDetails } from '../query/api';
import { SCHEMAS } from '../schemas';
import { QueryInfo } from '../../public/QueryInfo';
import { getSampleTypeDetails } from '../components/samples/actions';
import { SampleTypeModel } from '../components/domainproperties/samples/models';
import { SchemaQuery } from '../../public/SchemaQuery';

interface Props {
    row?: Map<any, any>;
    data?: any;
}

interface State {
    queryInfo: QueryInfo,
    importAliases?: Record<string, string>
}

export class SampleTypeTemplateDownloadRenderer extends React.PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            queryInfo: undefined,
            importAliases: undefined,
        }
    }

    componentDidMount() {
        const { row } = this.props;
        const schemaQuery = SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA,  row.getIn(['Name', 'value']))
        getQueryDetails({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
        }).then((queryInfo => {
            this.setState({queryInfo})
        }));
        getSampleTypeDetails(schemaQuery).then(domainDetails => {
            const sampleTypeModel = SampleTypeModel.create(domainDetails);
            this.setState({importAliases: domainDetails.options?.get('importAliases') ?? {}} );
        });
    }

    render(): ReactNode {
        const { queryInfo, importAliases } = this.state;

        if (!queryInfo || !importAliases)
            return null;

        return (
            <TemplateDownloadButton templateUrl={getSampleTypeTemplateUrl(queryInfo, importAliases)} text={"Download"}/>
        )
    }
}


export class AssayResultTemplateDownloadRenderer extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            queryInfo: undefined,
            importAliases: undefined,
        }
    }

    componentDidMount() {
        // const { row } = this.props;
        // const schemaQuery = SchemaQuery.create(SCHEMAS.DATA_CLASSES.SCHEMA,  row.getIn(['Name', 'value']))
        // getQueryDetails({
        //     schemaName: schemaQuery.schemaName,
        //     queryName: schemaQuery.queryName,
        // }).then((queryInfo => {
        //     this.setState({queryInfo})
        // }));
    }

    render(): ReactNode {

        return <TemplateDownloadButton templateUrl={"TODO"} text={"Download"}/>
    }
}

