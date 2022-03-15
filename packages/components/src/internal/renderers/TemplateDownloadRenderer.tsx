import React, { ReactNode } from 'react';
import { TemplateDownloadButton } from '../../public/files/TemplateDownloadButton';
import { Map } from 'immutable';
import { downloadSampleTypeTemplate, getSampleTypeTemplateUrl } from '../components/samples/utils';
import { SCHEMAS } from '../schemas';
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
        downloadSampleTypeTemplate(schemaQuery, getSampleTypeTemplateUrl);
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

