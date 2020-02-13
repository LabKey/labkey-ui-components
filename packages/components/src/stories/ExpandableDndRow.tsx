import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';

import './stories.scss';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import { ExpandableDndRow } from '..';

interface RowState {
    expanded?: number;
}

class WrappedExpandableDndRow extends React.Component<any, RowState> {
    constructor(props) {
        super(props);

        this.state = {
            expanded: undefined,
        };
    }

    onExpand = (index: number): void => {
        if (this.state.expanded === index) {
            this.setState({ expanded: undefined });
        } else {
            this.setState({ expanded: index });
        }
    };

    renderMainRow = (): React.ReactFragment => {
        return <span style={{ marginTop: '15px', marginLeft: '30px' }}>This is the main row</span>;
    };

    renderExpandedSection = (): React.ReactFragment => {
        return (
            <span style={{ height: '100px', paddingLeft: '30px', display: 'table-cell', verticalAlign: 'middle' }}>
                This is the expanded section
            </span>
        );
    };

    render(): React.ReactNode {
        const { expanded } = this.state;

        return (
            <DragDropContext onDragEnd={() => {}}>
                <Droppable droppableId="domain-form-droppable">
                    {provided => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
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
        );
    }
}

storiesOf('ExpandableDndRow', module)
    .addDecorator(withKnobs)
    .add('expandable row', () => {
        return <WrappedExpandableDndRow />;
    });
