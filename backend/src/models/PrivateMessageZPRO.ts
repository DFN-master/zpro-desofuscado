import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  DataType,
  AllowNull,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt
} from 'sequelize-typescript';

import User from './UserZPRO';
import Tenant from './TenantZPRO';
import GroupMessage from './GroupMessagesZPRO';

interface IPrivateMessage {
  id: number;
  groupId?: number;
  text: string;
  senderId: number;
  receiverId: number;
  mediaType?: string;
  mediaName?: string;
  mediaUrl?: string;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

@Table({
  tableName: 'PrivateMessages'
})
export default class PrivateMessage extends Model<IPrivateMessage> {
  @Column
  @PrimaryKey
  @AutoIncrement
  id: number;

  @ForeignKey(() => GroupMessage)
  @AllowNull(true)
  @Column
  groupId: number;

  @BelongsTo(() => GroupMessage)
  group: GroupMessage;

  @Column
  text: string;

  @Column
  mediaType: string;

  @Column
  mediaName: boolean;

  @ForeignKey(() => User)
  @Column
  senderId: number;

  @BelongsTo(() => User)
  sender: User;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column
  receiverId: number;

  @BelongsTo(() => User)
  receiver: User;

  @Column
  mediaUrl: string;

  @Column(DataType.STRING)
  get mediaName(): string {
    return this.getDataValue('mediaName');
  }

  @Column(DataType.VIRTUAL)
  get mediaUrl(): string | null {
    if (this.getDataValue('mediaUrl')) {
      const { BACKEND_URL, PROXY_PORT } = process.env;
      const fileName = this.getDataValue('mediaUrl');
      const tenantId = this.tenantId || (this.tenant && this.tenant.id);
      
      return `${BACKEND_URL}:${PROXY_PORT}/public/${tenantId}/${fileName}`;
    }
    return null;
  }

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
} 