import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  CreatedAt,
  UpdatedAt,
  HasMany,
  BelongsToMany,
  ForeignKey,
  BelongsTo,
  Default
} from "sequelize-typescript";

import Campaign from "./CampaignZPRO";
import CampaignContacts from "./CampaignContactsZPRO";
import ContactCustomField from "./ContactCustomFieldZPRO";
import ContactWallet from "./ContactWalletZPRO";
import Tag from "./TagZPRO";
import Tenant from "./TenantZPRO";
import Ticket from "./TicketZPRO";
import ContactTag from "./ContactTagZPRO";
import User from "./UserZPRO";

@Table
export default class Contact extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @AllowNull(true)
  @Column
  number: string;

  @AllowNull(true)
  @Default(null)
  @Column
  email: string;

  @Column
  profilePicUrl: string;

  @AllowNull(true)
  @Default(null)
  @Column
  pushname: string;

  @AllowNull(true)
  @Default(null)
  @Column
  telegramId: string;

  @AllowNull(true)
  @Default(null)
  @Column
  messengerId: string;

  @AllowNull(true)
  @Default(null)
  @Column
  instagramPK: number;

  @AllowNull(true)
  @Default(null)
  @Column
  hubMercado: string;

  @AllowNull(true)
  @Default(null)
  @Column
  hubWhatsapp: string;

  @AllowNull(true)
  @Default(null)
  @Column
  hubWebchat: string;

  @AllowNull(true)
  @Default(null)
  @Column
  hubTelegram: string;

  @AllowNull(true)
  @Default(null)
  @Column
  hubEmail: string;

  @AllowNull(true)
  @Default(null)
  @Column
  hubSms: string;

  @AllowNull(true)
  @Default(null)
  @Column
  hubOlx: string;

  @AllowNull(true)
  @Default(null)
  @Column
  hubIfood: string;

  @AllowNull(true)
  @Default(null)
  @Column
  hubTwitter: string;

  @AllowNull(true)
  @Default(null)
  @Column
  hubTiktok: string;

  @AllowNull(true)
  @Default(null)
  @Column
  hubYoutube: string;

  @AllowNull(true)
  @Default(null)
  @Column
  hubLikedin: string;

  @AllowNull(true)
  @Default(null)
  @Column
  birthdayDate: string;

  @AllowNull(true)
  @Default(null)
  @Column
  extraInfo: string;

  @AllowNull(true)
  @Default(null)
  @Column
  businessName: string;

  @Default(false)
  @Column
  isUser: boolean;

  @Default(false)
  @Column
  isWAContact: boolean;

  @Default(false)
  @Column
  isGroup: boolean;

  @Default(false)
  @Column
  blocked: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Ticket)
  tickets: Ticket[];

  @HasMany(() => ContactCustomField)
  extraFields: ContactCustomField[];

  @BelongsToMany(() => Tag, () => ContactTag, "contactId", "tagId")
  tags: Tag[];

  @BelongsToMany(() => User, () => ContactWallet, "contactId", "walletId")
  wallets: User[];

  @HasMany(() => ContactWallet)
  contactWallets: ContactWallet[];

  @HasMany(() => CampaignContacts)
  campaignContacts: CampaignContacts[];

  @BelongsToMany(() => Campaign, () => CampaignContacts, "contactId", "campaignId")
  campaign: Campaign[];

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;
} 