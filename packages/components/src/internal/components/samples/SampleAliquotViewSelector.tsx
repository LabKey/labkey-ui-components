import React, { Component, ReactNode } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { List } from 'immutable';

import { generateId } from '../../..';

export enum ALIQUOT_FILTER_MODE {
    all='all',
    samples='samples',
    aliquots='aliquots',
    none='none', // when using omni filter with 'is blank'
}

interface Props {
    aliquotFilterMode: ALIQUOT_FILTER_MODE
    updateAliquotFilter: (newMode?: ALIQUOT_FILTER_MODE) => any
    selectorHeader?: string
}

export class SampleAliquotViewSelector extends Component<Props> {
    dropId: string;

    static defaultProps = {
        aliquotFilterMode: ALIQUOT_FILTER_MODE.all,
        selectorHeader: 'Show Samples'
    };

    constructor(props: Props) {
        super(props);

        this.dropId = generateId('aliquotviewselector-');
    }

    getTitle(mode: ALIQUOT_FILTER_MODE) {
        switch (mode) {
            case ALIQUOT_FILTER_MODE.samples:
                return 'Samples Only';
            case ALIQUOT_FILTER_MODE.aliquots:
                return 'Aliquots Only';
            case ALIQUOT_FILTER_MODE.none:
                return 'None';
            default:
                return 'All Samples';
        }
    }

    createItem = (key: string, label: string, targetMode: ALIQUOT_FILTER_MODE, active: boolean): ReactNode => {
        const { updateAliquotFilter } = this.props;
        return (
            <MenuItem active={active} key={key} onSelect={() => updateAliquotFilter(targetMode)}>
                {label}
            </MenuItem>
        );
    };

    createMenuItems(filterMode: ALIQUOT_FILTER_MODE): List<ReactNode> {
        const { selectorHeader } = this.props;

        const items = List<ReactNode>().asMutable();
        items.push(
            <MenuItem header key="aliquot-selector-header">
                {selectorHeader}
            </MenuItem>
        );

        items.push(this.createItem('all', 'Samples and Aliquots', ALIQUOT_FILTER_MODE.all, filterMode == ALIQUOT_FILTER_MODE.all));
        items.push(this.createItem('sample', 'Samples Only', ALIQUOT_FILTER_MODE.samples, filterMode == ALIQUOT_FILTER_MODE.samples));
        items.push(this.createItem('aliquot', 'Aliquots Only', ALIQUOT_FILTER_MODE.aliquots, filterMode == ALIQUOT_FILTER_MODE.aliquots));

        return items.asImmutable();
    }

    render(): ReactNode {
        const { aliquotFilterMode } = this.props;

        const viewItems = this.createMenuItems(aliquotFilterMode);

        return (
            <span className="gridbar-button-spacer">
                <DropdownButton id={this.dropId} pullRight title={this.getTitle(aliquotFilterMode)}>
                    {viewItems.toArray()}
                </DropdownButton>
            </span>
        );
    }
}
