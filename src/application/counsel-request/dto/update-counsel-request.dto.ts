import { PartialType } from '@nestjs/swagger';
import {
  BasicInfoDto,
  CoverInfoDto,
  CreateCounselRequestDto,
  PsychologicalInfoDto,
  RequestMotivationDto,
  TestResultsDto,
} from './create-counsel-request.dto';

/**
 * 상담의뢰지 수정 DTO (부분 수정 가능)
 */
export class UpdateCounselRequestDto extends PartialType(CreateCounselRequestDto) {}
