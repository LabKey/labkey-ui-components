import React from 'react';

import {
    Alert,
    LoadingSpinner,
    Page,
    PageHeader,
    Section
} from "../../..";
import {getPipelineStatusDetail} from "./actions";
import {PipelineLogEntry, PipelineStatusDetailModel} from "./model";
import classNames from "classnames";

interface Props {
    rowId: number
    interval?: number // in ms
}

interface State {
    model: PipelineStatusDetailModel;
    error: any;
}

export class PipelineStatusDetailPage extends React.PureComponent<Props, State> {
    private _task : any;

    static defaultProps = {
        interval: 2000
    }

    constructor(props) {
        super(props);

        this.state = {
            model: new PipelineStatusDetailModel(),
            error: undefined
        };
    }

    componentDidMount() {
        this.refresh();
    }

    componentWillUnmount() {
        this.stopRefresh();
    }

    refresh = () => {
        const model = this.state.model;

        if (!model?.isLoading) {
            this.setState((state) => ({
                model: state.model.mutate({isLoading: true, isLoaded: false})
            }), () => {
                const offset = this.state.model?.nextOffset ? this.state.model?.nextOffset : 0;
                const count = this.state.model?.fetchCount ? this.state.model?.fetchCount + 1 : 1;

                getPipelineStatusDetail(this.props.rowId, offset, count)
                    .then((model: PipelineStatusDetailModel) => {
                        this.setState((state) => ({
                            model
                        }));
                    })
                    .catch((error) => {
                        this.setState((state) => ({
                            error: error
                        }));
                    })
            });
        }


        if (!this.shouldFetchUpdate())
            return;

        this._task = setTimeout(this.refresh, this.props.interval)
    }

    shouldFetchUpdate = () => {
        return !this.state.error && (this.state.model?.active !== false);
    };

    stopRefresh = () => {
        if (this._task)
            clearTimeout(this._task);
    };

    renderJobStatusRow = (key: string, label: string, value: string) => {
        return (<tr key={key} className={'pipeline-job-status-detail-row'}>
            <td>{label}:&nbsp;</td>
            <td>{value}</td>
        </tr>
        )
    };

    renderJobStatus = () => {
        const { model } = this.state;

        return (
            <Section
                    title={'Status'}
                    panelClassName={'pipeline-job-status-detail'}
                    titleSize={"medium"}
                >
                <table>
                    <tbody>
                    {this.renderJobStatusRow('created', 'Created', model.created)}
                    {this.renderJobStatusRow('status', 'Status', model.status)}
                    {this.renderJobStatusRow('info', 'Info', model.info)}
                    </tbody>
                </table>
            </Section>
        );
    };

    renderLogEntry = (entry: PipelineLogEntry, ind) => {
        if (!entry.lines)
            return null;

        return (
            <tr
                key={'log-' + ind}
                className={classNames('job-status-log-entry', {
                    'job-status-log-entry-warn': entry.level.toLowerCase() === 'warn',
                    'job-status-log-entry-error': entry.level.toLowerCase() === 'error' || entry.level.toLowerCase() === 'danger'
                })}
            >
                <td>{entry.lines}</td>
            </tr>
        );
    };

    renderLogFile = () => {
        const { model } = this.state;
        if (!model.logEntries)
            return null;

        return (
            <Section
                title={'Log'}
                panelClassName={'pipeline-job-status-log'}
                titleSize={"medium"}
            >
                <table>
                    <tbody>
                    {model.logEntries.map((entry, ind) => {
                        return this.renderLogEntry(entry, ind);
                    })}
                    </tbody>
                </table>
            </Section>
        );
    };

    render() {
        const { model, error } = this.state;
        if (!model || !model.isLoaded)
            return <LoadingSpinner/>;

        if (error)
            return <Alert>{error}</Alert>;

        return (
            <Page title={"Status Detail"} hasHeader={true}>
                <PageHeader title={model.description} />
                {this.renderJobStatus()}
                {this.renderLogFile()}
            </Page>
        );
    }

}
