import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity()
export class ContentBlock {
  @PrimaryColumn()
  key: string; // e.g., 'home_hero', 'global_settings', 'footer_content'

  @Column({ type: 'jsonb' })
  data: any; // Flexible JSON structure for the content

  @UpdateDateColumn()
  updatedAt: Date;
}