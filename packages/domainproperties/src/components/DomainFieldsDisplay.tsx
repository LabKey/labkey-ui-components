/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { Panel } from 'react-bootstrap'
import { Grid } from '@glass/base'

import { DomainDesign } from "../models";
import { DOMAIN_FIELD_COLS } from "../constants";

type Props = {
    domain: DomainDesign,
    title?: string
}

export class DomainFieldsDisplay extends React.Component<Props, any> {

    render() {
        const { domain, title } = this.props;
        const { name, description, fields } = domain;

        return (
            <Panel>
                <Panel.Heading>
                    <div className={"panel-title"}>{title || name}</div>
                </Panel.Heading>
                <Panel.Body>
                    <p>{description}</p>
                    <Grid columns={DOMAIN_FIELD_COLS} data={fields} />
                </Panel.Body>
            </Panel>
        )
    }
}