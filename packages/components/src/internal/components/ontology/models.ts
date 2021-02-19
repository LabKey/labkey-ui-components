export class ConceptModel {
    label: string;
    code: string;
    paths: string[];
    description: string;

    constructor(values: { [key: string]: any }) {
        Object.assign(this, values);
    }
}

// export interface PathModel {
//     label: string;
//     fullpath: string;
//     pathIdx: number;
//     conceptCode: string;
//     children?: PathModel[];
// }

export class PathModel {
    path: string;
    code: string;
    label: string;
    hasChildren: boolean;
    children: PathModel[];

    constructor(values: { [key: string]: any }) {
        Object.assign(this, values);
    }
}

export class OntologyModel {
    readonly name: string;
    readonly description: string;
    readonly rowId: number;
    readonly abbreviation: string;
    readonly path: string;
    readonly conceptCount: number;
    children: PathModel[] = undefined;

    constructor(values?: Partial<OntologyModel>) {
        Object.assign(this, values);
    }

    getPathModel = (): PathModel => {
        return new PathModel({
            path: this.path,
            code: this.abbreviation,
            label: this.name,
            hasChildren: !!this.children,
            children: this.children,
        });
    };
}
