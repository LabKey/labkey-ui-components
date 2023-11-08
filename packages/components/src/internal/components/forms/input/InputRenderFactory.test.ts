import { QueryColumn } from '../../../../public/QueryColumn';

import { AssayTaskInputRenderer } from './AssayTaskInput';

import { AliasGridInput, AliasInput } from './AliasInput';
import { SampleStatusInputRenderer } from './SampleStatusInput';
import { AppendUnitsInput } from './AppendUnitsInput';

import { resolveInputRenderer } from './InputRenderFactory';

describe('resolveInputRenderer', () => {
    const column = new QueryColumn({
        name: 'resolveInputRendererTestColumn',
    });

    test('appendunitsinput', () => {
        column.inputRenderer = 'appendunitsinput';
        expect(resolveInputRenderer(column)).toEqual(AppendUnitsInput);
        expect(resolveInputRenderer(column, true)).toBeUndefined();
    });

    test('experimentalias', () => {
        column.inputRenderer = 'experimentalias';
        expect(resolveInputRenderer(column)).toEqual(AliasInput);
        expect(resolveInputRenderer(column, true)).toEqual(AliasGridInput);
    });

    test('samplestatusinput', () => {
        column.inputRenderer = 'samplestatusinput';
        const AppendUnitsInputComponent = resolveInputRenderer(column);
        expect(AppendUnitsInputComponent).toEqual(SampleStatusInputRenderer);
    });

    test('workflowtask', () => {
        column.inputRenderer = 'workflowtask';
        const AppendUnitsInputComponent = resolveInputRenderer(column);
        expect(AppendUnitsInputComponent).toEqual(AssayTaskInputRenderer);
    });
});
