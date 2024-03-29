import React, { FC, memo, useMemo, useCallback, ReactNode } from 'react';

interface AssayContainerLocationProps {
    selected: string;
    locations: { [key: string]: string };
    onChange: (value: string) => void;
}

export const AssayContainerLocation: FC<AssayContainerLocationProps> = memo(props => {
    const { locations, selected, onChange } = props;

    const options = useMemo((): ReactNode => {
        const options = [];
        if (locations) {
            Object.entries(locations).forEach(([key, value]) => {
                options.push(<option key={key} value={key}>{value}</option>);
            });
        }
        return options;
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
