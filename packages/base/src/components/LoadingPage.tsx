import { LoadingSpinner, Page, PageHeader, User } from "..";
import * as React from "react";

export interface LoadingPageProps {
    title?: string
    user?: User
    msg?: string
}

export class LoadingPage extends React.Component<LoadingPageProps> {
    render () {
        return (
            <Page title={this.props.title}>
                <PageHeader user={this.props.user}/>
                <LoadingSpinner msg={this.props.msg} wrapperClassName="loading-page-message"/>
            </Page>
        )
    }
}