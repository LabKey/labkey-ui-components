import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';

import { LabelOverlay } from '../components/forms/LabelOverlay';
import './stories.scss';
import {ExpandableDndRow} from "..";
import {DragDropContext, Droppable} from "react-beautiful-dnd";

interface RowState {
    expanded?: number
}

class WrappedExpandableDndRow extends React.Component<any, RowState>
{
    constructor(props) {
        super(props);

        this.state = {
            expanded: undefined
        };
    }

    onExpand = (index: number) => {

        if (this.state.expanded === index) {
            this.setState({expanded: undefined});
        }
        else {
            this.setState({expanded: index})
        }
    };

    renderMainRow = () => {
        return (
            <span>This is the main row</span>
        )
    };

    renderExpandedSection = () => {
        return (
            <span>This is the expanded section</span>
        )
    };

    render() {
        const { expanded } = this.state;

        return (
            <DragDropContext onDragEnd={() => {}}>
                <Droppable droppableId='domain-form-droppable'>
                    {(provided) => (
                        <div ref={provided.innerRef}
                             {...provided.droppableProps}>
                            <ExpandableDndRow
                                index={1}
                                isDragDisabled={false}
                                expanded={expanded === 1}
                                dragging={false}
                                onExpand={this.onExpand}
                                renderMainRow={this.renderMainRow}
                                renderExpandedSection={this.renderExpandedSection}
                            />
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        )
    }
}

storiesOf('ExpandableDndRow', module)
    .addDecorator(withKnobs)
    .add("expandable row", () => {
        return (
            <WrappedExpandableDndRow />
        )
    });
