import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentSettingsEntity } from '@infrastructure/persistence/typeorm/entity/assessment-settings.entity';
import { SettingsController } from './settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AssessmentSettingsEntity])],
  controllers: [SettingsController],
})
export class SettingsModule {}
