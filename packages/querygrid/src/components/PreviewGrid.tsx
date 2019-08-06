import * as React from 'react';
import { fromJS, List } from 'immutable';
import { Grid, SchemaQuery, QueryInfo } from "@glass/base";
import { getQueryDetails, selectRows } from "..";

interface PreviewGridProps {
    schemaQuery: SchemaQuery,
    numCols: number,
    numRows: number,
}

export class PreviewGrid extends React.PureComponent<PreviewGridProps, any> {
    constructor(props) {
        super(props);

        this.state = {
            queryInfo: null,
            data: null,
            columns: null,
            loading: null,
        }
    }

    fetchData() {
        this.setState(() => ({ loading: true }));
        const { numCols, numRows } = this.props;
        const { schemaName, queryName, viewName }= this.props.schemaQuery;

        getQueryDetails({ schemaName, queryName }).then((queryInfo: QueryInfo) =>{
            const columns = queryInfo.getDisplayColumns(viewName).slice(0, numCols);
            const colString = queryInfo.getPkCols().concat(columns).map(c => c.fieldKey).join(',');

            selectRows({
                schemaName,
                queryName,
                viewName,
                columns: colString,
                maxRows: numRows,
                // No need to include total count, we only want the first three rows and it could be a perf issue.
                includeTotalCount: false,
            }).then(({key, models, orderedModels}) => {
                const rows = fromJS(models[key]);
                const data = List(orderedModels[key]).map((id) => rows.get(id)).toList();
                this.setState(() => ({
                    queryInfo,
                    data,
                    columns,
                    loading: false,
                }));
            });
        });
    }

    componentDidMount(): void {
        this.fetchData();
    }

    render() {
        const { loading, data } = this.state;
        let body = <div>Loading...</div>;

        if (loading === false && data !== null) {
            const { numCols } = this.props;
            const { viewName }= this.props.schemaQuery;
            const { queryInfo } = this.state;
            const columns = queryInfo.getDisplayColumns(viewName).slice(0, numCols);
            body = <Grid bordered={false} columns={columns} data={data} />;
        }

        return (
            <div className="preview-grid">
                {body}
            </div>
        );
    }
}
