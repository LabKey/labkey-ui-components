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
import errorData from "../test/data/property-saveDomainErrors.json";
import './stories.scss'

interface Props {
    data: {}
    helpNoun?: any
    helpURL?: any
}

class DomainFormContainer extends React.PureComponent<Props, any> {
    constructor(props: Props) {
        super(props);

        this.state = {
            domain: DomainDesign.create(props.data),
        };
    }

    onChange = (newDomain: DomainDesign) => {
        this.setState(() => ({
            domain: newDomain
        }));
    };

    render() {
        const { domain } = this.state;

        return (
            <DomainForm
                {...this.props}
                domain={domain}
                onChange={this.onChange}
            />
        )
    }
}

storiesOf("DomainForm", module)
    .addDecorator(withKnobs)
    .add("with empty domain", () => {
        return (
            <DomainFormContainer
                data={undefined}
                helpNoun={text('helpNoun', undefined)}
                helpURL={text('helpURL', undefined)}
            />
        )
    })
    .add("with domain properties", () => {
        return (
            <DomainFormContainer
                data={data}
            />
        )
    })
    .add("with domain property errors", () => {
        return (
            <DomainFormContainer
                data={errorData}
            />
        )
    });