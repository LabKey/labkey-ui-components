import React, { PureComponent } from 'react';
import { List, Map, OrderedMap } from 'immutable';

import { isSampleStatusEnabled } from '../internal/app/utils';

import { QueryColumn } from '../public/QueryColumn';
import { DefaultRenderer } from '../internal/renderers/DefaultRenderer';

import { SAMPLE_STATE_COLUMN_NAME } from '../internal/components/samples/constants';
import { SampleStatusTag } from '../internal/components/samples/SampleStatusTag';
import { getSampleStatus } from '../internal/components/samples/utils';
import {UserDetailsRenderer} from "../internal/renderers/UserDetailsRenderer";

interface SampleAliquotDetailHeaderProps {
    aliquotHeaderDisplayColumns: List<QueryColumn>;
    row: Map<string, any>;
}

export class SampleAliquotDetailHeader extends PureComponent<SampleAliquotDetailHeaderProps> {
    renderDetailRow(label: string, data: any, key: any, userLookup = false) {
        return (
            <tr key={key}>
                <td>{label}</td>
                <td>
                    {userLookup && <UserDetailsRenderer data={data} />}
                    {!userLookup && <DefaultRenderer data={data} />}
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
        const status = newRow.get(SAMPLE_STATE_COLUMN_NAME.toLowerCase());
        const createdBy = newRow.get('createdby');
        const parent = newRow.get('aliquotedfromlsid/name');

        return (
            <>
                <table className="table table-responsive table-condensed detail-component--table__fixed sample-aliquots-details-table">
                    <tbody>
                        {this.renderDetailRow(QueryColumn.ALIQUOTED_FROM_CAPTION, parent, 'aliquotedfrom')}
                        {this.renderDetailRow('Aliquoted By', createdBy, 'aliquotedby', true)}
                        {this.renderDetailRow('Aliquot Date', created, 'aliquoteddate')}
                        {this.renderDetailRow('Aliquot Description', description, 'aliquoteddescription')}
                        {isSampleStatusEnabled() && status !== undefined && (
                            <tr key="aliquotedstatus">
                                <td>Aliquot Status</td>
                                <td>
                                    <SampleStatusTag status={getSampleStatus(newRow.toJS())} />
                                </td>
                            </tr>
                        )}
                        {aliquotHeaderDisplayColumns.map((aliquotCol, key) => {
                            return this.renderDetailRow(
                                aliquotCol.caption,
                                newRow.get(aliquotCol.fieldKey.toLowerCase()),
                                key,
                                QueryColumn.isUserLookup(aliquotCol.lookup)
                            );
                        })}
                    </tbody>
                </table>
            </>
        );
    }
}
