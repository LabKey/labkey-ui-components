import React, { ChangeEvent, FC, memo, useCallback, useEffect, useState } from 'react';

import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { LINEAGE_GROUPING_GENERATIONS, LineageOptions } from './types';
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

interface Props extends LineageOptions {
    onSettingsChange: (options: LineageOptions) => void;
    options?: LineageOptions;
}

export const LineageSettings: FC<Props> = memo(props => {
    const { onSettingsChange } = props;
    const [options, setOptions] = useState<LineageOptions>(() => {
        if (props.options) return props.options;
        return { filters: props.filters, grouping: props.grouping, originalFilters: props.filters };
    });

    useEffect(() => {
        onSettingsChange(options);
    }, [onSettingsChange, options]);

    const onFilterChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
        const { checked, name } = evt.target;
        setOptions(options_ => {
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
    }, []);

    const onGenerationChange = useCallback((name, value) => {
        setOptions(options_ => ({ ...options_, grouping: { ...options_.grouping, generations: value } }));
    }, []);

    const onGroupingChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = evt.target;
        setOptions(options_ => ({
            ...options_,
            grouping: { ...options_.grouping, [name]: value },
        }));
    }, []);

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
                                up to the "parentDepth" or "childDepth" specified.
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

                <PanelFieldLabel>Child Depth (0-5)</PanelFieldLabel>
                <input
                    defaultValue={options.grouping?.childDepth ?? DEFAULT_GROUPING_OPTIONS.childDepth}
                    className="form-control"
                    max={5}
                    min={0}
                    name="childDepth"
                    onChange={onGroupingChange}
                    style={{ marginBottom: '16px', maxWidth: '100px' }}
                    type="number"
                />

                <PanelFieldLabel>Parent Depth (0-5)</PanelFieldLabel>
                <input
                    defaultValue={options.grouping?.parentDepth ?? DEFAULT_GROUPING_OPTIONS.childDepth}
                    className="form-control"
                    max={5}
                    min={0}
                    name="parentDepth"
                    onChange={onGroupingChange}
                    style={{ marginBottom: '16px', maxWidth: '100px' }}
                    type="number"
                />

                <PanelFieldLabel>Combine Edges Threshold</PanelFieldLabel>
                <input
                    defaultValue={options.grouping?.combineSize ?? DEFAULT_GROUPING_OPTIONS.combineSize}
                    className="form-control"
                    min={0}
                    name="combineSize"
                    onChange={onGroupingChange}
                    style={{ marginBottom: '16px', maxWidth: '100px' }}
                    type="number"
                />
            </div>

            <div className="job-overview__section">
                <div className="job-overview__section-header">Filters</div>

                {options.originalFilters?.map(filter => {
                    return (
                        <div key={filter.field}>
                            <input defaultChecked onChange={onFilterChange} name={filter.field} type="checkbox" />
                            <span style={{ marginLeft: '5px' }}>
                                {filter.field} = {filter.value.join(' OR ')}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

LineageSettings.displayName = 'LineageSettings';
