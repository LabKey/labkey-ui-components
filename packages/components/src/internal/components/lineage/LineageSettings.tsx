import React, { ChangeEvent, FC, memo, useCallback, useMemo, useRef, useState } from 'react';

import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { LINEAGE_GROUPING_GENERATIONS, LineageFilter, LineageOptions } from './types';
import { DEFAULT_GROUPING_OPTIONS, GROUPING_COMBINED_SIZE_MIN } from './constants';

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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow
        const { onSettingsChange, options, ...optionProps } = props;
        if (options) return options;
        return { ...optionProps, originalFilters: optionProps.filters ? [...optionProps.filters] : [] };
    });
    const generations = useMemo<SelectInputOption[]>(() => {
        const generations_ = [];
        // eslint-disable-next-line guard-for-in
        for (const value in LINEAGE_GROUPING_GENERATIONS) {
            generations_.push({ label: value, value: LINEAGE_GROUPING_GENERATIONS[value] });
        }
        return generations_;
    }, []);
    const changeRef = useRef(undefined);

    const applyOptions = useCallback(
        (cb: (options: LineageSettingsOptions) => LineageSettingsOptions) => {
            const options_ = cb(options);
            setOptions(options_);

            if (changeRef.current !== undefined) {
                clearTimeout(changeRef.current);
                changeRef.current = undefined;
            }

            // Debounce here for user input to skip possibly costly graph renders
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
                    if (!filters.find(f => f.field === name)) {
                        const filter = originalFilters.find(f => f.field === name);
                        if (filter) {
                            filters.push(filter);
                        }
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
            const nValue = parseInt(value, 10);
            if (GROUPING_COMBINED_SIZE_MIN < nValue) {
                applyOptions(options_ => ({
                    ...options_,
                    grouping: { ...options_.grouping, [name]: nValue },
                }));
            }
        },
        [applyOptions]
    );

    return (
        <div className="lineage-settings">
            <div className="lineage-settings-heading">Graph Options</div>
            <div className="lineage-settings__section">
                <div className="lineage-settings__section-header">Grouping</div>

                <label>
                    Generations
                    <LabelHelpTip placement="top" title="Generations">
                        <ul className="lineage-settings__tip-list">
                            <li>
                                <b>All</b> - Include all nodes from the seed available in the lineage response.
                            </li>
                            <li>
                                <b>Multi</b> - Include all nodes from the seed until a depth is found that contains
                                multiple nodes.
                            </li>
                            <li>
                                <b>Nearest</b> - Include only the immediately connected nodes from the seed.
                            </li>
                            <li>
                                <b>Specific</b> - Include all nodes from the seed up to the "Parent Generations" or
                                "Child Generations" specified.
                            </li>
                        </ul>
                    </LabelHelpTip>
                </label>
                <SelectInput
                    clearable={false}
                    name="generations"
                    onChange={onGenerationChange}
                    options={generations}
                    value={options.grouping?.generations ?? DEFAULT_GROUPING_OPTIONS.generations}
                />

                <label>
                    Child Generations
                    <LabelHelpTip placement="top" title="Child Generations">
                        <div className="lineage-settings__tip-body">
                            The number of descendant generations to render from the seed node. Only applies when
                            Generations is set to "Specific".
                            <div>
                                <b>Note:</b> This does not affect the number of generations requested from the server.
                            </div>
                        </div>
                    </LabelHelpTip>
                </label>
                <input
                    defaultValue={options.grouping?.childDepth ?? DEFAULT_GROUPING_OPTIONS.childDepth}
                    className="form-control"
                    max={DEFAULT_GROUPING_OPTIONS.childDepth * 2}
                    min={0}
                    name="childDepth"
                    onChange={onGroupingChange}
                    type="number"
                />

                <label>
                    Parent Generations
                    <LabelHelpTip placement="top" title="Parent Generations">
                        <div className="lineage-settings__tip-body">
                            The number of ancestor generations to render from the seed node. Only applies when
                            Generations is set to "Specific".
                            <div>
                                <b>Note:</b> This does not affect the number of generations requested from the server.
                            </div>
                        </div>
                    </LabelHelpTip>
                </label>
                <input
                    defaultValue={options.grouping?.parentDepth ?? DEFAULT_GROUPING_OPTIONS.parentDepth}
                    className="form-control"
                    max={DEFAULT_GROUPING_OPTIONS.parentDepth * 2}
                    min={0}
                    name="parentDepth"
                    onChange={onGroupingChange}
                    type="number"
                />

                <label>
                    Combine Generation Threshold
                    <LabelHelpTip placement="top" title="Combine Generation Threshold">
                        <div className="lineage-settings__tip-body">
                            If the number of nodes in a generation is greater than or equal to this threshold, then all
                            the nodes in this generation will be combined into a single node. Minimum value of{' '}
                            {GROUPING_COMBINED_SIZE_MIN}.
                            <div>
                                <b>Note:</b> Aliquots are combined separately and may appear as a single combined node.
                            </div>
                        </div>
                    </LabelHelpTip>
                </label>
                <input
                    defaultValue={options.grouping?.combineSize ?? DEFAULT_GROUPING_OPTIONS.combineSize}
                    className="form-control"
                    min={GROUPING_COMBINED_SIZE_MIN}
                    name="combineSize"
                    onChange={onGroupingChange}
                    type="number"
                />
            </div>

            <div className="lineage-settings__section">
                <div className="lineage-settings__section-header">
                    Filters
                    <LabelHelpTip placement="top" title="Filters">
                        <div className="lineage-settings__tip-body">
                            Some lineage views provide default filters specified by the application. Toggle filters to
                            change which nodes are displayed in the graph.
                        </div>
                    </LabelHelpTip>
                </div>

                {options.originalFilters.map(filter => (
                    <div key={filter.field}>
                        <input defaultChecked onChange={onFilterChange} name={filter.field} type="checkbox" />
                        <span className="lineage-settings__filter-label">
                            {filter.field} = {filter.value.join(' OR ')}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
});

LineageSettings.displayName = 'LineageSettings';
