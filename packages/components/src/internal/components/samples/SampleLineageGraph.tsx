import React, { PureComponent, ReactNode } from 'react';
import { Button, Checkbox, DropdownButton, Panel } from 'react-bootstrap';
import { Map } from 'immutable';

import {
    LINEAGE_DIRECTIONS,
    LINEAGE_GROUPING_GENERATIONS,
    LineageFilter,
    LineageGraph,
    LineageGroupingOptions,
    VisGraphNode,
} from '../../..';
import { DEFAULT_LINEAGE_DISTANCE, SAMPLE_ALIQUOT_PROTOCOL_LSID } from '../lineage/constants';
import { LineageDepthLimitMessage } from '../lineage/LineageGraph';

interface Props {
    sampleLsid: string;
    sampleID: string;
    seedContainer: string;
    goToLineageGrid: () => void;
    onLineageNodeDblClick: (node: VisGraphNode) => void;
    groupTitles?: Map<LINEAGE_DIRECTIONS, Map<string, string>>;
    groupingOptions?: LineageGroupingOptions;
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
        const {
            sampleLsid,
            sampleID,
            seedContainer,
            goToLineageGrid,
            onLineageNodeDblClick,
            groupTitles,
            groupingOptions,
        } = this.props;

        const grouping = {
            ...(groupingOptions ?? { childDepth: DEFAULT_LINEAGE_DISTANCE }),
            generations: LINEAGE_GROUPING_GENERATIONS.Specific,
        };
        return (
            <Panel>
                <Panel.Body>
                    <Button bsStyle="success" onClick={goToLineageGrid}>
                        Go to Lineage Grid
                    </Button>
                    {this.renderFilter()}

                    <LineageGraph
                        lsid={sampleLsid}
                        grouping={grouping}
                        filters={this.getLineageFilters()}
                        navigate={onLineageNodeDblClick}
                        groupTitles={groupTitles}
                        runProtocolLsid={this.getRunProtocolLsid()}
                        seedContainer={seedContainer}
                    />
                    <LineageDepthLimitMessage maxDistance={grouping.childDepth} nodeName={sampleID} />
                </Panel.Body>
            </Panel>
        );
    }
}
