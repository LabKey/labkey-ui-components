import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';

import './stories.scss';
import { AddEntityButton } from '..';

interface State {
    added: string[];
}

class WrappedAddEntityButton extends React.Component<any, State> {
    constructor(props: any) {
        super(props);

        this.state = {
            added: [],
        };
    }

    onClick = (e: string) => {
        const { added } = this.state;
        added.push('Another');
        this.setState(() => ({ added }));
    };

    renderValues() {
        const { added } = this.state;
        return added.map((val: string, index: number) => {
            return <div key={index}>{val}</div>;
        });
    }

    render() {
        const { disabled, entity, buttonClass, containerClass, getHelperBody, helperTitle, title } = this.props;

        return (
            <>
                {this.renderValues()}
                <AddEntityButton
                    entity={entity}
                    onClick={this.onClick.bind(this)}
                    buttonClass={buttonClass}
                    containerClass={containerClass}
                    helperTitle={helperTitle}
                    helperBody={getHelperBody}
                    disabled={disabled}
                    title={title}
                />
            </>
        );
    }
}

storiesOf('AddEntityButton', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        const entity = text('Entity', 'Entity', 'Entity');
        const helperId = 'ToolTip';
        const showHelper = boolean('Show tooltip', true, helperId);
        const helperBody = text('HelperBody', 'https://www.labkey.org', helperId);
        const getHelperBody = showHelper ? () => helperBody : undefined;
        const helperTitle = text('HelperTitle', undefined, helperId);
        const disabled = boolean('Disabled?', false);
        const title = text('Button title', 'Button title');

        return (
            <WrappedAddEntityButton
                title={title}
                disabled={disabled}
                entity={entity}
                helperTitle={helperTitle}
                getHelperBody={getHelperBody}
            />
        );
    });
