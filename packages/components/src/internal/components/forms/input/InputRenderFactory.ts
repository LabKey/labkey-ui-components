import { ComponentType } from 'react';

import { QueryColumn } from '../../../../public/QueryColumn';

import { InputRendererProps } from './types';

import { AssayTaskInputRenderer } from './AssayTaskInput';

import { AliasInput } from './AliasInput';
import { SampleStatusInputRenderer } from './SampleStatusInput';
import { AppendUnitsInput } from './AppendUnitsInput';

export type InputRendererFactory = (col: QueryColumn, isGridInput?: boolean) => ComponentType<InputRendererProps>;

export const resolveInputRenderer: InputRendererFactory = (col, isGridInput) => {
    if (col?.inputRenderer) {
        if (typeof col.inputRenderer === 'string') {

            switch (col.inputRenderer.toLowerCase()) {
                case 'appendunitsinput':
                    // AppendUnitsInput does not provide a custom implementation for grids
                    if (isGridInput) return undefined;
                    return AppendUnitsInput;
                case 'experimentalias':
                    return AliasInput;
                case 'samplestatusinput':
                    return SampleStatusInputRenderer;
                case 'workflowtask':
                    return AssayTaskInputRenderer;
                default:
            }
        }

        return col.inputRenderer.toJS();
    }

    // Fall through to default input render handling
    return undefined;
};
