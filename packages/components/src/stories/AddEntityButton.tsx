import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';

import './stories.scss';

import { AddEntityButton, AddEntityButtonProps } from '../internal/components/buttons/AddEntityButton';

type WrappedAddEntityButtonProps = Omit<AddEntityButtonProps, 'onClick'>;

interface State {
    added: string[];
}

class WrappedAddEntityButton extends React.Component<WrappedAddEntityButtonProps, State> {
    constructor(props: any) {
        super(props);

        this.state = {
            added: [],
        };
    }

    onClick = (): void => {
        const { added } = this.state;
        added.push('Another');
        this.setState(() => ({ added }));
    };

    render() {
        const { added } = this.state;

        return (
            <>
                {added.map((val: string, index: number) => (
                    <div key={index}>{val}</div>
                ))}
                <AddEntityButton {...this.props} onClick={this.onClick} />
            </>
        );
    }
}

storiesOf('AddEntityButton', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        const entity = text('Entity', 'Entity', 'Entity');
        const helperId = 'ToolTip';
        const helperBody = text('HelperBody', 'https://www.labkey.org', helperId);
        const helperTitle = text('HelperTitle', undefined, helperId);
        const disabled = boolean('Disabled?', false);
        const title = text('Button title', 'Button title');

        return (
            <WrappedAddEntityButton
                disabled={disabled}
                entity={entity}
                helperBody={helperBody}
                helperTitle={helperTitle}
                title={title}
            />
        );
    });
