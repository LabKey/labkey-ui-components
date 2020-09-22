import React, { ErrorInfo } from 'react';
import { ExperimentalFeatures, getServerContext } from '@labkey/api';

import { Page, PageHeader } from '../../../index';

interface ErrorPageProps {
    error: Error;
    errorInfo: ErrorInfo;
    stackTrace: string;
    title?: string;
}

export class ErrorPage extends React.PureComponent<ErrorPageProps> {
    static defaultProps = {
        title: 'Unexpected error occurred',
    };

    isFeatureEnabled = (feature: ExperimentalFeatures): boolean => {
        return getServerContext().experimental[feature] === true;
    };

    render() {
        const { devMode } = getServerContext();
        const { error, errorInfo, stackTrace, title } = this.props;

        return (
            <div className="content-wrapper">
                <div className="container">
                    <Page hasHeader={true} title={title}>
                        <PageHeader title={title} />
                        <div className="alert alert-danger" role="alert">
                            An unexpected error caused the application to stop working. Please refresh the page. If the
                            problem persists contact support.
                        </div>
                        <div className="panel panel-default">
                            <div className="panel-body">
                                <dl className="dl-horizontal dl-error-page-details">
                                    <dt>Error</dt>
                                    <dd>{`${error.name}: ${error.message}`}</dd>
                                    <dt>URL</dt>
                                    <dd>{window.location.href}</dd>
                                    <dt>Developer Mode</dt>
                                    <dd>{devMode ? 'Yes' : 'No'}</dd>

                                    <dt>Logging Enabled</dt>
                                    <dd>
                                        {this.isFeatureEnabled(ExperimentalFeatures.javascriptErrorServerLogging)
                                            ? 'Yes'
                                            : 'No'}
                                    </dd>

                                    <dt>Reporting Enabled</dt>
                                    <dd>
                                        {this.isFeatureEnabled(ExperimentalFeatures.javascriptMothership)
                                            ? 'Yes'
                                            : 'No'}
                                    </dd>
                                </dl>
                                <h4>Stacktrace</h4>
                                <pre>{stackTrace ? stackTrace : 'Stacktrace not available'}</pre>
                                <h4>Component stack</h4>
                                <pre>
                                    {errorInfo?.componentStack
                                        ? errorInfo.componentStack
                                        : 'Component stack not available'}
                                </pre>
                            </div>
                        </div>
                    </Page>
                </div>
            </div>
        );
    }
}
