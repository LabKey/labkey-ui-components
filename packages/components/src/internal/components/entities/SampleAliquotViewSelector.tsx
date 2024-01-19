import React, { Component, ReactNode } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { List } from 'immutable';

import { ALIQUOT_FILTER_MODE } from '../samples/constants';
import { generateId } from '../../util/utils';

interface Props {
    aliquotFilterMode: ALIQUOT_FILTER_MODE;
    aliquotsLabel?: string;
    allLabel?: string;
    headerLabel?: string;
    samplesLabel?: string;
    updateAliquotFilter: (newMode?: ALIQUOT_FILTER_MODE) => any;
}

export class SampleAliquotViewSelector extends Component<Props> {
    dropId: string;

    static defaultProps = {
        aliquotFilterMode: ALIQUOT_FILTER_MODE.all,
        headerLabel: 'Show Samples',
        samplesLabel: 'Samples Only',
        aliquotsLabel: 'Aliquots Only',
        allLabel: 'Samples and Aliquots',
    };

    constructor(props: Props) {
        super(props);

        this.dropId = generateId('aliquotviewselector-');
    }

    getTitle(mode: ALIQUOT_FILTER_MODE) {
        const { samplesLabel, aliquotsLabel } = this.props;
        switch (mode) {
            case ALIQUOT_FILTER_MODE.samples:
                return samplesLabel;
            case ALIQUOT_FILTER_MODE.aliquots:
                return aliquotsLabel;
            case ALIQUOT_FILTER_MODE.none:
                return 'None';
            default:
                return 'All Samples';
        }
    }

    // TODO: convert createItem to component (ViewMenuItem?)
    createItem = (key: string, label: string, targetMode: ALIQUOT_FILTER_MODE, active: boolean): ReactNode => {
        const { updateAliquotFilter } = this.props;
        return (
            <MenuItem active={active} key={key} onSelect={() => updateAliquotFilter(targetMode)}>
                {label}
            </MenuItem>
        );
    };

    createMenuItems(filterMode: ALIQUOT_FILTER_MODE): List<ReactNode> {
        const { headerLabel, samplesLabel, aliquotsLabel, allLabel } = this.props;

        const items = List<ReactNode>().asMutable();
        items.push(
            <MenuItem header key="aliquot-selector-header">
                {headerLabel}
            </MenuItem>
        );

        items.push(this.createItem('all', allLabel, ALIQUOT_FILTER_MODE.all, filterMode === ALIQUOT_FILTER_MODE.all));
        items.push(
            this.createItem(
                'sample',
                samplesLabel,
                ALIQUOT_FILTER_MODE.samples,
                filterMode === ALIQUOT_FILTER_MODE.samples
            )
        );
        items.push(
            this.createItem(
                'aliquot',
                aliquotsLabel,
                ALIQUOT_FILTER_MODE.aliquots,
                filterMode === ALIQUOT_FILTER_MODE.aliquots
            )
        );

        return items.asImmutable();
    }

    render(): ReactNode {
        const { aliquotFilterMode } = this.props;

        const viewItems = this.createMenuItems(aliquotFilterMode);

        return (
            <DropdownButton id={this.dropId} pullRight title={this.getTitle(aliquotFilterMode)}>
                {viewItems.toArray()}
            </DropdownButton>
        );
    }
}
