import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';

@Injectable()
export class S3Service {
  private s3: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      region: configService.get<string>('AWS_REGION')!,
      credentials: {
        accessKeyId: configService.get<string>('AWS_ACCESS_KEY')!,
        secretAccessKey: configService.get<string>('AWS_SECRET_KEY')!,
      },
    });
    this.bucket = configService.get<string>('AWS_STORAGE_BUCKET')!;
  }

  async uploadFile(params: {
    file: { buffer: Buffer; originalname: string; mimetype: string };
    location: string;
    isPublic?: boolean;
  }) {
    const { file, location, isPublic } = params;
    const filename = `${nanoid()}-${file.originalname}`;
    const key = `${location}/${filename}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ...(isPublic && { ACL: 'public-read' }),
      }),
    );

    return { filename, key };
  }

  async deleteFile(key: string) {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async getPresignedUrl(key: string, expiresIn = 7 * 24 * 60 * 60) {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  getPublicUrl(key: string) {
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async copyFile(params: {
    sourceKey: string;
    location: string;
    isPublic?: boolean;
  }) {
    const { sourceKey, location, isPublic } = params;
    const originalName = sourceKey.split('/').pop();
    const filename = `${nanoid(4)}-${originalName}`;
    const key = `${location}/${filename}`;

    await this.s3.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: key,
        ...(isPublic && { ACL: 'public-read' }),
      }),
    );

    return { filename, key };
  }
}
