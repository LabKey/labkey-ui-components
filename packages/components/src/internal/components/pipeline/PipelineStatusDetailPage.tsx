import React, { FC } from 'react';

import classNames from 'classnames';

import { getPipelineStatusDetail } from './actions';
import { PipelineLogEntry, PipelineStatusDetailModel } from './model';
import {Section} from "../base/Section";
import {Alert} from "../base/Alert";
import {LoadingSpinner} from "../base/LoadingSpinner";
import {Page} from "../base/Page";
import {PageHeader} from "../base/PageHeader";

interface JobStatusRowProps {
    label: string;
    value: string;
}

const JobStatusRow: FC<JobStatusRowProps> = ({ label, value }) => (
    <tr className="pipeline-job-status-detail-row">
        <td>{label}:&nbsp;</td>
        <td>{value}</td>
    </tr>
);

interface WithPipeLineStatusModel {
    model: PipelineStatusDetailModel;
}

const JobStatus: FC<WithPipeLineStatusModel> = ({ model }) => (
    <Section title="Status" panelClassName="pipeline-job-status-detail" titleSize="medium">
        <table>
            <tbody>
                <JobStatusRow label="Created" value={model.created} />
                <JobStatusRow label="Status" value={model.status} />
                <JobStatusRow label="Info" value={model.info} />
            </tbody>
        </table>
    </Section>
);

interface LogEntryProps {
    entry: PipelineLogEntry;
}

const LogEntry: FC<LogEntryProps> = ({ entry }) => (
    <tr
        className={classNames('job-status-log-entry', {
            'job-status-log-entry-warn': entry.level.toLowerCase() === 'warn',
            'job-status-log-entry-error':
                entry.level.toLowerCase() === 'error' || entry.level.toLowerCase() === 'danger',
        })}
    >
        <td>{entry.lines}</td>
    </tr>
);

const LogFile: FC<WithPipeLineStatusModel> = ({ model }) => (
    <Section title="Log" panelClassName="pipeline-job-status-log" titleSize="medium">
        <table>
            <tbody>
                {model.logEntries
                    .filter(entry => !!entry.lines)
                    .map((entry, idx) => (
                        <LogEntry key={idx} entry={entry} />
                    ))}
            </tbody>
        </table>
    </Section>
);

interface Props {
    rowId: number;
    interval?: number; // in ms
}

interface State {
    model: PipelineStatusDetailModel;
    error: any;
}

export class PipelineStatusDetailPage extends React.PureComponent<Props, State> {
    private _task: any;

    static defaultProps = {
        interval: 2000,
    };

    constructor(props) {
        super(props);

        this.state = {
            model: new PipelineStatusDetailModel(),
            error: undefined,
        };
    }

    componentDidMount() {
        this.refresh();
    }

    componentWillUnmount() {
        this.stopRefresh();
    }

    refresh = (): void => {
        const model = this.state.model;

        if (!model?.isLoading) {
            this.setState(
                state => ({
                    model: state.model.mutate({ isLoading: true, isLoaded: false }),
                }),
                () => {
                    const offset = this.state.model?.nextOffset ? this.state.model?.nextOffset : 0;
                    const count = this.state.model?.fetchCount ? this.state.model?.fetchCount + 1 : 1;

                    getPipelineStatusDetail(this.props.rowId, offset, count)
                        .then((model: PipelineStatusDetailModel) => {
                            this.setState(() => ({
                                model,
                            }));
                        })
                        .catch(error => {
                            this.setState(() => ({
                                error,
                            }));
                        });
                }
            );
        }

        if (!this.shouldFetchUpdate()) return;

        this._task = setTimeout(this.refresh, this.props.interval);
    };

    shouldFetchUpdate = (): boolean => {
        return !this.state.error && this.state.model?.active !== false;
    };

    stopRefresh = (): void => {
        if (this._task) clearTimeout(this._task);
    };

    render() {
        const { model, error } = this.state;

        if (!model || !model.isLoaded) return <LoadingSpinner />;
        if (error) return <Alert>{error}</Alert>;

        return (
            <Page title="Status Detail" hasHeader>
                <PageHeader title={model.description} />
                <JobStatus model={model} />
                {model.logEntries && <LogFile model={model} />}
            </Page>
        );
    }
}
