import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsString, MaxLength, ValidateNested } from 'class-validator';
import { APP_SETTING_KEYS_ORDER } from '../settings.constants';

const KEY_LIST = [...APP_SETTING_KEYS_ORDER] as string[];

export class SettingEntryDto {
  @IsIn(KEY_LIST)
  key!: string;

  @IsString()
  @MaxLength(5000)
  value!: string;
}

export class UpdateSettingsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SettingEntryDto)
  entries!: SettingEntryDto[];
}
