import React from 'react';
import {Checkbox} from "react-bootstrap";

import { Filter } from '@labkey/api'

import {
    GridPanel,
    InjectedQueryModels,
    LoadingSpinner,
    Page,
    PageHeader,
    SchemaQuery,
    withQueryModels
} from "../../..";

interface Props {
    autoRefresh: boolean
    title?: string
    gridId?: string
    interval?: number // in ms
    baseFilters?: Filter.IFilter[];
}

interface State {
    refreshOn: boolean;
}

const DEFAULT_JOBS_GRID_MODEL_ID = 'pipeline-jobs';

export class PipelineJobsPageImpl extends React.PureComponent<Props & InjectedQueryModels, State> {
    private _interval : any;

    static defaultProps = {
        autoRefresh: true,
        gridId: DEFAULT_JOBS_GRID_MODEL_ID,
        interval: 5000,
        title: 'Jobs'
    };

    constructor(props) {
        super(props);

        this.state = {
            refreshOn: props.autoRefresh !== false
        };
    }

    componentDidMount() {
        const { autoRefresh, interval, actions, gridId, baseFilters } = this.props;
        if (autoRefresh)
            this._interval = setInterval(this.refresh, interval);

        const queryConfig = {
            id: gridId,
            schemaQuery: SchemaQuery.create("pipeline", "job"),
            baseFilters
        };
        actions.addModel(queryConfig, true);
    }

    componentWillUnmount() {
        this.stopRefresh();
    }

    refresh = () => {
        const { queryModels, actions, gridId } = this.props;

        const model = queryModels[gridId];
        if (model)
            actions.loadModel(model.id);
    }

    toggleAutoRefresh = () => {
        const { interval } = this.props;
        const { refreshOn } = this.state;

        if (!refreshOn) {
            this._interval = setInterval(this.refresh, interval);
        }
        else
            this.stopRefresh();

        this.setState((state) => ({
            refreshOn: !refreshOn
        }));
    }

    stopRefresh = () => {
        if (this._interval)
            clearInterval(this._interval);
    }

    render() {
        const { queryModels, actions, gridId, title } = this.props;
        const { refreshOn } = this.state;

        const model = queryModels[gridId];
        if (model === undefined)
            return <LoadingSpinner/>;

        return (
            <Page title={title} hasHeader={true}>
                <PageHeader title={title} />
                <Checkbox checked={refreshOn} onChange={this.toggleAutoRefresh}>
                    Automatically refresh grid
                </Checkbox>
                <GridPanel
                    actions={actions}
                    model={model}
                />
            </Page>
        );
    }

}

export const PipelineJobsPage = withQueryModels<Props>(PipelineJobsPageImpl);