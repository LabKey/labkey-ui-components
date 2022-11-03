import { QueryColumn } from '../../../../public/QueryColumn';

import { AssayTaskInputRenderer } from './AssayTaskInput';

import { AliasInput } from './AliasInput';
import { SampleStatusInputRenderer } from './SampleStatusInput';
import { AppendUnitsInput } from './AppendUnitsInput';

import { resolveInputRenderer } from './InputRenderFactory';

describe('resolveInputRenderer', () => {
    const column = QueryColumn.create({
        name: 'resolveInputRendererTestColumn',
    });

    test('appendunitsinput', () => {
        const appendUnitsCol = column.set('inputRenderer', 'appendunitsinput') as QueryColumn;
        const AppendUnitsInputComponent = resolveInputRenderer(appendUnitsCol);
        expect(AppendUnitsInputComponent).toEqual(AppendUnitsInput);
    });

    test('experimentalias', () => {
        const appendUnitsCol = column.set('inputRenderer', 'experimentalias') as QueryColumn;
        const AppendUnitsInputComponent = resolveInputRenderer(appendUnitsCol);
        expect(AppendUnitsInputComponent).toEqual(AliasInput);
    });

    test('samplestatusinput', () => {
        const appendUnitsCol = column.set('inputRenderer', 'samplestatusinput') as QueryColumn;
        const AppendUnitsInputComponent = resolveInputRenderer(appendUnitsCol);
        expect(AppendUnitsInputComponent).toEqual(SampleStatusInputRenderer);
    });

    test('workflowtask', () => {
        const appendUnitsCol = column.set('inputRenderer', 'workflowtask') as QueryColumn;
        const AppendUnitsInputComponent = resolveInputRenderer(appendUnitsCol);
        expect(AppendUnitsInputComponent).toEqual(AssayTaskInputRenderer);
    });
});
