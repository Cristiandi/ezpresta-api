export class GetByFieldsInput {
  readonly fields: Record<any, any>;

  readonly relations?: string[];

  readonly checkIfExists?: boolean;

  readonly loadRelationIds?: boolean;
}
