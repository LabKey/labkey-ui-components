/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react';
import moment from 'moment';
import { Panel, Row, Col } from "react-bootstrap";
import { Map } from 'immutable'
import { Principal, SecurityPolicy, SecurityRole } from "../permissions/models";
import { EffectiveRolesList } from "../permissions/EffectiveRolesList";
import { getUserProperties } from "../base/actions";
import { LoadingSpinner } from "../base/LoadingSpinner";
import { caseInsensitive } from "../../util/utils";
import { getDateTimeFormat } from "../../util/Date";

interface Props {
    principal: Principal
    policy?: SecurityPolicy
    rolesByUniqueName?: Map<string, SecurityRole>
}

interface State {
    loading: boolean
    userProperties: {}
}

export class UserDetailsPanel extends React.PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            loading: false,
            userProperties: undefined
        }
    }

    componentDidMount() {
        this.loadUserDetails();
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        const notMatchingUserId = this.props.principal && prevProps.principal && this.props.principal.userId !== prevProps.principal.userId;
        if (this.props.principal === undefined || prevProps.principal === undefined || notMatchingUserId) {
            this.loadUserDetails();
        }
    }

    loadUserDetails() {
        const { principal } = this.props;

        if (principal && principal.userId) {
            this.setState(() => ({loading: true}));

            getUserProperties(principal.userId)
                .then(response => {
                    this.setState(() => ({userProperties: response.props, loading: false}));
                })
                .catch(error => {
                    console.error(error);
                    this.setState(() => ({userProperties: undefined, loading: false}));
                });
        }
        else {
            this.setState(() => ({userProperties: undefined}));
        }
    }

    renderUserProp(title: string, prop: string, formatDate = false) {
        let value = caseInsensitive(this.state.userProperties, prop);
        if (formatDate && value) {
            value = moment(value).format(getDateTimeFormat());
        }

        if (value) {
            return (
                <Row>
                    <Col xs={4} className={'principal-detail-label'}>{title}:</Col>
                    <Col xs={8} className={'principal-detail-value'}>{value}</Col>
                </Row>
            )
        }
    }

    renderBody() {
        const { principal } = this.props;
        const { loading, userProperties } = this.state;

        if (loading) {
            return <LoadingSpinner/>
        }

        if (principal) {
            const description = caseInsensitive(userProperties, 'description');

            return (
                <>
                    <p className={'principal-title-primary'}>{principal.displayName}</p>

                    {this.renderUserProp('Email', 'email')}
                    {this.renderUserProp('First Name', 'firstName')}
                    {this.renderUserProp('Last Name', 'lastName')}

                    {description &&
                        <>
                            <hr className={'principal-hr'}/>
                            {this.renderUserProp('Description', 'description')}
                        </>
                    }

                    <hr className={'principal-hr'}/>
                    {this.renderUserProp('Created', 'created', true)}
                    {this.renderUserProp('Last Login', 'lastLogin', true)}

                    <EffectiveRolesList {...this.props}/>
                    {/*TODO when groups are implemented, add "Member of" for users*/}
                </>
            )
        }

        return <div>No user selected.</div>
    }

    render() {
        return (
            <Panel>
                <Panel.Heading>
                    User Details
                </Panel.Heading>
                <Panel.Body>
                    {this.renderBody()}
                </Panel.Body>
            </Panel>
        )
    }
}
