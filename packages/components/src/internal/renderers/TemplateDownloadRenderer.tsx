import React, { ReactNode } from 'react';
import { TemplateDownloadButton } from '../../public/files/TemplateDownloadButton';
import { Map } from 'immutable';
import { getSampleTypeTemplateUrl } from '../components/samples/utils';
import { getQueryDetails } from '../query/api';
import { SCHEMAS } from '../schemas';
import { getSampleTypeDetails } from '../components/samples/actions';
import { SchemaQuery } from '../../public/SchemaQuery';
import { Assay } from '@labkey/api';
import { downloadFromUrl } from '../util/utils';

interface Props {
    row?: Map<any, any>;
}

export class SampleTypeTemplateDownloadRenderer extends React.PureComponent<Props> {

    onDownload = () => {
        const { row } = this.props;
        const schemaQuery = SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA,  row.getIn(['Name', 'value']));
        const promises = []
        promises.push(getQueryDetails({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
        }));
        promises.push(getSampleTypeDetails(schemaQuery));
        Promise.all(promises).then(results => {
            const [queryInfo, domainDetails] = results;
            downloadFromUrl(getSampleTypeTemplateUrl(queryInfo, domainDetails.options?.get('importAliases')));
        });
    }

    render(): ReactNode {
        return (
            <TemplateDownloadButton onClick={this.onDownload} text={"Download"} className={"button-small-padding"}/>
        )
    }
}


export class AssayResultTemplateDownloadRenderer extends React.PureComponent<Props> {

    onDownload = () => {
        const { row } = this.props;
        Assay.getByName({
            name: row.getIn(['Name', 'value']),
            success: (assayDef => {
                if (assayDef?.length) {
                    downloadFromUrl(assayDef[0].templateLink);
                }
                else {
                    console.error("Assay definition not found for row", row.toJS());
                }
            }),
            failure: () => {
                console.error("Error retrieving assay definition for row", row.toJS());
            }
        })
    }

    render(): ReactNode {
        return <TemplateDownloadButton onClick={this.onDownload} text={"Download"} className="button-small-padding"/>
    }
}

