import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.module';
import { comments, tasks, users } from '../db/schema';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  async addComment(taskId: number, dto: CreateCommentDto, userId: number) {
    const text = dto.text?.trim();

    if (!text) {
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Comment text is required',
          details: { field: 'text' },
        },
      });
    }

    // 1. Task eka thiyenawada balanna
    const [task] = await this.db
      .select({
        id: tasks.id,
        user_id: tasks.user_id,
        is_private: tasks.is_private,
      })
      .from(tasks)
      .where(eq(tasks.id, taskId));

    if (!task) {
      throw new NotFoundException({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    if (task.is_private === true) {
      throw new ForbiddenException({
        error: {
          code: 'FORBIDDEN',
          message: 'Comments are not supported on private tasks',
        },
      });
    }

    if (task.user_id === userId) {
      throw new ForbiddenException({
        error: {
          code: 'FORBIDDEN',
          message: 'Task owner cannot comment on their own task',
        },
      });
    }

    // 2. Comment eka insert karanna
    const [newComment] = await this.db
      .insert(comments)
      .values({
        task_id: taskId,
        user_id: userId,
        content: text,
      })
      .returning({
        id: comments.id,
        content: comments.content,
        created_at: comments.created_at,
      });

    // 3. Comment dapu user ge username eka ganna
    const [user] = await this.db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, userId));

    return {
      comment: {
        id: newComment.id,
        username: user.username,
        text: newComment.content,
        created_at: newComment.created_at,
      },
    };
  }
}