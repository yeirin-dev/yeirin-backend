import {
  FastTrackCounselingReferral,
  Gender,
  InstitutionType,
  GuardianContactAvailability,
  CrisisLevel,
  GuardianConsentStatus,
  FastTrackReferralStatus,
} from '@domain/fast-track-referral/model/fast-track-referral';
import { FastTrackReferralEntity } from '../entity/fast-track-referral.entity';
import {
  FastTrackGender,
  FastTrackInstitutionType,
  FastTrackGuardianContactAvailability,
  FastTrackGuardianConsentStatus,
  FastTrackReferralStatus as EntityFastTrackReferralStatus,
} from '../entity/enums/fast-track-referral-enums';

/**
 * FastTrackReferral Mapper
 * Domain ↔ Infrastructure 변환 (Anti-Corruption Layer)
 */
export class FastTrackReferralMapper {
  /**
   * Entity → Domain
   */
  static toDomain(entity: FastTrackReferralEntity): FastTrackCounselingReferral {
    return FastTrackCounselingReferral.restore({
      id: entity.id,
      status: entity.status as unknown as FastTrackReferralStatus,
      referralDate: entity.referralDate,
      institutionName: entity.institutionName,
      staffName: entity.staffName,
      childName: entity.childName,
      childGender: entity.childGender as unknown as Gender,
      childAge: entity.childAge,
      childGrade: entity.childGrade,
      facilityAdmissionDate: entity.facilityAdmissionDate,
      institutionType: entity.institutionType as unknown as InstitutionType,
      institutionTypeOther: entity.institutionTypeOther,
      guardianContactAvailability:
        entity.guardianContactAvailability as unknown as GuardianContactAvailability,
      crisisOccurrenceDate: entity.crisisOccurrenceDate,
      crisisLevels: entity.crisisLevels as unknown as CrisisLevel[],
      crisisLevelOther: entity.crisisLevelOther,
      hasPreExistingPsychiatricCondition: entity.hasPreExistingPsychiatricCondition,
      psychiatricDiagnosisName: entity.psychiatricDiagnosisName,
      isCurrentlyOnMedication: entity.isCurrentlyOnMedication,
      medicationName: entity.medicationName,
      childCharacteristicsAndCounselingNotes: entity.childCharacteristicsAndCounselingNotes,
      recentIncidentsAndBehavioralChanges: entity.recentIncidentsAndBehavioralChanges,
      referralMotivation: entity.referralMotivation,
      counselingGoal: entity.counselingGoal,
      guardianConsentStatus: entity.guardianConsentStatus as unknown as GuardianConsentStatus,
      consentPersonName: entity.consentPersonName,
      relationship: entity.relationship,
      consentDate: entity.consentDate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Domain → Entity
   */
  static toEntity(domain: FastTrackCounselingReferral): FastTrackReferralEntity {
    const entity = new FastTrackReferralEntity();
    entity.id = domain.id;
    entity.status = domain.status as unknown as EntityFastTrackReferralStatus;
    entity.referralDate = domain.referralDate;
    entity.institutionName = domain.institutionName;
    entity.staffName = domain.staffName;
    entity.childName = domain.childName;
    entity.childGender = domain.childGender as unknown as FastTrackGender;
    entity.childAge = domain.childAge;
    entity.childGrade = domain.childGrade;
    entity.facilityAdmissionDate = domain.facilityAdmissionDate;
    entity.institutionType = domain.institutionType as unknown as FastTrackInstitutionType;
    entity.institutionTypeOther = domain.institutionTypeOther;
    entity.guardianContactAvailability =
      domain.guardianContactAvailability as unknown as FastTrackGuardianContactAvailability;
    entity.crisisOccurrenceDate = domain.crisisOccurrenceDate;
    entity.crisisLevels = domain.crisisLevels;
    entity.crisisLevelOther = domain.crisisLevelOther;
    entity.hasPreExistingPsychiatricCondition = domain.hasPreExistingPsychiatricCondition;
    entity.psychiatricDiagnosisName = domain.psychiatricDiagnosisName;
    entity.isCurrentlyOnMedication = domain.isCurrentlyOnMedication;
    entity.medicationName = domain.medicationName;
    entity.childCharacteristicsAndCounselingNotes = domain.childCharacteristicsAndCounselingNotes;
    entity.recentIncidentsAndBehavioralChanges = domain.recentIncidentsAndBehavioralChanges;
    entity.referralMotivation = domain.referralMotivation;
    entity.counselingGoal = domain.counselingGoal;
    entity.guardianConsentStatus =
      domain.guardianConsentStatus as unknown as FastTrackGuardianConsentStatus;
    entity.consentPersonName = domain.consentPersonName;
    entity.relationship = domain.relationship;
    entity.consentDate = domain.consentDate;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
