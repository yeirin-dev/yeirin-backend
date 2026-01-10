import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Roles } from '@infrastructure/auth/decorators/roles.decorator';
import { ReviewEntity } from '@infrastructure/persistence/typeorm/entity/review.entity';
import {
  AdminPermissions,
  AdminPermissionGuard,
  AdminAuditInterceptor,
  AuditAction,
  SkipAdminAudit,
  ADMIN_PERMISSIONS,
  AdminPaginatedResponseDto,
} from '@yeirin/admin-common';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { ReviewQueryDto } from './dto/review-query.dto';

/**
 * Admin Review Controller
 * 리뷰 관리 Admin API
 *
 * @route /admin/reviews
 */
@ApiTags('Admin - 리뷰 관리')
@Controller('admin/reviews')
@UseGuards(AdminJwtAuthGuard, AdminPermissionGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminReviewController {
  private readonly logger = new Logger(AdminReviewController.name);

  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
  ) {}

  /**
   * 리뷰 목록 조회
   */
  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.REVIEW_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '리뷰 목록 조회',
    description: '전체 리뷰 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getReviews(@Query() query: ReviewQueryDto) {
    const { page = 1, limit = 20, search, institutionId, rating, isHidden } = query;

    const where: FindOptionsWhere<ReviewEntity> = {};

    if (search) {
      where.content = Like(`%${search}%`);
    }
    if (institutionId) {
      where.institutionId = institutionId;
    }
    if (rating) {
      where.rating = rating;
    }
    if (isHidden !== undefined) {
      where.isHidden = isHidden;
    }

    const [data, total] = await this.reviewRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = data.map((review) => ({
      id: review.id,
      institutionId: review.institutionId,
      userId: review.userId,
      authorNickname: review.authorNickname,
      rating: review.rating,
      content: review.content,
      helpfulCount: review.helpfulCount,
      isHidden: review.isHidden,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      institutionName: '', // NOTE: VoucherInstitution 제거로 기관명 조회 불가
    }));

    return AdminPaginatedResponseDto.of(items, total, page, limit);
  }

  /**
   * 리뷰 상세 조회
   */
  @Get(':id')
  @AdminPermissions(ADMIN_PERMISSIONS.REVIEW_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '리뷰 상세 조회',
    description: '특정 리뷰의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '리뷰를 찾을 수 없음' })
  async getReview(@Param('id', ParseUUIDPipe) id: string) {
    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      return { error: '리뷰를 찾을 수 없습니다', statusCode: 404 };
    }

    return {
      id: review.id,
      institutionId: review.institutionId,
      userId: review.userId,
      authorNickname: review.authorNickname,
      rating: review.rating,
      content: review.content,
      helpfulCount: review.helpfulCount,
      isHidden: review.isHidden,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      institutionName: '',
    };
  }

  /**
   * 리뷰 숨김
   */
  @Post(':id/hide')
  @AdminPermissions(ADMIN_PERMISSIONS.REVIEW_UPDATE)
  @AuditAction('HIDE', 'Review', {
    level: 'NORMAL',
    description: '리뷰 숨김',
  })
  @ApiOperation({
    summary: '리뷰 숨김',
    description: '리뷰를 숨김 처리합니다.',
  })
  @ApiResponse({ status: 200, description: '숨김 성공' })
  @ApiResponse({ status: 404, description: '리뷰를 찾을 수 없음' })
  async hideReview(@Param('id', ParseUUIDPipe) id: string) {
    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      return { error: '리뷰를 찾을 수 없습니다', statusCode: 404 };
    }

    await this.reviewRepository.update(id, { isHidden: true });

    this.logger.log(`리뷰 숨김: ${id}`);

    return { success: true, message: '리뷰가 숨김 처리되었습니다' };
  }

  /**
   * 리뷰 숨김 해제
   */
  @Post(':id/show')
  @AdminPermissions(ADMIN_PERMISSIONS.REVIEW_UPDATE)
  @AuditAction('SHOW', 'Review', {
    level: 'NORMAL',
    description: '리뷰 숨김 해제',
  })
  @ApiOperation({
    summary: '리뷰 숨김 해제',
    description: '숨김 처리된 리뷰를 다시 표시합니다.',
  })
  @ApiResponse({ status: 200, description: '숨김 해제 성공' })
  @ApiResponse({ status: 404, description: '리뷰를 찾을 수 없음' })
  async showReview(@Param('id', ParseUUIDPipe) id: string) {
    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      return { error: '리뷰를 찾을 수 없습니다', statusCode: 404 };
    }

    await this.reviewRepository.update(id, { isHidden: false });

    this.logger.log(`리뷰 숨김 해제: ${id}`);

    return { success: true, message: '리뷰가 다시 표시됩니다' };
  }

  /**
   * 리뷰 삭제
   */
  @Delete(':id')
  @AdminPermissions(ADMIN_PERMISSIONS.REVIEW_DELETE)
  @AuditAction('DELETE', 'Review', {
    level: 'HIGH',
    description: '리뷰 삭제',
  })
  @ApiOperation({
    summary: '리뷰 삭제',
    description: '리뷰를 영구 삭제합니다.',
  })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '리뷰를 찾을 수 없음' })
  async deleteReview(@Param('id', ParseUUIDPipe) id: string) {
    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      return { error: '리뷰를 찾을 수 없습니다', statusCode: 404 };
    }

    await this.reviewRepository.delete(id);

    this.logger.log(`리뷰 삭제: ${id}`);

    return { success: true, message: '리뷰가 삭제되었습니다' };
  }
}
