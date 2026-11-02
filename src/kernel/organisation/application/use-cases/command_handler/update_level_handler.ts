import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { UpdateLevelCommand } from '#kernel/organisation/application/use-cases/command/update_level_command'
import { LevelRepository } from '#kernel/organisation/domain/repository/level_repository'
import { Level } from '#kernel/organisation/domain/entity/level'
import { LevelNotFoundError } from '#kernel/organisation/domain/errors/level_not_found_error'

export class UpdateLevelHandler implements CommandHandler<UpdateLevelCommand, void> {
  constructor(private readonly levels: LevelRepository) {}

  async handle(command: UpdateLevelCommand): Promise<void> {
    const level = await this.levels.findById(command.id)

    if (!level) {
      throw new LevelNotFoundError()
    }

    await this.levels.save(
      new Level(command.id, level.getDepartmentId(), command.name ?? level.getName(), null, null)
    )
  }
}
