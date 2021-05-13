import React, { PureComponent, ReactNode } from 'react';
import { Button, Panel, Checkbox, DropdownButton } from 'react-bootstrap';
import { Map } from 'immutable';

import { LineageFilter, LineageGraph, LINEAGE_GROUPING_GENERATIONS, VisGraphNode, LINEAGE_DIRECTIONS } from '../../..';
import { SAMPLE_ALIQUOT_PROTOCOL_LSID } from '../lineage/constants';

interface Props {
    sampleLsid: string;
    goToLineageGrid: () => void;
    onLineageNodeDblClick: (node: VisGraphNode) => void;
    groupTitles?: Map<LINEAGE_DIRECTIONS, Map<string, string>>;
}

interface State {
    includeDerivative: boolean;
    includeAliquot: boolean;
    includeSources: boolean;
}

export class SampleLineageGraph extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            includeDerivative: true,
            includeAliquot: true,
            includeSources: true,
        };
    }

    handleCheckboxChange = (evt, key: string) => {
        const filter = {};
        const check = evt.target.checked;
        filter[key] = check;

        if (key === 'includeDerivative' && !check) {
            filter['includeSources'] = false;
        }
        this.setState(() => filter);
    };

    isIncludeAll = () => {
        const { includeDerivative, includeAliquot, includeSources } = this.state;
        return (
            (includeDerivative && includeAliquot && includeSources) ||
            (!includeDerivative && !includeAliquot && !includeSources)
        );
    };

    getLineageFilters = (): LineageFilter[] => {
        const { includeSources, includeDerivative, includeAliquot } = this.state;

        const filters = [];
        const typeValues = includeSources || this.isIncludeAll() ? ['Sample', 'Data'] : ['Sample'];
        filters.push(new LineageFilter('type', typeValues));

        if (includeDerivative && !includeAliquot)
            filters.push(new LineageFilter('materialLineageType', ['RootMaterial', 'Derivative', undefined]));

        return filters;
    };

    getRunProtocolLsid = (): string => {
        const { includeDerivative, includeAliquot } = this.state;

        if (!includeDerivative && includeAliquot) return SAMPLE_ALIQUOT_PROTOCOL_LSID;

        return undefined;
    };

    createItem(key, label, checked, disabled?: boolean): ReactNode {
        return (
            <li key={key}>
                <Checkbox
                    checked={checked}
                    disabled={disabled}
                    className="dropdown-menu-row"
                    onChange={evt => this.handleCheckboxChange(evt, key)}
                    id={'checkbox-' + key}
                    name={key}
                >
                    {label}
                </Checkbox>
            </li>
        );
    }

    getFilterMenu(): ReactNode[] {
        const { includeDerivative, includeAliquot, includeSources } = this.state;

        const items = [];

        items.push(this.createItem('includeDerivative', 'Derivatives ', includeDerivative));
        items.push(this.createItem('includeSources', 'Source Parents ', includeSources, !includeDerivative));
        items.push(this.createItem('includeAliquot', 'Aliquots', includeAliquot));

        return items;
    }

    renderFilter() {
        return (
            <span className="gridbar-button-spacer">
                <DropdownButton id="lineage-type-filter" pullRight title="Filter">
                    {this.getFilterMenu()}
                </DropdownButton>
            </span>
        );
    }

    render() {
        const { sampleLsid, goToLineageGrid, onLineageNodeDblClick, groupTitles } = this.props;
        return (
            <Panel>
                <Panel.Body>
                    <Button bsStyle="success" onClick={goToLineageGrid}>
                        Go to Lineage Grid
                    </Button>
                    {this.renderFilter()}
                    <LineageGraph
                        lsid={sampleLsid}
                        grouping={{ generations: LINEAGE_GROUPING_GENERATIONS.Specific }}
                        filters={this.getLineageFilters()}
                        navigate={onLineageNodeDblClick}
                        groupTitles={groupTitles}
                        runProtocolLsid={this.getRunProtocolLsid()}
                    />
                </Panel.Body>
            </Panel>
        );
    }
} //
