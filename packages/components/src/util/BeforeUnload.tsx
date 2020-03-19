import React from 'react';

interface Props {
    beforeunload: (event: any) => any
}

export class BeforeUnload extends React.PureComponent<Props, any> {

    componentDidMount() {
        window.addEventListener("beforeunload", this.props.beforeunload);
    }

    componentWillUnmount() {
        window.removeEventListener("beforeunload", this.props.beforeunload);
    }

    render() {
        return this.props.children;
    }
}