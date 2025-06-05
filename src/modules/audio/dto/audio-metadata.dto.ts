import { IsString, IsUUID, IsOptional } from 'class-validator';

export class AudioMetadataDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  description?: string;
}
