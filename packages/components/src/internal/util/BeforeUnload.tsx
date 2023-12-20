import React, { ReactNode } from 'react';

interface Props {
    beforeunload: (event: any) => void;
}

/**
 * A HOC to be used for any LKS React page that needs to check for a dirty state on page navigation.
 *
 * This HOC  will NOT work in any of our App pages, because we use react-router in our apps. If you need similar
 * behavior in an app page use the useRouteLeave hook.
 */
export class BeforeUnload extends React.PureComponent<Props> {
    componentDidMount(): void {
        window.addEventListener('beforeunload', this.props.beforeunload);
    }

    componentWillUnmount(): void {
        window.removeEventListener('beforeunload', this.props.beforeunload);
    }

    render(): ReactNode {
        return this.props.children;
    }
}
