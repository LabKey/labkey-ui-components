import React, { FC, memo, useMemo, useCallback, ReactNode } from 'react';

interface AssayContainerLocationProps {
    locations: { [key: string]: string };
    onChange: (value: string) => void;
    selected: string;
}

export const AssayContainerLocation: FC<AssayContainerLocationProps> = memo(props => {
    const { locations, selected, onChange } = props;

    const options = useMemo((): ReactNode => {
        const options_ = [];
        if (locations) {
            Object.entries(locations).forEach(([key, value]) => {
                options_.push(
                    <option key={key} value={key}>
                        {value}
                    </option>
                );
            });
        }
        return options_;
    }, [locations]);

    const onSelectChange = useCallback(
        e => {
            onChange(e.target.value);
        },
        [onChange]
    );

    return (
        <>
            <div className="margin-bottom">
                <b>Assay Location</b>
            </div>
            <p>Choose where the assay will be used and visible within subfolders.</p>
            <select
                id="assay-type-select-container"
                value={selected}
                onChange={onSelectChange}
                className="form-control"
            >
                {options}
            </select>
        </>
    );
});

AssayContainerLocation.displayName = 'AssayContainerLocation';
