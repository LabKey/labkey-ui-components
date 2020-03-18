import React, { ErrorInfo } from 'react';
import { getServerContext } from '@labkey/api';

import { ErrorPage } from './ErrorPage';

interface ErrorBoundaryState {
    error: Error
    errorInfo: ErrorInfo
    hasError: boolean
    stackTrace: string
}

export class ErrorBoundary extends React.PureComponent<{}, ErrorBoundaryState> {

    constructor(props) {
        super(props);

        this.state = {
            error: undefined,
            errorInfo: undefined,
            hasError: false,
            stackTrace: undefined
        };
    }

    componentDidCatch(error, errorInfo) {
        const { Mothership } = getServerContext();

        if (Mothership) {
            // process stack trace against available source maps
            Mothership.processStackTrace(error, (stackTrace) => {
                this.setState(() => ({
                    error,
                    errorInfo,
                    hasError: true,
                    stackTrace: stackTrace || error.stack,
                }));
            });

            // log error as this error was caught by React
            Mothership.logError(error);
        } else {
            this.setState(() => ({
                error,
                errorInfo,
                hasError: true,
                stackTrace: error.stack,
            }));
        }
    }

    render() {
        if (this.state.hasError) {
            const { error, errorInfo, stackTrace } = this.state;

            return (
                <ErrorPage
                    error={error}
                    errorInfo={errorInfo}
                    stackTrace={stackTrace}
                />
            );
        }

        return this.props.children;
    }
}
