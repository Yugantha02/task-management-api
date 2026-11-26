import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.module';
import { tasks, users } from '../db/schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

// Public tasks walata comments tika ganna reusable subquery eka
const commentsSubquery = sql`
  CASE
    WHEN ${tasks.is_private} = true THEN '[]'::json
    ELSE COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', c.id,
            'username', cu.username,
            'text', c.content,
            'created_at', c.created_at
          )
          ORDER BY c.created_at DESC
        )
        FROM comments c
        JOIN users cu ON c.user_id = cu.id
        WHERE c.task_id = ${tasks.id}
      ),
      '[]'::json
    )
  END
`;

@Injectable()
export class TasksService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  async findAll(userId: number) {
    const allTasks = await this.db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        is_private: tasks.is_private,
        user_id: tasks.user_id,
        created_at: tasks.created_at,
        username: users.username,
        comments: commentsSubquery,
      })
      .from(tasks)
      .innerJoin(users, eq(tasks.user_id, users.id))
      .where(or(eq(tasks.user_id, userId), eq(tasks.is_private, false)))
      .orderBy(desc(tasks.created_at));

    return { tasks: allTasks };
  }

  async findOne(taskId: number, userId: number) {
    const [task] = await this.db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        is_private: tasks.is_private,
        user_id: tasks.user_id,
        created_at: tasks.created_at,
        username: users.username,
        comments: commentsSubquery,
      })
      .from(tasks)
      .innerJoin(users, eq(tasks.user_id, users.id))
      .where(eq(tasks.id, taskId));

    if (!task) {
      throw new NotFoundException({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    if (task.is_private === true && task.user_id !== userId) {
      throw new ForbiddenException({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this private task',
        },
      });
    }

    return { task };
  }

  async create(dto: CreateTaskDto, userId: number) {
    const title = dto.title?.trim();
    const description = dto.description?.trim() || '';
    const status = dto.status || 'pending';
    const is_private = dto.is_private ?? false;

    if (!title) {
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title is required',
          details: { field: 'title' },
        },
      });
    }

    const [newTask] = await this.db
      .insert(tasks)
      .values({
        title,
        description,
        status,
        is_private,
        user_id: userId,
      })
      .returning({ id: tasks.id });

    return {
      message: 'Task created successfully',
      id: newTask.id,
    };
  }

  async update(id: number, dto: UpdateTaskDto, userId: number) {
    const [currentTask] = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));

    if (!currentTask) {
      throw new NotFoundException({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    if (currentTask.user_id !== userId) {
      throw new ForbiddenException({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this task',
        },
      });
    }

    const updatedTask = {
      title: dto.title !== undefined ? dto.title.trim() : currentTask.title,
      description:
        dto.description !== undefined
          ? dto.description.trim()
          : currentTask.description,
      status: dto.status ?? currentTask.status,
      is_private: dto.is_private ?? currentTask.is_private,
    };

    await this.db.update(tasks).set(updatedTask).where(eq(tasks.id, id));

    return { message: 'Task updated successfully' };
  }

  async remove(id: number, userId: number) {
    const [existingTask] = await this.db
      .select({
        id: tasks.id,
        user_id: tasks.user_id,
      })
      .from(tasks)
      .where(eq(tasks.id, id));

    if (!existingTask) {
      throw new NotFoundException({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    if (existingTask.user_id !== userId) {
      throw new ForbiddenException({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this task',
        },
      });
    }

    await this.db.delete(tasks).where(eq(tasks.id, id));

    return { message: 'Task deleted successfully' };
  }
}