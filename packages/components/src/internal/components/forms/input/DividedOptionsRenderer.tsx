import React, { FC, memo } from 'react';

interface DividedOptionsRendererProps {
    isDivider: boolean;
    label: string;
}

// export for jest testing
export const DividedOptionsRenderer: FC<DividedOptionsRendererProps> = memo(({ label, isDivider }) => {
    if (isDivider) {
        return <hr className="select-options-divider"/>;
    }
    return <div>{label}</div>
});
DividedOptionsRenderer.displayName = 'DividedOptionsRenderer';

export function dividedOptionsRenderer(option) {
    return <DividedOptionsRenderer isDivider={option.data.isDivider} label={option.data.label} />;
}

export function filterDividedOptions(allOptions, selectedOptions): any[] {
    if (!allOptions)
        return [];

    const notSelected = allOptions
        // remove options already selected
        .filter(option => selectedOptions.indexOf(option.value) == -1);
    const options = [];
    // remove dividers that are no longer dividing anything
    let lastDivider = -1;
    notSelected.forEach((option, index) => {
        if (!option.isDivider)
            options.push(option);
        else {
            if (index-1 !== lastDivider && index !== notSelected.length-1) {
                options.push(option);
            }
            lastDivider = index
        }
    });
    return options;
}
