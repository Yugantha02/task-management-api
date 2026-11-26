import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/tasks')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':id/comments')
  addComment(
    @Param('id', ParseIntPipe) taskId: number,
    @Body() dto: CreateCommentDto,
    @Req() req: any,
  ) {
    return this.commentsService.addComment(taskId, dto, req.user.id);
  }
}