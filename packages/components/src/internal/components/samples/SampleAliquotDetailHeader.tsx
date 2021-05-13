import React, { PureComponent } from 'react';
import { List, OrderedMap } from 'immutable';

import { DefaultRenderer, QueryColumn } from '../../..';

interface SampleAliquotDetailHeaderProps {
    row: any;
    aliquotHeaderDisplayColumns: List<QueryColumn>;
}

export class SampleAliquotDetailHeader extends PureComponent<SampleAliquotDetailHeaderProps, any> {
    renderAliquotDetailSubHeader(header: string) {
        return (
            <div className="bottom-spacing">
                <b>{header}</b>
            </div>
        );
    }

    renderDetailRow(label: string, data: any, key: any) {
        return (
            <tr key={key}>
                <td>{label}</td>
                <td>
                    <DefaultRenderer data={data} />
                </td>
            </tr>
        );
    }

    render() {
        const { row, aliquotHeaderDisplayColumns } = this.props;

        const newRow = row.reduce((newRow, value, key) => {
            return newRow.set(key.toLowerCase(), value);
        }, OrderedMap<string, any>());

        const description = newRow.get('description');
        const created = newRow.get('created');
        const createdBy = newRow.get('createdby');
        const parent = newRow.get('aliquotedfromlsid/name');
        const root = newRow.get('rootmateriallsid/name');
        const rootDescription = newRow.get('rootmateriallsid/description');

        const showRootSampleName = root.get('value') !== parent.get('value');

        return (
            <>
                {this.renderAliquotDetailSubHeader('Aliquot data')}
                <table className="table table-responsive table-condensed detail-component--table__fixed sample-aliquots-details-table">
                    <tbody>
                        {this.renderDetailRow('Aliquoted from', parent, 'aliquotedfrom')}
                        {this.renderDetailRow('Aliquoted by', createdBy, 'aliquotedby')}
                        {this.renderDetailRow('Aliquot date', created, 'aliquoteddate')}
                        {this.renderDetailRow('Aliquot description', description, 'aliquoteddescription')}
                        {aliquotHeaderDisplayColumns.map((aliquotCol, key) => {
                            return this.renderDetailRow(
                                aliquotCol.caption,
                                newRow.get(aliquotCol.fieldKey.toLowerCase()),
                                key
                            );
                        })}
                    </tbody>
                </table>
                {this.renderAliquotDetailSubHeader('Original Sample Data')}
                <table className="table table-responsive table-condensed detail-component--table__fixed sample-aliquots-details-meta-table">
                    <tbody>
                        {showRootSampleName && this.renderDetailRow('Original sample', root, 'originalsample')}
                        {this.renderDetailRow('Sample description', rootDescription, 'sampledescription')}
                    </tbody>
                </table>
            </>
        );
    }
}
