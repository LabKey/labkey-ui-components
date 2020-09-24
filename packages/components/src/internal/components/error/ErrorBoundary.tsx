import React, { ErrorInfo } from 'react';
import { getServerContext } from '@labkey/api';

import { ErrorPage } from './ErrorPage';

interface ErrorBoundaryState {
    error: Error;
    errorInfo: ErrorInfo;
    stackTrace: string;
}

export class ErrorBoundary extends React.PureComponent<{}, ErrorBoundaryState> {
    constructor(props) {
        super(props);

        this.state = {
            error: undefined,
            errorInfo: undefined,
            stackTrace: undefined,
        };
    }

    componentDidCatch(error, errorInfo) {
        const { Mothership } = getServerContext();

        this.setState(() => ({
            error,
            errorInfo,
            stackTrace: error?.stack ? error.stack : undefined,
        }));

        if (Mothership) {
            // process stack trace against available source maps
            Mothership.processStackTrace(error, stackTrace => {
                this.setState(state => ({
                    stackTrace: stackTrace || state.stackTrace,
                }));
            });

            // log error as this error was caught by React
            Mothership.logError(error);
        }
    }

    render() {
        if (this.state.error !== undefined) {
            const { error, errorInfo, stackTrace } = this.state;

            return <ErrorPage error={error} errorInfo={errorInfo} stackTrace={stackTrace} />;
        }

        return this.props.children;
    }
}
