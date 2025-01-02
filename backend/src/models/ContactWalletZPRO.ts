import {
  Table,
  Model,
  PrimaryKey,
  AutoIncrement,
  Column,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt
} from 'sequelize-typescript';

import Contact from './ContactZPRO';
import Tenant from './TenantZPRO';
import User from './UserZPRO';

@Table
export default class ContactWallet extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => User)
  @Column
  walletId: number;

  @BelongsTo(() => User)
  wallet: User;

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