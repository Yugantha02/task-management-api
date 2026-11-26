import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.module';
import { users } from '../db/schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.username, dto.username));

    if (existingUser) {
      throw new BadRequestException('Username already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const [newUser] = await this.db
      .insert(users)
      .values({
        username: dto.username,
        password: hashedPassword,
      })
      .returning({
        id: users.id,
        username: users.username,
        created_at: users.created_at,
      });

    return {
      message: 'User registered successfully',
      user: newUser,
    };
  }

  async login(dto: LoginDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.username, dto.username));

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const token = this.jwtService.sign({
      id: user.id,
      username: user.username,
    });

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    };
  }

  async getCurrentUser(userId: number) {
    const [user] = await this.db
      .select({
        id: users.id,
        username: users.username,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}