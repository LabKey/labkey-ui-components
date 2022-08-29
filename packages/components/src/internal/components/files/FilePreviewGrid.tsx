import React from 'react';
import { List, Map } from 'immutable';

import { FileGridPreviewProps } from '../../../public/files/models';
import { GridColumn } from '../base/models/GridColumn';
import { Alert } from '../base/Alert';
import { Grid } from '../base/Grid';

type Props = FileGridPreviewProps & {
    columns?: List<GridColumn>;
    data: List<Map<string, any>>;
    errorMsg?: string;
};

export class FilePreviewGrid extends React.Component<Props, any> {
    static defaultProps = {
        header: 'File preview:',
        msg: '',
        errorStyle: 'warning',
    };

    render() {
        const { data, columns, header, infoMsg, errorMsg, errorStyle, warningMsg } = this.props;
        const numRows = data ? data.size : 0;

        return (
            <>
                {errorMsg ? (
                    <Alert bsStyle={errorStyle}>{errorMsg}</Alert>
                ) : (
                    <>
                        <strong>{header}</strong>
                        <Alert className="margin-top" bsStyle="warning">
                            {warningMsg}
                        </Alert>
                        <p className="margin-top">
                            <span>
                                The {numRows === 1 ? 'one row ' : 'first ' + numRows + ' rows '} of your data file{' '}
                                {numRows === 1 ? 'is' : 'are'} shown below.
                            </span>
                            &nbsp;
                            {infoMsg}
                        </p>
                        <Grid columns={columns} data={data} />
                    </>
                )}
            </>
        );
    }
}
