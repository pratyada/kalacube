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
  private region: string;

  constructor(private configService: ConfigService) {
    this.region = configService.get<string>('AWS_REGION')!;
    const key = configService.get<string>('AWS_ACCESS_KEY');
    const secret = configService.get<string>('AWS_SECRET_KEY');

    // Use explicit env credentials only when they look real. When they are the
    // shipped placeholders (or absent), fall back to the default AWS credential
    // provider chain — the local `aws` config in dev, and the IAM role on Lambda.
    const explicit =
      key && secret && !/^placeholder/i.test(key) && !/^placeholder/i.test(secret);

    this.s3 = new S3Client({
      region: this.region,
      ...(explicit
        ? { credentials: { accessKeyId: key!, secretAccessKey: secret! } }
        : {}),
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

  /**
   * Reverse `getPublicUrl()` — derive the S3 object key from a public URL we
   * generated for this bucket. Returns null if the URL isn't for our bucket
   * (so callers never delete a foreign/shared asset). Each path segment was
   * `encodeURIComponent`-encoded (identityIds contain ':'), so decode per-segment.
   */
  keyFromPublicUrl(url: string): string | null {
    if (!url) return null;
    const prefix = `https://${this.bucket}.s3.${this.region}.amazonaws.com/`;
    if (!url.startsWith(prefix)) return null;
    const encoded = url.slice(prefix.length);
    if (!encoded) return null;
    try {
      return encoded.split('/').map(decodeURIComponent).join('/');
    } catch {
      return null;
    }
  }

  /** Best-effort delete of an object given its public URL (no-op for foreign URLs). */
  async deleteByUrl(url: string) {
    const key = this.keyFromPublicUrl(url);
    if (!key) return;
    await this.deleteFile(key);
  }

  async getPresignedUrl(key: string, expiresIn = 7 * 24 * 60 * 60) {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  getPublicUrl(key: string) {
    // Region-scoped virtual-hosted URL, matching the migrated artwork URLs.
    // Each path segment is encoded (identityId contains a ':').
    const encoded = key.split('/').map(encodeURIComponent).join('/');
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${encoded}`;
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
