import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import {
    AddEntityButton as AddEntityButtonComponent,
    AddEntityButtonProps,
} from '../internal/components/buttons/AddEntityButton';

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
                {added.map((val, index) => (
                    <div key={index}>{val}</div>
                ))}
                <AddEntityButtonComponent {...this.props} onClick={this.onClick} />
            </>
        );
    }
}

export default {
    title: 'Components/AddEntityButton',
    component: WrappedAddEntityButton,
} as Meta;

export const AddEntityButton: Story = storyProps => <WrappedAddEntityButton {...storyProps} />;

AddEntityButton.args = {
    disabled: false,
    entity: 'Entity',
    helperBody: 'https://www.labkey.org',
    title: 'Button title',
};
