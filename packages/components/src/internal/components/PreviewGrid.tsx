import React, { PureComponent, ReactNode } from 'react';
import { fromJS, List } from 'immutable';
import { Alert } from 'react-bootstrap';

import { resolveErrorMessage, SchemaQuery, getQueryDetails, QueryInfo, selectRows, LoadingSpinner, Grid } from '../..';

interface PreviewGridProps {
    schemaQuery: SchemaQuery;
    numCols: number;
    numRows: number;
}

interface PreviewGridState {
    queryInfo: QueryInfo;
    data: any;
    loading: boolean;
    error: string;
}

type StatelessPreviewGridProps = PreviewGridProps & PreviewGridState;

export class StatelessPreviewGrid extends PureComponent<StatelessPreviewGridProps> {
    render() {
        const { loading, data, error, queryInfo, numCols, numRows, schemaQuery } = this.props;
        let body = <LoadingSpinner />;

        if (loading === false && data !== null) {
            const { viewName } = schemaQuery;
            const allColumns = queryInfo.getDisplayColumns(viewName);
            const columns = allColumns.slice(0, numCols).toList();
            const slicedData = data.slice(0, numRows).toList();
            let rowStats = '';

            if (slicedData.size === 1) {
                rowStats = ' first row and';
            } else if (slicedData.size > 1) {
                rowStats = ` first ${slicedData.size} rows and`;
            }

            const stats = `Previewing${rowStats} ${columns.size} of ${allColumns.size} columns.`;
            body = (
                <>
                    <p>{stats}</p>
                    <Grid bordered={true} columns={columns} data={slicedData} />
                </>
            );
        } else if (loading === false && error !== null) {
            body = (
                <>
                    <Alert bsStyle="danger">{error}</Alert>
                </>
            );
        }

        return <div className="preview-grid">{body}</div>;
    }
}

export class PreviewGrid extends PureComponent<PreviewGridProps, PreviewGridState> {
    constructor(props) {
        super(props);

        this.state = {
            queryInfo: null,
            data: null,
            loading: false,
            error: null,
        };
    }

    componentDidMount(): void {
        this.fetchData();
    }

    fetchData = (): void => {
        this.setState(() => ({ loading: true }));
        const { numCols, numRows } = this.props;
        const { schemaName, queryName, viewName } = this.props.schemaQuery;

        const handleFailure = resp => {
            // Do we know for sure that the error response in getQueryDetails will look the same as selectRows? We may
            // need to tweak this error handler to handle both cases, or just write one for each.
            const error = resolveErrorMessage(resp) || 'An unexpected error encountered while loading the data.';
            this.setState(() => ({
                error,
                loading: false,
            }));
        };

        getQueryDetails({ schemaName, queryName })
            .then((queryInfo: QueryInfo) => {
                const columns = queryInfo.getDisplayColumns(viewName).slice(0, numCols);
                const colString = queryInfo
                    .getPkCols()
                    .concat(columns)
                    .map(c => c.fieldKey)
                    .join(',');

                selectRows({
                    schemaName,
                    queryName,
                    viewName,
                    columns: colString,
                    maxRows: numRows,
                    // No need to include total count, we only want the first three rows and it could be a perf issue.
                    includeTotalCount: false,
                })
                    .then(({ key, models, orderedModels }) => {
                        const rows = fromJS(models[key]);
                        const data = List(orderedModels[key])
                            .map(id => rows.get(id))
                            .toList();
                        this.setState(() => ({
                            queryInfo,
                            data,
                            loading: false,
                            error: null,
                        }));
                    })
                    .catch(handleFailure);
            })
            .catch(handleFailure);
    };

    render(): ReactNode {
        return <StatelessPreviewGrid {...this.props} {...this.state} />;
    }
}
