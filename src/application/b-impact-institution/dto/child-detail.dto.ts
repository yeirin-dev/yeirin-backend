import { CounselSessionResponseDto } from './counsel-session.dto';
import { CounselRecordResponseDto } from './counsel-record.dto';

export class ChildDetailResponseDto {
  linkageId: string;
  childId: string;
  childName: string;
  childAge: number;
  childGender: string;
  counselRequestId: string;
  formData: unknown;
  sessions: CounselSessionResponseDto[];
  records: CounselRecordResponseDto[];
  careType: string;
  centerName: string;
  requestDate: string;
  specialNeeds?: string;
}
