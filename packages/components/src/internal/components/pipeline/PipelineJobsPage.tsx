import React from 'react';
import { Checkbox } from 'react-bootstrap';

import { Filter, Query } from '@labkey/api';

import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QuerySort } from '../../../public/QuerySort';
import { GridPanel } from '../../../public/QueryModel/GridPanel';
import { PageHeader } from '../base/PageHeader';
import { Page } from '../base/Page';
import { LoadingSpinner } from '../base/LoadingSpinner';

interface Props {
    autoRefresh: boolean;
    baseFilters?: Filter.IFilter[];
    gridId?: string;
    interval?: number; // in ms
    title?: string;
}

interface State {
    refreshOn: boolean;
}

const DEFAULT_JOBS_GRID_MODEL_ID = 'pipeline-jobs';

export class PipelineJobsPageImpl extends React.PureComponent<Props & InjectedQueryModels, State> {
    private _interval: any;

    static defaultProps = {
        autoRefresh: true,
        gridId: DEFAULT_JOBS_GRID_MODEL_ID,
        interval: 5000,
        title: 'Jobs',
    };

    constructor(props) {
        super(props);

        this.state = {
            refreshOn: props.autoRefresh !== false,
        };
    }

    componentDidMount() {
        const { autoRefresh, interval, actions, gridId, baseFilters } = this.props;
        if (autoRefresh) this._interval = setInterval(this.refresh, interval);

        const queryConfig = {
            id: gridId,
            containerFilter: Query.ContainerFilter.allInProject, // use AllInProject for this grid to match getServerNotifications()
            schemaQuery: new SchemaQuery('pipeline', 'job'),
            baseFilters,
            sorts: [new QuerySort({ fieldKey: 'Created', dir: '-' })],
            requiredColumns: ['Provider'],
            includeTotalCount: true,
            useSavedSettings: true,
        };
        actions.addModel(queryConfig, true);
    }

    componentWillUnmount() {
        this.stopRefresh();
    }

    refresh = () => {
        const { queryModels, actions, gridId } = this.props;

        const model = queryModels[gridId];
        if (model) actions.loadModel(model.id);
    };

    toggleAutoRefresh = () => {
        const { interval } = this.props;

        this.setState(
            state => ({
                refreshOn: !state.refreshOn,
            }),
            () => {
                const { refreshOn } = this.state;
                if (refreshOn) {
                    this._interval = setInterval(this.refresh, interval);
                } else this.stopRefresh();
            }
        );
    };

    stopRefresh = () => {
        if (this._interval) clearInterval(this._interval);
    };

    renderButtons = (refreshOn: boolean) => {
        return (
            <Checkbox checked={refreshOn} onChange={this.toggleAutoRefresh}>
                Automatically refresh grid
            </Checkbox>
        );
    };

    render() {
        const { queryModels, actions, gridId, title } = this.props;
        const { refreshOn } = this.state;

        const model = queryModels[gridId];
        if (model === undefined) return <LoadingSpinner />;

        return (
            <Page title={title} hasHeader={true}>
                <PageHeader title={title} />
                <GridPanel
                    actions={actions}
                    model={model}
                    ButtonsComponent={() => this.renderButtons(refreshOn)}
                    allowViewCustomization={false}
                />
            </Page>
        );
    }
}

export const PipelineJobsPage = withQueryModels<Props>(PipelineJobsPageImpl);
