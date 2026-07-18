/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ComponentType } from 'react';

import { QueryColumn } from '../../../../public/QueryColumn';

import { InputRendererProps } from './types';
import { AliasGridInput, AliasInput } from './AliasInput';
import { AppendUnitsInput } from './AppendUnitsInput';
import { SampleStatusInputRenderer } from './SampleStatusInput';
import { SampleColorInputRenderer } from './SampleColorInput';
import { AmountUnitInput } from './AmountUnitInput';

export type InputRendererComponent = ComponentType<InputRendererProps>;
export type InputRendererFactory = (col: QueryColumn, isGridInput?: boolean) => InputRendererComponent;

const inputRenderers: Record<string, InputRendererComponent> = {};

export enum InputRenderContext {
    All = 'All',
    Form = 'Form',
    Grid = 'Grid',
}

function getKey(identifier: string, inputRenderContext: InputRenderContext): string {
    return [identifier.toLowerCase(), inputRenderContext].join('|');
}

export function registerInputRenderer(
    identifier: string,
    renderer: InputRendererComponent,
    inputRenderContext = InputRenderContext.All
): void {
    if (inputRenderContext === InputRenderContext.All) {
        inputRenderers[getKey(identifier, InputRenderContext.Form)] = renderer;
        inputRenderers[getKey(identifier, InputRenderContext.Grid)] = renderer;
    } else {
        inputRenderers[getKey(identifier, inputRenderContext)] = renderer;
    }
}

export const resolveInputRenderer: InputRendererFactory = (col, isGridInput = false) => {
    if (col?.inputRenderer) {
        const context = isGridInput ? InputRenderContext.Grid : InputRenderContext.Form;
        return inputRenderers[getKey(col.inputRenderer, context)];
    }
    return undefined;
};

export function registerInputRenderers(): void {
    registerInputRenderer('AppendUnitsInput', AppendUnitsInput, InputRenderContext.Form);
    registerInputRenderer('ExperimentAlias', AliasGridInput, InputRenderContext.Grid);
    registerInputRenderer('ExperimentAlias', AliasInput, InputRenderContext.Form);
    registerInputRenderer('SampleStatusInput', SampleStatusInputRenderer);
    registerInputRenderer('SampleColorInput', SampleColorInputRenderer);
    registerInputRenderer('AmountUnitInput', AmountUnitInput, InputRenderContext.Form);
}
