import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  BelongsTo,
  DataType,
  CreatedAt,
  UpdatedAt
} from "sequelize-typescript";

import Campaign from "./CampaignZPRO";
import Contact from "./ContactZPRO";
import Message from "./MessageZPRO";

@Table
export default class CampaignContacts extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column(DataType.INTEGER)
  messageRandom!: number;

  @Column(DataType.TEXT)
  body!: string;

  @Column
  mediaName!: string;

  @AllowNull
  @Column(null)
  message!: string;

  @AllowNull
  @Column(DataType.INTEGER)
  ack!: number;

  @ForeignKey(() => Message)
  @Column
  messageId!: string;

  @BelongsTo(() => Message, "messageId")
  metadata!: Message;

  @ForeignKey(() => Campaign)
  @Column
  campaignId!: string;

  @BelongsTo(() => Campaign, "campaignId")
  campaign!: Campaign;

  @ForeignKey(() => Contact)
  @Column
  contactId!: number;

  @BelongsTo(() => Contact, "contactId")
  contact!: Contact;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
} 