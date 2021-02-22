import * as Path from 'path';

import { ActionURL, Ajax, getServerContext, Utils } from '@labkey/api';

import { ConceptModel, OntologyModel, PathModel } from './models';

interface OntologyOptions {
    ontologyId: string | number;
    success: (model: OntologyModel) => void;
    failure: (resp: { [key: string]: any }) => any;
}

// //TODO remove
// const mockResponse = new OntologyModel({
//     path: '/NCIT/',
//     name: 'My Ontology',
//     conceptCount: 65,
//     concepts: [],
//     paths: [
//         // new PathModel({
//         //     path: '/',
//         //     label: 'Ontologies',
//         //     code: 'NCIT',
//         //     hasChildren: true,
//         //     children: [],
//         // }),
//     ],
// });

const ONTOLOGY_CONTROLLER = 'ontology';
const GET_CHILD_PATHS_ACTION = 'getChildPaths.api';
const GET_ONTOLOGY_ACTION = 'getOntology.api';
const GET_CONCEPT_ACTION = 'getConcept.api';
const SHARED_CONTAINER = 'shared';

class Ontology {
    static getOntology(ontologyId: string): Promise<OntologyModel> {
        return new Promise<OntologyModel>((resolve, reject) => {
            const { container } = getServerContext();
            const form = {
                abbreviation: ontologyId,
            };

            Ajax.request({
                url: ActionURL.buildURL(ONTOLOGY_CONTROLLER, GET_ONTOLOGY_ACTION, container?.path, form),
                method: 'GET',
                success: Utils.getCallbackWrapper(response => {
                    resolve(new OntologyModel(response));
                }),
                failure: Utils.getCallbackWrapper(
                    response => {
                        reject(response);
                    },
                    null,
                    false
                ),
            });
        });
    }

    static getConcept(code: string): Promise<ConceptModel> {
        return new Promise<ConceptModel>((resolve, reject) => {
            const { container } = getServerContext();
            const form = {
                code,
            };

            Ajax.request({
                url: ActionURL.buildURL(ONTOLOGY_CONTROLLER, GET_CONCEPT_ACTION, container?.path, form),
                method: 'GET',
                success: Utils.getCallbackWrapper(response => {
                    resolve(new ConceptModel(response.concept));
                }),
                failure: Utils.getCallbackWrapper(
                    response => {
                        reject(response);
                    },
                    null,
                    false
                ),
            });
        });
    }
}

export function getOntologyDetails(ontologyId: string): Promise<OntologyModel> {
    return Ontology.getOntology(ontologyId);
}

export function getOntologyChildPathsAndConcepts(ontologyPath: string, container: string = SHARED_CONTAINER): Promise<PathModel> {
    return new Promise((resolve, reject) => {
        const params = { path: ontologyPath };
        return Ajax.request({
            url: ActionURL.buildURL(ONTOLOGY_CONTROLLER, GET_CHILD_PATHS_ACTION, container, params),
            // jsonData: params,
            method: 'GET',
            success: Utils.getCallbackWrapper(response => {
                const parent = response.parent;
                const { path, code, children } = parent;
                const childPaths = children?.map(child => new PathModel(child));
                resolve(new PathModel({ path, code, children: childPaths }));
            }),
            failure: Utils.getCallbackWrapper(
                response => {
                    reject(response);
                },
                null,
                false
            ),
        });
    });
}

export async function fetchChildPaths(ontologyPath?: string): Promise<PathModel> {
    return await getOntologyChildPathsAndConcepts(ontologyPath);
}

export async function fetchConceptForCode(code: string): Promise<ConceptModel> {
    return await Ontology.getConcept(code);
}
