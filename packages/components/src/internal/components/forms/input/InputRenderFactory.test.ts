import { FC } from 'react';

import { QueryColumn } from '../../../../public/QueryColumn';

import { InputRenderContext, registerInputRenderer, resolveInputRenderer } from './InputRenderFactory';

describe('InputRenderFactory', () => {
    const AllInput: FC = () => {
        return null;
    };
    const FormInput: FC = () => {
        return null;
    };
    const GridInput: FC = () => {
        return null;
    };

    beforeAll(() => {
        registerInputRenderer('AllInput', AllInput);
        registerInputRenderer('FormInput', FormInput, InputRenderContext.Form);
        registerInputRenderer('GridInput', GridInput, InputRenderContext.Grid);
    });

    test('resolveInputRenderer', () => {
        const allColumn = new QueryColumn({ inputRenderer: 'AllInput', name: 'allColumn' });
        expect(resolveInputRenderer(allColumn, true)).toEqual(AllInput);
        expect(resolveInputRenderer(allColumn, false)).toEqual(AllInput);

        const formColumn = new QueryColumn({ inputRenderer: 'FormInput', name: 'formColumn' });
        expect(resolveInputRenderer(formColumn, true)).toBeUndefined();
        expect(resolveInputRenderer(formColumn, false)).toEqual(FormInput);

        const gridColumn = new QueryColumn({ inputRenderer: 'GridInput', name: 'gridColumn' });
        expect(resolveInputRenderer(gridColumn, true)).toEqual(GridInput);
        expect(resolveInputRenderer(gridColumn, false)).toBeUndefined();
    });
});
