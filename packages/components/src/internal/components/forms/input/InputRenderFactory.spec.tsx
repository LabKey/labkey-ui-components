import { QueryColumn } from '../../../../public/QueryColumn';

import { AssayTaskInputRenderer } from './AssayTaskInput';

import { AliasInput } from './AliasInput';
import { SampleStatusInputRenderer } from './SampleStatusInput';
import { AppendUnitsInput } from './AppendUnitsInput';

import { resolveInputRenderer } from './InputRenderFactory';

describe('resolveInputRenderer', () => {
    const column = new QueryColumn({
        name: 'resolveInputRendererTestColumn',
    });

    test('appendunitsinput', () => {
        column.inputRenderer = 'appendunitsinput';
        const AppendUnitsInputComponent = resolveInputRenderer(column);
        expect(AppendUnitsInputComponent).toEqual(AppendUnitsInput);
    });

    test('experimentalias', () => {
        column.inputRenderer = 'experimentalias';
        const AppendUnitsInputComponent = resolveInputRenderer(column);
        expect(AppendUnitsInputComponent).toEqual(AliasInput);
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
