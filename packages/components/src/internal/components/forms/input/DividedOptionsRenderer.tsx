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
    let hasPreviousSection = false;
    let pendingDivider;
    notSelected.forEach((option, index) => {
        if (!option.isDivider) {
            if (pendingDivider) {
                options.push(pendingDivider);
                pendingDivider = undefined;
            }
            options.push(option);
            hasPreviousSection = true;
        } else {
            if (hasPreviousSection) {
                pendingDivider = option;
                hasPreviousSection = false;
            }
        }
    });
    return options;
}
