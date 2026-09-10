import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { isBefore, sub } from 'date-fns';
import { User } from '../user/schemas/user.schema';
import { UserRepository } from '../user/user.repository';
import { RefreshToken } from './schemas/refresh-token.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OnboardingDto } from './dto/onboarding.dto';
import { AuthType, UserRole } from '../user/types/user.types';
import type { CognitoClaims } from './cognito/cognito.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshToken>,
  ) {}

  async register(dto: RegisterDto) {
    // Validate age >= 18
    const dob = new Date(dto.dob);
    const minDate = sub(new Date(), { years: 18 });
    if (!isBefore(dob, minDate)) {
      throw new BadRequestException('You must be at least 18 years old');
    }

    // Check uniqueness
    const emailExists = await this.userRepo.userExists({ email: dto.email });
    if (emailExists) throw new ConflictException('Email already registered');

    const usernameExists = await this.userRepo.userExists({
      username: dto.username,
    });
    if (usernameExists) throw new ConflictException('Username already taken');

    // Hash password
    const saltRounds = this.configService.get<number>('SALT_ROUNDS') || 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    // Generate email verification token
    const emailVerificationToken = nanoid(32);

    const user = await this.userRepo.createUser({
      ...dto,
      dob,
      password: hashedPassword,
      authType: AuthType.KALACUBE,
      role: dto.role || UserRole.USER,
      emailVerificationToken,
    } as any);

    const tokens = await this.generateTokens(user);

    return {
      data: {
        user: this.sanitizeUser(user),
        ...tokens,
      },
      message: 'Registration successful. Please verify your email.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findUserByEmail(dto.email, true);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.authType !== AuthType.KALACUBE) {
      throw new BadRequestException(
        `Please login with ${user.authType}`,
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    await this.userRepo.updateUser(
      { _id: user._id },
      { lastLoginAt: new Date() },
    );

    const tokens = await this.generateTokens(user);

    return {
      data: {
        user: this.sanitizeUser(user),
        ...tokens,
      },
      message: 'Login successful',
    };
  }

  async refreshTokens(refreshToken: string) {
    const tokenDoc = await this.refreshTokenModel.findOne({
      token: refreshToken,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token (rotation)
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();

    const user = await this.userRepo.findUserById(tokenDoc.user.toString());
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const tokens = await this.generateTokens(user);
    return { data: tokens, message: 'Tokens refreshed' };
  }

  async logout(refreshToken: string) {
    await this.refreshTokenModel.updateOne(
      { token: refreshToken },
      { revokedAt: new Date() },
    );
    return { message: 'Logged out' };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepo.findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If this email is registered, a reset link has been sent' };
    }

    const resetToken = nanoid(32);
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userRepo.updateUser(
      { _id: user._id },
      {
        resetPasswordToken: resetToken,
        resetPasswordExpires,
      },
    );

    // TODO: Queue reset email via EmailService

    return { message: 'If this email is registered, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepo
      .findUserByUsername('') // We need to find by token
      .catch(() => null);

    // Find user by reset token
    const userDoc = await (this.userRepo as any).userModel?.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!userDoc) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const saltRounds = this.configService.get<number>('SALT_ROUNDS') || 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.userRepo.updateUser(
      { _id: userDoc._id },
      {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    );

    // Revoke all refresh tokens
    await this.refreshTokenModel.updateMany(
      { user: userDoc._id, revokedAt: null },
      { revokedAt: new Date() },
    );

    return { message: 'Password reset successful' };
  }

  async verifyEmail(token: string) {
    const userDoc = await (this.userRepo as any).userModel?.findOne({
      emailVerificationToken: token,
    });

    if (!userDoc) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.userRepo.updateUser(
      { _id: userDoc._id },
      {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
      },
    );

    return { message: 'Email verified successfully' };
  }

  async handleOAuthLogin(provider: string, profile: any) {
    const providerField = `oauthProviderIds.${provider}`;

    // Check if user already linked with this provider
    let user = await (this.userRepo as any).userModel?.findOne({
      [providerField]: profile.providerId,
    });

    if (!user && profile.email) {
      // Check if user with same email exists
      user = await this.userRepo.findUserByEmail(profile.email);
      if (user) {
        // Link provider to existing account
        await this.userRepo.updateUser(
          { _id: user._id },
          { [providerField]: profile.providerId },
        );
      }
    }

    if (!user) {
      // Create new user
      const username =
        profile.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') +
        '_' +
        nanoid(4);
      user = await this.userRepo.createUser({
        authType: provider as AuthType,
        role: UserRole.USER,
        username,
        email: profile.email,
        firstName: profile.firstName || 'User',
        lastName: profile.lastName || '',
        dob: new Date('1990-01-01'), // Placeholder — user must update
        oauthProviderIds: { [provider]: profile.providerId },
        emailVerifiedAt: new Date(), // OAuth emails are pre-verified
      } as any);
    }

    await this.userRepo.updateUser(
      { _id: user._id },
      { lastLoginAt: new Date() },
    );

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findUserById(userId);
    if (!user) throw new NotFoundException('User not found');
    return { data: this.sanitizeUser(user), message: 'User fetched' };
  }

  /**
   * First-login onboarding: creates the Mongo user + artist profile for a
   * verified Cognito sign-up that has no record yet. Idempotent — if a record
   * already exists for the token's email it is returned as-is.
   */
  async onboard(claims: CognitoClaims, dto: OnboardingDto) {
    const email = (claims?.email || '').toLowerCase();
    if (!email) throw new BadRequestException('Token has no email claim');

    const existing = await this.userRepo.findUserByEmail(email);
    if (existing) {
      return { data: this.sanitizeUser(existing), message: 'Already onboarded' };
    }

    const username = dto.username.toLowerCase().trim();
    if (await this.userRepo.userExists({ username })) {
      throw new ConflictException('Username already taken');
    }

    const isFederated = !!claims.identities;
    const user = await this.userRepo.createUser({
      authType: isFederated ? AuthType.GOOGLE : AuthType.KALACUBE,
      role: UserRole.ARTIST,
      username,
      email,
      firstName: dto.firstName || claims.given_name,
      lastName: dto.lastName || claims.family_name,
      bio: dto.bio,
      cognitoSub: claims.sub,
      emailVerifiedAt: claims.email_verified ? new Date() : undefined,
      isActive: true,
    });

    await this.userRepo.upsertArtistProfile(user._id.toString(), {
      artDimensions: dto.artDimensions,
      headline: dto.headline,
      statement: dto.statement,
    });

    return { data: this.sanitizeUser(user), message: 'Onboarding complete' };
  }

  // Private helpers
  private async generateTokens(user: User) {
    const payload = {
      sub: user._id.toString(),
      role: user.role,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION') || '15m',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user._id.toString() },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
      },
    );

    // Store refresh token
    await this.refreshTokenModel.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.emailVerificationToken;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    delete obj.__v;
    return obj;
  }
}
