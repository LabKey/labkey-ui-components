import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';

import './stories.scss';
import { AddEntityButton } from '..';

interface State {
    added: Array<string>
}

class WrappedAddEntityButton extends React.Component<any, State>
{
    constructor(props: any) {
        super(props);

        this.state = {
            added: []
        }
    }

    onClick = (e: string) => {
        const {added} = this.state;
        added.push("Another");
        this.setState(() => ({added}));
    };

    renderValues() {
        const {added} = this.state;
        return (added.map( (val: string, index:number) => {
            return (<div key={index}>{val}</div>);
        }));
    }

    render() {
        const { entity, buttonClass, containerClass, getHelperBody, helperTitle } = this.props;

        return (
            <>
                {this.renderValues()}
                <AddEntityButton
                    entity={entity}
                    onClick={this.onClick.bind(this)}
                    buttonClass={buttonClass}
                    containerClass={containerClass}
                    helperTitle={helperTitle}
                    helperBody={getHelperBody} />
            </>
        );
    }
}

storiesOf("AddEntityButton", module)
    .addDecorator(withKnobs)
    .add("with knobs", () => {
        const entity = text("Entity", 'Entity', 'Entity');
        const helperId = 'ToolTip';
        const showHelper = boolean('Show tooltip', true, helperId);
        const helperBody = text('HelperBody', "https://www.labkey.org", helperId);
        const getHelperBody = showHelper ? () => helperBody : undefined;
        const helperTitle = text('HelperTitle', undefined, helperId);

        return <WrappedAddEntityButton entity={entity} helperTitle={helperTitle} getHelperBody={getHelperBody} />
    })
;
