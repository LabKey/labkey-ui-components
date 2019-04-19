/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'

import DomainForm from "../components/DomainForm";
import { DomainDesign } from "../models";
import data from "../test/data/property-getDomain.json";
import './stories.scss'

class DomainFormContainer extends React.PureComponent<any, any> {
    constructor(props) {
        super(props);

        this.state = {
            domain: new DomainDesign(data),
        };
    }

    onChange = () => {
        console.log('onchange');
    };

    render() {
        const { domain } = this.state;

        return (
            <DomainForm domain={domain} onChange={this.onChange}/>
        )
    }
}

storiesOf("DomainForm", module)
    .addDecorator(withKnobs)
    .add("with empty domain", () => {
        const domain = new DomainDesign();

        return (
            <DomainForm domain={domain}/>
        )
    })
    .add("with domain properties", () => {
        return (
            <DomainFormContainer/>
        )
    });