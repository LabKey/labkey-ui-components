import React, { ChangeEvent, FC, memo, useCallback, useRef, useState } from 'react';

import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { LINEAGE_GROUPING_GENERATIONS, LineageFilter, LineageOptions } from './types';
import { DEFAULT_GROUPING_OPTIONS } from './constants';

const generations: SelectInputOption[] = [
    { label: 'All', value: LINEAGE_GROUPING_GENERATIONS.All },
    { label: 'Multi', value: LINEAGE_GROUPING_GENERATIONS.Multi },
    { label: 'Nearest', value: LINEAGE_GROUPING_GENERATIONS.Nearest },
    { label: 'Specific', value: LINEAGE_GROUPING_GENERATIONS.Specific },
];

interface PanelFieldLabelProps {
    className?: string;
}

export const PanelFieldLabel: FC<PanelFieldLabelProps> = memo(({ children, className }) => (
    <div className="panel-field-label">
        <label className={className}>{children}</label>
    </div>
));

interface LineageSettingsOptions extends LineageOptions {
    originalFilters?: LineageFilter[];
}

interface Props extends LineageOptions {
    onSettingsChange: (options: LineageOptions) => void;
    options?: LineageOptions;
}

export const LineageSettings: FC<Props> = memo(props => {
    const { onSettingsChange } = props;
    const [options, setOptions] = useState<LineageSettingsOptions>(() => {
        if (props.options) return props.options;
        return { filters: props.filters, grouping: props.grouping, originalFilters: props.filters };
    });
    const changeRef = useRef(undefined);

    const applyOptions = useCallback(
        (cb: (options: LineageSettingsOptions) => LineageSettingsOptions) => {
            const options_ = cb(options);
            setOptions(options_);

            if (changeRef.current !== undefined) {
                clearTimeout(changeRef.current);
                changeRef.current = undefined;
            }

            changeRef.current = setTimeout(() => {
                onSettingsChange(options_);
            }, 500);
        },
        [onSettingsChange, options]
    );

    const onFilterChange = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            const { checked, name } = evt.target;
            applyOptions(options_ => {
                const { originalFilters } = options_;
                let { filters } = options_;

                if (checked) {
                    const filter = originalFilters.find(f => f.field === name);
                    if (filter) {
                        filters.push(filter);
                    }
                } else {
                    filters = filters.filter(f => f.field !== name);
                }

                return { ...options_, filters };
            });
        },
        [applyOptions]
    );

    const onGenerationChange = useCallback(
        (name, value) => {
            applyOptions(options_ => ({ ...options_, grouping: { ...options_.grouping, generations: value } }));
        },
        [applyOptions]
    );

    const onGroupingChange = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            const { name, value } = evt.target;
            applyOptions(options_ => ({
                ...options_,
                grouping: { ...options_.grouping, [name]: value },
            }));
        },
        [applyOptions]
    );

    return (
        <div>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: '15px' }}>Graph Options</div>
            <div className="job-overview__section">
                <div className="job-overview__section-header">Grouping</div>

                <PanelFieldLabel>
                    Generations
                    <LabelHelpTip placement="bottom" title="Generations">
                        <ul style={{ listStyle: 'none', marginLeft: 0, paddingLeft: 0 }}>
                            <li>
                                <span style={{ fontWeight: 'bold' }}>All</span> - Include all nodes from the seed
                                available in the lineage response.
                            </li>
                            <li>
                                <span style={{ fontWeight: 'bold' }}>Multi</span> - Include all nodes from the seed
                                until a depth is found that contains multiple nodes..
                            </li>
                            <li>
                                <span style={{ fontWeight: 'bold' }}>Nearest</span> - Include only the immediately
                                connected nodes from the seed.
                            </li>
                            <li>
                                <span style={{ fontWeight: 'bold' }}>Specific</span> - Include all nodes from the seed
                                up to the "Parent Generations" or "Child Generations" specified.
                            </li>
                        </ul>
                    </LabelHelpTip>
                </PanelFieldLabel>
                <SelectInput
                    clearable={false}
                    name="generations"
                    onChange={onGenerationChange}
                    options={generations}
                    customStyles={{ marginBottom: '16px' }}
                    value={options.grouping?.generations ?? DEFAULT_GROUPING_OPTIONS.generations}
                />

                <PanelFieldLabel>
                    Child Generations
                    <LabelHelpTip placement="bottom" title="Child Generations">
                        <div style={{ maxWidth: '350px' }}>
                            The number of descendant generations to render from the seed node. Only applies when
                            Generations is set to "Specific".
                            <div>
                                <b>Note:</b> A maximum of {DEFAULT_GROUPING_OPTIONS.childDepth * 2} generations are
                                requested from the server.
                            </div>
                        </div>
                    </LabelHelpTip>
                </PanelFieldLabel>
                <input
                    defaultValue={options.grouping?.childDepth ?? DEFAULT_GROUPING_OPTIONS.childDepth}
                    className="form-control"
                    max={DEFAULT_GROUPING_OPTIONS.childDepth * 2}
                    min={0}
                    name="childDepth"
                    onChange={onGroupingChange}
                    style={{ marginBottom: '16px', maxWidth: '100px' }}
                    type="number"
                />

                <PanelFieldLabel>
                    Parent Generations
                    <LabelHelpTip placement="bottom" title="Parent Generations">
                        <div style={{ maxWidth: '350px' }}>
                            The number of ancestor generations to render from the seed node. Only applies when
                            Generations is set to "Specific".
                            <div>
                                <b>Note:</b> A maximum of {DEFAULT_GROUPING_OPTIONS.childDepth * 2} generations are
                                requested from the server.
                            </div>
                        </div>
                    </LabelHelpTip>
                </PanelFieldLabel>
                <input
                    defaultValue={options.grouping?.parentDepth ?? DEFAULT_GROUPING_OPTIONS.parentDepth}
                    className="form-control"
                    max={DEFAULT_GROUPING_OPTIONS.parentDepth * 2}
                    min={0}
                    name="parentDepth"
                    onChange={onGroupingChange}
                    style={{ marginBottom: '16px', maxWidth: '100px' }}
                    type="number"
                />

                <PanelFieldLabel>
                    Combine Generation Threshold
                    <LabelHelpTip placement="bottom" title="Combine Generation Threshold">
                        <div style={{ maxWidth: '350px' }}>
                            If the number of nodes in a generation is greater than or equal to this threshold, then all
                            the nodes in this generation will be combined into a single node.
                        </div>
                    </LabelHelpTip>
                </PanelFieldLabel>
                <input
                    defaultValue={options.grouping?.combineSize ?? DEFAULT_GROUPING_OPTIONS.combineSize}
                    className="form-control"
                    min={2}
                    name="combineSize"
                    onChange={onGroupingChange}
                    style={{ marginBottom: '16px', maxWidth: '100px' }}
                    type="number"
                />

                <PanelFieldLabel>
                    Combine Type Threshold
                    <LabelHelpTip placement="bottom" title="Combine Type Threshold">
                        <div style={{ maxWidth: '350px' }}>
                            If the number of nodes of a common type in a generation is greater than or equal to this
                            threshold, then all the nodes of a common type in a generation will be combined into a
                            single node.
                        </div>
                    </LabelHelpTip>
                </PanelFieldLabel>
                <input
                    defaultValue={options.grouping?.combineTypeSize ?? DEFAULT_GROUPING_OPTIONS.combineTypeSize}
                    className="form-control"
                    min={2}
                    name="combineTypeSize"
                    onChange={onGroupingChange}
                    style={{ marginBottom: '16px', maxWidth: '100px' }}
                    type="number"
                />
            </div>

            <div className="job-overview__section">
                <div className="job-overview__section-header">
                    Filters
                    <LabelHelpTip placement="bottom" title="Filters">
                        <div style={{ maxWidth: '350px' }}>
                            Some lineage views provide default filters specified by the application. Toggle filters to
                            change which nodes are displayed in the graph.
                        </div>
                    </LabelHelpTip>
                </div>

                {options.originalFilters?.map(filter => (
                    <div key={filter.field}>
                        <input defaultChecked onChange={onFilterChange} name={filter.field} type="checkbox" />
                        <span style={{ marginLeft: '5px' }}>
                            {filter.field} = {filter.value.join(' OR ')}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
});

LineageSettings.displayName = 'LineageSettings';
