import { NotFoundException } from '@nestjs/common';
import { BaseEntity, Repository } from 'typeorm';

import { GetByFieldsInput } from './dto/get-by-fields-input.dto';

export class BaseService<Entity extends BaseEntity> {
  constructor(private readonly repository: Repository<Entity>) {}

  public async getOneByFields(
    input: GetByFieldsInput,
  ): Promise<Entity | undefined> {
    const {
      fields,
      relations,
      checkIfExists = false,
      loadRelationIds = true,
    } = input;

    // create a simpler fields object
    const fieldsToDoWhere = {};
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'object' && value.hasOwnProperty('id')) {
        fieldsToDoWhere[key] = {
          id: value.id,
        };
      } else {
        fieldsToDoWhere[key] = value;
      }
    }

    const existing = await this.repository.findOne({
      where: { ...(fieldsToDoWhere as any) },
      relations,
      loadRelationIds: !relations?.length && loadRelationIds ? true : false,
    });

    if (!existing && checkIfExists) {
      const values = Object.keys(fields)
        .map(
          (key) =>
            `${key} = ${
              typeof fields[key] === 'object' && fields[key]
                ? fields[key].id
                : fields[key]
            }`,
        )
        .join(' | ');

      throw new NotFoundException(
        `can't get the ${this.repository.metadata.tableName} with the values: ${values}.`,
      );
    }

    return existing || undefined;
  }

  public async getManyByFields(input: GetByFieldsInput): Promise<Entity[]> {
    const { fields, relations } = input;

    // create a simpler fields object
    const fieldsToDoWhere = {};
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'object' && value.hasOwnProperty('id')) {
        fieldsToDoWhere[key] = {
          id: value.id,
        };
      } else {
        fieldsToDoWhere[key] = value;
      }
    }

    return await this.repository.find({
      loadRelationIds: !relations?.length ? true : false,
      where: { ...(fieldsToDoWhere as any) },
      relations,
    });
  }
}
