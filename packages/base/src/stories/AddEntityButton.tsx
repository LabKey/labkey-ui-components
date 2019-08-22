import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'

import './stories.scss'
import {AddEntityButton} from "..";

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
        const { entity, buttonClass, containerClass, moreInfoUrl } = this.props;

        return (
            <>
                {this.renderValues()}
                <AddEntityButton
                    entity={entity}
                    onClick={this.onClick.bind(this)}
                    buttonClass={buttonClass}
                    containerClass={containerClass}
                    helperBody={moreInfoUrl} />
            </>
        );
    }
}

storiesOf("AddEntityButton", module)
    .addDecorator(withKnobs)
    .add("with knobs", () => {
        return <WrappedAddEntityButton entity={"Entity"} />
    })
    .add("with More Info", () => {
        return <WrappedAddEntityButton entity={"Entity"} moreInfoUrl={()=>"https://www.labkey.org"}/>
    })
;