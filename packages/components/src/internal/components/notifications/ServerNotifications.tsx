import React, { ReactNode } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import { User } from '../base/models/User';

import { getPipelineActivityData } from './actions';
import { ServerActivityData } from './model';
import { ServerActivityList } from './ServerActivityList';
import { LoadingSpinner } from '../../../index';

interface Props {
    user?: User;
}

interface State {
    activityData: ServerActivityData[];
    isLoading: boolean;
    error: string;
    show: boolean;
}

export class ServerNotifications extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            activityData: undefined,
            isLoading: true,
            error: undefined,
            show: false,
        };
    }

    componentDidMount(): void {
        getPipelineActivityData()
            .then(response => {
                this.setState(() => ({ activityData: response, isLoading: false }));
            })
            .catch(reason => {
                this.setState(() => ({ error: reason, isLoading: false }));
            });
    }

    markAllRead = (): void => {
        console.log("markAllRead: not yet implemented");
    };

    viewAll = (): void => {
        console.log("viewAll: not yet implemented");
    };

    hasAnyUnread(): boolean {
        return this.state.activityData?.find(activity => activity.ReadOn == undefined) !== undefined;
    }

    hasAnyInProgress(): boolean {
        return this.state.activityData?.find(activity => activity.inProgress === true) !== undefined;
    }

    onToggle = (show: boolean): void => {
        this.setState(() => {show});
    };

    render(): ReactNode {
        const { activityData, error, isLoading, show } = this.state;

        const title = (
            <>
                Notifications
                {this.hasAnyUnread() && <div className="pull-right server-notifications-link" onClick={this.markAllRead}>Mark all as read</div>}
            </>
        );
        let overlayContents;
        if (isLoading) {
            overlayContents = <LoadingSpinner />;
        } else if (error) {
            overlayContents = <div className="server-notifications-footer server-notifications-error">{error}</div>;
        } else {
            overlayContents = <ServerActivityList activityData={activityData} onViewAll={this.viewAll} />;
        }
        return (
            <>
                <OverlayTrigger
                    placement="bottom"
                    overlay={
                        <Popover id="server-notifications" title={title}>
                            {overlayContents}
                        </Popover>
                    }
                    trigger="click"
                >
                    <span className="fa-stack server-notifications" data-count={activityData?.length}>
                        <i className="fa fa-circle fa-stack-1x" />
                        <i className={
                                'fa ' +
                                (this.hasAnyInProgress() ? 'fa-spinner fa-pulse' : 'fa-bell') +
                                ' fa-stack-1x server-notifications-icon'
                            }
                        />
                    </span>
                </OverlayTrigger>
            </>
        );
    }
}
