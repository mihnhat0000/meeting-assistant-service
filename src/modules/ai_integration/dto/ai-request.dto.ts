import { IsString, IsNotEmpty } from 'class-validator';

export class SummarizeTextDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class AnalyzeSentimentDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
