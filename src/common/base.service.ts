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
      loadRelationIds = false,
    } = input;

    const existing = await this.repository.findOne({
      loadRelationIds: loadRelationIds,
      where: { ...fields },
      relations,
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

    return await this.repository.find({
      loadRelationIds: !relations?.length ? true : false,
      where: { ...fields },
      relations,
    });
  }
}
